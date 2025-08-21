'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Search, X, ArrowRight, TrendingUp, DollarSign, BarChart3, Newspaper, Brain, Zap, Star, Activity } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

const MARKDOWN_OPTIONS = {
  forceBlock: true,
  overrides: {
    h1: {
      component: ({ children, ...props }) => (
        <h1 className="text-2xl font-bold mb-6 text-white" {...props}>{children}</h1>
      ),
    },
    h2: {
      component: ({ children, ...props }) => (
        <h2 className="text-xl font-semibold mb-4 text-slate-200" {...props}>{children}</h2>
      ),
    },
    p: {
      component: ({ children, ...props }) => (
        <p className="mb-4 text-slate-300 leading-relaxed" {...props}>{children}</p>
      ),
    },
    ul: {
      component: ({ children, ...props }) => (
        <ul className="list-disc pl-6 mb-4 text-slate-300" {...props}>{children}</ul>
      ),
    },
    li: {
      component: ({ children, ...props }) => (
        <li className="mb-2" {...props}>{children}</li>
      ),
    },
    table: {
      component: ({ children, ...props }) => (
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full border-collapse border border-slate-700 rounded-lg" {...props}>
            {children}
          </table>
        </div>
      ),
    },
    th: {
      component: ({ children, ...props }) => (
        <th className="border border-slate-700 bg-slate-800 px-4 py-3 text-left font-semibold text-slate-200" {...props}>
          {children}
        </th>
      ),
    },
    td: {
      component: ({ children, ...props }) => (
        <td className="border border-slate-700 px-4 py-3 text-slate-300" {...props}>
          {children}
        </td>
      ),
    },
    code: {
      component: ({ className, children, ...props }) => (
        <code className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-cyan-300" {...props}>
          {children}
        </code>
      ),
    },
    pre: {
      component: ({ children, ...props }) => (
        <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-6 font-mono text-sm text-slate-300" {...props}>
          {children}
        </pre>
      ),
    }
  },
};

