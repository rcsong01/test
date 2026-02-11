import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  PieChart, 
  Eye, 
  Cpu,
  Search,
  Plus,
  Minus,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Wallet,
  Star,
  Newspaper,
  Zap,
  ExternalLink,
  Radio,
  AlertTriangle,
  Bell,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatPercent, formatLargeNumber, cn } from '../lib/utils';
import { toast } from 'sonner';
import { SignalAlertsModal } from '../components/SignalAlertsModal';
import { AutoTradeSettingsModal } from '../components/AutoTradeSettingsModal';

// Stock Card Component
const StockCard = ({ stock, onClick, onAddWatchlist }) => {
  const isPositive = stock.change >= 0;
  
  return (
    <div 
      className="p-4 border border-border bg-card hover:bg-secondary/30 cursor-pointer transition-colors duration-200 bento-item"
      onClick={() => onClick(stock)}
      data-testid={`stock-card-${stock.symbol}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight uppercase">{stock.symbol}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={(e) => { e.stopPropagation(); onAddWatchlist(stock.symbol); }}
          data-testid={`watchlist-btn-${stock.symbol}`}
        >
          <Star className="h-4 w-4" />
        </Button>
      </div>
      <div className="font-mono text-2xl font-bold tracking-wide mb-1">
        {formatCurrency(stock.price)}
      </div>
      <div className={cn(
        "font-mono text-sm flex items-center gap-1",
        isPositive ? "text-positive" : "text-negative"
      )}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{formatCurrency(Math.abs(stock.change))}</span>
        <span>({formatPercent(stock.change_percent)})</span>
      </div>
    </div>
  );
};

// Portfolio Summary Card
const PortfolioSummary = ({ portfolio }) => {
  const isPositive = portfolio.total_gain_loss >= 0;
  
  return (
    <Card className="bg-card border-border" data-testid="portfolio-summary">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Portfolio Value
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-3xl font-bold tracking-wide mb-4">
          {formatCurrency(portfolio.total_value + portfolio.cash_balance)}
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Invested</span>
            <span className="font-mono text-sm">{formatCurrency(portfolio.total_value)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Cash</span>
            <span className="font-mono text-sm">{formatCurrency(portfolio.cash_balance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">P&L</span>
            <span className={cn("font-mono text-sm font-bold", isPositive ? "text-positive" : "text-negative")}>
              {formatCurrency(portfolio.total_gain_loss)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// News Signal Card Component
const NewsSignalCard = ({ signal, onClick }) => {
  const getSignalIcon = (sig) => {
    switch (sig) {
      case 'BUY': return <TrendingUp className="h-5 w-5" />;
      case 'SELL': return <TrendingDown className="h-5 w-5" />;
      default: return <Minus className="h-5 w-5" />;
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return { dateStr: '', timeStr: '', relativeTime: '' };
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    
    let relativeTime = '';
    if (diffMins < 60) {
      relativeTime = diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    }
    
    return { dateStr, timeStr, relativeTime };
  };

  const { dateStr, timeStr, relativeTime } = formatDateTime(signal.created_at);
  const isBuy = signal.signal === 'BUY';
  const isSell = signal.signal === 'SELL';
  
  return (
    <div 
      className={cn(
        "p-4 border-2 bg-card hover:bg-secondary/30 cursor-pointer transition-all duration-200 relative overflow-hidden group",
        isBuy ? "border-positive hover:border-positive bg-positive/5" : isSell ? "border-negative hover:border-negative bg-negative/5" : "border-border"
      )}
      onClick={() => onClick(signal.symbol)}
      data-testid={`news-signal-${signal.id}`}
    >
      {/* Signal indicator stripe - thicker */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-3",
        isBuy ? 'bg-positive' : isSell ? 'bg-negative' : 'bg-accent'
      )} />
      
      <div className="pl-5">
        {/* Header with VERY prominent signal badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-4">
            {/* VERY Large prominent signal badge */}
            <div className={cn(
              "flex items-center gap-2 px-5 py-3 font-mono text-lg font-black uppercase tracking-wider shadow-lg",
              isBuy ? "bg-positive text-black" : isSell ? "bg-negative text-white" : "bg-accent text-white"
            )}>
              {getSignalIcon(signal.signal)}
              <span className="text-xl">{signal.signal}</span>
            </div>
            {/* Stock symbol */}
            <span className="font-heading font-bold uppercase text-3xl tracking-tight">{signal.symbol}</span>
          </div>
            </div>
            {/* Stock symbol */}
            <span className="font-heading font-bold uppercase text-2xl tracking-tight">{signal.symbol}</span>
          </div>
          {/* Date/Time */}
          <div className="text-right">
            <div className="font-mono text-base text-primary font-bold">{timeStr}</div>
            <div className="font-mono text-sm text-muted-foreground">{dateStr}</div>
          </div>
        </div>

        {/* Confidence and relative time */}
        <div className="flex items-center gap-3 mb-3">
          {relativeTime && (
            <Badge variant="outline" className="font-mono text-xs border-primary text-primary px-2 py-1">
              {relativeTime}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-sm">
            <Zap className={cn("h-4 w-4", signal.confidence >= 80 ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("font-mono font-bold", signal.confidence >= 80 ? "text-primary" : "text-muted-foreground")}>
              {signal.confidence}% confidence
            </span>
          </div>
        </div>
        
        <h4 className="text-base font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {signal.news_title}
        </h4>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {signal.reasoning}
        </p>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/30">
          <span className="flex items-center gap-1">
            <Newspaper className="h-3 w-3" />
            {signal.news_source}
          </span>
          <a 
            href={signal.news_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        </div>
      </div>
    </div>
  );
};
// AI Recommendation Card
const AIRecommendationCard = ({ recommendation }) => {
  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'BUY': return 'bg-positive text-black';
      case 'SELL': return 'bg-negative text-white';
      default: return 'bg-accent text-white';
    }
  };
  
  return (
    <div className="p-4 border border-border bg-card ai-glow" data-testid={`ai-rec-${recommendation.symbol}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-heading text-xl font-semibold uppercase tracking-tight">{recommendation.symbol}</h3>
        </div>
        <Badge className={cn("font-mono uppercase", getRecommendationColor(recommendation.recommendation))}>
          {recommendation.recommendation}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-muted-foreground text-xs uppercase">Confidence</div>
        <div className="flex-1 h-2 bg-secondary rounded-sm overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${recommendation.confidence}%` }}
          />
        </div>
        <span className="font-mono text-sm">{recommendation.confidence}%</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{recommendation.analysis}</p>
      <div className="flex flex-wrap gap-1">
        {recommendation.key_factors?.slice(0, 3).map((factor, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {factor}
          </Badge>
        ))}
      </div>
      {recommendation.target_price && (
        <div className="mt-3 pt-3 border-t border-border flex gap-4">
          <div>
            <div className="text-muted-foreground text-xs uppercase">Target</div>
            <div className="font-mono text-positive">{formatCurrency(recommendation.target_price)}</div>
          </div>
          {recommendation.stop_loss && (
            <div>
              <div className="text-muted-foreground text-xs uppercase">Stop Loss</div>
              <div className="font-mono text-negative">{formatCurrency(recommendation.stop_loss)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Trade Modal
const TradeModal = ({ stock, onTrade, cashBalance }) => {
  const [shares, setShares] = useState(1);
  const [action, setAction] = useState('BUY');
  const [isLoading, setIsLoading] = useState(false);
  
  const total = shares * stock.price;
  
  const handleTrade = async () => {
    setIsLoading(true);
    try {
      await onTrade({
        symbol: stock.symbol,
        action,
        shares,
        price: stock.price
      });
      toast.success(`${action} order executed for ${shares} shares of ${stock.symbol}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Trade failed');
    }
    setIsLoading(false);
  };
  
  return (
    <DialogContent className="bg-card border-border">
      <DialogHeader>
        <DialogTitle className="font-heading text-2xl uppercase tracking-tight">
          Trade {stock.symbol}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex gap-2">
          <Button 
            className={cn("flex-1 font-mono uppercase", action === 'BUY' ? 'bg-positive text-black' : 'bg-secondary')}
            onClick={() => setAction('BUY')}
            data-testid="trade-buy-btn"
          >
            Buy
          </Button>
          <Button 
            className={cn("flex-1 font-mono uppercase", action === 'SELL' ? 'bg-negative text-white' : 'bg-secondary')}
            onClick={() => setAction('SELL')}
            data-testid="trade-sell-btn"
          >
            Sell
          </Button>
        </div>
        
        <div>
          <label className="text-xs uppercase text-muted-foreground tracking-wider">Current Price</label>
          <div className="font-mono text-2xl">{formatCurrency(stock.price)}</div>
        </div>
        
        <div>
          <label className="text-xs uppercase text-muted-foreground tracking-wider">Shares</label>
          <div className="flex items-center gap-2 mt-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShares(Math.max(1, shares - 1))}
              data-testid="shares-minus"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input 
              type="number" 
              value={shares} 
              onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 text-center font-mono"
              data-testid="shares-input"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShares(shares + 1)}
              data-testid="shares-plus"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-secondary/50 border border-border">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono text-xl">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available Cash</span>
            <span className="font-mono">{formatCurrency(cashBalance)}</span>
          </div>
        </div>
        
        <Button 
          className={cn(
            "w-full font-mono uppercase tracking-wider btn-glow",
            action === 'BUY' ? 'bg-positive text-black hover:bg-positive/90' : 'bg-negative text-white hover:bg-negative/90'
          )}
          onClick={handleTrade}
          disabled={isLoading || (action === 'BUY' && total > cashBalance)}
          data-testid="execute-trade-btn"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : `${action} ${shares} Shares`}
        </Button>
      </div>
    </DialogContent>
  );
};

// Stock Detail View
const StockDetail = ({ symbol, onClose, onTrade, cashBalance }) => {
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [newsSignals, setNewsSignals] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [quoteRes, historyRes, newsRes] = await Promise.all([
        api.getStockQuote(symbol),
        api.getStockHistory(symbol),
        api.getNewsSignalsBySymbol(symbol)
      ]);
      setQuote(quoteRes.data);
      setHistory(historyRes.data.history);
      setNewsSignals(newsRes.data);
    } catch (error) {
      toast.error('Failed to load stock data');
    }
    setIsLoading(false);
  }, [symbol]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeStock(symbol);
      setAnalysis(res.data);
      toast.success('AI analysis complete');
    } catch (error) {
      toast.error('Analysis failed');
    }
    setIsAnalyzing(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isPositive = quote?.change >= 0;
  
  return (
    <div className="space-y-6" data-testid="stock-detail">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-tight">{symbol}</h2>
          <div className="font-mono text-5xl font-bold tracking-wide mt-2">
            {formatCurrency(quote?.price || 0)}
          </div>
          <div className={cn(
            "font-mono text-lg flex items-center gap-2 mt-1",
            isPositive ? "text-positive" : "text-negative"
          )}>
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span>{formatCurrency(Math.abs(quote?.change || 0))}</span>
            <span>({formatPercent(quote?.change_percent || 0)})</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="font-mono uppercase tracking-wider"
            data-testid="analyze-btn"
          >
            {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Cpu className="h-4 w-4 mr-2" />}
            AI Analyze
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black font-mono uppercase tracking-wider btn-glow" data-testid="trade-btn">
                Trade
              </Button>
            </DialogTrigger>
            {quote && <TradeModal stock={quote} onTrade={onTrade} cashBalance={cashBalance} />}
          </Dialog>
        </div>
      </div>
      
      {/* Price Chart */}
      <Card className="bg-card border-border chart-container">
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E599" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00E599" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#888', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#262626' }}
              />
              <YAxis 
                tick={{ fill: '#888', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#262626' }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  border: '1px solid #262626',
                  fontFamily: 'JetBrains Mono'
                }}
                labelStyle={{ color: '#888' }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="#00E599" 
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Stock Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Open</div>
          <div className="font-mono text-lg">{formatCurrency(quote?.open || 0)}</div>
        </div>
        <div className="p-4 bg-card border border-border">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">High</div>
          <div className="font-mono text-lg text-positive">{formatCurrency(quote?.high || 0)}</div>
        </div>
        <div className="p-4 bg-card border border-border">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Low</div>
          <div className="font-mono text-lg text-negative">{formatCurrency(quote?.low || 0)}</div>
        </div>
        <div className="p-4 bg-card border border-border">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Volume</div>
          <div className="font-mono text-lg">{formatLargeNumber(quote?.volume || 0)}</div>
        </div>
      </div>
      
      {/* AI Analysis */}
      {analysis && (
        <div className="tracing-beam">
          <AIRecommendationCard recommendation={analysis} />
        </div>
      )}
      
      {/* News Signals for this stock */}
      {newsSignals.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              News-Based Signals for {symbol}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newsSignals.slice(0, 5).map((signal) => (
                <NewsSignalCard 
                  key={signal.id} 
                  signal={signal} 
                  onClick={() => {}}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [portfolio, setPortfolio] = useState({ total_value: 0, total_cost: 0, total_gain_loss: 0, total_gain_loss_percent: 0, cash_balance: 100000, holdings: [] });
  const [watchlist, setWatchlist] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newsSignals, setNewsSignals] = useState([]);
  const [newsStats, setNewsStats] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('market');
  const [signalFilter, setSignalFilter] = useState('ALL'); // ALL, BUY, SELL
  
  // Filter signals based on selected filter
  const filteredSignals = newsSignals.filter(signal => {
    if (signalFilter === 'ALL') return true;
    return signal.signal === signalFilter;
  });
  
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trendingRes, portfolioRes, watchlistRes, recRes, txRes, newsRes, statsRes] = await Promise.all([
        api.getTrendingStocks(),
        api.getPortfolio(),
        api.getWatchlist(),
        api.getRecommendations(),
        api.getTransactions(),
        api.getNewsSignals(30),
        api.getNewsStats()
      ]);
      setTrendingStocks(trendingRes.data);
      setPortfolio(portfolioRes.data);
      setWatchlist(watchlistRes.data);
      setRecommendations(recRes.data);
      setTransactions(txRes.data);
      setNewsSignals(newsRes.data);
      setNewsStats(statsRes.data);
    } catch (error) {
      console.error('Dashboard load error:', error);
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
    // Refresh news signals every 2 minutes
    const interval = setInterval(() => {
      api.getNewsSignals(30).then(res => setNewsSignals(res.data)).catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);
  
  const handleTrade = async (tradeData) => {
    await api.executeTrade(tradeData);
    fetchDashboardData();
  };
  
  const handleAddWatchlist = async (symbol) => {
    try {
      await api.addToWatchlist(symbol);
      toast.success(`${symbol} added to watchlist`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to watchlist');
    }
  };
  
  const handleRemoveWatchlist = async (symbol) => {
    try {
      await api.removeFromWatchlist(symbol);
      toast.success(`${symbol} removed from watchlist`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      setSelectedStock(searchSymbol.toUpperCase().trim());
    }
  };
  
  const handleScanNews = async () => {
    setIsScanning(true);
    try {
      await api.triggerNewsScan();
      toast.success('News scan started - signals will appear shortly');
      // Refresh after a delay to show new signals
      setTimeout(() => {
        api.getNewsSignals(30).then(res => setNewsSignals(res.data)).catch(() => {});
        api.getNewsStats().then(res => setNewsStats(res.data)).catch(() => {});
      }, 5000);
    } catch (error) {
      toast.error('Failed to start news scan');
    }
    setIsScanning(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-mono text-muted-foreground uppercase tracking-wider">Loading Market Data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" data-testid="dashboard">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">MarketGenius</h1>
            <Badge className="bg-primary text-black font-mono text-xs">AI</Badge>
            {newsStats && (
              <div className="hidden md:flex items-center gap-2 ml-4 text-xs text-muted-foreground">
                <Radio className="h-3 w-3 text-primary animate-pulse" />
                <span>{newsStats.total_signals_generated} signals</span>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search symbol..." 
                className="pl-10 w-48 bg-secondary border-border font-mono uppercase"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="bg-primary text-black font-mono uppercase" data-testid="search-btn">
              Search
            </Button>
          </form>
          
          <div className="flex gap-2">
            <AutoTradeSettingsModal onSettingsChange={fetchDashboardData}>
              <Button 
                variant="outline"
                className="font-mono uppercase tracking-wider border-primary text-primary hover:bg-primary hover:text-black"
                data-testid="auto-trade-btn"
              >
                <Bot className="h-4 w-4 mr-2" />
                Auto-Trade
              </Button>
            </AutoTradeSettingsModal>
            <SignalAlertsModal>
              <Button 
                className="bg-primary text-black font-mono uppercase tracking-wider btn-glow"
                data-testid="signal-alerts-btn"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
            </SignalAlertsModal>
            <Button 
              variant="outline" 
              onClick={handleScanNews}
              disabled={isScanning}
              className="font-mono uppercase tracking-wider"
              data-testid="scan-news-btn"
            >
              {isScanning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Newspaper className="h-4 w-4 mr-2" />}
              Scan
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              className="font-mono uppercase tracking-wider"
              data-testid="refresh-btn"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="p-6">
        {selectedStock ? (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedStock(null)} 
              className="mb-4 font-mono uppercase"
              data-testid="back-btn"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
              Back to Dashboard
            </Button>
            <StockDetail 
              symbol={selectedStock} 
              onClose={() => setSelectedStock(null)}
              onTrade={handleTrade}
              cashBalance={portfolio.cash_balance}
            />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Portfolio & Holdings */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <PortfolioSummary portfolio={portfolio} />
              
              {/* Holdings */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {portfolio.holdings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="font-mono text-sm">No holdings yet</p>
                        <p className="text-xs">Start trading to build your portfolio</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {portfolio.holdings.map((holding) => (
                          <div 
                            key={holding.symbol}
                            className="p-3 bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                            onClick={() => setSelectedStock(holding.symbol)}
                            data-testid={`holding-${holding.symbol}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-heading font-semibold uppercase">{holding.symbol}</div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {holding.shares} shares @ {formatCurrency(holding.avg_cost)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono">{formatCurrency(holding.market_value)}</div>
                                <div className={cn(
                                  "font-mono text-xs",
                                  holding.gain_loss >= 0 ? "text-positive" : "text-negative"
                                )}>
                                  {formatPercent(holding.gain_loss_percent)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Watchlist */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Watchlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-36">
                    {watchlist.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-mono text-sm">Watchlist empty</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {watchlist.map((item) => (
                          <div 
                            key={item.symbol}
                            className="p-2 bg-secondary/30 border border-border flex justify-between items-center cursor-pointer hover:bg-secondary/50"
                            onClick={() => setSelectedStock(item.symbol)}
                            data-testid={`watchlist-item-${item.symbol}`}
                          >
                            <div>
                              <div className="font-heading font-semibold uppercase text-sm">{item.symbol}</div>
                              <div className="font-mono text-sm">{formatCurrency(item.price)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-mono text-xs",
                                item.change >= 0 ? "text-positive" : "text-negative"
                              )}>
                                {formatPercent(item.change_percent)}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 p-0 text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleRemoveWatchlist(item.symbol); }}
                                data-testid={`remove-watchlist-${item.symbol}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            {/* Center Column - Main Content with Tabs */}
            <div className="col-span-12 lg:col-span-6 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary h-14 p-1">
                  <TabsTrigger 
                    value="market" 
                    className="font-mono uppercase text-sm h-12 cursor-pointer transition-all duration-200 hover:bg-secondary/80 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md"
                    data-testid="market-tab"
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Market
                  </TabsTrigger>
                  <TabsTrigger 
                    value="news" 
                    className={cn(
                      "font-mono uppercase text-sm h-12 cursor-pointer transition-all duration-200 hover:bg-secondary/80 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md",
                      newsSignals.length > 0 && activeTab !== 'news' && "animate-pulse border-2 border-primary"
                    )}
                    data-testid="news-signals-tab"
                  >
                    <Newspaper className="h-5 w-5 mr-2" />
                    News Signals
                    {newsSignals.length > 0 && (
                      <Badge className="ml-2 bg-primary text-black text-sm font-bold px-2 py-0.5">{newsSignals.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="market" className="mt-4">
                  {/* Trending Stocks */}
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Market Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-0">
                        {trendingStocks.slice(0, 8).map((stock) => (
                          <StockCard 
                            key={stock.symbol}
                            stock={stock}
                            onClick={(s) => setSelectedStock(s.symbol)}
                            onAddWatchlist={handleAddWatchlist}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* AI Recommendations */}
                  <Card className="bg-card border-border mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recommendations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Cpu className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="font-mono text-sm">No recommendations yet</p>
                          <p className="text-xs">Analyze a stock to get AI insights</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recommendations.slice(0, 3).map((rec) => (
                            <div 
                              key={rec.id} 
                              className="cursor-pointer"
                              onClick={() => setSelectedStock(rec.symbol)}
                            >
                              <AIRecommendationCard recommendation={rec} />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="news" className="mt-4">
                  {/* News Stats with Clickable Filters */}
                  {newsStats && (
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div 
                        className={cn(
                          "p-3 border-2 cursor-pointer transition-all duration-200",
                          signalFilter === 'ALL' 
                            ? "bg-card border-primary" 
                            : "bg-card border-border hover:border-primary/50"
                        )}
                        onClick={() => setSignalFilter('ALL')}
                        data-testid="filter-all"
                      >
                        <div className="text-muted-foreground text-xs uppercase mb-1">All Signals</div>
                        <div className="font-mono text-2xl font-bold">{newsStats.total_signals_generated}</div>
                      </div>
                      <div className="p-3 bg-card border border-border">
                        <div className="text-muted-foreground text-xs uppercase mb-1">Articles</div>
                        <div className="font-mono text-xl">{newsStats.total_articles_analyzed}</div>
                      </div>
                      <div 
                        className={cn(
                          "p-3 border-2 cursor-pointer transition-all duration-200",
                          signalFilter === 'BUY' 
                            ? "bg-positive/20 border-positive" 
                            : "bg-card border-border hover:border-positive/50 hover:bg-positive/10"
                        )}
                        onClick={() => setSignalFilter(signalFilter === 'BUY' ? 'ALL' : 'BUY')}
                        data-testid="filter-buy"
                      >
                        <div className="text-muted-foreground text-xs uppercase mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-positive" />
                          Buy Signals
                        </div>
                        <div className="font-mono text-2xl font-bold text-positive">{newsStats.buy_signals}</div>
                        <div className="text-xs text-muted-foreground mt-1">Click to filter</div>
                      </div>
                      <div 
                        className={cn(
                          "p-3 border-2 cursor-pointer transition-all duration-200",
                          signalFilter === 'SELL' 
                            ? "bg-negative/20 border-negative" 
                            : "bg-card border-border hover:border-negative/50 hover:bg-negative/10"
                        )}
                        onClick={() => setSignalFilter(signalFilter === 'SELL' ? 'ALL' : 'SELL')}
                        data-testid="filter-sell"
                      >
                        <div className="text-muted-foreground text-xs uppercase mb-1 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-negative" />
                          Sell Signals
                        </div>
                        <div className="font-mono text-2xl font-bold text-negative">{newsStats.sell_signals}</div>
                        <div className="text-xs text-muted-foreground mt-1">Click to filter</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Active Filter Indicator */}
                  {signalFilter !== 'ALL' && (
                    <div className="mb-4 flex items-center gap-2">
                      <Badge className={cn(
                        "text-sm px-3 py-1",
                        signalFilter === 'BUY' ? "bg-positive text-black" : "bg-negative text-white"
                      )}>
                        Showing {signalFilter} signals only
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSignalFilter('ALL')}
                        className="text-xs"
                      >
                        Clear filter
                      </Button>
                    </div>
                  )}
                  
                  {/* News Signals Feed */}
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          Live News Signals
                          <Radio className="h-3 w-3 text-primary animate-pulse ml-2" />
                          {signalFilter !== 'ALL' && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {filteredSignals.length} {signalFilter}
                            </Badge>
                          )}
                        </CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleScanNews}
                          disabled={isScanning}
                          className="font-mono text-xs"
                        >
                          {isScanning ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Scan Now'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] [&_[data-radix-scroll-area-viewport]]:!overflow-y-scroll [&_[data-radix-scroll-area-scrollbar]]:!bg-white/20 [&_[data-radix-scroll-area-thumb]]:!bg-white/60">
                        {filteredSignals.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="font-mono text-sm mb-2">
                              {signalFilter !== 'ALL' ? `No ${signalFilter} signals yet` : 'No news signals yet'}
                            </p>
                            <p className="text-xs mb-4">
                              {signalFilter !== 'ALL' 
                                ? <Button variant="link" onClick={() => setSignalFilter('ALL')} className="text-xs p-0 h-auto">Show all signals</Button>
                                : 'Click "Scan News" to analyze latest market news'
                              }
                            </p>
                            {signalFilter === 'ALL' && (
                              <Button 
                                onClick={handleScanNews}
                              disabled={isScanning}
                              className="bg-primary text-black font-mono uppercase"
                            >
                              {isScanning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Newspaper className="h-4 w-4 mr-2" />}
                              Start Scanning
                            </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredSignals.map((signal) => (
                              <NewsSignalCard 
                                key={signal.id} 
                                signal={signal} 
                                onClick={(symbol) => setSelectedStock(symbol)}
                              />
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Transactions */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              {/* Recent Transactions */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {transactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="font-mono text-sm">No transactions</p>
                        <p className="text-xs">Your trades will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {transactions.slice(0, 15).map((tx) => (
                          <div 
                            key={tx.id}
                            className="p-3 bg-secondary/30 border border-border data-row"
                            data-testid={`transaction-${tx.id}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge className={cn(
                                  "font-mono text-xs mb-1",
                                  tx.action === 'BUY' ? 'bg-positive text-black' : 'bg-negative text-white'
                                )}>
                                  {tx.action}
                                </Badge>
                                <div className="font-heading font-semibold uppercase">{tx.symbol}</div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {tx.shares} @ {formatCurrency(tx.price)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono">{formatCurrency(tx.total)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Quick Tips */}
              <Card className="bg-card border border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-sm uppercase tracking-tight mb-1">Paper Trading</h4>
                      <p className="text-xs text-muted-foreground">
                        This is simulated trading with virtual money. Use it to practice strategies based on AI signals before trading with real funds.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
