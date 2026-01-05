import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Zap, Shield, Smartphone } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";

/**
 * Home Page - Responsive Landing Page
 * Works seamlessly on mobile, tablet, and desktop
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading FinTrack Mobile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FinTrack Mobile</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm sm:text-base text-gray-600 hidden sm:inline">
                  Welcome, {user?.name}
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className="text-xs sm:text-sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                asChild
                size={isMobile ? "sm" : "default"}
                className="text-xs sm:text-sm"
              >
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Real-Time Financial Data
                <span className="text-blue-600"> With Smart Signals</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-gray-600">
                Track Forex, Cryptocurrencies, and Commodities with advanced technical indicators.
                Multi-provider integration ensures you never miss market opportunities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isAuthenticated ? (
                <Button size={isMobile ? "default" : "lg"} className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button asChild size={isMobile ? "default" : "lg"} className="w-full sm:w-auto">
                    <a href={getLoginUrl()}>Get Started</a>
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobile ? "default" : "lg"}
                    className="w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Smartphone className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">
                {isMobile ? "📱 Mobile Optimized" : "🖥️ Desktop Ready"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Responsive design adapts to your device
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-8 sm:py-16 lg:py-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Powerful Features
            </h3>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">
              Everything you need to make informed trading decisions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg sm:text-xl">Multi-Provider API</CardTitle>
                <CardDescription>Automatic Fallback</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  5 integrated providers with intelligent fallback mechanism. Never miss data due to rate limits.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="w-8 h-8 text-yellow-600 mb-2" />
                <CardTitle className="text-lg sm:text-xl">Technical Indicators</CardTitle>
                <CardDescription>Real-Time Signals</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  RSI, MACD, Bollinger Bands, ATR, and more. Clear buy/sell/neutral signals with strength indicators.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg sm:text-xl">Asset Type Labels</CardTitle>
                <CardDescription>Clear Organization</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Color-coded badges for Forex, Commodities, and Crypto. Always know what you're trading.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Smartphone className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg sm:text-xl">Responsive Design</CardTitle>
                <CardDescription>Mobile & Desktop</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Seamlessly adapts to any device. Trade on your phone, tablet, or desktop with the same experience.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg sm:text-xl">Live Price Updates</CardTitle>
                <CardDescription>Real-Time Data</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Get live prices for Forex pairs, precious metals, and cryptocurrencies updated every 60 seconds.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle className="text-lg sm:text-xl">Provider Health</CardTitle>
                <CardDescription>Reliability Tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Monitor provider health status and automatic failover. Always get data from the most reliable source.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Asset Types Section */}
      <section className="py-8 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
            Supported Asset Types
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Forex */}
            <div className="bg-blue-50 rounded-xl p-6 sm:p-8 border border-blue-200">
              <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Forex
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Currency Pairs
              </h4>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                EUR/USD, GBP/USD, USD/JPY, and more major forex pairs with real-time rates.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Real-time exchange rates</li>
                <li>✓ Historical data</li>
                <li>✓ Technical analysis</li>
              </ul>
            </div>

            {/* Commodities */}
            <div className="bg-yellow-50 rounded-xl p-6 sm:p-8 border border-yellow-200">
              <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Commodities
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Precious Metals
              </h4>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Gold, Silver, and other commodities with spot prices and market analysis.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Spot prices</li>
                <li>✓ Market trends</li>
                <li>✓ Indicator signals</li>
              </ul>
            </div>

            {/* Crypto */}
            <div className="bg-purple-50 rounded-xl p-6 sm:p-8 border border-purple-200">
              <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Crypto
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Cryptocurrencies
              </h4>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Bitcoin, Ethereum, and 18,000+ cryptocurrencies with live market data.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Live prices</li>
                <li>✓ Market cap data</li>
                <li>✓ Trading signals</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-8 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-blue-100 text-base sm:text-lg mb-8">
            Join thousands of traders using FinTrack Mobile for smarter trading decisions.
          </p>
          {isAuthenticated ? (
            <Button
              size={isMobile ? "default" : "lg"}
              className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              asChild
              size={isMobile ? "default" : "lg"}
              className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto"
            >
              <a href={getLoginUrl()}>Sign In Now</a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
            <p>&copy; 2026 FinTrack Mobile. All rights reserved.</p>
            <p>Built with real-time financial data and advanced indicators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
