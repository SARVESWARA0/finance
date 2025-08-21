import { z } from 'zod';
import { generateText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import yahooFinance from 'yahoo-finance2';

export const maxDuration = 60;

// Simplified schemas for Yahoo data (kept for validation)
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
  exchange: z.string().optional()
});

const StockSymbolSchema = z.string().trim().toUpperCase().min(1);

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// Tools (text-only)
const tools = {
  extractSymbols: tool({
    description: 'Extract stock symbols from text',
    parameters: z.object({
      text: z.string().describe('The text to extract symbols from'),
    }),
    execute: async ({ text }) => {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY not configured');
      }

      const result = await generateText({
        model: google('gemini-2.0-flash'),
        messages: [{
          role: 'user',
          content: `Extract stock symbols from: "${text}"
          Rules:
          1. Convert company names to Ticker Symbol: (e.g., AAPL, MSFT, GOOG) 
          2. Return comma-separated list
          3. Maximum 8 symbols
          4. Return NULL if none found`
        }]
      });

      const symbols = result.text
        .trim()
        .toUpperCase()
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'NULL' && /^[A-Z]{1,5}$/.test(s))
        .slice(0, 8);

      if (symbols.length === 0) {
        throw new Error('No valid stock symbols found');
      }

      return symbols;
    }
  }),

  planQuery: tool({
    description: 'Understand the user\'s specific stock-related intent and required metrics',
    parameters: z.object({
      text: z.string().describe('The user input to analyze')
    }),
    execute: async ({ text }) => {
      const PlanSchema = z.object({
        isStockRelated: z.boolean(),
        taskType: z.enum([
          'overview', 'price', 'pe', 'marketcap', 'volume', 'compare', 'returns', 'dividend', 'recommendation', 'custom'
        ]).optional(),
        symbolsHint: z.array(z.string()).optional(),
        timeframe: z.string().optional(),
        metrics: z.array(z.string()).optional(),
        question: z.string().optional()
      });

      const result = await generateText({
        model: google('gemini-2.0-flash'),
        messages: [{
          role: 'user',
          content:
            `Classify the following user request. Only for stock analysis use-cases.
Return a strict JSON object with keys: isStockRelated (boolean), taskType (one of overview|price|pe|marketcap|volume|compare|returns|dividend|recommendation|custom), symbolsHint (array of strings), timeframe (string), metrics (array of strings), question (string).
Text: ${JSON.stringify(text)}`
        }]
      });

      try {
        const jsonStart = result.text.indexOf('{');
        const jsonEnd = result.text.lastIndexOf('}');
        const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? result.text.slice(jsonStart, jsonEnd + 1) : '{}';
        const parsed = JSON.parse(jsonStr);
        return PlanSchema.parse(parsed);
      } catch (e) {
        return { isStockRelated: true, taskType: 'overview', question: text };
      }
    }
  }),

  // Replaced SerpAPI with yahoo-finance2
  fetchStockData: tool({
    description: 'Fetch stock data using Yahoo Finance (yahoo-finance2)',
    parameters: z.object({
      symbol: StockSymbolSchema.describe('The stock symbol to fetch data for'),
    }),
    execute: async ({ symbol }) => {
      try {
        // Helper to compact market cap like 2.85T / 345.2B
        const normalizeMarketCap = (value) => {
          if (value === undefined || value === null) return undefined;
          const num = Number(value);
          if (!Number.isFinite(num)) return undefined;
          const abs = Math.abs(num);
          if (abs >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
          if (abs >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
          if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
          return `${num}`;
        };

        const compactRange = (low, high) => (low !== undefined && high !== undefined) ? `${low} - ${high}` : undefined;

        // Primary: get quote (fast) and summary modules for extra fields
        const quote = await yahooFinance.quote(symbol).catch(err => {
          throw new Error(`Yahoo quote fetch failed for ${symbol}: ${err.message}`);
        });

        // Provide best-effort summary details
        const modules = ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData'];
        let summary = null;
        try {
          summary = await yahooFinance.quoteSummary(symbol, { modules }).catch(() => null);
        } catch {
          summary = null;
        }

        const stockData = { symbol };

        // Price & change
        const priceObj = quote?.regularMarketPrice ?? quote?.price ?? (summary?.price ?? {}).regularMarketPrice;
        const change = quote?.regularMarketChange ?? (summary?.price ?? {}).regularMarketChange;
        const changePct = quote?.regularMarketChangePercent ?? (summary?.price ?? {}).regularMarketChangePercent;

        if (typeof priceObj === 'number') stockData.price = +priceObj;
        if (typeof change === 'number') stockData.priceChange = +change;
        if (typeof changePct === 'number') stockData.priceChangePercentage = +(+changePct).toFixed(2);

        // Company name & exchange
        const longName = quote?.longName ?? (summary?.price ?? {}).longName ?? quote?.shortName;
        if (typeof longName === 'string') stockData.companyName = longName;
        const exch = quote?.exchangeName ?? (summary?.price ?? {}).exchangeName;
        if (typeof exch === 'string') stockData.exchange = exch;

              // Market cap
        const mc = quote?.marketCap ?? (summary?.price ?? {}).marketCap ?? (summary?.defaultKeyStatistics ?? {}).marketCap;
              const mcNorm = normalizeMarketCap(mc);
              if (mcNorm) stockData.marketCap = mcNorm;

        // P/E
        const pe = quote?.trailingPE ?? (summary?.defaultKeyStatistics ?? {}).trailingPE ?? (summary?.summaryDetail ?? {}).trailingPE;
        if (typeof pe === 'number') stockData.peRatio = +pe;

        // Volume and avgVolume
        const vol = quote?.regularMarketVolume ?? (summary?.price ?? {}).volume ?? (summary?.summaryDetail ?? {}).volume;
        if (typeof vol === 'number') stockData.volume = Math.round(vol);
        const avgVol = (summary?.summaryDetail ?? {}).averageVolume ?? (summary?.price ?? {}).averageDailyVolume10Day ?? (summary?.defaultKeyStatistics ?? {}).averageVolume;
        if (typeof avgVol === 'number') stockData.avgVolume = Math.round(avgVol);

        // Day range & 52-week range
        const dayLow = (summary?.summaryDetail ?? {}).dayLow ?? (quote?.regularMarketDayLow ?? undefined);
        const dayHigh = (summary?.summaryDetail ?? {}).dayHigh ?? (quote?.regularMarketDayHigh ?? undefined);
        if (dayLow !== undefined || dayHigh !== undefined) stockData.dayRange = compactRange(dayLow, dayHigh);

        const f52low = (summary?.summaryDetail ?? {}).fiftyTwoWeekLow ?? (quote?.fiftyTwoWeekLow ?? undefined);
        const f52high = (summary?.summaryDetail ?? {}).fiftyTwoWeekHigh ?? (quote?.fiftyTwoWeekHigh ?? undefined);
        if (f52low !== undefined || f52high !== undefined) stockData.yearRange = compactRange(f52low, f52high);

        // If change wasn't provided but pct and price exist, compute absolute change
              if (stockData.priceChange === undefined && stockData.priceChangePercentage !== undefined && stockData.price !== undefined) {
                stockData.priceChange = +(stockData.price * (stockData.priceChangePercentage / 100)).toFixed(2);
              }

        console.log('Yahoo fetched stock data for', symbol, stockData);

        // Validate and return
        const validatedData = StockDataSchema.parse(stockData);
        return validatedData;
      } catch (error) {
        console.error('Stock data fetch error (Yahoo):', error);
        // Return a basic structure if parsing fails
        return {
          symbol: symbol,
          companyName: symbol
        };
      }
    }
  }),

  analyzeStocks: tool({
    description: 'Analyze stock data and provide recommendations',
    parameters: z.object({
      stocksData: z.array(z.any()).describe('Array of stock data to analyze'),
    }),
    execute: async ({ stocksData }) => {
      try {
      const analysis = await generateText({
          model: google('gemini-2.5-flash'),
        messages: [{
          role: 'system',
            content: `You are a senior financial analyst providing investment recommendations. 
            
            IMPORTANT: Some stock data may be limited or incomplete. Analyze what's available and note any missing information.
            
            For each stock, provide:
            1. Brief overview (company name, symbol, exchange)
            2. Available metrics analysis (price, changes, etc.)
            3. Risk assessment (based on available data)
            4. Investment recommendation (Buy/Hold/Sell) with confidence level
            5. Reasoning and any data limitations
            
            Be professional, concise, and honest about data limitations. If data is insufficient, recommend seeking additional information.`
        }, {
          role: 'user',
            content: `Analyze these stocks: ${JSON.stringify(stocksData, null, 2)}`
        }]
      });
        
        console.log('Analysis result:', analysis.text);
      return analysis.text;
      } catch (error) {
        console.error('Analysis error:', error);
        return `Analysis failed: ${error.message}. Please try again.`;
      }
    }
  }),
  
  computeIndicators: tool({
    description: 'Compute basic technical indicators (SMA, RSI) from historical prices',
    parameters: z.object({
      symbol: StockSymbolSchema.describe('Ticker to compute indicators for'),
      lookbackDays: z.number().int().min(30).max(730).default(200).optional(),
      smaWindows: z.array(z.number().int().min(2).max(400)).default([20, 50]).optional(),
      rsiWindow: z.number().int().min(5).max(50).default(14).optional()
    }),
    execute: async ({ symbol, lookbackDays = 200, smaWindows = [20, 50], rsiWindow = 14 }) => {
      try {
        const end = new Date();
        const start = new Date(end.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
        const chart = await yahooFinance.chart(symbol, {
          period1: start,
          period2: end,
          interval: '1d'
        });
        let closes = [];
        if (chart && Array.isArray(chart.quotes)) {
          closes = chart.quotes.map(q => q.close).filter(v => typeof v === 'number');
        } else if (chart?.indicators?.quote && chart.indicators.quote[0]?.close) {
          closes = (chart.indicators.quote[0].close || []).filter(v => typeof v === 'number');
        }
        if (!closes.length) return {};
        if (closes.length === 0) return {};
        const sma = (arr, n) => {
          if (arr.length < n) return undefined;
          const sum = arr.slice(-n).reduce((a, b) => a + b, 0);
          return +(sum / n).toFixed(2);
        };
        const computeRSI = (arr, n) => {
          if (arr.length < n + 1) return undefined;
          let gains = 0, losses = 0;
          for (let i = arr.length - n; i < arr.length; i++) {
            const diff = arr[i] - arr[i - 1];
            if (diff > 0) gains += diff; else losses -= diff;
          }
          const avgGain = gains / n;
          const avgLoss = losses / n;
          if (avgLoss === 0) return 100;
          const rs = avgGain / avgLoss;
          return +((100 - (100 / (1 + rs)))).toFixed(2);
        };
        const result = {
          latestClose: +closes[closes.length - 1].toFixed(2),
          rsi: rsiWindow ? computeRSI(closes, rsiWindow) : undefined
        };
        for (const w of smaWindows) {
          result[`sma${w}`] = sma(closes, w);
        }
        return result;
      } catch (e) {
        return {};
      }
    }
  }),

  fetchNews: tool({
    description: 'Fetch recent headlines for a symbol and summarize sentiment',
    parameters: z.object({
      symbol: StockSymbolSchema.describe('Ticker to fetch news for'),
      maxItems: z.number().int().min(1).max(10).default(5).optional()
    }),
    execute: async ({ symbol, maxItems = 5 }) => {
      try {
        let headlines = [];
        try {
          const search = await yahooFinance.search(symbol, {});
          if (search && Array.isArray(search.news)) {
            headlines = search.news.slice(0, maxItems).map(n => ({
              title: n.title,
              publisher: n.publisher,
              link: n.link,
              published: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : undefined
            }));
          }
        } catch {}

        const summary = headlines.length ? (await generateText({
          model: google('gemini-2.0-flash'),
          messages: [{
            role: 'user',
            content: `Summarize these ${symbol} news headlines in 2-3 sentences and give a sentiment (Positive/Neutral/Negative):\n${headlines.map(h => `- ${h.title}`).join('\n')}`
          }]
        })).text : 'No recent headlines available.';

        return { headlines, summary };
      } catch (e) {
        return { headlines: [], summary: 'No recent headlines available.' };
      }
    }
  })
};

// Agent runner (text-only)
async function runStockAgent(options) {
  const { text } = options || {};
  if (!text || !text.trim()) {
    throw new Error('No input text to analyze');
  }

  // 1) Plan
  const plan = await tools.planQuery.execute({ text });

  // 2) Extract symbols (plan hint -> extractor -> fallback)
  const normalizeTicker = (s) => String(s || '').trim().toUpperCase();
  let symbols = Array.isArray(plan.symbolsHint)
    ? plan.symbolsHint.map(normalizeTicker).filter((s) => /^[A-Z]{1,5}$/.test(s))
    : [];
  if (!symbols.length) {
    try {
      symbols = await tools.extractSymbols.execute({ text });
    } catch {}
  }
  if (!symbols.length) {
    const map = {
      TESLA: 'TSLA',
      APPLE: 'AAPL',
      MICROSOFT: 'MSFT',
      GOOGLE: 'GOOGL',
      ALPHABET: 'GOOGL',
      AMAZON: 'AMZN',
      NVIDIA: 'NVDA',
      META: 'META',
      FACEBOOK: 'META'
    };
    const tokens = String(text || '').toUpperCase().split(/[^A-Z]+/g);
    const mapped = [...new Set(tokens.map((t) => map[t]).filter(Boolean))];
    if (mapped.length) symbols = mapped;
  }
  if (!symbols.length) {
    throw new Error('Could not detect any valid stock symbols in your request. Please include tickers like AAPL or TSLA.');
  }

  // 3) Fetch stock data
  const stocksData = await Promise.all(
    symbols.map((symbol) => tools.fetchStockData.execute({ symbol }))
  );

  // 4) Enrich: indicators and news per symbol (best-effort)
  const [indicatorsEntries, newsEntries] = await Promise.all([
    Promise.all(symbols.map(async (s) => [s, await tools.computeIndicators.execute({ symbol: s })])),
    Promise.all(symbols.map(async (s) => [s, await tools.fetchNews.execute({ symbol: s, maxItems: 3 })]))
  ]);
  const indicators = Object.fromEntries(indicatorsEntries);
  const news = Object.fromEntries(newsEntries);

  // 5) Analyze with extras and require a Final: line
  const analysisResult = await generateText({
    model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'system',
        content: 'You are an agentic stock analyst. Be concise, accurate, and avoid fabrication. Use provided data only. End your response with a single-line Final: takeaway.'
        },
        {
          role: 'user',
        content: `User question: ${plan.question || text}\nSymbols: ${symbols.join(', ')}\n\nStock data: ${JSON.stringify(stocksData)}\n\nIndicators: ${JSON.stringify(indicators)}\n\nNews summaries: ${JSON.stringify(Object.fromEntries(Object.entries(news).map(([k,v]) => [k, v.summary])))}\n\nInstructions:\n- If comparing, include a compact table (symbol, price, P/E, market cap).\n- If recommending, provide Buy/Hold/Sell with 1-2 sentence rationale and 1 key risk.\n- If a metric is missing, state it plainly and proceed using available info.`
      }
    ]
  });

  const analysis = analysisResult.text;
  return { plan, symbols, stocksData, indicators, news, analysis };
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    
    if (!messages?.length) {
      throw new Error('Invalid request format');
    }

    const lastContent = messages[messages.length - 1].content;

    // Plan intent and gate non-stock requests
    const plan = await tools.planQuery.execute({ text: lastContent });
    if (!plan.isStockRelated) {
      return new Response(JSON.stringify({
        error: 'Final: I only handle stock analysis queries. Please provide a stock-related question with a ticker (e.g., AAPL).'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Use the runStockAgent flow (text-only)
    const result = await runStockAgent({ text: lastContent });

    const payload = {
      userQuery: lastContent,
      plan: result.plan,
      symbols: result.symbols,
      stocksData: result.stocksData,
      indicators: result.indicators,
      news: result.news,
      analysis: result.analysis
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
