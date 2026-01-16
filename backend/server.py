from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio
import feedparser
from bs4 import BeautifulSoup
import re
import resend
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
ALPHA_VANTAGE_KEY = os.environ.get('ALPHA_VANTAGE_KEY', 'demo')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Initialize Resend
resend.api_key = RESEND_API_KEY

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== MODELS =====

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class StockQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    high: float
    low: float
    open: float
    previous_close: float
    volume: int
    timestamp: str

class PortfolioHolding(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    shares: float
    avg_cost: float
    current_price: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    action: str  # BUY or SELL
    shares: float
    price: float
    total: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    symbol: str
    action: str
    shares: float
    price: float

class WatchlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WatchlistCreate(BaseModel):
    symbol: str

class AIRecommendation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    recommendation: str  # BUY, SELL, HOLD
    confidence: int  # 0-100
    analysis: str
    key_factors: List[str]
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioSummary(BaseModel):
    total_value: float
    total_cost: float
    total_gain_loss: float
    total_gain_loss_percent: float
    cash_balance: float
    holdings: List[PortfolioHolding]

class UserBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cash_balance: float = 100000.0  # Starting with $100k paper money
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsArticle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    source: str
    url: str
    symbol: str
    company_name: str
    published_at: datetime
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    signal: Optional[str] = None  # BUY, SELL, HOLD
    signal_confidence: Optional[int] = None
    signal_reasoning: Optional[str] = None
    analyzed: bool = False

class NewsSignal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    news_id: str
    symbol: str
    company_name: str
    signal: str  # BUY, SELL, HOLD
    confidence: int
    reasoning: str
    news_title: str
    news_source: str
    news_url: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Company symbols and names mapping with search keywords
TRACKED_COMPANIES = {
    "AAPL": {"name": "Apple Inc.", "keywords": ["apple", "iphone", "ipad", "mac", "tim cook", "app store"]},
    "MSFT": {"name": "Microsoft Corporation", "keywords": ["microsoft", "windows", "azure", "satya nadella", "xbox", "linkedin"]},
    "GOOGL": {"name": "Alphabet Inc.", "keywords": ["google", "alphabet", "youtube", "android", "waymo", "sundar pichai"]},
    "AMZN": {"name": "Amazon.com Inc.", "keywords": ["amazon", "aws", "prime", "alexa", "andy jassy", "whole foods"]},
    "NVDA": {"name": "NVIDIA Corporation", "keywords": ["nvidia", "geforce", "gpu", "jensen huang", "cuda", "ai chip"]},
    "META": {"name": "Meta Platforms Inc.", "keywords": ["meta", "facebook", "instagram", "whatsapp", "zuckerberg", "metaverse"]},
    "TSLA": {"name": "Tesla Inc.", "keywords": ["tesla", "elon musk", "electric vehicle", "ev", "model 3", "model y", "cybertruck"]},
    "JPM": {"name": "JPMorgan Chase & Co.", "keywords": ["jpmorgan", "jp morgan", "jamie dimon", "chase bank"]},
    "V": {"name": "Visa Inc.", "keywords": ["visa"]},
    "WMT": {"name": "Walmart Inc.", "keywords": ["walmart", "wal-mart"]},
    "JNJ": {"name": "Johnson & Johnson", "keywords": ["johnson & johnson", "j&j"]},
    "PG": {"name": "Procter & Gamble Co.", "keywords": ["procter & gamble", "p&g"]},
    "MA": {"name": "Mastercard Inc.", "keywords": ["mastercard"]},
    "UNH": {"name": "UnitedHealth Group Inc.", "keywords": ["unitedhealth", "united health"]},
    "HD": {"name": "The Home Depot Inc.", "keywords": ["home depot"]},
    "DIS": {"name": "The Walt Disney Company", "keywords": ["disney", "walt disney", "disney+", "espn", "marvel"]},
    "BAC": {"name": "Bank of America Corp.", "keywords": ["bank of america", "bofa"]},
    "NFLX": {"name": "Netflix Inc.", "keywords": ["netflix"]},
    "ADBE": {"name": "Adobe Inc.", "keywords": ["adobe", "photoshop", "creative cloud"]},
    "CRM": {"name": "Salesforce Inc.", "keywords": ["salesforce", "marc benioff"]}
}

# Reliable news sources RSS feeds
NEWS_SOURCES = [
    {"name": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex", "type": "rss"},
    {"name": "CNBC Top News", "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html", "type": "rss"},
    {"name": "MarketWatch", "url": "https://feeds.marketwatch.com/marketwatch/topstories/", "type": "rss"},
    {"name": "Investing.com", "url": "https://www.investing.com/rss/news.rss", "type": "rss"},
    {"name": "Bloomberg Markets", "url": "https://feeds.bloomberg.com/markets/news.rss", "type": "rss"},
    {"name": "WSJ Markets", "url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", "type": "rss"},
    {"name": "Reuters Business", "url": "https://www.reuters.com/rssFeed/businessNews", "type": "rss"},
]

# ===== HELPER FUNCTIONS =====

async def get_stock_quote_from_api(symbol: str) -> dict:
    """Fetch stock quote from Alpha Vantage API"""
    url = f"https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol.upper(),
        "apikey": ALPHA_VANTAGE_KEY
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
    
    if "Global Quote" not in data or not data["Global Quote"]:
        # Return mock data for demo purposes
        import random
        base_price = random.uniform(50, 500)
        change = random.uniform(-10, 10)
        return {
            "symbol": symbol.upper(),
            "price": round(base_price, 2),
            "change": round(change, 2),
            "change_percent": round((change / base_price) * 100, 2),
            "high": round(base_price * 1.02, 2),
            "low": round(base_price * 0.98, 2),
            "open": round(base_price - change/2, 2),
            "previous_close": round(base_price - change, 2),
            "volume": random.randint(1000000, 50000000),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    quote = data["Global Quote"]
    return {
        "symbol": quote.get("01. symbol", symbol.upper()),
        "price": float(quote.get("05. price", 0)),
        "change": float(quote.get("09. change", 0)),
        "change_percent": float(quote.get("10. change percent", "0%").replace("%", "")),
        "high": float(quote.get("03. high", 0)),
        "low": float(quote.get("04. low", 0)),
        "open": float(quote.get("02. open", 0)),
        "previous_close": float(quote.get("08. previous close", 0)),
        "volume": int(quote.get("06. volume", 0)),
        "timestamp": quote.get("07. latest trading day", datetime.now(timezone.utc).isoformat())
    }

async def get_stock_history(symbol: str) -> List[dict]:
    """Fetch historical stock data from Alpha Vantage"""
    url = f"https://www.alphavantage.co/query"
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol.upper(),
        "apikey": ALPHA_VANTAGE_KEY,
        "outputsize": "compact"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
    
    if "Time Series (Daily)" not in data:
        # Generate mock historical data
        import random
        history = []
        base_price = random.uniform(100, 400)
        for i in range(30):
            date = datetime.now(timezone.utc).replace(day=max(1, datetime.now().day - i))
            change = random.uniform(-5, 5)
            base_price += change
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(base_price - 2, 2),
                "high": round(base_price + 3, 2),
                "low": round(base_price - 3, 2),
                "close": round(base_price, 2),
                "volume": random.randint(1000000, 20000000)
            })
        return history[::-1]
    
    time_series = data["Time Series (Daily)"]
    history = []
    for date_str, values in list(time_series.items())[:30]:
        history.append({
            "date": date_str,
            "open": float(values["1. open"]),
            "high": float(values["2. high"]),
            "low": float(values["3. low"]),
            "close": float(values["4. close"]),
            "volume": int(values["5. volume"])
        })
    
    return history[::-1]

async def get_or_create_balance() -> dict:
    """Get or create user's cash balance"""
    balance = await db.balance.find_one({}, {"_id": 0})
    if not balance:
        balance_obj = UserBalance()
        doc = balance_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.balance.insert_one(doc)
        return {"cash_balance": balance_obj.cash_balance}
    return {"cash_balance": balance.get("cash_balance", 100000.0)}

# ===== NEWS SCANNING FUNCTIONS =====

def extract_company_from_text(text: str) -> List[dict]:
    """Extract company symbols and names from news text"""
    found_companies = []
    text_lower = text.lower()
    
    for symbol, data in TRACKED_COMPANIES.items():
        # Check for symbol (with word boundaries)
        if re.search(rf'\b{symbol}\b', text, re.IGNORECASE):
            found_companies.append({"symbol": symbol, "name": data["name"]})
            continue
        
        # Check for company keywords
        for keyword in data["keywords"]:
            if keyword.lower() in text_lower:
                found_companies.append({"symbol": symbol, "name": data["name"]})
                break
    
    return found_companies

async def fetch_rss_news(source: dict) -> List[dict]:
    """Fetch news from RSS feed"""
    articles = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(source["url"], follow_redirects=True)
            if response.status_code == 200:
                feed = feedparser.parse(response.text)
                for entry in feed.entries[:20]:  # Limit to 20 articles per source
                    title = entry.get("title", "")
                    summary = entry.get("summary", entry.get("description", ""))
                    # Clean HTML from summary
                    if summary:
                        soup = BeautifulSoup(summary, "html.parser")
                        summary = soup.get_text()[:500]
                    
                    # Parse published date
                    published = entry.get("published_parsed") or entry.get("updated_parsed")
                    if published:
                        published_dt = datetime(*published[:6], tzinfo=timezone.utc)
                    else:
                        published_dt = datetime.now(timezone.utc)
                    
                    articles.append({
                        "title": title,
                        "summary": summary,
                        "source": source["name"],
                        "url": entry.get("link", ""),
                        "published_at": published_dt
                    })
    except Exception as e:
        logger.error(f"Error fetching RSS from {source['name']}: {e}")
    
    return articles

async def fetch_all_news() -> List[dict]:
    """Fetch news from all sources"""
    all_articles = []
    
    # Fetch from RSS feeds concurrently
    tasks = [fetch_rss_news(source) for source in NEWS_SOURCES]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for result in results:
        if isinstance(result, list):
            all_articles.extend(result)
    
    return all_articles

async def analyze_news_with_ai(article: dict, company: dict) -> dict:
    """Analyze a news article with AI to generate trading signal"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"news-analysis-{uuid.uuid4()}",
        system_message="""You are an expert financial analyst. Analyze the given news article about a company and determine if it suggests a BUY, SELL, or HOLD signal for the stock.

Consider:
- Is this news positive, negative, or neutral for the company?
- How significant is this news for the stock price?
- Is this breaking news or already priced in?
- What are the short-term implications?

Respond ONLY in this exact JSON format:
{
    "signal": "BUY" or "SELL" or "HOLD",
    "confidence": 0-100,
    "reasoning": "Brief 1-2 sentence explanation"
}"""
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Analyze this news for {company['name']} ({company['symbol']}):

HEADLINE: {article['title']}

SUMMARY: {article['summary']}

SOURCE: {article['source']}

Based on this news, what is your trading signal? Respond in JSON format."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        analysis = json.loads(response_text.strip())
        return {
            "signal": analysis.get("signal", "HOLD"),
            "confidence": analysis.get("confidence", 50),
            "reasoning": analysis.get("reasoning", "Unable to analyze")
        }
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "signal": "HOLD",
            "confidence": 30,
            "reasoning": "Analysis pending - unable to process"
        }

async def scan_and_analyze_news():
    """Main function to scan news and generate signals"""
    logger.info("Starting news scan...")
    
    # Fetch all news
    articles = await fetch_all_news()
    logger.info(f"Fetched {len(articles)} articles from news sources")
    
    new_signals = []
    
    for article in articles:
        # Check if we already processed this article
        existing = await db.news_articles.find_one({"url": article["url"]})
        if existing:
            continue
        
        # Find companies mentioned in the article
        full_text = f"{article['title']} {article['summary']}"
        companies = extract_company_from_text(full_text)
        
        if not companies:
            continue
        
        # Analyze for each company mentioned
        for company in companies[:2]:  # Limit to 2 companies per article
            # Analyze with AI
            analysis = await analyze_news_with_ai(article, company)
            
            # Create news article record
            news_article = NewsArticle(
                title=article["title"],
                summary=article["summary"],
                source=article["source"],
                url=article["url"],
                symbol=company["symbol"],
                company_name=company["name"],
                published_at=article["published_at"],
                signal=analysis["signal"],
                signal_confidence=analysis["confidence"],
                signal_reasoning=analysis["reasoning"],
                analyzed=True
            )
            
            # Save to database
            doc = news_article.model_dump()
            doc['published_at'] = doc['published_at'].isoformat()
            doc['fetched_at'] = doc['fetched_at'].isoformat()
            await db.news_articles.insert_one(doc)
            
            # Create signal record if confidence is high enough
            if analysis["confidence"] >= 60 and analysis["signal"] in ["BUY", "SELL"]:
                signal = NewsSignal(
                    news_id=news_article.id,
                    symbol=company["symbol"],
                    company_name=company["name"],
                    signal=analysis["signal"],
                    confidence=analysis["confidence"],
                    reasoning=analysis["reasoning"],
                    news_title=article["title"],
                    news_source=article["source"],
                    news_url=article["url"]
                )
                signal_doc = signal.model_dump()
                signal_doc['created_at'] = signal_doc['created_at'].isoformat()
                await db.news_signals.insert_one(signal_doc)
                new_signals.append(signal_doc)
                
                logger.info(f"New {analysis['signal']} signal for {company['symbol']}: {article['title'][:50]}...")
    
    logger.info(f"News scan complete. Generated {len(new_signals)} new signals.")
    return new_signals

# Background task to periodically scan news
news_scan_running = False

async def periodic_news_scan():
    """Run news scan every 15 minutes"""
    global news_scan_running
    while news_scan_running:
        try:
            await scan_and_analyze_news()
        except Exception as e:
            logger.error(f"Periodic news scan error: {e}")
        await asyncio.sleep(900)  # 15 minutes

# ===== API ROUTES =====

@api_router.get("/")
async def root():
    return {"message": "AI Stock Trading API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Stock Routes
@api_router.get("/stocks/{symbol}/quote")
async def get_stock_quote(symbol: str):
    """Get real-time stock quote"""
    quote = await get_stock_quote_from_api(symbol)
    return quote

@api_router.get("/stocks/{symbol}/history")
async def get_stock_history_route(symbol: str):
    """Get historical stock data"""
    history = await get_stock_history(symbol)
    return {"symbol": symbol.upper(), "history": history}

@api_router.get("/stocks/trending")
async def get_trending_stocks():
    """Get trending/popular stocks"""
    trending = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM"]
    stocks = []
    for symbol in trending:
        quote = await get_stock_quote_from_api(symbol)
        stocks.append(quote)
    return stocks

# AI Analysis Routes
@api_router.get("/ai/analyze/{symbol}")
async def analyze_stock(symbol: str):
    """Get AI-powered stock analysis"""
    # Get stock data first
    quote = await get_stock_quote_from_api(symbol)
    history = await get_stock_history(symbol)
    
    # Prepare context for AI
    history_summary = history[-5:] if history else []
    
    # Use GPT-5.2 for analysis
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"stock-analysis-{symbol}-{uuid.uuid4()}",
        system_message="""You are an expert stock analyst. Analyze the given stock data and provide:
1. A clear BUY, SELL, or HOLD recommendation
2. Confidence level (0-100)
3. Brief analysis (2-3 sentences)
4. 3-4 key factors influencing your decision
5. Target price (if buying)
6. Stop loss price (if applicable)

Respond in JSON format:
{
    "recommendation": "BUY|SELL|HOLD",
    "confidence": 75,
    "analysis": "Your analysis here",
    "key_factors": ["factor1", "factor2", "factor3"],
    "target_price": 150.00,
    "stop_loss": 130.00
}"""
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Analyze {symbol} stock:
Current Price: ${quote['price']}
Change Today: ${quote['change']} ({quote['change_percent']}%)
Day High: ${quote['high']}
Day Low: ${quote['low']}
Volume: {quote['volume']:,}

Recent 5-day prices: {[h['close'] for h in history_summary]}

Provide your analysis in JSON format."""
    
    try:
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse the JSON response
        import json
        # Clean the response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        analysis_data = json.loads(response_text.strip())
        
        recommendation = AIRecommendation(
            symbol=symbol.upper(),
            recommendation=analysis_data.get("recommendation", "HOLD"),
            confidence=analysis_data.get("confidence", 50),
            analysis=analysis_data.get("analysis", "Unable to analyze"),
            key_factors=analysis_data.get("key_factors", []),
            target_price=analysis_data.get("target_price"),
            stop_loss=analysis_data.get("stop_loss")
        )
        
        # Save to database
        doc = recommendation.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.ai_recommendations.insert_one(doc)
        
        return recommendation.model_dump()
        
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        # Return default recommendation on error
        return AIRecommendation(
            symbol=symbol.upper(),
            recommendation="HOLD",
            confidence=50,
            analysis="Unable to complete analysis. Please try again.",
            key_factors=["Analysis pending"]
        ).model_dump()

@api_router.get("/ai/recommendations")
async def get_recent_recommendations():
    """Get recent AI recommendations"""
    recommendations = await db.ai_recommendations.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).to_list(20)
    return recommendations

