# MarketGenius AI - Product Requirements Document

## Original Problem Statement
Build an app that uses AI to pick stocks and make money buying and selling stocks in the stock market.

## User Choices
- Paper trading with simulated $100,000 starting balance
- AI-powered stock recommendations via OpenAI GPT-5.2
- Alpha Vantage for stock market data
- Dark theme financial dashboard aesthetic

## Architecture
- **Frontend**: React with Tailwind CSS, Recharts for charts, Shadcn UI components
- **Backend**: FastAPI with async endpoints
- **Database**: MongoDB for portfolio, transactions, watchlist, AI recommendations
- **AI Integration**: OpenAI GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Stock Data**: Alpha Vantage API (demo key - returns mock data)

## What's Been Implemented (Jan 2026)
- ✅ Dashboard with portfolio overview, market overview, watchlist, recent trades
- ✅ Paper trading (BUY/SELL) with $100k starting balance
- ✅ Real-time stock quotes for 8 trending stocks
- ✅ Stock detail pages with interactive price charts
- ✅ AI analysis with GPT-5.2 (BUY/SELL/HOLD recommendations)
- ✅ Watchlist functionality (add/remove stocks)
- ✅ Transaction history tracking
- ✅ Stock search functionality

## P0 - Critical (Completed)
- [x] Core dashboard UI
- [x] Paper trading functionality
- [x] AI stock analysis
- [x] Portfolio tracking

## P1 - Important (Backlog)
- [ ] User authentication
- [ ] Multiple portfolios
- [ ] Real Alpha Vantage API key (premium)
- [ ] Historical AI recommendation accuracy tracking

## P2 - Nice to Have (Backlog)
- [ ] Price alerts
- [ ] News integration
- [ ] Social features (share trades)
- [ ] Advanced charting (candlesticks, indicators)

## Next Action Items
1. Get real Alpha Vantage API key for accurate stock data
2. Add user authentication for multi-user support
3. Implement price alerts for watchlist stocks
