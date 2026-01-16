import { useState, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  Power,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Activity,
  RefreshCw,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import api from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';

export const AutoTradeSettingsModal = ({ children, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    amount: 1000,
    min_confidence: 80
  });
  const [logs, setLogs] = useState([]);
  const [shortPositions, setShortPositions] = useState({ positions: [], total_short_value: 0, total_short_pnl: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [settingsRes, logsRes, shortsRes] = await Promise.all([
        api.getAutoTradeSettings(),
        api.getAutoTradeLogs(20),
        api.getShortPositions()
      ]);
      setSettings(settingsRes.data);
      setLogs(logsRes.data);
      setShortPositions(shortsRes.data);
    } catch (error) {
      console.error('Failed to fetch auto-trade data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (enabled) => {
    setIsLoading(true);
    try {
      await api.updateAutoTradeSettings({ enabled });
      setSettings({ ...settings, enabled });
      toast.success(enabled ? 'Auto-trading enabled' : 'Auto-trading disabled');
      onSettingsChange?.();
    } catch (error) {
      toast.error('Failed to update settings');
    }
    setIsLoading(false);
  };

  const handleUpdateAmount = async (amount) => {
    if (amount < 100 || amount > 10000) {
      toast.error('Amount must be between $100 and $10,000');
      return;
    }
    setIsLoading(true);
    try {
      await api.updateAutoTradeSettings({ amount });
      setSettings({ ...settings, amount });
      toast.success('Trade amount updated');
      onSettingsChange?.();
    } catch (error) {
      toast.error('Failed to update settings');
    }
    setIsLoading(false);
  };

  const handleUpdateConfidence = async (min_confidence) => {
    if (min_confidence < 60 || min_confidence > 95) {
      toast.error('Confidence must be between 60% and 95%');
      return;
    }
    setIsLoading(true);
    try {
      await api.updateAutoTradeSettings({ min_confidence });
      setSettings({ ...settings, min_confidence });
      toast.success('Confidence threshold updated');
      onSettingsChange?.();
    } catch (error) {
      toast.error('Failed to update settings');
    }
    setIsLoading(false);
  };

  const handleCoverShort = async (symbol) => {
    try {
      const res = await api.coverShortPosition(symbol);
      toast.success(`Covered ${symbol}: P&L ${formatCurrency(res.data.pnl)}`);
      fetchData();
      onSettingsChange?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cover position');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl uppercase tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Auto-Trading Bot
            <Badge className={cn(
              "font-mono text-xs ml-2",
              settings.enabled ? "bg-positive text-black" : "bg-destructive text-white"
            )}>
              {settings.enabled ? "ACTIVE" : "DISABLED"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <Power className={cn("h-6 w-6", settings.enabled ? "text-positive" : "text-muted-foreground")} />
              <div>
                <h3 className="font-heading uppercase tracking-tight">Auto-Trading</h3>
                <p className="text-xs text-muted-foreground">Automatically execute trades on high-confidence signals</p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
              data-testid="auto-trade-toggle"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase text-muted-foreground tracking-wider">Trade Amount</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.amount}
                  onChange={(e) => setSettings({ ...settings, amount: parseFloat(e.target.value) || 1000 })}
                  className="font-mono"
                  min={100}
                  max={10000}
                  data-testid="trade-amount-input"
                />
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateAmount(settings.amount)}
                  disabled={isLoading}
                >
                  Set
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per trade: $100 - $10,000</p>
            </div>

            <div className="p-4 bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase text-muted-foreground tracking-wider">Min Confidence</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.min_confidence}
                  onChange={(e) => setSettings({ ...settings, min_confidence: parseInt(e.target.value) || 80 })}
                  className="font-mono"
                  min={60}
                  max={95}
                  data-testid="confidence-input"
                />
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateConfidence(settings.min_confidence)}
                  disabled={isLoading}
                >
                  Set
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Only trade on signals ≥ this %</p>
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 bg-primary/10 border border-primary/30">
            <h4 className="font-heading uppercase tracking-tight mb-2 text-primary">How Auto-Trading Works</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-positive" />
                <span><strong>BUY Signal ≥{settings.min_confidence}%</strong> → Auto-buy ${settings.amount} worth</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-negative" />
                <span><strong>SELL Signal ≥{settings.min_confidence}%</strong> → Sell ${settings.amount} (or SHORT if no holdings)</span>
              </div>
            </div>
          </div>

          {/* Short Positions */}
          {shortPositions.positions.length > 0 && (
            <div>
              <h4 className="font-heading uppercase tracking-tight mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-negative" />
                Short Positions
                <Badge variant="outline" className="font-mono">
                  P&L: <span className={shortPositions.total_short_pnl >= 0 ? "text-positive" : "text-negative"}>
                    {formatCurrency(shortPositions.total_short_pnl)}
                  </span>
                </Badge>
              </h4>
              <div className="space-y-2">
                {shortPositions.positions.map((pos) => (
                  <div key={pos.symbol} className="p-3 bg-negative/10 border border-negative/30 flex justify-between items-center">
                    <div>
                      <div className="font-heading font-bold uppercase">{pos.symbol}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {pos.shares} shares @ ${pos.entry_price.toFixed(2)} → ${pos.current_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={cn("font-mono", pos.pnl >= 0 ? "text-positive" : "text-negative")}>
                          {formatCurrency(pos.pnl)}
                        </div>
                        <div className="text-xs text-muted-foreground">{pos.pnl_percent.toFixed(2)}%</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-negative text-negative hover:bg-negative hover:text-white"
                        onClick={() => handleCoverShort(pos.symbol)}
                        data-testid={`cover-${pos.symbol}`}
                      >
                        Cover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Auto-Trades */}
          <div>
            <h4 className="font-heading uppercase tracking-tight mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Auto-Trades
            </h4>
            <ScrollArea className="h-48">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm">No auto-trades yet</p>
                  <p className="text-xs">Trades will appear when signals hit {settings.min_confidence}%+ confidence</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-secondary/30 border border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className={cn(
                            "font-mono text-xs mb-1",
                            log.action === 'BUY' ? 'bg-positive text-black' : 
                            log.action === 'SHORT' ? 'bg-negative text-white' : 'bg-accent text-white'
                          )}>
                            {log.action}
                          </Badge>
                          <div className="font-heading font-semibold uppercase">{log.symbol}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {log.shares.toFixed(4)} @ {formatCurrency(log.price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{formatCurrency(log.total)}</div>
                          <div className="text-xs text-muted-foreground">{log.confidence}% confidence</div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{log.news_title}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoTradeSettingsModal;
