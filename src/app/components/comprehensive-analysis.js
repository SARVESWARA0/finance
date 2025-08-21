"use client"

import { useState } from "react"
import {
  TrendingUp,
  BarChart3,
  Newspaper,
  Brain,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Target,
  Clock,
  Shield,
  Zap,
  Award,
} from "lucide-react"
import Markdown from "markdown-to-jsx"

const ComprehensiveAnalysis = ({ structuredOutput, analysisResults }) => {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (!structuredOutput) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg"></div>
            <div className="relative p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Multi-Agent Analysis</h2>
            <p className="text-slate-400 text-sm">Comprehensive AI-powered stock analysis</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
            <div className="relative p-6 rounded-3xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20">
              <Brain className="w-16 h-16 text-purple-400 mx-auto" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Awaiting Analysis</h3>
          <p className="text-slate-400 leading-relaxed">
            Comprehensive multi-agent analysis will appear here after your query.
          </p>
        </div>
      </div>
    )
  }

  const { stock, company, summary, fundamentals, newsSentiment, technicalAnalysis, riskAssessment, recommendation } =
    structuredOutput

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case "buy":
        return "text-green-400"
      case "sell":
        return "text-red-400"
      case "hold":
        return "text-yellow-400"
      default:
        return "text-slate-400"
    }
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case "high":
        return "text-green-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-red-400"
      default:
        return "text-slate-400"
    }
  }

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case "bullish":
        return "text-green-400"
      case "bearish":
        return "text-red-400"
      case "neutral":
        return "text-yellow-400"
      default:
        return "text-slate-400"
    }
  }

  const getSentimentColor = (sentiment) => {
    const sentimentLower = sentiment?.toLowerCase()
    if (sentimentLower?.includes("positive")) return "text-green-400"
    if (sentimentLower?.includes("negative")) return "text-red-400"
    return "text-yellow-400"
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg"></div>
              <div className="relative p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Multi-Agent Analysis</h2>
              <p className="text-slate-400 text-sm">Comprehensive AI-powered stock analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-purple-400 font-semibold">AI AGENTS</span>
          </div>
        </div>

        {/* Stock Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-3xl font-bold text-white">{stock}</h3>
              <p className="text-slate-400">{company}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getActionColor(recommendation.action)}`}>
                {recommendation.action}
              </div>
              <div className={`text-sm font-semibold ${getConfidenceColor(recommendation.confidence)}`}>
                {recommendation.confidence} Confidence
              </div>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">{recommendation.rationale}</p>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="p-6 space-y-6">
        {/* Fundamentals Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-sm uppercase tracking-wide text-blue-400 font-bold">Fundamentals</span>
            </div>
            <button
              onClick={() => toggleSection("fundamentals")}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {expandedSections.fundamentals ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">P/E Ratio</span>
              <span className="text-white font-bold text-lg">{fundamentals.peRatio || "—"}</span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Market Cap</span>
              <span className="text-white font-bold text-lg">{fundamentals.marketCap || "—"}</span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">EPS</span>
              <span className="text-white font-bold text-lg">{fundamentals.eps || "—"}</span>
            </div>
            
          </div>
        </div>

        {/* Technical Analysis Section */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <span className="text-sm uppercase tracking-wide text-orange-400 font-bold">Technical Analysis</span>
            </div>
            <button
              onClick={() => toggleSection("technical")}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              {expandedSections.technical ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-slate-400 text-sm">Trend:</span>
              <span className={`ml-2 font-bold text-lg ${getTrendColor(technicalAnalysis.trend)}`}>
                {technicalAnalysis.trend}
              </span>
            </div>
          </div>

          {expandedSections.technical && technicalAnalysis.signals && technicalAnalysis.signals.length > 0 && (
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-3">Signals</span>
              <div className="space-y-2">
                {technicalAnalysis.signals.map((signal, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-slate-300">{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Assessment Section */}
        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm uppercase tracking-wide text-red-400 font-bold">Risk Assessment</span>
            </div>
            <button onClick={() => toggleSection("risk")} className="text-red-400 hover:text-red-300 transition-colors">
              {expandedSections.risk ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Volatility</span>
              <span className="text-white font-bold text-lg">
                {riskAssessment.volatility ? `${riskAssessment.volatility}%` : "—"}
              </span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Beta</span>
              <span className="text-white font-bold text-lg">{riskAssessment.beta || "—"}</span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-2">Downside Risk</span>
              <span className="text-white font-bold text-lg">
                {riskAssessment.downsideRisk ? `${riskAssessment.downsideRisk}%` : "—"}
              </span>
            </div>
          </div>

          {expandedSections.risk && (
            <div className="bg-slate-800/40 rounded-xl p-4">
              <span className="text-slate-400 text-xs uppercase tracking-wide block mb-3">Scenario Analysis</span>
              <Markdown className="text-slate-300 leading-relaxed">{riskAssessment.scenarioAnalysis}</Markdown>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-green-400" />
              <span className="text-sm uppercase tracking-wide text-green-400 font-bold">News & Sentiment</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${getSentimentColor(newsSentiment)} bg-green-500/20 border border-green-500/30`}
            >
              {newsSentiment.split(" - ")[0]?.toUpperCase() || "NEUTRAL"}
            </div>
          </div>

          <Markdown className="text-slate-300 leading-relaxed">
            {newsSentiment}
          </Markdown>
        </div>

        {/* Recommendation Details Section */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-sm uppercase tracking-wide text-yellow-400 font-bold">Recommendation Details</span>
            </div>
            <button
              onClick={() => toggleSection("recommendation")}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              {expandedSections.recommendation ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wide">Price Target</span>
              </div>
              <span className="text-white font-bold text-lg">{recommendation.priceTarget}</span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wide">Time Horizon</span>
              </div>
              <span className="text-white font-bold text-lg">{recommendation.timeHorizon}</span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wide">Confidence</span>
              </div>
              <span className={`font-bold text-lg ${getConfidenceColor(recommendation.confidence)}`}>
                {recommendation.confidence}
              </span>
            </div>
          </div>

          {expandedSections.recommendation && (
            <div className="space-y-4">
              {recommendation.keyRisks && recommendation.keyRisks.length > 0 && (
                <div className="bg-slate-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-bold">Key Risks</span>
                  </div>
                  <div className="space-y-2">
                    {recommendation.keyRisks.map((risk, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-slate-300">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendation.keyOpportunities && recommendation.keyOpportunities.length > 0 && (
                <div className="bg-slate-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-bold">Key Opportunities</span>
                  </div>
                  <div className="space-y-2">
                    {recommendation.keyOpportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-slate-300">{opportunity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComprehensiveAnalysis
