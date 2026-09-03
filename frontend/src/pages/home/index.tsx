import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import type { Trade } from '@/types';
import TradeList from '@/components/tradeList';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/userAuthContext';
interface IHomeProps {}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const Home: React.FunctionComponent<IHomeProps> = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState('100');
  const [price, setPrice] = useState('200');
  const trader = user?.email ?? '';

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades`, { credentials: 'include' });

      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      setTrades(data);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();

    const socket = io(API_BASE_URL);

    socket.on('trade:created', (trade: Trade) => {
      console.log('Trade created:', trade);
      setTrades((prev) => [trade, ...prev.filter((existingTrade) => existingTrade.tradeId !== trade.tradeId)]);
    });

    socket.on('trade:deleted', ({ tradeId }: { tradeId: string }) => {
      setTrades((prev) => prev.filter((trade) => trade.tradeId !== tradeId));
    });

    socket.on('trade:updated', (trade: Trade) => {
      setTrades((prev) => prev.map((existingTrade) => existingTrade.tradeId === trade.tradeId ? trade : existingTrade));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTradeSubmit = async (side: 'BUY' | 'SELL') => {
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanQuantity = Number(quantity);
    const cleanPrice = Number(price);
    const cleanTrader = trader.trim();

    if (!cleanSymbol || !quantity.trim() || !price.trim() || !cleanTrader) {
      toast.add({
        title: 'Incomplete order',
        description: 'Please provide a value for every field.',
        type: 'error',
      });
      return;
    }

    if (!Number.isFinite(cleanQuantity) || cleanQuantity < 0 || !Number.isFinite(cleanPrice) || cleanPrice < 0) {
      toast.add({
        title: 'Invalid order values',
        description: 'Quantity and price cannot be negative.',
        type: 'error',
      });
      return;
    }

    const tradePayload = {
      tradeId: crypto.randomUUID(),
      symbol: cleanSymbol,
      side,
      quantity: cleanQuantity,
      price: cleanPrice,
      trader: cleanTrader,
      book: 'PRIMARY',
      counterparty: 'CLIENT',
      tradeTimestamp: new Date().toISOString(),
      status: 'NEW',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/trades`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create trade');
      }

      const result = await response.json();
      setTrades((prev) => [result.trade, ...prev.filter((trade) => trade.tradeId !== result.trade.tradeId)]);
      setSymbol('');
      setQuantity('');
      setPrice('');
      console.log('Trade created:', result);
    } catch (error) {
      console.error('Error creating trade:', error);
      alert('Unable to create trade. Check backend and MongoDB connection.');
    }
  };

  const handleTradeDelete = async (tradeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades/${encodeURIComponent(tradeId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete trade');
      }

      setTrades((prev) => prev.filter((trade) => trade.tradeId !== tradeId));
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Unable to delete trade. Check backend and MongoDB connection.');
      throw error;
    }
  };

  const handleTradeUpdate = async (updatedTrade: Trade) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades/${encodeURIComponent(updatedTrade.tradeId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTrade),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update trade');
      }

      const result = await response.json();
      setTrades((prev) => prev.map((trade) => trade.tradeId === result.trade.tradeId ? result.trade : trade));
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Unable to update trade. Check backend and MongoDB connection.');
      throw error;
    }
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-button" type="button" aria-label="Toggle menu">
              <span />
              <span />
              <span />
            </button>
            <h1>Blotter Dashboard</h1>
          </div>
          <div className="header-right">
            <span className="header-user">{user?.username}</span>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          {loading ? <div>Loading trades...</div> : <TradeList trades={trades} onDeleteTrade={handleTradeDelete} onUpdateTrade={handleTradeUpdate} />}

          <aside className="order-panel">
            <h2>Order Entry</h2>
            <div className="order-input">
              <label htmlFor="symbol-input" style={{ color: 'white' }}>Symbol</label>
              <input
                id="symbol-input"
                type="text"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="Enter symbol"
                aria-label="Enter symbol"
                style={{ color: 'white' }}
              />
            </div>

            <div className="order-input">
              <label htmlFor="quantity-input" style={{ color: 'white' }}>Quantity</label>
              <input
                id="quantity-input"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Quantity"
                aria-label="Quantity"
                style={{ color: 'white' }}
              />
            </div>

            <div className="order-input">
              <label htmlFor="price-input" style={{ color: 'white' }}>Price</label>
              <input
                id="price-input"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Price"
                aria-label="Price"
                style={{ color: 'white' }}
              />
            </div>

            <div className="order-input">
              <label htmlFor="trader-input" style={{ color: 'white' }}>Trader</label>
              <input
                id="trader-input"
                type="text"
                value={trader}
                placeholder="Current user email"
                aria-label="Trader"
                readOnly
                style={{ color: 'white' }}
              />
            </div>

            <div className="trade-actions">
              <button
                type="button"
                className="action-button buy-button"
                id="buy-button"
                onClick={() => handleTradeSubmit('BUY')}
              >
                BUY
              </button>
              <button
                type="button"
                className="action-button sell-button"
                id="sell-button"
                onClick={() => handleTradeSubmit('SELL')}
              >
                SELL
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Home;
