'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Search, X, ArrowRight, TrendingUp, DollarSign, BarChart3, Newspaper, Brain, Zap, Star, Activity, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import EnhancedMarketInsights from './enhanced-insights';
import ComprehensiveAnalysis from './comprehensive-analysis';

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
          news: data?.news || {},
          structuredOutput: data?.structuredOutput || null,
          analysisResults: data?.analysisResults || []
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

  const suggestedQueries = [
    { text: "Analyze AAPL with comprehensive multi-agent analysis", icon: Brain },
    { text: "Compare TSLA vs F vs GM with full analysis", icon: BarChart3 },
    { text: "NVDA stock recommendation with risk assessment", icon: TrendingUp },
    { text: "MSFT technical analysis and sentiment", icon: Newspaper }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-indigo-400/40 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 left-3/4 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '5s' }}></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Enhanced Header */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 rounded-3xl blur-lg"></div>
                    <div className="relative p-4 rounded-3xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 backdrop-blur-sm border border-cyan-500/20">
                      <Brain className="w-10 h-10 text-cyan-400" />
                    </div>
                  </div>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Multi-Agent Stock Analyst
                </h1>
                <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
                  Comprehensive analysis powered by specialized AI agents: Data, News, Risk, Technical & Advisor
                </p>
                <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Data Agent
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Newspaper className="w-4 h-4 text-indigo-400" />
                    News Agent
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <AlertTriangle className="w-4 h-4 text-purple-400" />
                    Risk Agent
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Technical Agent
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Brain className="w-4 h-4 text-yellow-400" />
                    Advisor Agent
                  </div>
                </div>
              </div>

              {/* Enhanced Search Input */}
              <div className="mb-8">
                <div className="max-w-5xl mx-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-3 group-hover:border-slate-600/70 transition-all duration-300">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <input
                        ref={inputRef}
                        className="flex-1 pl-16 pr-24 py-5 bg-transparent text-white placeholder:text-slate-500 text-lg focus:outline-none"
                        value={input}
                        onChange={handleInputChange}
                        autoComplete="off"
                        placeholder="Ask for comprehensive stock analysis... (e.g., 'Analyze AAPL with multi-agent analysis')"
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
                          className="absolute right-24 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={handleSubmit}
                        disabled={isLoading || !input.trim()} 
                        className="ml-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 group"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            Analyze
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Queries - Only show when no insights */}
              {!insights && (
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Ready to Analyze</h3>
                    <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
                      Get detailed insights including fundamentals, technical analysis, risk assessment, news sentiment, and clear recommendations.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {suggestedQueries.map((query, index) => {
                      const IconComponent = query.icon;
                      return (
                        <button 
                          key={index}
                          onClick={() => setInput(query.text)}
                          className="group p-6 text-left bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-2xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <IconComponent className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                            <span className="text-sm font-semibold text-white group-hover:text-cyan-100 transition-colors">Suggested</span>
                          </div>
                          <p className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed">{query.text}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="space-y-6">
                {/* Enhanced Market Insights Panel - Full Width */}
                <EnhancedMarketInsights insights={insights} />
                
                {/* Comprehensive Multi-Agent Analysis */}
                <ComprehensiveAnalysis 
                  structuredOutput={insights?.structuredOutput} 
                  analysisResults={insights?.analysisResults} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading indicator - Fixed at bottom */}
        {isLoading && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 text-sm text-cyan-400 bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-full border border-cyan-500/20 shadow-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              Processing your multi-agent analysis...
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background: rgb(30 41 59);
          border-radius: 4px;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
          border-radius: 4px;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb:hover {
          background: rgb(100 116 139);
        }
      `}</style>
    </div>
  )
}

export default UnifiedStockAnalysisPage;