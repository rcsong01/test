import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = {
  // Stock endpoints
  getStockQuote: (symbol) => axios.get(`${API}/stocks/${symbol}/quote`),
  getStockHistory: (symbol) => axios.get(`${API}/stocks/${symbol}/history`),
  getTrendingStocks: () => axios.get(`${API}/stocks/trending`),
  
  // AI endpoints
  analyzeStock: (symbol) => axios.get(`${API}/ai/analyze/${symbol}`),
  getRecommendations: () => axios.get(`${API}/ai/recommendations`),
  
  // Portfolio endpoints
  getPortfolio: () => axios.get(`${API}/portfolio`),
  executeTrade: (data) => axios.post(`${API}/portfolio/trade`, data),
  getTransactions: () => axios.get(`${API}/transactions`),
  
  // Watchlist endpoints
  getWatchlist: () => axios.get(`${API}/watchlist`),
  addToWatchlist: (symbol) => axios.post(`${API}/watchlist`, { symbol }),
  removeFromWatchlist: (symbol) => axios.delete(`${API}/watchlist/${symbol}`),
  
  // Balance
  getBalance: () => axios.get(`${API}/balance`),
};

export default api;