const UnifiedStockAnalysisPage = () => {
  const messagesEndRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMessage }] }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data?.error ? String(data.error) : `Server error: ${response.status}`;
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      } else {
        const content = data?.analysis || 'Final: Unable to generate analysis.';
        setInsights({
          userQuery: data?.userQuery,
          plan: data?.plan,
          symbols: data?.symbols || [],
          stocksData: data?.stocksData || [],
          indicators: data?.indicators || {},
          news: data?.news || {}
        })
        setMessages(prev => [...prev, { role: 'assistant', content }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Final: ${error.message}` }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 backdrop-blur-sm border border-cyan-500/20">
                <Brain className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
              AI Stock Analyst
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Advanced market intelligence powered by real-time data and AI analysis
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    ref={inputRef}
                    className="flex-1 pl-14 pr-20 py-4 bg-transparent text-white placeholder:text-slate-500 text-lg focus:outline-none"
                    value={input}
                    onChange={handleInputChange}
                    autoComplete="off"
                    placeholder="Ask anything about stocks... (e.g., 'Compare AAPL vs MSFT fundamentals')"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  {input && (
                    <button 
                      type="button" 
                      onClick={() => setInput("")}
                      className="absolute right-20 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()} 
                    className="ml-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Analyze
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Chat Messages - Takes up more space */}
            <div className="xl:col-span-3">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Analysis Chat
                  </h2>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                      Processing your request...
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 mb-4">
                        <BarChart3 className="w-12 h-12 text-cyan-400 mx-auto" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                      <p className="text-slate-400 max-w-md">
                        Ask specific questions about stocks, compare companies, or request market analysis. 
                        I'll provide detailed insights with real-time data.
                      </p>
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                        <button 
                          onClick={() => setInput("Compare AAPL vs MSFT fundamentals")}
                          className="p-3 text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all text-sm text-slate-300 hover:text-white"
                        >
                          Compare AAPL vs MSFT
                        </button>
                        <button 
                          onClick={() => setInput("What's TSLA's current P/E ratio?")}
                          className="p-3 text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all text-sm text-slate-300 hover:text-white"
                        >
                          TSLA P/E ratio analysis
                        </button>
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white ml-4' 
                          : 'bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 text-slate-200 mr-4'
                      } animate-fadeIn`}>
                        <Markdown options={MARKDOWN_OPTIONS}>{message.content}</Markdown>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="xl:col-span-1">
              <InsightsPanel insights={insights} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background: rgb(30 41 59);
          border-radius: 3px;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
          border-radius: 3px;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb:hover {
          background: rgb(100 116 139);
        }
      `}</style>
    </div>
  )
}

const InsightsPanel = ({ insights }) => {
  if (!insights) return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[70vh]">
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">Market Insights</h2>
      </div>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 mb-4">
          <TrendingUp className="w-10 h-10 text-indigo-400 mx-auto" />
        </div>
        <p className="text-slate-400">
          Detailed insights and market data will appear here after your analysis.
        </p>
      </div>
    </div>
  )

  const { userQuery, symbols = [], stocksData = [], indicators = {}, news = {} } = insights
  const bySymbol = (sym) => stocksData.find(s => s.symbol === sym) || {}

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">Market Insights</h2>
      </div>

      <div className="space-y-4">
        {userQuery && (
          <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase tracking-wide text-cyan-400 font-semibold">Your Query</span>
            </div>
            <p className="text-sm text-white">{userQuery}</p>
          </div>
        )}

        {symbols.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs uppercase tracking-wide text-indigo-400 font-semibold">Analyzed Stocks</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {symbols.map(symbol => (
                <span key={symbol} className="px-3 py-1 bg-indigo-600/20 text-indigo-300 text-sm font-semibold rounded-full border border-indigo-500/30">
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {symbols.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs uppercase tracking-wide text-green-400 font-semibold">Key Metrics</span>
            </div>
            <div className="space-y-3">
              {symbols.map(symbol => {
                const data = bySymbol(symbol)
                return (
                  <div key={symbol} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-b-0">
                    <div>
                      <div className="font-semibold text-white">{symbol}</div>
                      {data.companyName && (
                        <div className="text-xs text-slate-400">{data.companyName}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {data.price !== undefined ? `$${Number(data.price).toFixed(2)}` : '—'}
                      </div>
                      <div className="text-xs text-slate-400">
                        P/E: {data.peRatio !== undefined ? data.peRatio : '—'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {symbols.length > 1 && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-xs uppercase tracking-wide text-purple-400 font-semibold">Comparison</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 font-medium">Symbol</th>
                    <th className="text-right py-2 font-medium">Price</th>
                    <th className="text-right py-2 font-medium">P/E</th>
                  </tr>
                </thead>
                <tbody>
                  {symbols.map(symbol => {
                    const data = bySymbol(symbol)
                    return (
                      <tr key={symbol} className="text-white">
                        <td className="py-2 font-semibold">{symbol}</td>
                        <td className="text-right py-2">
                          {data.price !== undefined ? `$${Number(data.price).toFixed(2)}` : '—'}
                        </td>
                        <td className="text-right py-2">
                          {data.peRatio !== undefined ? data.peRatio : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {symbols.length > 0 && Object.keys(indicators).length > 0 && (
          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-orange-400" />
              <span className="text-xs uppercase tracking-wide text-orange-400 font-semibold">Technical Indicators</span>
            </div>
            <div className="space-y-3">
              {symbols.map(symbol => {
                const ind = indicators[symbol] || {}
                return (
                  <div key={symbol} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="font-semibold text-white mb-2">{symbol}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">SMA20: </span>
                        <span className="text-white">{ind.sma20 ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">SMA50: </span>
                        <span className="text-white">{ind.sma50 ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">RSI: </span>
                        <span className="text-white">{ind.rsi ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Close: </span>
                        <span className="text-white">{ind.latestClose !== undefined ? `$${ind.latestClose}` : '—'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {symbols.length > 0 && Object.keys(news).length > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-blue-400" />
              <span className="text-xs uppercase tracking-wide text-blue-400 font-semibold">Latest News</span>
            </div>
            <div className="space-y-4">
              {symbols.map(symbol => {
                const newsData = news[symbol]
                if (!newsData) return null
                return (
                  <div key={symbol} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="font-semibold text-white mb-2">{symbol}</div>
                    {newsData.summary && (
                      <p className="text-slate-300 text-sm mb-3">{newsData.summary}</p>
                    )}
                    {newsData.headlines && newsData.headlines.length > 0 && (
                      <div className="space-y-2">
                        {newsData.headlines.slice(0, 3).map((headline, i) => (
                          <a 
                            key={i}
                            href={headline.link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block text-xs text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
                          >
                            • {headline.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnifiedStockAnalysisPage;