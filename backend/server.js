require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
});
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'tradershub';
const SESSION_COOKIE = 'tradershub_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

let client = null;
let db = null;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
    const [name, ...value] = cookie.trim().split('=');
    return [name, decodeURIComponent(value.join('='))];
  }));
}

function setSessionCookie(response, token, expires) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Expires=${expires.toUTCString()}${secure}`);
}

async function getUserFromSession(request) {
  if (!db) {
    return null;
  }

  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const session = await db.collection('sessions').findOne({
    token,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  return db.collection('users').findOne(
    { _id: session.userId },
    { projection: { passwordHash: 0 } },
  );
}

async function requireAuth(request, response, next) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return response.status(401).json({ message: 'Authentication required.' });
    }
    request.user = user;
    return next();
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
}

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

async function connectToMongo() {
  if (!MONGODB_URI) {
    console.log('MONGODB_URI is not set. Starting server without MongoDB connection.');
    return null;
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    db = client.db(MONGODB_DB);
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log(`Connected to MongoDB database: ${MONGODB_DB}`);
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    db = null;
    return null;
  }
}

async function getTradeCollection() {
  if (!db) {
    return null;
  }

  return db.collection('trades');
}

function normalizeTradeTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return new Date();
}

app.get('/', (req, res) => {
  res.json({
    message: 'TradersHub API is running',
    endpoints: {
      health: '/api/health',
      trades: '/api/trades',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'disconnected',
    service: 'TradersHub Backend',
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ message: 'MongoDB is not configured.' });
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const username = (typeof req.body.username === 'string' ? req.body.username.trim() : '') || email;
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !email || password.length < 8) {
      return res.status(400).json({ message: 'Username, email, and a password of at least 8 characters are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.collection('users').insertOne({
      timestamp: new Date(),
      email,
      username,
      passwordHash,
    });
    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username is already in use.' });
    }
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ message: 'MongoDB is not configured.' });
    }

    const login = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await db.collection('users').findOne({
      $or: [{ username: login }, { email: login }],
    });
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !validPassword) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await db.collection('sessions').insertOne({ token, userId: user._id, expiresAt });
    setSessionCookie(res, token, expiresAt);

    return res.json({ user: { id: user._id.toString(), username: user.username, email: user.email } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    return user ? res.json({ user: { id: user._id.toString(), username: user.username, email: user.email } }) : res.status(401).json({ message: 'Not authenticated.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (db && token) {
    await db.collection('sessions').deleteOne({ token });
  }
  setSessionCookie(res, '', new Date(0));
  return res.json({ message: 'Logged out successfully.' });
});

app.get('/api/trades', requireAuth, async (req, res) => {
  try {
    const tradesCollection = await getTradeCollection();

    if (!tradesCollection) {
      return res.status(503).json({
        message: 'MongoDB is not configured. Add MONGODB_URI to your environment first.',
      });
    }

    const trades = await tradesCollection.find({}).sort({ tradeTimestamp: -1 }).toArray();
    return res.json(trades);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/trades', requireAuth, async (req, res) => {
  try {
    const tradesCollection = await getTradeCollection();

    if (!tradesCollection) {
      return res.status(503).json({
        message: 'MongoDB is not configured. Add MONGODB_URI to your environment first.',
      });
    }

    const trade = {
      ...req.body,
      timestamp: normalizeTradeTimestamp(req.body.timestamp ?? req.body.tradeTimestamp),
      tradeTimestamp: normalizeTradeTimestamp(req.body.tradeTimestamp ?? req.body.timestamp),
    };

    const result = await tradesCollection.insertOne(trade);
    io.emit('trade:created', trade);

    return res.status(201).json({
      insertedId: result.insertedId,
      trade,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.delete('/api/trades/:tradeId', requireAuth, async (req, res) => {
  try {
    const tradesCollection = await getTradeCollection();

    if (!tradesCollection) {
      return res.status(503).json({
        message: 'MongoDB is not configured. Add MONGODB_URI to your environment first.',
      });
    }

    const result = await tradesCollection.deleteOne({ tradeId: req.params.tradeId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Trade not found.' });
    }

    io.emit('trade:deleted', { tradeId: req.params.tradeId });
    return res.json({ message: 'Trade deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put('/api/trades/:tradeId', requireAuth, async (req, res) => {
  try {
    const tradesCollection = await getTradeCollection();

    if (!tradesCollection) {
      return res.status(503).json({
        message: 'MongoDB is not configured. Add MONGODB_URI to your environment first.',
      });
    }

    const { _id, tradeId, timestamp, tradeTimestamp, ...updates } = req.body;
    const trade = {
      ...updates,
      tradeId: req.params.tradeId,
      timestamp: normalizeTradeTimestamp(timestamp ?? tradeTimestamp),
      tradeTimestamp: normalizeTradeTimestamp(tradeTimestamp ?? timestamp),
    };
    const result = await tradesCollection.replaceOne({ tradeId: req.params.tradeId }, trade);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Trade not found.' });
    }

    io.emit('trade:updated', trade);
    return res.json({ message: 'Trade updated successfully.', trade });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

async function startServer() {
  await connectToMongo();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = {
  app,
  normalizeTradeTimestamp,
};
