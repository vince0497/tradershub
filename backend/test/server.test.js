const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const {
  app,
  normalizeTradeTimestamp,
  setDatabase,
} = require('../server');

function startTestServer() {
  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

test('normalizes valid trade timestamps', () => {
  const timestamp = normalizeTradeTimestamp('2026-01-15T12:00:00.000Z');

  assert.equal(timestamp.toISOString(), '2026-01-15T12:00:00.000Z');
});

test('falls back to the current time for invalid trade timestamps', () => {
  const before = Date.now();
  const timestamp = normalizeTradeTimestamp('invalid timestamp');
  const after = Date.now();

  assert.ok(timestamp.getTime() >= before);
  assert.ok(timestamp.getTime() <= after);
});

test('returns backend health without a database connection', async (context) => {
  setDatabase(null);
  const { server, url } = await startTestServer();
  context.after(() => server.close());

  const response = await fetch(`${url}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    status: 'ok',
    database: 'disconnected',
    service: 'TradersHub Backend',
  });
});

test('rejects registration when MongoDB is unavailable', async (context) => {
  setDatabase(null);
  const { server, url } = await startTestServer();
  context.after(() => server.close());

  const response = await fetch(`${url}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'test-user',
      email: 'test@example.com',
      password: 'password123',
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    message: 'MongoDB is not configured.',
  });
});