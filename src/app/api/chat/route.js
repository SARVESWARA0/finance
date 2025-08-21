import { z } from "zod"
import { generateText, tool } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import yahooFinance from "yahoo-finance2"

export const maxDuration = 60

// Enhanced schemas for comprehensive analysis
const StockDataSchema = z.object({
  symbol: z.string(),
  price: z.number().optional(),
  priceChange: z.number().optional(),
  priceChangePercentage: z.number().optional(),
  marketCap: z.string().optional(),
  peRatio: z.number().optional(),
  volume: z.number().optional(),
  avgVolume: z.number().optional(),
  dayRange: z.string().optional(),
  yearRange: z.string().optional(),
  companyName: z.string().optional(),
  exchange: z.string().optional(),
  eps: z.number().optional(),
  debtRatio: z.number().optional(),
  beta: z.number().optional(),
  dividendYield: z.number().optional(),
})

const StockSymbolSchema = z.string().trim().toUpperCase().min(1)

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

// Multi-Agent System Tools
const tools = {
  // Data Agent Tools
  extractSymbols: tool({
    description: "Extract stock symbols from text",
    parameters: z.object({
      text: z.string().describe("The text to extract symbols from"),
    }),
    execute: async ({ text }) => {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY not configured")
      }

      const result = await generateText({
        model: google("gemini-2.0-flash"),
        messages: [
          {
            role: "user",
            content: `Extract stock symbols from: "${text}"
          Rules:
          1. Convert company names to Ticker Symbol: (e.g., AAPL, MSFT, GOOG) 
          2. Return comma-separated list
          3. Maximum 8 symbols
          4. Return NULL if none found`,
          },
        ],
      })

      const symbols = result.text
        .trim()
        .toUpperCase()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "NULL" && /^[A-Z]{1,5}$/.test(s))
        .slice(0, 8)

      if (symbols.length === 0) {
        throw new Error("No valid stock symbols found")
      }

      return symbols
    },
  }),

  // Data Agent: Enhanced stock data fetching
  fetchComprehensiveStockData: tool({
    description: "Fetch comprehensive stock data including fundamentals, debt, beta, and EPS",
    parameters: z.object({
      symbol: StockSymbolSchema.describe("The stock symbol to fetch data for"),
    }),
    execute: async ({ symbol }) => {
      try {
        const normalizeMarketCap = (value) => {
          if (value === undefined || value === null) return undefined
          const num = Number(value)
          if (!Number.isFinite(num)) return undefined
          const abs = Math.abs(num)
          if (abs >= 1e12) return `${(num / 1e12).toFixed(2)}T`
          if (abs >= 1e9) return `${(num / 1e9).toFixed(2)}B`
          if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`
          return `${num}`
        }

        const compactRange = (low, high) => (low !== undefined && high !== undefined ? `${low} - ${high}` : undefined)

        // Fetch comprehensive data
        const quote = await yahooFinance.quote(symbol).catch((err) => {
          throw new Error(`Yahoo quote fetch failed for ${symbol}: ${err.message}`)
        })

        // Get detailed financial data
        const modules = [
          "price",
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
          "balanceSheetHistory",
          "incomeStatementHistory",
        ]
        let summary = null
        try {
          summary = await yahooFinance.quoteSummary(symbol, { modules }).catch(() => null)
        } catch {
          summary = null
        }

        const stockData = { symbol }

        // Basic price data
        const priceObj = quote?.regularMarketPrice ?? quote?.price ?? (summary?.price ?? {}).regularMarketPrice
        const change = quote?.regularMarketChange ?? (summary?.price ?? {}).regularMarketChange
        const changePct = quote?.regularMarketChangePercent ?? (summary?.price ?? {}).regularMarketChangePercent

        if (typeof priceObj === "number") stockData.price = +priceObj
        if (typeof change === "number") stockData.priceChange = +change
        if (typeof changePct === "number") stockData.priceChangePercentage = +(+changePct).toFixed(2)

        // Company info
        const longName = quote?.longName ?? (summary?.price ?? {}).longName ?? quote?.shortName
        if (typeof longName === "string") stockData.companyName = longName
        const exch = quote?.exchangeName ?? (summary?.price ?? {}).exchangeName
        if (typeof exch === "string") stockData.exchange = exch

        // Market cap
        const mc =
          quote?.marketCap ?? (summary?.price ?? {}).marketCap ?? (summary?.defaultKeyStatistics ?? {}).marketCap
        const mcNorm = normalizeMarketCap(mc)
        if (mcNorm) stockData.marketCap = mcNorm

        // P/E and EPS
        const pe =
          quote?.trailingPE ??
          (summary?.defaultKeyStatistics ?? {}).trailingPE ??
          (summary?.summaryDetail ?? {}).trailingPE
        if (typeof pe === "number") stockData.peRatio = +pe

        const eps = (summary?.financialData ?? {}).trailingEps ?? (summary?.defaultKeyStatistics ?? {}).trailingEps
        if (typeof eps === "number") stockData.eps = +eps

        // Volume data
        const vol = quote?.regularMarketVolume ?? (summary?.price ?? {}).volume ?? (summary?.summaryDetail ?? {}).volume
        if (typeof vol === "number") stockData.volume = Math.round(vol)
        const avgVol =
          (summary?.summaryDetail ?? {}).averageVolume ??
          (summary?.price ?? {}).averageDailyVolume10Day ??
          (summary?.defaultKeyStatistics ?? {}).averageVolume
        if (typeof avgVol === "number") stockData.avgVolume = Math.round(avgVol)

        // Ranges
        const dayLow = (summary?.summaryDetail ?? {}).dayLow ?? quote?.regularMarketDayLow ?? undefined
        const dayHigh = (summary?.summaryDetail ?? {}).dayHigh ?? quote?.regularMarketDayHigh ?? undefined
        if (dayLow !== undefined || dayHigh !== undefined) stockData.dayRange = compactRange(dayLow, dayHigh)

        const f52low = (summary?.summaryDetail ?? {}).fiftyTwoWeekLow ?? quote?.fiftyTwoWeekLow ?? undefined
        const f52high = (summary?.summaryDetail ?? {}).fiftyTwoWeekHigh ?? quote?.fiftyTwoWeekHigh ?? undefined
        if (f52low !== undefined || f52high !== undefined) stockData.yearRange = compactRange(f52low, f52high)

        // Beta and risk metrics
        const beta = (summary?.defaultKeyStatistics ?? {}).beta
        if (typeof beta === "number") stockData.beta = +beta

        // Dividend yield
        const dividendYield =
          (summary?.summaryDetail ?? {}).dividendYield ?? (summary?.financialData ?? {}).dividendYield
        if (typeof dividendYield === "number") stockData.dividendYield = +dividendYield

        // Debt ratio calculation (robust: handle {raw} objects and missing fields)
        if (
          summary?.balanceSheetHistory?.balanceSheetStatements &&
          summary.balanceSheetHistory.balanceSheetStatements.length > 0
        ) {
          const latestBalanceSheet = summary.balanceSheetHistory.balanceSheetStatements[0]

          // Helper to extract numeric value from plain number or { raw: number } object
          const toNumber = (val) => {
            if (val === undefined || val === null) return undefined
            if (typeof val === "number") return val
            if (typeof val === "object") {
              // common yahoo structure: { raw: 12345, fmt: "12.35M" }
              return typeof val.raw === "number" ? val.raw : Number(val.raw ?? val.fmt ?? Number.NaN)
            }
            const n = Number(val)
            return Number.isFinite(n) ? n : undefined
          }

          const totalLiabilitiesRaw = toNumber(latestBalanceSheet.totalLiabilities)
          const totalAssetsRaw = toNumber(latestBalanceSheet.totalAssets)

          // debug log to help troubleshoot
          console.log("Balance sheet raw values for", symbol, { totalLiabilitiesRaw, totalAssetsRaw })

          if (Number.isFinite(totalLiabilitiesRaw) && Number.isFinite(totalAssetsRaw) && totalAssetsRaw !== 0) {
            const debtRatio = totalLiabilitiesRaw / totalAssetsRaw
            stockData.debtRatio = +debtRatio.toFixed(3) // numeric value
          }
        }
        console.log(stockData.debtRatio, "for", symbol)

        // Compute absolute change if needed
        if (
          stockData.priceChange === undefined &&
          stockData.priceChangePercentage !== undefined &&
          stockData.price !== undefined
        ) {
          stockData.priceChange = +(stockData.price * (stockData.priceChangePercentage / 100)).toFixed(2)
        }

        console.log("Comprehensive stock data fetched for", symbol, stockData)

        const validatedData = StockDataSchema.parse(stockData)
        return validatedData
      } catch (error) {
        console.error("Comprehensive stock data fetch error:", error)
        return {
          symbol: symbol,
          companyName: symbol,
        }
      }
    },
  }),

  // News Agent: Enhanced news and sentiment analysis
  fetchNewsAndSentiment: tool({
    description: "Fetch recent news and analyze sentiment for a stock",
    parameters: z.object({
      symbol: StockSymbolSchema.describe("Ticker to fetch news for"),
      maxItems: z.number().int().min(1).max(10).default(8).optional(),
    }),
    execute: async ({ symbol, maxItems = 8 }) => {
      try {
        let headlines = []
        try {
          const search = await yahooFinance.search(symbol, {})
          if (search && Array.isArray(search.news)) {
            headlines = search.news.slice(0, maxItems).map((n) => ({
              title: n.title,
              publisher: n.publisher,
              link: n.link,
              published: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : undefined,
            }))
          }
        } catch {}

        // Enhanced sentiment analysis with regulatory and leadership change detection
        const sentimentAnalysis = headlines.length
          ? (
              await generateText({
                model: google("gemini-2.0-flash"),
                messages: [
                  {
                    role: "user",
                    content: `Analyze these ${symbol} news headlines and provide:
1. Overall sentiment (Positive/Neutral/Negative)
2. Brief reason for sentiment
3. Any regulatory changes mentioned
4. Any product launches mentioned
5. Any executive leadership changes mentioned

Headlines:
${headlines.map((h) => `- ${h.title}`).join("\n")}

Return as JSON:
{
  "sentiment": "positive/neutral/negative",
  "reason": "brief explanation",
  "regulatoryChanges": ["any regulatory mentions"],
  "productLaunches": ["any product launch mentions"],
  "leadershipChanges": ["any executive changes"]
}`,
                  },
                ],
              })
            ).text
          : "No recent headlines available."

        // Parse sentiment analysis
        let parsedSentiment = { sentiment: "neutral", reason: "No recent news available" }
        try {
          const jsonStart = sentimentAnalysis.indexOf("{")
          const jsonEnd = sentimentAnalysis.lastIndexOf("}")
          if (jsonStart >= 0 && jsonEnd >= 0) {
            const jsonStr = sentimentAnalysis.slice(jsonStart, jsonEnd + 1)
            parsedSentiment = JSON.parse(jsonStr)
          }
        } catch (e) {
          // Fallback to simple sentiment analysis
          const simpleSentiment = await generateText({
            model: google("gemini-2.0-flash"),
            messages: [
              {
                role: "user",
                content: `Summarize these ${symbol} news headlines in 2-3 sentences and give a sentiment (Positive/Neutral/Negative):\n${headlines.map((h) => `- ${h.title}`).join("\n")}`,
              },
            ],
          })
          parsedSentiment = { sentiment: "neutral", reason: simpleSentiment.text }
        }

        return {
          headlines,
          summary: parsedSentiment.reason,
          sentiment: parsedSentiment.sentiment,
          regulatoryChanges: parsedSentiment.regulatoryChanges || [],
          productLaunches: parsedSentiment.productLaunches || [],
          leadershipChanges: parsedSentiment.leadershipChanges || [],
        }
      } catch (e) {
        return {
          headlines: [],
          summary: "No recent headlines available.",
          sentiment: "neutral",
          regulatoryChanges: [],
          productLaunches: [],
          leadershipChanges: [],
        }
      }
    },
  }),

  // Risk Agent: Comprehensive risk assessment
  assessRisk: tool({
    description: "Evaluate volatility, beta, downside risk, and run scenario analysis",
    parameters: z.object({
      symbol: StockSymbolSchema.describe("Ticker to assess risk for"),
      stockData: z.object({}).describe("Stock data for risk assessment"),
    }),
    execute: async ({ symbol, stockData }) => {
      try {
        // Get historical data for volatility calculation
        const end = new Date()
        const start = new Date(end.getTime() - 252 * 24 * 60 * 60 * 1000) // 1 year
        const chart = await yahooFinance.chart(symbol, {
          period1: start,
          period2: end,
          interval: "1d",
        })

        let closes = []
        if (chart && Array.isArray(chart.quotes)) {
          closes = chart.quotes.map((q) => q.close).filter((v) => typeof v === "number")
        } else if (chart?.indicators?.quote && chart.indicators.quote[0]?.close) {
          closes = (chart.indicators.quote[0].close || []).filter((v) => typeof v === "number")
        }

        // Calculate volatility (standard deviation of returns)
        let volatility = null
        if (closes.length > 1) {
          const returns = []
          for (let i = 1; i < closes.length; i++) {
            returns.push((closes[i] - closes[i - 1]) / closes[i - 1])
          }
          const mean = returns.reduce((a, b) => a + b, 0) / returns.length
          const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
          volatility = Math.sqrt(variance) * Math.sqrt(252) * 100 // Annualized percentage
        }

        // Scenario analysis
        const scenarioAnalysis = await generateText({
          model: google("gemini-2.0-flash"),
          messages: [
            {
              role: "user",
              content: `Analyze risk scenarios for ${symbol} (Price: $${stockData.price}, Beta: ${stockData.beta}, P/E: ${stockData.peRatio}):
1. If interest rates rise by 2%
2. If market volatility increases by 50%
3. If sector-specific risks materialize
4. Probability of short-term gains/losses

Provide brief scenario analysis in 2-3 sentences.`,
            },
          ],
        })

        // Calculate downside risk (semi-deviation)
        let downsideRisk = null
        if (closes.length > 1) {
          const returns = []
          for (let i = 1; i < closes.length; i++) {
            returns.push((closes[i] - closes[i - 1]) / closes[i - 1])
          }
          const negativeReturns = returns.filter((r) => r < 0)
          if (negativeReturns.length > 0) {
            const mean = negativeReturns.reduce((a, b) => a + b, 0) / negativeReturns.length
            const variance = negativeReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / negativeReturns.length
            downsideRisk = Math.sqrt(variance) * Math.sqrt(252) * 100
          }
        }
        console.log(downsideRisk)
        return {
          volatility: volatility ? +volatility.toFixed(2) : null,
          beta: stockData.beta || null,
          downsideRisk: downsideRisk ? +downsideRisk.toFixed(2) : null,
          scenarioAnalysis: scenarioAnalysis.text,
          probabilityGain: volatility ? Math.max(0, 50 - volatility / 2) : null,
          probabilityLoss: volatility ? Math.min(100, 50 + volatility / 2) : null,
        }
      } catch (error) {
        console.error("Risk assessment error:", error)
        return {
          volatility: null,
          beta: stockData.beta || null,
          downsideRisk: null,
          scenarioAnalysis: "Risk assessment unavailable",
          probabilityGain: null,
          probabilityLoss: null,
        }
      }
    },
  }),

  // Technical Agent: Enhanced technical analysis
  performTechnicalAnalysis: tool({
    description: "Perform comprehensive technical analysis with multiple indicators",
    parameters: z.object({
      symbol: StockSymbolSchema.describe("Ticker to analyze"),
      lookbackDays: z.number().int().min(30).max(730).default(200).optional(),
    }),
    execute: async ({ symbol, lookbackDays = 200 }) => {
      try {
        const end = new Date()
        const start = new Date(end.getTime() - lookbackDays * 24 * 60 * 60 * 1000)
        const chart = await yahooFinance.chart(symbol, {
          period1: start,
          period2: end,
          interval: "1d",
        })

        let closes = []
        if (chart && Array.isArray(chart.quotes)) {
          closes = chart.quotes.map((q) => q.close).filter((v) => typeof v === "number")
        } else if (chart?.indicators?.quote && chart.indicators.quote[0]?.close) {
          closes = (chart.indicators.quote[0].close || []).filter((v) => typeof v === "number")
        }

        if (closes.length === 0) return {}

        // Calculate indicators
        const sma = (arr, n) => {
          if (arr.length < n) return undefined
          const sum = arr.slice(-n).reduce((a, b) => a + b, 0)
          return +(sum / n).toFixed(2)
        }

        const computeRSI = (arr, n) => {
          if (arr.length < n + 1) return undefined
          let gains = 0,
            losses = 0
          for (let i = arr.length - n; i < arr.length; i++) {
            const diff = arr[i] - arr[i - 1]
            if (diff > 0) gains += diff
            else losses -= diff
          }
          const avgGain = gains / n
          const avgLoss = losses / n
          if (avgLoss === 0) return 100
          const rs = avgGain / avgLoss
          return +(100 - 100 / (1 + rs)).toFixed(2)
        }

        const computeMACD = (arr, fast = 12, slow = 26, signal = 9) => {
          if (arr.length < slow) return undefined

          const ema = (data, period) => {
            const k = 2 / (period + 1)
            let emaValue = data[0]
            for (let i = 1; i < data.length; i++) {
              emaValue = data[i] * k + emaValue * (1 - k)
            }
            return emaValue
          }

          const fastEMA = ema(arr, fast)
          const slowEMA = ema(arr, slow)
          const macdLine = fastEMA - slowEMA

          // Simplified signal line
          const signalLine = macdLine * 0.1 // Approximation
          const histogram = macdLine - signalLine

          return {
            macdLine: +macdLine.toFixed(3),
            signalLine: +signalLine.toFixed(3),
            histogram: +histogram.toFixed(3),
          }
        }

        const latestClose = +closes[closes.length - 1].toFixed(2)
        const rsi = computeRSI(closes, 14)
        const macd = computeMACD(closes)
        const sma20 = sma(closes, 20)
        const sma50 = sma(closes, 50)
        const sma200 = sma(closes, 200)

        // Determine trend and signals
        let trend = "neutral"
        const signals = []

        if (sma20 && sma50 && latestClose > sma20 && sma20 > sma50) {
          trend = "bullish"
          signals.push("Price above 20-day SMA")
          signals.push("20-day SMA above 50-day SMA")
        } else if (sma20 && sma50 && latestClose < sma20 && sma20 < sma50) {
          trend = "bearish"
          signals.push("Price below 20-day SMA")
          signals.push("20-day SMA below 50-day SMA")
        }

        if (rsi) {
          if (rsi > 70) {
            signals.push("RSI overbought (>70)")
            if (trend === "bullish") trend = "neutral"
          } else if (rsi < 30) {
            signals.push("RSI oversold (<30)")
            if (trend === "bearish") trend = "neutral"
          }
        }

        if (macd && macd.histogram > 0 && macd.macdLine > macd.signalLine) {
          signals.push("MACD bullish crossover")
        } else if (macd && macd.histogram < 0 && macd.macdLine < macd.signalLine) {
          signals.push("MACD bearish crossover")
        }

        // Candlestick pattern detection (simplified)
        if (closes.length >= 3) {
          const last3 = closes.slice(-3)
          const current = last3[2]
          const prev = last3[1]
          const prev2 = last3[0]

          if (current > prev && prev > prev2) {
            signals.push("Three white soldiers pattern")
          } else if (current < prev && prev < prev2) {
            signals.push("Three black crows pattern")
          }
        }

        return {
          latestClose,
          rsi,
          macd,
          sma20,
          sma50,
          sma200,
          trend,
          signals,
          support: sma50 || null,
          resistance: sma20 || null,
        }
      } catch (e) {
        console.error("Technical analysis error:", e)
        return {}
      }
    },
  }),

  // NEW: Multi-Stock Comparison Tool
  compareStocks: tool({
    description: "Compare multiple stocks and determine the best investment option",
    parameters: z.object({
      stockAnalyses: z
        .array(
          z.object({
            symbol: z.string(),
            stockData: z.object({}),
            newsData: z.object({}),
            riskData: z.object({}),
            technicalData: z.object({}),
          }),
        )
        .describe("Array of complete stock analyses to compare"),
    }),
    execute: async ({ stockAnalyses }) => {
      if (stockAnalyses.length <= 1) {
        // Single stock - return individual analysis
        const stock = stockAnalyses[0]
        return {
          bestStock: stock.symbol,
          isComparison: false,
          comparisonRationale: `Analysis of ${stock.symbol} completed.`,
          individualAnalysis: true,
        }
      }

      try {
        // Multi-stock comparison
        const comparisonPrompt = `
Compare these ${stockAnalyses.length} stocks and determine which is the BEST investment opportunity right now:

${stockAnalyses
  .map(
    (analysis, index) => `
STOCK ${index + 1}: ${analysis.symbol}
- Price: $${analysis.stockData.price || "N/A"}
- P/E Ratio: ${analysis.stockData.peRatio || "N/A"}
- Market Cap: ${analysis.stockData.marketCap || "N/A"}
- EPS: ${analysis.stockData.eps || "N/A"}
- Beta: ${analysis.stockData.beta || "N/A"}
- Debt Ratio: ${analysis.stockData.debtRatio || "N/A"}
- Price Change: ${analysis.stockData.priceChangePercentage || "N/A"}%
- News Sentiment: ${analysis.newsData.sentiment || "neutral"}
- Technical Trend: ${analysis.technicalData.trend || "neutral"}
- Volatility: ${analysis.riskData.volatility || "N/A"}%
- RSI: ${analysis.technicalData.rsi || "N/A"}
- Key Signals: ${analysis.technicalData.signals?.join(", ") || "None"}
`,
  )
  .join("\n")}

COMPARISON CRITERIA:
1. Fundamental Strength (P/E, EPS, Market Cap, Debt Ratio)
2. Technical Momentum (Trend, RSI, Signals)
3. Risk-Adjusted Returns (Beta, Volatility)
4. News Sentiment and Market Conditions
5. Growth Potential vs Stability

Return ONLY a JSON object with this exact structure:
{
  "bestStock": "SYMBOL_OF_BEST_STOCK",
  "isComparison": true,
  "comparisonRationale": "Detailed 3-4 sentence explanation of why this stock is the best choice among the compared options, mentioning specific metrics that made it stand out",
  "rankingFactors": [
    "Factor 1 that influenced the decision",
    "Factor 2 that influenced the decision", 
    "Factor 3 that influenced the decision"
  ],
  "alternativeOptions": [
    {
      "symbol": "SECOND_BEST_SYMBOL",
      "reason": "Brief reason why it's second choice"
    }
  ]
}`

        const comparison = await generateText({
          model: google("gemini-2.5-flash"),
          messages: [
            {
              role: "user",
              content: comparisonPrompt,
            },
          ],
        })

        // Parse the comparison result
        try {
          const jsonStart = comparison.text.indexOf("{")
          const jsonEnd = comparison.text.lastIndexOf("}")
          if (jsonStart >= 0 && jsonEnd >= 0) {
            const jsonStr = comparison.text.slice(jsonStart, jsonEnd + 1)
            const result = JSON.parse(jsonStr)
            return result
          }
        } catch (e) {
          console.error("Error parsing comparison result:", e)
        }

        // Fallback comparison logic
        let bestStock = stockAnalyses[0]
        let bestScore = 0

        for (const analysis of stockAnalyses) {
          let score = 0

          // Scoring logic
          if (analysis.technicalData.trend === "bullish") score += 30
          if (analysis.newsData.sentiment === "positive") score += 20
          if (analysis.stockData.peRatio && analysis.stockData.peRatio < 25) score += 15
          if (analysis.riskData.volatility && analysis.riskData.volatility < 30) score += 15
          if (analysis.stockData.priceChangePercentage && analysis.stockData.priceChangePercentage > 0) score += 10
          if (analysis.stockData.debtRatio && analysis.stockData.debtRatio < 0.5) score += 10

          if (score > bestScore) {
            bestScore = score
            bestStock = analysis
          }
        }

        return {
          bestStock: bestStock.symbol,
          isComparison: true,
          comparisonRationale: `${bestStock.symbol} emerged as the best choice based on a combination of technical trend (${bestStock.technicalData.trend}), news sentiment (${bestStock.newsData.sentiment}), and fundamental metrics. This stock scored highest across multiple evaluation criteria.`,
          rankingFactors: ["Technical Analysis", "Fundamental Strength", "Risk Assessment"],
          individualAnalysis: false,
        }
      } catch (error) {
        console.error("Stock comparison error:", error)
        return {
          bestStock: stockAnalyses[0].symbol,
          isComparison: stockAnalyses.length > 1,
          comparisonRationale: "Comparison analysis encountered technical difficulties. Defaulting to first stock.",
          individualAnalysis: false,
        }
      }
    },
  }),

  // MODIFIED: Advisor Agent with stock comparison integration
  synthesizeRecommendation: tool({
    description:
      "Synthesize analysis and provide recommendation for the best stock (handles both single and multi-stock scenarios)",
    parameters: z.object({
      stockAnalyses: z
        .array(
          z.object({
            symbol: z.string(),
            stockData: z.object({}),
            newsData: z.object({}),
            riskData: z.object({}),
            technicalData: z.object({}),
          }),
        )
        .describe("Array of all stock analyses"),
    }),
    execute: async ({ stockAnalyses }) => {
      try {
        // First, determine the best stock through comparison
        const comparisonResult = await tools.compareStocks.execute({ stockAnalyses })

        // Find the best stock's complete analysis
        const bestStockAnalysis =
          stockAnalyses.find((analysis) => analysis.symbol === comparisonResult.bestStock) || stockAnalyses[0]

        // Generate comprehensive recommendation for the best stock
        const analysisPrompt = comparisonResult.isComparison
          ? `Provide investment recommendation for ${comparisonResult.bestStock} - the BEST choice among ${stockAnalyses.length} compared stocks.

COMPARISON CONTEXT: ${comparisonResult.comparisonRationale}

SELECTED STOCK DETAILS:
- Symbol: ${bestStockAnalysis.symbol}
- Company: ${bestStockAnalysis.stockData.companyName || bestStockAnalysis.symbol}
- Price: ${bestStockAnalysis.stockData.price || "N/A"}
- P/E Ratio: ${bestStockAnalysis.stockData.peRatio || "N/A"}
- Market Cap: ${bestStockAnalysis.stockData.marketCap || "N/A"}
- EPS: ${bestStockAnalysis.stockData.eps || "N/A"}
- Beta: ${bestStockAnalysis.stockData.beta || "N/A"}
- Debt Ratio: ${bestStockAnalysis.stockData.debtRatio || "N/A"}
- News Sentiment: ${bestStockAnalysis.newsData.sentiment} - ${bestStockAnalysis.newsData.summary}
- Technical Trend: ${bestStockAnalysis.technicalData.trend}
- Volatility: ${bestStockAnalysis.riskData.volatility || "N/A"}%
- Risk Scenario: ${bestStockAnalysis.riskData.scenarioAnalysis}

INSTRUCTION: Your recommendation should emphasize WHY this stock was chosen as the BEST among the compared options. Include comparison insights in your rationale.`
          : `Provide investment recommendation for ${bestStockAnalysis.symbol}:

STOCK DATA: ${JSON.stringify(bestStockAnalysis.stockData)}
NEWS SENTIMENT: ${JSON.stringify(bestStockAnalysis.newsData)}
RISK ASSESSMENT: ${JSON.stringify(bestStockAnalysis.riskData)}
TECHNICAL ANALYSIS: ${JSON.stringify(bestStockAnalysis.technicalData)}`

        const analysis = await generateText({
          model: google("gemini-2.5-flash"),
          messages: [
            {
              role: "system",
              content: `You are a senior financial advisor providing investment recommendations.
            
            Always structure your response as a JSON object with these exact fields:
            {
              "action": "Buy/Hold/Sell",
              "rationale": "Clear explanation combining all factors (2-3 sentences)",
              "confidence": "High/Medium/Low",
              "keyRisks": ["specific risk 1", "specific risk 2", "specific risk 3"],
              "keyOpportunities": ["specific opportunity 1", "specific opportunity 2", "specific opportunity 3"],
              "timeHorizon": "Short-term/Medium-term/Long-term",
              "priceTarget": "specific price or range if applicable",
              "comparisonContext": "${comparisonResult.isComparison ? comparisonResult.comparisonRationale : "Single stock analysis"}"
            }
            
            IMPORTANT: Provide specific, actionable risks and opportunities based on the data provided.`,
            },
            {
              role: "user",
              content: analysisPrompt,
            },
          ],
        })

        // Parse the JSON response
        try {
          const jsonStart = analysis.text.indexOf("{")
          const jsonEnd = analysis.text.lastIndexOf("}")
          if (jsonStart >= 0 && jsonEnd >= 0) {
            const jsonStr = analysis.text.slice(jsonStart, jsonEnd + 1)
            const recommendation = JSON.parse(jsonStr)

            // Add comparison metadata
            recommendation.isComparison = comparisonResult.isComparison
            recommendation.bestStock = comparisonResult.bestStock
            recommendation.totalStocksAnalyzed = stockAnalyses.length

            return recommendation
          }
        } catch (e) {
          console.error("Recommendation parsing error:", e)
        }

        // Fallback recommendation
        return {
          action: "Hold",
          rationale: comparisonResult.isComparison
            ? `${comparisonResult.bestStock} selected as best option among ${stockAnalyses.length} stocks. ${comparisonResult.comparisonRationale}`
            : `Analysis completed for ${bestStockAnalysis.symbol}. Recommendation based on current market conditions.`,
          confidence: "Medium",
          keyRisks: ["Market volatility", "Economic uncertainty", "Sector-specific risks"],
          keyOpportunities: ["Growth potential", "Market position", "Financial strength"],
          timeHorizon: "Medium-term",
          priceTarget: "Not specified",
          isComparison: comparisonResult.isComparison,
          bestStock: comparisonResult.bestStock,
          totalStocksAnalyzed: stockAnalyses.length,
          comparisonContext: comparisonResult.comparisonRationale,
        }
      } catch (error) {
        console.error("Recommendation synthesis error:", error)
        const fallbackStock = stockAnalyses[0]
        return {
          action: "Hold",
          rationale: "Unable to generate comprehensive recommendation due to technical error.",
          confidence: "Low",
          keyRisks: ["Analysis error", "Technical failure", "Data unavailable"],
          keyOpportunities: ["Retry analysis", "Check system status", "Contact support"],
          timeHorizon: "Short-term",
          priceTarget: "Not specified",
          isComparison: stockAnalyses.length > 1,
          bestStock: fallbackStock.symbol,
          totalStocksAnalyzed: stockAnalyses.length,
          comparisonContext: "Analysis failed",
        }
      }
    },
  }),
}

// MODIFIED: Enhanced Agent Runner with multi-stock comparison
async function runMultiAgentAnalysis(options) {
  const { text } = options || {}
  if (!text || !text.trim()) {
    throw new Error("No input text to analyze")
  }

  // 1) Extract symbols
  let symbols = []
  try {
    symbols = await tools.extractSymbols.execute({ text })
  } catch (error) {
    // Fallback symbol extraction
    const map = {
      TESLA: "TSLA",
      APPLE: "AAPL",
      MICROSOFT: "MSFT",
      GOOGLE: "GOOGL",
      ALPHABET: "GOOGL",
      AMAZON: "AMZN",
      NVIDIA: "NVDA",
      META: "META",
      FACEBOOK: "META",
      FORD: "F",
      GENERAL_MOTORS: "GM",
      TOYOTA: "TM",
    }
    const tokens = String(text || "")
      .toUpperCase()
      .split(/[^A-Z]+/g)
    const mapped = [...new Set(tokens.map((t) => map[t]).filter(Boolean))]
    if (mapped.length) symbols = mapped
  }

  if (!symbols.length) {
    throw new Error(
      "Could not detect any valid stock symbols in your request. Please include tickers like AAPL or TSLA.",
    )
  }

  // Limit to 5 symbols for comprehensive comparison
  symbols = symbols.slice(0, 5)

  // 2) Run all agents in parallel for each symbol
  const analysisResults = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        // Data Agent
        const stockData = await tools.fetchComprehensiveStockData.execute({ symbol })

        // News Agent
        const newsData = await tools.fetchNewsAndSentiment.execute({ symbol })

        // Risk Agent
        const riskData = await tools.assessRisk.execute({ symbol, stockData })

        // Technical Agent
        const technicalData = await tools.performTechnicalAnalysis.execute({ symbol })

        return {
          symbol,
          stockData,
          newsData,
          riskData,
          technicalData,
        }
      } catch (error) {
        console.error(`Analysis failed for ${symbol}:`, error)
        return {
          symbol,
          stockData: { symbol, companyName: symbol },
          newsData: { sentiment: "neutral", summary: "Analysis failed" },
          riskData: { scenarioAnalysis: "Risk assessment failed" },
          technicalData: { trend: "neutral" },
        }
      }
    }),
  )

  // 3) NEW: Multi-stock comparison and recommendation synthesis
  const recommendation = await tools.synthesizeRecommendation.execute({
    stockAnalyses: analysisResults,
  })

  // 4) Find the recommended stock's analysis for primary display
  const recommendedStock = recommendation.bestStock || symbols[0]
  const primaryAnalysis = analysisResults.find((r) => r.symbol === recommendedStock) || analysisResults[0]

  // 5) Generate enhanced price target
  const generatePriceTarget = (stockData, technicalData, recommendation) => {
    if (!stockData.price) return "Not available"

    const currentPrice = stockData.price
    let targetPrice = currentPrice

    // Base adjustment on recommendation action
    if (recommendation.action === "Buy") {
      targetPrice = currentPrice * 1.2 // 20% upside
    } else if (recommendation.action === "Sell") {
      targetPrice = currentPrice * 0.8 // 20% downside
    } else {
      targetPrice = currentPrice * 1.05 // 5% upside for hold
    }

    // Adjust based on technical trend
    if (technicalData.trend === "bullish") {
      targetPrice *= 1.1
    } else if (technicalData.trend === "bearish") {
      targetPrice *= 0.9
    }

    // Adjust based on P/E ratio if available
    if (stockData.peRatio) {
      const avgPE = 20
      if (stockData.peRatio < avgPE * 0.8) {
        targetPrice *= 1.15 // Undervalued
      } else if (stockData.peRatio > avgPE * 1.5) {
        targetPrice *= 0.85 // Overvalued
      }
    }

    return targetPrice.toFixed(2)
  }

  // 6) Enhanced structured output with comparison context
  // Enhanced structured output with proper market cap mapping
  const structuredOutput = {
    stock: recommendedStock,
    company: primaryAnalysis.stockData.companyName || recommendedStock,
    summary: recommendation.rationale,
    isComparison: recommendation.isComparison || false,
    totalStocksAnalyzed: recommendation.totalStocksAnalyzed || 1,
    comparisonContext: recommendation.comparisonContext || "Single stock analysis",

    // FIXED: Proper market cap and current price mapping
    currentPrice: primaryAnalysis.stockData.price || null,
    priceChange: primaryAnalysis.stockData.priceChange || null,
    priceChangePercentage: primaryAnalysis.stockData.priceChangePercentage || null,

    fundamentals: {
      peRatio: primaryAnalysis.stockData.peRatio || null,
      marketCap: primaryAnalysis.stockData.marketCap || null, // This should now work properly
      eps: primaryAnalysis.stockData.eps || null,
      debtRatio: primaryAnalysis.stockData.debtRatio || null,
      beta: primaryAnalysis.stockData.beta || null,
      dividendYield: primaryAnalysis.stockData.dividendYield || null,
      volume: primaryAnalysis.stockData.volume || null,
      avgVolume: primaryAnalysis.stockData.avgVolume || null,
      dayRange: primaryAnalysis.stockData.dayRange || null,
      yearRange: primaryAnalysis.stockData.yearRange || null,
    },

    newsSentiment: `${primaryAnalysis.newsData.sentiment} - ${primaryAnalysis.newsData.summary}`,

    technicalAnalysis: {
      trend: primaryAnalysis.technicalData.trend || "neutral",
      signals: primaryAnalysis.technicalData.signals || [],
      rsi: primaryAnalysis.technicalData.rsi || null,
      sma20: primaryAnalysis.technicalData.sma20 || null,
      sma50: primaryAnalysis.technicalData.sma50 || null,
      sma200: primaryAnalysis.technicalData.sma200 || null,
      support: primaryAnalysis.technicalData.support || null,
      resistance: primaryAnalysis.technicalData.resistance || null,
    },

    riskAssessment: {
      volatility: primaryAnalysis.riskData.volatility || null,
      beta: primaryAnalysis.riskData.beta || null,
      downsideRisk: primaryAnalysis.riskData.downsideRisk || null,
      scenarioAnalysis: primaryAnalysis.riskData.scenarioAnalysis || "Not available",
      probabilityGain: primaryAnalysis.riskData.probabilityGain || null,
      probabilityLoss: primaryAnalysis.riskData.probabilityLoss || null,
    },

    recommendation: {
      action: recommendation.action,
      rationale: recommendation.rationale,
      confidence: recommendation.confidence,
      keyRisks: recommendation.keyRisks || [],
      keyOpportunities: recommendation.keyOpportunities || [],
      timeHorizon: recommendation.timeHorizon || "Medium-term",
      priceTarget: generatePriceTarget(primaryAnalysis.stockData, primaryAnalysis.technicalData, recommendation),
    },

    // Additional comparison data
    allStocksAnalyzed: symbols,
    alternativeOptions: analysisResults
      .filter((r) => r.symbol !== recommendedStock)
      .map((r) => ({
        symbol: r.symbol,
        company: r.stockData.companyName || r.symbol,
        price: r.stockData.price,
        marketCap: r.stockData.marketCap, // Include market cap in alternatives too
        trend: r.technicalData.trend,
        sentiment: r.newsData.sentiment,
      })),
  }

  // 7) Generate enhanced markdown analysis
  const generateMarkdownAnalysis = (analysisResults, structuredOutput, recommendation) => {
    let markdown = ""

    if (structuredOutput.isComparison) {
      markdown += `# 🏆 Multi-Stock Comparison Analysis\n\n`
      markdown += `**Best Investment Choice: ${structuredOutput.stock}** (from ${structuredOutput.totalStocksAnalyzed} stocks analyzed)\n\n`
      markdown += `## 🎯 Why ${structuredOutput.stock} Was Selected\n`
      markdown += `${structuredOutput.comparisonContext}\n\n`

      if (structuredOutput.alternativeOptions.length > 0) {
        markdown += `## 📊 Other Stocks Analyzed\n`
        structuredOutput.alternativeOptions.forEach((alt) => {
          markdown += `- **${alt.symbol}** (${alt.company}): ${alt.price?.toFixed(2) || "N/A"} - ${alt.trend} trend, ${alt.sentiment} sentiment\n`
        })
        markdown += `\n`
      }
    } else {
      markdown += `# 📈 Stock Analysis: ${structuredOutput.stock}\n\n`
    }

    // Recommendation
    markdown += `## 🎯 Investment Recommendation\n`
    markdown += `**Action:** ${structuredOutput.recommendation.action}\n`
    markdown += `**Confidence:** ${structuredOutput.recommendation.confidence}\n`
    markdown += `**Price Target:** ${structuredOutput.recommendation.priceTarget}\n`
    markdown += `**Time Horizon:** ${structuredOutput.recommendation.timeHorizon}\n\n`
    markdown += `**Rationale:** ${structuredOutput.recommendation.rationale}\n\n`

    // Current metrics
    const primary = analysisResults.find((r) => r.symbol === structuredOutput.stock)
    markdown += `## 📊 Current Metrics\n`
    markdown += `- **Current Price:** ${primary.stockData.price?.toFixed(2) || "N/A"}\n`
    markdown += `- **P/E Ratio:** ${primary.stockData.peRatio || "N/A"}\n`
    markdown += `- **Market Cap:** ${primary.stockData.marketCap || "N/A"}\n`
    markdown += `- **EPS:** ${primary.stockData.eps || "N/A"}\n`
    markdown += `- **Beta:** ${primary.stockData.beta || "N/A"}\n`
    markdown += `- **Debt Ratio:** ${primary.stockData.debtRatio || "N/A"}\n\n`

    // Technical Analysis
    markdown += `## 📈 Technical Analysis\n`
    markdown += `- **Trend:** ${primary.technicalData.trend || "neutral"}\n`
    if (primary.technicalData.signals && primary.technicalData.signals.length > 0) {
      markdown += `- **Key Signals:** ${primary.technicalData.signals.join(", ")}\n`
    }
    markdown += `- **RSI:** ${primary.technicalData.rsi || "N/A"}\n`
    markdown += `- **20-day SMA:** ${primary.technicalData.sma20 || "N/A"}\n`
    markdown += `- **50-day SMA:** ${primary.technicalData.sma50 || "N/A"}\n\n`

    // Risk Assessment
    markdown += `## ⚠️ Risk Assessment\n`
    markdown += `- **Volatility:** ${primary.riskData.volatility ? `${primary.riskData.volatility}%` : "N/A"}\n`
    markdown += `- **Downside Risk:** ${primary.riskData.downsideRisk ? `${primary.riskData.downsideRisk}%` : "N/A"}\n`
    markdown += `- **Scenario Analysis:** ${primary.riskData.scenarioAnalysis}\n\n`

    // News Sentiment
    markdown += `## 📰 News & Market Sentiment\n`
    markdown += `- **Sentiment:** ${primary.newsData.sentiment}\n`
    markdown += `- **Summary:** ${primary.newsData.summary}\n\n`

    // Key Risks & Opportunities
    if (structuredOutput.recommendation.keyRisks && structuredOutput.recommendation.keyRisks.length > 0) {
      markdown += `## 🚨 Key Risks\n`
      structuredOutput.recommendation.keyRisks.forEach((risk) => {
        markdown += `- ${risk}\n`
      })
      markdown += `\n`
    }

    if (
      structuredOutput.recommendation.keyOpportunities &&
      structuredOutput.recommendation.keyOpportunities.length > 0
    ) {
      markdown += `## 💡 Key Opportunities\n`
      structuredOutput.recommendation.keyOpportunities.forEach((opportunity) => {
        markdown += `- ${opportunity}\n`
      })
      markdown += `\n`
    }

    return markdown
  }

  const markdownAnalysis = generateMarkdownAnalysis(analysisResults, structuredOutput, recommendation)

  return {
    symbols,
    analysisResults,
    structuredOutput,
    markdownAnalysis,
    recommendation,
  }
}

export async function POST(req) {
  try {
    const { messages } = await req.json()

    if (!messages?.length) {
      throw new Error("Invalid request format")
    }

    const lastContent = messages[messages.length - 1].content

    // Run the multi-agent analysis with comparison
    const result = await runMultiAgentAnalysis({ text: lastContent })

    const payload = {
      userQuery: lastContent,
      symbols: result.symbols,
      analysisResults: result.analysisResults,
      structuredOutput: result.structuredOutput,
      analysis: result.markdownAnalysis,
      recommendation: result.recommendation,
      // Enhanced comparison metadata
      isComparison: result.structuredOutput.isComparison,
      bestStock: result.recommendation.bestStock,
      totalStocksAnalyzed: result.recommendation.totalStocksAnalyzed,
      // Legacy format for backward compatibility
      stocksData: result.analysisResults.map((r) => r.stockData),
      indicators: Object.fromEntries(result.analysisResults.map((r) => [r.symbol, r.technicalData])),
      news: Object.fromEntries(result.analysisResults.map((r) => [r.symbol, r.newsData])),
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
