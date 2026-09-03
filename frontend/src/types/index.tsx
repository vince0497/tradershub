// export interface Trade { 
// symbol: string; 
// quantity: number; 
// price: number; 
// side: "BUY" | "SELL"; 
// trader: string; 
// tradeDate: string; 
// status: "ACTIVE" | "CANCELLED"; 
// }

export interface Trade {
  tradeId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  trader: string;
  book: string;
  counterparty: string;
  tradeTimestamp: string;
  status: string;
};

export type SortKey = 'symbol' | 'side' | 'status';
export type SortDirection = 'asc' | 'desc';