import * as React from 'react';
import { useMemo, useState } from 'react';

import type { SortDirection, SortKey, Trade } from '@/types';
import DeleteTrade from '@/components/modal/deleteTrade';
import UpdateTrade from '@/components/modal/updateTrade';

interface ITradeListProps {
  trades: Trade[];
  onDeleteTrade: (tradeId: string) => void | Promise<void>;
  onUpdateTrade: (trade: Trade) => void | Promise<void>;
}

const pageSize = 8;

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const TradeList: React.FunctionComponent<ITradeListProps> = ({ trades, onDeleteTrade, onUpdateTrade }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrades = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const rows = [...trades].map((trade) => ({
      originalTrade: trade,
      tradeId: trade.tradeId,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity.toLocaleString(),
      status: trade.status,
      time: formatTime(trade.tradeTimestamp),
      trader: trade.trader,
    }));

    if (!query) return rows;

    return rows.filter((trade) =>
      [trade.symbol, trade.side, trade.quantity, trade.status, trade.time, trade.trader].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchTerm, trades]);

  const sortedTrades = useMemo(() => {
    const rows = [...filteredTrades];

    rows.sort((a, b) => {
      const first = a[sortKey].toString().toLowerCase();
      const second = b[sortKey].toString().toLowerCase();

      if (first < second) return sortDirection === 'asc' ? -1 : 1;
      if (first > second) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [filteredTrades, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

  const orders = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    const end = start + pageSize;

    return sortedTrades.slice(start, end);
  }, [currentPageSafe, sortedTrades]);

  const startIndex = (currentPageSafe - 1) * pageSize + 1;
  const endIndex = Math.min(currentPageSafe * pageSize, sortedTrades.length);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
    setCurrentPage(1);
  };






  return (<>
  
    <section className="blotter-panel">
            {/* <div className="chip-row">
              {filterChips.map((chip) => (
                <div key={chip} className="filter-chip">
                  <span>{chip}</span>
                  <span className="filter-close">×</span>
                </div>
              ))}
            </div> */}

            <div className="table-toolbar">
              <div className="table-search">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search symbol, trader, status..."
                  aria-label="Search trades"
                />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className={`sort-button ${sortKey === 'symbol' ? 'active' : ''}`}
                        onClick={() => handleSort('symbol')}
                      >
                        Symbol
                        <span>{sortKey === 'symbol' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className={`sort-button ${sortKey === 'side' ? 'active' : ''}`}
                        onClick={() => handleSort('side')}
                      >
                        Side
                        <span>{sortKey === 'side' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>Quantity</th>
                    <th>
                      <button
                        type="button"
                        className={`sort-button ${sortKey === 'status' ? 'active' : ''}`}
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <span>{sortKey === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                    <th>Time</th>
                    <th>Trader</th>
                    <th className="action-column">Delete</th>
                    <th className="action-column">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((trade, index) => (
                      <tr key={trade.tradeId || `${trade.symbol}-${index}`}>
                        <td className="symbol-cell">{trade.symbol}</td>
                        <td className={`side-cell ${trade.side.toLowerCase()}`}>{trade.side}</td>
                        <td className="quantity-cell">{trade.quantity}</td>
                        <td className={`status-cell ${trade.status.toLowerCase()}`}>
                          {trade.status}
                        </td>
                        <td className="time-cell">{trade.time}</td>
                        <td className="trader-cell">{trade.trader}</td>
                        <td className="action-cell">
                          <DeleteTrade
                            symbol={trade.symbol}
                            onConfirm={() => onDeleteTrade(trade.tradeId)}
                          />
                        </td>
                        <td className="action-cell">
                          <UpdateTrade trade={trade.originalTrade} onConfirm={onUpdateTrade} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        No trades match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-row">
              <span className="pagination-summary">
                Showing {startIndex}-{endIndex} of {sortedTrades.length} trades
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPageSafe === 1}
                >
                  Prev
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`page-number ${currentPageSafe === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="page-button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPageSafe === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
  
  </>);
};

export default TradeList;
