# MarketGenius AI - Product Requirements Document

## Original Problem Statement
Build an app that uses AI to pick stocks and make money buying and selling stocks in the stock market. The app should constantly scan the internet for real news from reliable verifiable sources of publicly traded companies. The news article will be provided with the company name and stock symbol and analyze the news and recommend a buy or a sell signal.

## User Choices
- Paper trading with simulated $100,000 starting balance
- AI-powered stock recommendations via OpenAI GPT-5.2
- Alpha Vantage for stock market data (demo key - mock data)
- Real-time news scanning from reliable financial sources
- Dark theme financial dashboard aesthetic

## Architecture
- **Frontend**: React with Tailwind CSS, Recharts for charts, Shadcn UI components
- **Backend**: FastAPI with async endpoints, background news scanning
- **Database**: MongoDB for portfolio, transactions, watchlist, news articles, AI signals
- **AI Integration**: OpenAI GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Stock Data**: Alpha Vantage API (demo key - returns mock data)
- **News Sources**: Yahoo Finance, CNBC, MarketWatch, WSJ Markets, Bloomberg, Investing.com, Reuters

## What's Been Implemented (Jan 2026)
- ✅ Dashboard with portfolio overview, market overview, watchlist, recent trades
- ✅ Paper trading (BUY/SELL) with $100k starting balance
- ✅ Real-time stock quotes for trending stocks
- ✅ Stock detail pages with interactive price charts
- ✅ AI analysis with GPT-5.2 (BUY/SELL/HOLD recommendations)
- ✅ Watchlist functionality (add/remove stocks)
- ✅ Transaction history tracking
- ✅ Stock search functionality
- ✅ **NEWS SCANNING**: Real-time RSS feed scanning from 7 financial news sources
- ✅ **NEWS AI ANALYSIS**: GPT-5.2 analyzes news for trading signals
- ✅ **BUY/SELL SIGNALS**: AI-generated signals with confidence scores
- ✅ Background news scanning (runs every 15 minutes)
- ✅ Manual "Scan News" trigger button
- ✅ News Signals tab with live updates

## Tracked Companies (20)
AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, WMT, JNJ, PG, MA, UNH, HD, DIS, BAC, NFLX, ADBE, CRM

## P0 - Critical (Completed)
- [x] Core dashboard UI
- [x] Paper trading functionality
- [x] AI stock analysis
- [x] Portfolio tracking
- [x] News scanning from reliable sources
- [x] AI-powered news sentiment analysis
- [x] BUY/SELL signal generation

## P1 - Important (Backlog)
- [ ] Real Alpha Vantage API key for accurate stock data
- [ ] User authentication for multi-user support
- [ ] More news sources (Twitter/X, Reddit)
- [ ] Historical signal accuracy tracking

## P2 - Nice to Have (Backlog)
- [ ] Price alerts
- [ ] Auto-trading based on signals
- [ ] Email/SMS notifications for signals
- [ ] Advanced charting (candlesticks, indicators)

## Next Action Items
1. Get real Alpha Vantage API key for live stock data
2. Add user authentication
3. Implement price alerts when signals are generated
4. Add signal performance tracking (accuracy over time)
