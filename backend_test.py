#!/usr/bin/env python3
"""
AI Stock Trading App - Backend API Testing
Tests all endpoints for the MarketGenius trading platform including Signal Alerts
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class StockTradingAPITester:
    def __init__(self, base_url="https://marketgenius-23.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = {}
        self.test_email = f"test_{int(time.time())}@example.com"

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})
        
        self.test_results[name] = {
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200 and "AI Stock Trading API" in response.text
            self.log_test("API Root", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_trending_stocks(self):
        """Test trending stocks endpoint"""
        try:
            response = requests.get(f"{self.api_url}/stocks/trending", timeout=15)
            if response.status_code == 200:
                data = response.json()
                success = isinstance(data, list) and len(data) > 0
                if success:
                    # Check if we have expected stocks like AAPL, MSFT
                    symbols = [stock.get('symbol', '') for stock in data]
                    has_expected = any(symbol in ['AAPL', 'MSFT', 'GOOGL'] for symbol in symbols)
                    self.log_test("Trending Stocks", has_expected, f"Found {len(data)} stocks: {symbols[:3]}")
                    return has_expected
                else:
                    self.log_test("Trending Stocks", False, "Empty or invalid response")
                    return False
            else:
                self.log_test("Trending Stocks", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Trending Stocks", False, str(e))
            return False

    def test_stock_quote(self, symbol="AAPL"):
        """Test individual stock quote"""
        try:
            response = requests.get(f"{self.api_url}/stocks/{symbol}/quote", timeout=10)
            if response.status_code == 200:
                data = response.json()
                required_fields = ['symbol', 'price', 'change', 'change_percent', 'volume']
                has_fields = all(field in data for field in required_fields)
                self.log_test(f"Stock Quote ({symbol})", has_fields, f"Price: ${data.get('price', 'N/A')}")
                return has_fields
            else:
                self.log_test(f"Stock Quote ({symbol})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Stock Quote ({symbol})", False, str(e))
            return False

    def test_stock_history(self, symbol="AAPL"):
        """Test stock historical data"""
        try:
            response = requests.get(f"{self.api_url}/stocks/{symbol}/history", timeout=10)
            if response.status_code == 200:
                data = response.json()
                success = 'history' in data and isinstance(data['history'], list) and len(data['history']) > 0
                self.log_test(f"Stock History ({symbol})", success, f"History points: {len(data.get('history', []))}")
                return success
            else:
                self.log_test(f"Stock History ({symbol})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Stock History ({symbol})", False, str(e))
            return False

    def test_portfolio(self):
        """Test portfolio endpoint"""
        try:
            response = requests.get(f"{self.api_url}/portfolio", timeout=10)
            if response.status_code == 200:
                data = response.json()
                required_fields = ['total_value', 'cash_balance', 'holdings']
                has_fields = all(field in data for field in required_fields)
                # Check if starting with $100k
                correct_balance = data.get('cash_balance') == 100000.0
                success = has_fields and correct_balance
                self.log_test("Portfolio", success, f"Cash: ${data.get('cash_balance', 'N/A')}, Holdings: {len(data.get('holdings', []))}")
                return success
            else:
                self.log_test("Portfolio", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Portfolio", False, str(e))
            return False

    def test_balance(self):
        """Test balance endpoint"""
        try:
            response = requests.get(f"{self.api_url}/balance", timeout=10)
            if response.status_code == 200:
                data = response.json()
                success = 'cash_balance' in data and data['cash_balance'] == 100000.0
                self.log_test("Balance", success, f"Balance: ${data.get('cash_balance', 'N/A')}")
                return success
            else:
                self.log_test("Balance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Balance", False, str(e))
            return False

    def test_watchlist(self):
        """Test watchlist endpoints"""
        try:
            # Get initial watchlist
            response = requests.get(f"{self.api_url}/watchlist", timeout=10)
            if response.status_code != 200:
                self.log_test("Watchlist GET", False, f"Status: {response.status_code}")
                return False
            
            initial_data = response.json()
            self.log_test("Watchlist GET", True, f"Items: {len(initial_data)}")
            
            # Add to watchlist
            add_response = requests.post(f"{self.api_url}/watchlist", 
                                       json={"symbol": "TSLA"}, timeout=10)
            if add_response.status_code == 200:
                self.log_test("Watchlist ADD", True, "Added TSLA")
                
                # Remove from watchlist
                remove_response = requests.delete(f"{self.api_url}/watchlist/TSLA", timeout=10)
                success = remove_response.status_code == 200
                self.log_test("Watchlist REMOVE", success, f"Status: {remove_response.status_code}")
                return success
            else:
                self.log_test("Watchlist ADD", False, f"Status: {add_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Watchlist", False, str(e))
            return False

    def test_ai_analysis(self, symbol="AAPL"):
        """Test AI stock analysis - this may take longer"""
        try:
            print(f"🤖 Testing AI analysis for {symbol} (this may take 10-15 seconds)...")
            response = requests.get(f"{self.api_url}/ai/analyze/{symbol}", timeout=30)
            if response.status_code == 200:
                data = response.json()
                required_fields = ['symbol', 'recommendation', 'confidence', 'analysis']
                has_fields = all(field in data for field in required_fields)
                valid_rec = data.get('recommendation') in ['BUY', 'SELL', 'HOLD']
                success = has_fields and valid_rec
                self.log_test(f"AI Analysis ({symbol})", success, 
                            f"Rec: {data.get('recommendation', 'N/A')}, Confidence: {data.get('confidence', 'N/A')}%")
                return success
            else:
                self.log_test(f"AI Analysis ({symbol})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"AI Analysis ({symbol})", False, str(e))
            return False

    def test_recommendations(self):
        """Test AI recommendations endpoint"""
        try:
            response = requests.get(f"{self.api_url}/ai/recommendations", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.log_test("AI Recommendations", True, f"Found {len(data)} recommendations")
            else:
                self.log_test("AI Recommendations", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("AI Recommendations", False, str(e))
            return False

    def test_news_signals(self):
        """Test news signals endpoint"""
        try:
            response = requests.get(f"{self.api_url}/news/signals?limit=10", timeout=15)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.log_test("News Signals", True, f"Found {len(data)} news signals")
                
                # Check signal structure if any exist
                if len(data) > 0:
                    signal = data[0]
                    required_fields = ['symbol', 'signal', 'confidence', 'news_title', 'news_source']
                    has_fields = all(field in signal for field in required_fields)
                    valid_signal = signal.get('signal') in ['BUY', 'SELL', 'HOLD']
                    if has_fields and valid_signal:
                        self.log_test("News Signal Structure", True, f"Signal: {signal.get('signal')}, Confidence: {signal.get('confidence')}%")
                    else:
                        self.log_test("News Signal Structure", False, "Missing required fields or invalid signal")
                
                return True
            else:
                self.log_test("News Signals", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("News Signals", False, str(e))
            return False

    def test_news_signals_by_symbol(self, symbol="AAPL"):
        """Test news signals for specific symbol"""
        try:
            response = requests.get(f"{self.api_url}/news/signals/{symbol}", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.log_test(f"News Signals ({symbol})", True, f"Found {len(data)} signals for {symbol}")
            else:
                self.log_test(f"News Signals ({symbol})", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test(f"News Signals ({symbol})", False, str(e))
            return False

    def test_news_scan_trigger(self):
        """Test manual news scan trigger"""
        try:
            response = requests.post(f"{self.api_url}/news/scan", timeout=15)
            success = response.status_code == 200
            if success:
                data = response.json()
                has_message = 'message' in data and 'scan' in data['message'].lower()
                self.log_test("News Scan Trigger", has_message, f"Response: {data.get('message', 'N/A')}")
                return has_message
            else:
                self.log_test("News Scan Trigger", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("News Scan Trigger", False, str(e))
            return False

    def test_news_stats(self):
        """Test news statistics endpoint"""
        try:
            response = requests.get(f"{self.api_url}/news/stats", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ['total_articles_analyzed', 'total_signals_generated', 'buy_signals', 'sell_signals']
                has_fields = all(field in data for field in required_fields)
                self.log_test("News Stats", has_fields, 
                            f"Articles: {data.get('total_articles_analyzed', 0)}, Signals: {data.get('total_signals_generated', 0)}")
                return has_fields
            else:
                self.log_test("News Stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("News Stats", False, str(e))
            return False

    def test_news_articles(self):
        """Test news articles endpoint"""
        try:
            response = requests.get(f"{self.api_url}/news/articles?limit=5", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.log_test("News Articles", True, f"Found {len(data)} news articles")
            else:
                self.log_test("News Articles", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("News Articles", False, str(e))
            return False

    def test_trading(self):
        """Test paper trading functionality"""
        try:
            # Test BUY order
            buy_data = {
                "symbol": "AAPL",
                "action": "BUY",
                "shares": 1,
                "price": 150.0
            }
            
            buy_response = requests.post(f"{self.api_url}/portfolio/trade", 
                                       json=buy_data, timeout=10)
            if buy_response.status_code == 200:
                self.log_test("Trading BUY", True, "Bought 1 share of AAPL")
                
                # Test SELL order
                sell_data = {
                    "symbol": "AAPL",
                    "action": "SELL", 
                    "shares": 1,
                    "price": 155.0
                }
                
                sell_response = requests.post(f"{self.api_url}/portfolio/trade",
                                            json=sell_data, timeout=10)
                success = sell_response.status_code == 200
                self.log_test("Trading SELL", success, f"Status: {sell_response.status_code}")
                return success
            else:
                self.log_test("Trading BUY", False, f"Status: {buy_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Trading", False, str(e))
            return False

    def test_transactions(self):
        """Test transaction history"""
        try:
            response = requests.get(f"{self.api_url}/transactions", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.log_test("Transactions", True, f"Found {len(data)} transactions")
            else:
                self.log_test("Transactions", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Transactions", False, str(e))
            return False

    # ===== SIGNAL ALERTS TESTING =====
    
    def test_subscribe_to_alerts(self):
        """Test POST /api/alerts/subscribe"""
        try:
            subscription_data = {
                "email": self.test_email,
                "min_confidence": 75,
                "signal_types": ["BUY", "SELL"],
                "watched_symbols": ["AAPL", "MSFT"]
            }
            
            response = requests.post(f"{self.api_url}/alerts/subscribe", 
                                   json=subscription_data, timeout=10)
            success = response.status_code == 200  # API returns 200, not 201
            
            if success:
                data = response.json()
                if 'subscription' in data:
                    sub = data['subscription']
                    valid_data = (sub.get('email') == self.test_email and 
                                sub.get('min_confidence') == 75 and
                                'BUY' in sub.get('signal_types', []))
                    self.log_test("Subscribe to Alerts", valid_data, 
                                f"Email: {sub.get('email')}, Confidence: {sub.get('min_confidence')}%")
                    return valid_data
                else:
                    self.log_test("Subscribe to Alerts", False, "Missing subscription in response")
                    return False
            else:
                self.log_test("Subscribe to Alerts", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Subscribe to Alerts", False, str(e))
            return False

    def test_get_subscription(self):
        """Test GET /api/alerts/subscription/{email}"""
        try:
            response = requests.get(f"{self.api_url}/alerts/subscription/{self.test_email}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                valid_data = (data.get('email') == self.test_email and
                            data.get('is_active') == True and
                            data.get('min_confidence') == 75)
                self.log_test("Get Subscription", valid_data, 
                            f"Active: {data.get('is_active')}, Confidence: {data.get('min_confidence')}%")
                return valid_data
            else:
                self.log_test("Get Subscription", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Subscription", False, str(e))
            return False

    def test_update_subscription(self):
        """Test PUT /api/alerts/subscription/{email}"""
        try:
            update_data = {
                "min_confidence": 80,
                "signal_types": ["BUY"],
                "watched_symbols": ["AAPL", "GOOGL", "TSLA"]
            }
            
            response = requests.put(f"{self.api_url}/alerts/subscription/{self.test_email}",
                                  json=update_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                valid_update = (data.get('min_confidence') == 80 and
                              data.get('signal_types') == ["BUY"] and
                              len(data.get('watched_symbols', [])) == 3)
                self.log_test("Update Subscription", valid_update,
                            f"New confidence: {data.get('min_confidence')}%, Symbols: {len(data.get('watched_symbols', []))}")
                return valid_update
            else:
                self.log_test("Update Subscription", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Update Subscription", False, str(e))
            return False

    def test_send_test_alert(self):
        """Test POST /api/alerts/test/{email}"""
        try:
            response = requests.post(f"{self.api_url}/alerts/test/{self.test_email}", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_message = 'message' in data and 'test alert sent' in data['message'].lower()
                self.log_test("Send Test Alert", has_message, data.get('message', 'No message'))
                return has_message
            else:
                self.log_test("Send Test Alert", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Send Test Alert", False, str(e))
            return False

    def test_get_alert_stats(self):
        """Test GET /api/alerts/stats"""
        try:
            response = requests.get(f"{self.api_url}/alerts/stats", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['total_subscribers', 'active_subscribers', 'total_alerts_sent', 'alert_limits']
                has_fields = all(field in data for field in required_fields)
                
                if has_fields:
                    subscriber_count = data.get('total_subscribers', 0)
                    self.log_test("Alert Stats", True, 
                                f"Subscribers: {subscriber_count}, Alerts sent: {data.get('total_alerts_sent', 0)}")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Alert Stats", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Alert Stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Alert Stats", False, str(e))
            return False

    def test_unsubscribe(self):
        """Test DELETE /api/alerts/subscription/{email}"""
        try:
            response = requests.delete(f"{self.api_url}/alerts/subscription/{self.test_email}", timeout=10)
            success = response.status_code == 200
            
            if success:
                # Verify subscription is deleted
                verify_response = requests.get(f"{self.api_url}/alerts/subscription/{self.test_email}", timeout=10)
                deleted = verify_response.status_code == 404
                self.log_test("Unsubscribe", deleted, "Subscription successfully removed" if deleted else "Subscription still exists")
                return deleted
            else:
                self.log_test("Unsubscribe", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Unsubscribe", False, str(e))
            return False

    def test_duplicate_subscription_prevention(self):
        """Test that duplicate subscriptions are prevented"""
        try:
            # Create a subscription
            test_email = f"duplicate_{int(time.time())}@example.com"
            subscription_data = {
                "email": test_email,
                "min_confidence": 70,
                "signal_types": ["BUY"],
                "watched_symbols": []
            }
            
            # First subscription should succeed
            response1 = requests.post(f"{self.api_url}/alerts/subscribe", 
                                    json=subscription_data, timeout=10)
            
            if response1.status_code == 201:
                # Second subscription should fail
                response2 = requests.post(f"{self.api_url}/alerts/subscribe", 
                                        json=subscription_data, timeout=10)
                prevented = response2.status_code == 400
                
                # Clean up
                requests.delete(f"{self.api_url}/alerts/subscription/{test_email}", timeout=10)
                
                self.log_test("Duplicate Subscription Prevention", prevented, 
                            f"Second attempt status: {response2.status_code}")
                return prevented
            else:
                self.log_test("Duplicate Subscription Prevention", False, 
                            f"First subscription failed: {response1.status_code}")
                return False
        except Exception as e:
            self.log_test("Duplicate Subscription Prevention", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting AI Stock Trading API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_api_root():
            print("❌ API not accessible, stopping tests")
            return False
            
        # Core stock data
        self.test_trending_stocks()
        self.test_stock_quote("AAPL")
        self.test_stock_quote("MSFT") 
        self.test_stock_history("AAPL")
        
        # Portfolio & balance
        self.test_portfolio()
        self.test_balance()
        
        # Watchlist functionality
        self.test_watchlist()
        
        # Trading functionality
        self.test_trading()
        self.test_transactions()
        
        # AI features (may be slower)
        self.test_ai_analysis("AAPL")
        self.test_recommendations()
        
        # News scanning features
        print("\n🗞️  Testing News Scanning Features...")
        self.test_news_stats()
        self.test_news_signals()
        self.test_news_signals_by_symbol("AAPL")
        self.test_news_articles()
        self.test_news_scan_trigger()
        
        # Signal Alerts features
        print(f"\n🔔 Testing Signal Alerts Features (Email: {self.test_email})...")
        if self.test_subscribe_to_alerts():
            self.test_get_subscription()
            self.test_update_subscription()
            self.test_send_test_alert()
            self.test_unsubscribe()
        
        # Test edge cases
        self.test_duplicate_subscription_prevention()
        self.test_get_alert_stats()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    tester = StockTradingAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "tests_run": tester.tests_run,
            "tests_passed": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "failed_tests": tester.failed_tests,
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())