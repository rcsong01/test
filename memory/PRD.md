# MarketGenius AI - Product Requirements Document

## Original Problem Statement
Build an app that uses AI to pick stocks and make money buying and selling stocks. The app should constantly scan the internet for real news from reliable verifiable sources. News articles are analyzed with AI to recommend BUY or SELL signals. Auto-trade based on 80%+ confidence signals. Add premium Signal Alerts feature for email notifications.

## What's Been Implemented (Dec 2025)

### Core Features
- ✅ Dashboard with portfolio overview, market overview, watchlist, recent trades
- ✅ Paper trading (BUY/SELL/SHORT) with $100k starting balance
- ✅ Real-time stock quotes via yfinance (no API key needed)
- ✅ Stock detail pages with interactive price charts
- ✅ AI analysis with GPT-5.2 (BUY/SELL/HOLD recommendations)
- ✅ Watchlist functionality (add/remove stocks)
- ✅ Transaction history tracking
- ✅ Stock search functionality

### News Scanning & AI Signals
- ✅ Real-time RSS feed scanning from 9 financial news sources (WSJ, Bloomberg, Reuters, etc.)
- ✅ GPT-5.2 analyzes news sentiment for trading signals
- ✅ BUY/SELL signals generated with confidence scores and reasoning
- ✅ Background news scanning (every 15 minutes)
- ✅ Manual "Scan News" trigger button
- ✅ News Signals tab with live updates
- ✅ Any publicly traded company detection (regex + yfinance validation)

### Auto-Trading Bot
- ✅ Configurable auto-trading with min confidence threshold (default 80%)
- ✅ Customizable trade amount (default $1,000)
- ✅ Automatic BUY on high-confidence BUY signals
- ✅ Automatic SELL on high-confidence SELL signals (or SHORT if no holdings)
- ✅ Short position management

### Premium Signal Alerts
- ✅ Email subscription system via Resend API
- ✅ Customizable confidence threshold (50-95%)
- ✅ Signal type filtering (BUY, SELL, or both)
- ✅ Beautiful HTML email templates with signal details
- ✅ Automatic alerts when high-confidence signals generated
- ✅ Test email functionality
- ✅ Unsubscribe option

### UI/UX Features (Dec 2025)
- ✅ Portfolio value display (Invested, Cash, P&L) with proper layout
- ✅ Prominent "News Signals" tab - easily clickable
- ✅ Date and time on all news cards
- ✅ White scrollbar for news feed visibility
- ✅ Clickable BUY/SELL signal counts for filtering
- ✅ **VERY PROMINENT BUY/SELL badges** - large green/red badges with white text next to ticker symbol

## Tech Stack
- **Frontend**: React + Tailwind CSS + Recharts + Shadcn UI
- **Backend**: FastAPI with async endpoints
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Stock Data**: yfinance (real-time, no API key needed)
- **Email**: Resend API
- **News**: WSJ, Bloomberg, Reuters, CNBC, MarketWatch, Yahoo Finance, Investing.com, Seeking Alpha, Benzinga

## Notes
- Stock prices are REAL via yfinance library
- Resend test mode: emails only go to verified address (richard.csongor@gmail.com)
- For production: verify domain at resend.com/domains

## Upcoming Tasks (P1)
- Verify Resend domain for production emails

## Future/Backlog Tasks
- Implement backtesting for historical AI strategy performance
- Add granular auto-trading controls (risk tolerance, stop-loss)
- Explore paid news APIs for better data quality
- Add technical indicator charts
- Mobile-first responsive design
- Social features (leaderboard)

## Next Action Items
1. Get real Alpha Vantage API key for live stock data
2. Verify domain in Resend for production emails
3. Add Stripe integration for premium tier payments
4. Implement push notifications (browser/mobile)
