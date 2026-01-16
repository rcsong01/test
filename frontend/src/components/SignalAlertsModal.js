import { useState } from 'react';
import { 
  Bell, 
  Mail, 
  Zap, 
  Check, 
  X, 
  Send,
  Crown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const TRACKED_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM",
  "V", "WMT", "JNJ", "PG", "MA", "UNH", "HD", "DIS", "BAC", "NFLX", "ADBE", "CRM"
];

export const SignalAlertsModal = ({ children }) => {
  const [email, setEmail] = useState('');
  const [minConfidence, setMinConfidence] = useState([70]);
  const [signalTypes, setSignalTypes] = useState(['BUY', 'SELL']);
  const [watchedSymbols, setWatchedSymbols] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);

  const handleCheckSubscription = async () => {
    if (!email) return;
    try {
      const res = await api.getSubscription(email);
      setSubscription(res.data);
      setIsSubscribed(true);
      setMinConfidence([res.data.min_confidence]);
      setSignalTypes(res.data.signal_types);
      setWatchedSymbols(res.data.watched_symbols || []);
      toast.success('Subscription found!');
    } catch (error) {
      setIsSubscribed(false);
      setSubscription(null);
    }
  };

  const handleSubscribe = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.subscribeToAlerts({
        email,
        min_confidence: minConfidence[0],
        signal_types: signalTypes,
        watched_symbols: watchedSymbols
      });
      setSubscription(res.data.subscription);
      setIsSubscribed(true);
      toast.success('Successfully subscribed! Check your email for confirmation.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to subscribe');
    }
    setIsLoading(false);
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await api.updateSubscription(email, {
        min_confidence: minConfidence[0],
        signal_types: signalTypes,
        watched_symbols: watchedSymbols
      });
      toast.success('Settings updated!');
    } catch (error) {
      toast.error('Failed to update settings');
    }
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await api.unsubscribe(email);
      setIsSubscribed(false);
      setSubscription(null);
      toast.success('Unsubscribed successfully');
    } catch (error) {
      toast.error('Failed to unsubscribe');
    }
    setIsLoading(false);
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      await api.sendTestAlert(email);
      toast.success('Test alert sent! Check your email.');
    } catch (error) {
      toast.error('Failed to send test alert');
    }
    setIsSendingTest(false);
  };

  const toggleSignalType = (type) => {
    if (signalTypes.includes(type)) {
      if (signalTypes.length > 1) {
        setSignalTypes(signalTypes.filter(t => t !== type));
      }
    } else {
      setSignalTypes([...signalTypes, type]);
    }
  };

  const toggleSymbol = (symbol) => {
    if (watchedSymbols.includes(symbol)) {
      setWatchedSymbols(watchedSymbols.filter(s => s !== symbol));
    } else {
      setWatchedSymbols([...watchedSymbols, symbol]);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl uppercase tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Signal Alerts
            <Badge className="bg-primary text-black font-mono text-xs ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              PREMIUM
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Hero Section */}
          <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <h3 className="font-heading text-lg uppercase tracking-tight mb-2">
              Never Miss a Trading Signal
            </h3>
            <p className="text-sm text-muted-foreground">
              Get instant email alerts when our AI detects high-confidence BUY or SELL signals from breaking news.
            </p>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Real-time alerts
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                AI analysis
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Source links
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="text-xs uppercase text-muted-foreground tracking-wider mb-2 block">
              Email Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 font-mono"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleCheckSubscription}
                  data-testid="alert-email-input"
                />
              </div>
              {isSubscribed && (
                <Badge className="bg-positive text-black self-center">
                  <Check className="h-3 w-3 mr-1" />
                  Subscribed
                </Badge>
              )}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs uppercase text-muted-foreground tracking-wider">
                Minimum Confidence
              </label>
              <span className="font-mono text-primary text-lg">{minConfidence[0]}%</span>
            </div>
            <Slider
              value={minConfidence}
              onValueChange={setMinConfidence}
              min={50}
              max={95}
              step={5}
              className="w-full"
              data-testid="confidence-slider"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Only receive alerts for signals with confidence above this threshold
            </p>
          </div>

          {/* Signal Types */}
          <div>
            <label className="text-xs uppercase text-muted-foreground tracking-wider mb-3 block">
              Signal Types
            </label>
            <div className="flex gap-2">
              <Button
                variant={signalTypes.includes('BUY') ? 'default' : 'outline'}
                className={cn(
                  "flex-1 font-mono uppercase",
                  signalTypes.includes('BUY') && 'bg-positive text-black hover:bg-positive/90'
                )}
                onClick={() => toggleSignalType('BUY')}
                data-testid="signal-type-buy"
              >
                <Zap className="h-4 w-4 mr-2" />
                BUY
              </Button>
              <Button
                variant={signalTypes.includes('SELL') ? 'default' : 'outline'}
                className={cn(
                  "flex-1 font-mono uppercase",
                  signalTypes.includes('SELL') && 'bg-negative text-white hover:bg-negative/90'
                )}
                onClick={() => toggleSignalType('SELL')}
                data-testid="signal-type-sell"
              >
                <Zap className="h-4 w-4 mr-2" />
                SELL
              </Button>
            </div>
          </div>

          {/* Watched Symbols */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs uppercase text-muted-foreground tracking-wider">
                Watched Stocks
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setShowSymbols(!showSymbols)}
              >
                {showSymbols ? 'Hide' : 'Customize'}
              </Button>
            </div>
            
            {watchedSymbols.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Watching all 20 stocks
              </p>
            ) : (
              <div className="flex flex-wrap gap-1 mb-2">
                {watchedSymbols.map(s => (
                  <Badge key={s} variant="outline" className="font-mono">
                    {s}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => toggleSymbol(s)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            
            {showSymbols && (
              <div className="grid grid-cols-5 gap-1 p-3 bg-secondary/30 border border-border max-h-32 overflow-y-auto">
                {TRACKED_SYMBOLS.map(symbol => (
                  <div
                    key={symbol}
                    className={cn(
                      "p-1 text-center text-xs font-mono cursor-pointer border transition-colors",
                      watchedSymbols.includes(symbol) || watchedSymbols.length === 0
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => toggleSymbol(symbol)}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier Info */}
          <div className="p-4 bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="font-heading uppercase tracking-tight">Free Tier</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              3 email alerts per day. Upgrade to Premium for 50 alerts/day.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary" />
              </div>
              <span className="font-mono text-xs">3/day</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {isSubscribed ? (
              <>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-primary text-black font-mono uppercase btn-glow"
                    onClick={handleUpdate}
                    disabled={isLoading}
                    data-testid="update-subscription-btn"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSendTest}
                    disabled={isSendingTest}
                    data-testid="send-test-btn"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingTest ? 'Sending...' : 'Test'}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  data-testid="unsubscribe-btn"
                >
                  Unsubscribe
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-primary text-black font-mono uppercase tracking-wider btn-glow"
                onClick={handleSubscribe}
                disabled={isLoading || !email}
                data-testid="subscribe-btn"
              >
                <Bell className="h-4 w-4 mr-2" />
                {isLoading ? 'Subscribing...' : 'Subscribe to Alerts'}
              </Button>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            This is paper trading for educational purposes only. Not financial advice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignalAlertsModal;