# Portfolio Routes
@api_router.get("/portfolio")
async def get_portfolio():
    """Get current portfolio"""
    holdings = await db.holdings.find({}, {"_id": 0}).to_list(100)
    balance = await get_or_create_balance()
    
    total_value = 0.0
    total_cost = 0.0
    
    updated_holdings = []
    for holding in holdings:
        # Get current price
        quote = await get_stock_quote_from_api(holding['symbol'])
        holding['current_price'] = quote['price']
        market_value = holding['shares'] * quote['price']
        cost_basis = holding['shares'] * holding['avg_cost']
        total_value += market_value
        total_cost += cost_basis
        
        updated_holdings.append({
            **holding,
            "market_value": round(market_value, 2),
            "gain_loss": round(market_value - cost_basis, 2),
            "gain_loss_percent": round(((market_value - cost_basis) / cost_basis * 100) if cost_basis > 0 else 0, 2)
        })
    
    return {
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain_loss": round(total_value - total_cost, 2),
        "total_gain_loss_percent": round(((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0, 2),
        "cash_balance": balance['cash_balance'],
        "holdings": updated_holdings
    }

@api_router.post("/portfolio/trade")
async def execute_trade(transaction: TransactionCreate):
    """Execute a paper trade (buy/sell)"""
    symbol = transaction.symbol.upper()
    action = transaction.action.upper()
    shares = transaction.shares
    price = transaction.price
    total = shares * price
    
    balance = await get_or_create_balance()
    current_cash = balance['cash_balance']
    
    if action == "BUY":
        if total > current_cash:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        # Update cash balance
        new_cash = current_cash - total
        await db.balance.update_one({}, {"$set": {"cash_balance": new_cash}})
        
        # Update or create holding
        existing = await db.holdings.find_one({"symbol": symbol}, {"_id": 0})
        if existing:
            new_shares = existing['shares'] + shares
            new_avg_cost = ((existing['shares'] * existing['avg_cost']) + total) / new_shares
            await db.holdings.update_one(
                {"symbol": symbol},
                {"$set": {"shares": new_shares, "avg_cost": new_avg_cost, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            holding = PortfolioHolding(symbol=symbol, shares=shares, avg_cost=price)
            doc = holding.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.holdings.insert_one(doc)
    
    elif action == "SELL":
        existing = await db.holdings.find_one({"symbol": symbol}, {"_id": 0})
        if not existing or existing['shares'] < shares:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        # Update cash balance
        new_cash = current_cash + total
        await db.balance.update_one({}, {"$set": {"cash_balance": new_cash}})
        
        # Update holding
        new_shares = existing['shares'] - shares
        if new_shares <= 0:
            await db.holdings.delete_one({"symbol": symbol})
        else:
            await db.holdings.update_one(
                {"symbol": symbol},
                {"$set": {"shares": new_shares, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    # Record transaction
    tx = Transaction(
        symbol=symbol,
        action=action,
        shares=shares,
        price=price,
        total=total
    )
    doc = tx.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.transactions.insert_one(doc)
    
    return {"message": f"{action} order executed", "transaction": tx.model_dump()}

@api_router.get("/transactions")
async def get_transactions():
    """Get transaction history"""
    transactions = await db.transactions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return transactions

# Watchlist Routes
@api_router.get("/watchlist")
async def get_watchlist():
    """Get user's watchlist with current prices"""
    items = await db.watchlist.find({}, {"_id": 0}).to_list(50)
    watchlist = []
    for item in items:
        quote = await get_stock_quote_from_api(item['symbol'])
        watchlist.append({
            **item,
            **quote
        })
    return watchlist

@api_router.post("/watchlist")
async def add_to_watchlist(item: WatchlistCreate):
    """Add stock to watchlist"""
    symbol = item.symbol.upper()
    existing = await db.watchlist.find_one({"symbol": symbol})
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")
    
    watchlist_item = WatchlistItem(symbol=symbol)
    doc = watchlist_item.model_dump()
    doc['added_at'] = doc['added_at'].isoformat()
    await db.watchlist.insert_one(doc)
    
    return watchlist_item.model_dump()

@api_router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    """Remove stock from watchlist"""
    result = await db.watchlist.delete_one({"symbol": symbol.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    return {"message": "Removed from watchlist"}

# Balance Route
@api_router.get("/balance")
async def get_balance():
    """Get current cash balance"""
    balance = await get_or_create_balance()
    return balance

# News Routes
@api_router.get("/news/signals")
async def get_news_signals(limit: int = 20):
    """Get latest news-based trading signals"""
    signals = await db.news_signals.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return signals

@api_router.get("/news/signals/{symbol}")
async def get_news_signals_by_symbol(symbol: str, limit: int = 10):
    """Get news signals for a specific stock"""
    signals = await db.news_signals.find(
        {"symbol": symbol.upper()}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return signals

@api_router.get("/news/articles")
async def get_news_articles(limit: int = 50):
    """Get latest news articles with analysis"""
    articles = await db.news_articles.find({}, {"_id": 0}).sort("fetched_at", -1).to_list(limit)
    return articles

@api_router.get("/news/articles/{symbol}")
async def get_news_articles_by_symbol(symbol: str, limit: int = 20):
    """Get news articles for a specific stock"""
    articles = await db.news_articles.find(
        {"symbol": symbol.upper()},
        {"_id": 0}
    ).sort("fetched_at", -1).to_list(limit)
    return articles

@api_router.post("/news/scan")
async def trigger_news_scan(background_tasks: BackgroundTasks):
    """Manually trigger a news scan"""
    background_tasks.add_task(scan_and_analyze_news)
    return {"message": "News scan started", "status": "processing"}

@api_router.get("/news/stats")
async def get_news_stats():
    """Get news scanning statistics"""
    total_articles = await db.news_articles.count_documents({})
    total_signals = await db.news_signals.count_documents({})
    buy_signals = await db.news_signals.count_documents({"signal": "BUY"})
    sell_signals = await db.news_signals.count_documents({"signal": "SELL"})
    
    # Get signals by company
    pipeline = [
        {"$group": {"_id": "$symbol", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    signals_by_company = await db.news_signals.aggregate(pipeline).to_list(10)
    
    return {
        "total_articles_analyzed": total_articles,
        "total_signals_generated": total_signals,
        "buy_signals": buy_signals,
        "sell_signals": sell_signals,
        "top_companies": signals_by_company
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Start background news scanning on startup"""
    global news_scan_running
    news_scan_running = True
    # Run initial scan after a short delay
    asyncio.create_task(initial_news_scan())

async def initial_news_scan():
    """Run initial news scan after startup"""
    await asyncio.sleep(5)  # Wait for app to be fully ready
    logger.info("Running initial news scan...")
    await scan_and_analyze_news()
    # Start periodic scanning
    asyncio.create_task(periodic_news_scan())

@app.on_event("shutdown")
async def shutdown_db_client():
    global news_scan_running
    news_scan_running = False
    client.close()
