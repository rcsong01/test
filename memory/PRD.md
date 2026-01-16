# MarketGenius AI - Product Requirements Document

## Original Problem Statement
Build an app that uses AI to pick stocks and make money buying and selling stocks. The app should constantly scan the internet for real news from reliable verifiable sources. News articles are analyzed with AI to recommend BUY or SELL signals. Add premium Signal Alerts feature for email notifications.

## What's Been Implemented (Jan 2026)

### Core Features
- ✅ Dashboard with portfolio overview, market overview, watchlist, recent trades
- ✅ Paper trading (BUY/SELL) with $100k starting balance
- ✅ Real-time stock quotes for 20 trending stocks
- ✅ Stock detail pages with interactive price charts
- ✅ AI analysis with GPT-5.2 (BUY/SELL/HOLD recommendations)
- ✅ Watchlist functionality (add/remove stocks)
- ✅ Transaction history tracking
- ✅ Stock search functionality

### News Scanning & AI Signals
- ✅ Real-time RSS feed scanning from 7 financial news sources
- ✅ GPT-5.2 analyzes news sentiment for trading signals
- ✅ BUY/SELL signals generated with confidence scores
- ✅ Background news scanning (every 15 minutes)
- ✅ Manual "Scan News" trigger button
- ✅ News Signals tab with live updates

### Premium Signal Alerts (NEW)
- ✅ Email subscription system via Resend API
- ✅ Customizable confidence threshold (50-95%)
- ✅ Signal type filtering (BUY, SELL, or both)
- ✅ Watched symbols selection (any of 20 tracked stocks)
- ✅ Free tier: 3 alerts/day
- ✅ Premium tier: 50 alerts/day
- ✅ Beautiful HTML email templates with signal details
- ✅ Automatic alerts when high-confidence signals generated
- ✅ Test email functionality
- ✅ Unsubscribe option

## Tech Stack
- **Frontend**: React + Tailwind CSS + Recharts + Shadcn UI
- **Backend**: FastAPI with async endpoints
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Stock Data**: Alpha Vantage API (demo key - mock data)
- **Email**: Resend API
- **News**: Yahoo Finance, CNBC, MarketWatch, WSJ, Bloomberg, Investing.com, Reuters

## Notes
- Stock prices use MOCKED data (Alpha Vantage demo key)
- Resend test mode: emails only go to verified address
- For production: verify domain at resend.com/domains

## Next Action Items
1. Get real Alpha Vantage API key for live stock data
2. Verify domain in Resend for production emails
3. Add Stripe integration for premium tier payments
4. Implement push notifications (browser/mobile)
