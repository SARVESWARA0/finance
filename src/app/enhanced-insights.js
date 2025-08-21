import React, { useState } from 'react';
import { Search, TrendingUp, DollarSign, BarChart3, Newspaper, Brain, Star, Activity, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const EnhancedMarketInsights = ({ insights }) => {
  const [expandedNews, setExpandedNews] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const toggleNewsExpansion = (symbol) => {
    setExpandedNews(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (!insights) return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Star className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">Market Insights</h2>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
          <div className="relative p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/20">
            <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Awaiting Analysis</h3>
        <p className="text-slate-400 leading-relaxed">
          Detailed insights and market data will appear here after your analysis.
        </p>
      </div>
    </div>
  )

  const { userQuery, symbols = [], stocksData = [], indicators = {}, news = {} } = insights
  const bySymbol = (sym) => stocksData.find(s => s.symbol === sym) || {}

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'technical', label: 'Technical', icon: TrendingUp },
    { id: 'news', label: 'News & Sentiment', icon: Newspaper },
    { id: 'comparison', label: 'Comparison', icon: Activity }
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl">
      {/* Header with Tabs */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-2xl blur-lg"></div>
              <div className="relative p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 backdrop-blur-sm border border-cyan-500/20">
                <Star className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Market Insights</h2>
              <p className="text-slate-400 text-sm">Comprehensive analysis and real-time data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-semibold">LIVE DATA</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800/50 rounded-2xl p-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Query Summary */}
            {userQuery && (
              <div className="group p-6 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-2xl hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs uppercase tracking-wide text-cyan-400 font-bold">Your Query</span>
                </div>
                <p className="text-white font-medium leading-relaxed text-lg">{userQuery}</p>
              </div>
            )}

            {/* Stock Overview Cards */}
            {symbols.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {symbols.map(symbol => {
                  const data = bySymbol(symbol)
                  const changePercent = data.priceChangePercentage || data.changePercent || 0
                  const isPositive = changePercent >= 0
                  
                  return (
                    <div key={symbol} className="group p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-600/30 rounded-2xl hover:border-slate-500/50 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{symbol}</h3>
                          {data.companyName && (
                            <p className="text-slate-400 text-sm mt-1">{data.companyName}</p>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isPositive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Current Price</span>
                          <span className="text-white font-bold text-xl">
                            {data.price !== undefined ? `$${Number(data.price).toFixed(2)}` : '—'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Today's Change</span>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                            </div>
                            <div className="text-xs text-slate-400">
                              {data.priceChange !== undefined ? `${isPositive ? '+' : ''}${data.priceChange.toFixed(2)}` : '—'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">P/E Ratio</span>
                          <span className="text-white font-semibold">
                            {data.peRatio !== undefined ? data.peRatio : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quick Stats */}
            {symbols.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-400 mb-1">{symbols.length}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Stocks Analyzed</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                                  <div className="text-2xl font-bold text-blue-400 mb-1">
                  {symbols.filter(s => (bySymbol(s).priceChangePercentage || bySymbol(s).changePercent || 0) > 0).length}
                </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Gaining</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl">
                                  <div className="text-2xl font-bold text-red-400 mb-1">
                  {symbols.filter(s => (bySymbol(s).priceChangePercentage || bySymbol(s).changePercent || 0) < 0).length}
                </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Declining</div>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {Object.keys(news).length}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">News Sources</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="space-y-6">
            {symbols.length > 0 && Object.keys(indicators).length > 0 ? (
              symbols.map(symbol => {
                const ind = indicators[symbol] || {}
                return (
                  <div key={symbol} className="p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-orange-400" />
                      <span className="text-xs uppercase tracking-wide text-orange-400 font-bold">Technical Analysis</span>
                      <span className="text-white font-bold text-lg ml-2">{symbol}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800/40 rounded-xl p-4">
                        <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">SMA 20</span>
                        <span className="text-white font-bold text-lg">{ind.sma20 ?? '—'}</span>
                      </div>
                      <div className="bg-slate-800/40 rounded-xl p-4">
                        <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">SMA 50</span>
                        <span className="text-white font-bold text-lg">{ind.sma50 ?? '—'}</span>
                      </div>
                      <div className="bg-slate-800/40 rounded-xl p-4">
                        <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">RSI</span>
                        <span className="text-white font-bold text-lg">{ind.rsi ?? '—'}</span>
                      </div>
                      <div className="bg-slate-800/40 rounded-xl p-4">
                        <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Latest Close</span>
                        <span className="text-white font-bold text-lg">{ind.latestClose !== undefined ? `$${ind.latestClose}` : '—'}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No technical indicators available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6">
            {symbols.length > 0 && Object.keys(news).length > 0 ? (
              symbols.map(symbol => {
                const newsData = news[symbol]
                if (!newsData) return null
                const isExpanded = expandedNews[symbol]
                
                return (
                  <div key={symbol} className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-white text-xl">{symbol}</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-400 font-semibold">LIVE</span>
                        </div>
                      </div>
                      {newsData.sentiment && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          newsData.sentiment === 'positive' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          newsData.sentiment === 'negative' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {newsData.sentiment.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {newsData.summary && (
                      <div className="mb-6">
                        <div className="bg-slate-800/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-blue-400" />
                            <span className="text-xs uppercase tracking-wide text-blue-400 font-bold">AI Summary</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {isExpanded ? newsData.summary : truncateText(newsData.summary, 200)}
                          </p>
                          {newsData.summary.length > 200 && (
                            <button
                              onClick={() => toggleNewsExpansion(symbol)}
                              className="mt-3 flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors group"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
                                  Read More
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {newsData.headlines && newsData.headlines.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Newspaper className="w-4 h-4 text-slate-400" />
                          <span className="text-xs uppercase tracking-wide text-slate-400 font-bold">Latest Headlines</span>
                        </div>
                        <div className="space-y-3">
                          {newsData.headlines.slice(0, isExpanded ? newsData.headlines.length : 5).map((headline, i) => (
                            <a 
                              key={i}
                              href={headline.link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="group block p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                                    {headline.title}
                                  </h4>
                                  <div className="flex items-center gap-4 mt-2">
                                    {headline.source && (
                                      <span className="text-xs text-slate-400 font-medium">
                                        {headline.source}
                                      </span>
                                    )}
                                    {headline.publishedAt && (
                                      <span className="text-xs text-slate-500">
                                        {new Date(headline.publishedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
                              </div>
                            </a>
                          ))}
                          
                          {newsData.headlines.length > 5 && (
                            <button
                              onClick={() => toggleNewsExpansion(symbol)}
                              className="w-full mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/30 transition-all duration-300 group"
                            >
                              <div className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-semibold">
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
                                    Show Less Headlines
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
                                    Show {newsData.headlines.length - 5} More Headlines
                                  </>
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <Newspaper className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No news data available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {symbols.length > 1 ? (
              <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <span className="text-xs uppercase tracking-wide text-purple-400 font-bold">Stock Comparison</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="text-left py-4 font-bold">Symbol</th>
                        <th className="text-right py-4 font-bold">Price</th>
                        <th className="text-right py-4 font-bold">Change</th>
                        <th className="text-right py-4 font-bold">P/E</th>
                        <th className="text-right py-4 font-bold">Market Cap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbols.map(symbol => {
                        const data = bySymbol(symbol)
                        const changePercent = data.priceChangePercentage || data.changePercent || 0
                        const isPositive = changePercent >= 0
                        
                        return (
                          <tr key={symbol} className="text-white hover:bg-slate-700/30 transition-colors border-b border-slate-700/30">
                            <td className="py-4 font-bold">
                              <div>
                                <div className="text-lg">{symbol}</div>
                                {data.companyName && (
                                  <div className="text-xs text-slate-400">{data.companyName}</div>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-4 font-medium text-lg">
                              {data.price !== undefined ? `$${Number(data.price).toFixed(2)}` : '—'}
                            </td>
                            <td className="text-right py-4">
                              <div className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                              </div>
                              <div className="text-xs text-slate-400">
                                {data.priceChange !== undefined ? `${isPositive ? '+' : ''}${data.priceChange.toFixed(2)}` : '—'}
                              </div>
                            </td>
                            <td className="text-right py-4 font-medium">
                              {data.peRatio !== undefined ? data.peRatio : '—'}
                            </td>
                            <td className="text-right py-4 font-medium">
                              {data.marketCap ? `$${(data.marketCap / 1e9).toFixed(1)}B` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Compare multiple stocks to see detailed analysis</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedMarketInsights;