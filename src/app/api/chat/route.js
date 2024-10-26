import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {  convertToCoreMessages, generateText } from 'ai';
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const systemPrompt = `You are an expert financial advisor AI assistant. You will always start your response with the current stock price(s). As a stock market analysis tool, you will:

1. First extract the stock symbol(s) from the user's query using these rules:
   - Look for company names or stock symbols in the query
   - If a company name is mentioned, use its corresponding stock symbol
   - Handle comparison queries like "Should I buy X or Y?"
   - Common patterns: "What about [company]", "Should I invest in [company]", "Compare [company1] vs [company2]"
   - Return null if no company or symbol is found

2. For single stock analysis:
   - Start with "Current Price: $XX.XX"
   - Technical Analysis (trends, volume, support/resistance)
   - Analyst Recommendations and Trends
   - Fund Performance Metrics
   - Financial Data Analysis
   - Clear Buy/Sell/Hold recommendation with confidence level
   - Risk assessment and potential catalysts
   - Market sentiment analysis

3. For stock comparisons:
   - Start with both prices: "[Symbol1]: $XX.XX | [Symbol2]: $YY.YY"
   - Side-by-side comparison of key metrics
   - Relative strength analysis
   - Comparative analyst recommendations
   - Financial performance comparison
   - Risk/reward comparison
   - Clear recommendation on which stock appears more promising

Keep responses concise and actionable. Always start with current price(s) and end with a clear recommendation.`;

const extractSymbolsFromQuery = async (query, model) => {
  try {
    const extractionPrompt = `Extract stock symbol(s) from this query: "${query}"
    If company names are mentioned, convert them to stock symbols (e.g., "Apple" -> "AAPL", "Microsoft" -> "MSFT").
    If it's a comparison query (e.g., "Should I buy X or Y?"), return both symbols.
    Return in format: SYMBOL1,SYMBOL2 if comparison, or just SYMBOL if single stock.
    Return NULL if no company/symbol is found.`;
    
    const response = await generateText({
      model: google('gemini-1.5-pro-002'),
      messages: [
        { role: 'user', content: extractionPrompt }
      ]
    });
    
    const symbolsStr = response.text.trim().toUpperCase();
    if (symbolsStr === 'NULL') return { symbols: [], isComparison: false };
    
    const symbols = symbolsStr.split(',').map(s => s.trim());
    return {
      symbols,
      isComparison: symbols.length === 2
    };
  } catch (error) {
    console.error('Error extracting symbols:', error);
    throw new Error('Failed to extract stock symbols');
  }
};

async function fetchStockData(symbol) {
  const endpoints = {
    price: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-price?region=US&symbol=${symbol}`,
    recommendation: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-recommendation-by-symbol?region=US&symbol=${symbol}`,
    holders: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-insider-holders?region=US&symbol=${symbol}`,
    statistics: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-statistics?symbol=${symbol}&region=US`,
    feesExpenses: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-fees-and-expenses?region=US&symbol=${symbol}}`,
    score: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-scores?symbol=${symbol}&region=US`,
    earnings: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-earnings?symbol=${symbol}&region=US`,
    analysis: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-analysis?symbol=${symbol}&region=US`,
    // New endpoints
    financialData: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-financial-data?region=US&symbol=${symbol}`,
    fundPerformance: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-fund-performance?symbol=${symbol}&region=US`,
    analystsOpinions: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-what-analysts-are-saying?region=US&symbol=${symbol}`,
    recommendationTrend: `https://yahoo-finance166.p.rapidapi.com/api/stock/get-recommendation-trend?symbol=${symbol}&region=US`
  };

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY ,
      'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com'
    }
  };

  try {
    const responses = await Promise.allSettled(
      Object.entries(endpoints).map(async ([key, url]) => {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return { [key]: data };
        } catch (error) {
          console.warn(`Failed to fetch ${key} data:`, error.message);
          return { [key]: null };
        }
      })
    );

    const combinedResult = responses.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        return { ...acc, ...result.value };
      }
      return acc;
    }, {});

    return combinedResult;
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    throw new Error(`Failed to fetch stock data for ${symbol}`);
  }
}

const formatAnalysisData = (stockSymbol, technicalIndicators, stockData) => {
  // Helper function to format large numbers
  const formatNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  // Extract recommendation trend data
  const recommendationTrend = stockData.recommendationTrend?.data?.[0] || {};
  const strongBuy = recommendationTrend.strongBuy || 0;
  const buy = recommendationTrend.buy || 0;
  const hold = recommendationTrend.hold || 0;
  const sell = recommendationTrend.sell || 0;
  const strongSell = recommendationTrend.strongSell || 0;
  const totalRecommendations = strongBuy + buy + hold + sell + strongSell;

  // Extract financial data
  const financials = stockData.financialData?.data?.[0] || {};
  
  // Extract fund performance data
  const fundPerf = stockData.fundPerformance?.data?.[0] || {};
  
  // Extract analyst opinions
  const analystsOpinions = stockData.analystsOpinions?.data || [];
  
  // Calculate recommendation score (1-5 scale)
  const recommendationScore = totalRecommendations > 0 
    ? ((strongBuy * 5 + buy * 4 + hold * 3 + sell * 2 + strongSell * 1) / totalRecommendations).toFixed(2)
    : 'N/A';

  return `
    Current Price for ${stockSymbol}: $${technicalIndicators.currentPrice?.toFixed(2)}

    Technical Indicators:
    - Previous Close: $${technicalIndicators.previousClose?.toFixed(2)}
    - Daily Range: $${technicalIndicators.dailyRange.low?.toFixed(2)} - $${technicalIndicators.dailyRange.high?.toFixed(2)}
    - Price Change: ${technicalIndicators.priceChange?.toFixed(2)}%
    - Volume: ${technicalIndicators.volume?.toLocaleString()}
    - Avg Volume (10d): ${technicalIndicators.averageVolume?.toLocaleString()}
    - Market Cap: ${technicalIndicators.marketCap ? formatNumber(technicalIndicators.marketCap) : 'N/A'}

    Financial Metrics:
    - Revenue (TTM): ${financials.totalRevenue ? formatNumber(financials.totalRevenue) : 'N/A'}
    - Profit Margin: ${financials.profitMargins ? `${(financials.profitMargins * 100).toFixed(2)}%` : 'N/A'}
    - Operating Margin: ${financials.operatingMargins ? `${(financials.operatingMargins * 100).toFixed(2)}%` : 'N/A'}
    - Return on Equity: ${financials.returnOnEquity ? `${(financials.returnOnEquity * 100).toFixed(2)}%` : 'N/A'}
    - Quick Ratio: ${financials.quickRatio || 'N/A'}
    - Debt to Equity: ${financials.debtToEquity ? `${financials.debtToEquity.toFixed(2)}` : 'N/A'}

    Analyst Recommendations (${totalRecommendations} analysts):
    - Strong Buy: ${strongBuy} (${((strongBuy/totalRecommendations)*100).toFixed(1)}%)
    - Buy: ${buy} (${((buy/totalRecommendations)*100).toFixed(1)}%)
    - Hold: ${hold} (${((hold/totalRecommendations)*100).toFixed(1)}%)
    - Sell: ${sell} (${((sell/totalRecommendations)*100).toFixed(1)}%)
    - Strong Sell: ${strongSell} (${((strongSell/totalRecommendations)*100).toFixed(1)}%)
    - Overall Score: ${recommendationScore} / 5.0

    Fund Performance Metrics:
    - YTD Return: ${fundPerf.ytd ? `${fundPerf.ytd.toFixed(2)}%` : 'N/A'}
    - 1-Year Return: ${fundPerf.oneYear ? `${fundPerf.oneYear.toFixed(2)}%` : 'N/A'}
    - 3-Year Return: ${fundPerf.threeYear ? `${fundPerf.threeYear.toFixed(2)}%` : 'N/A'}
    - 5-Year Return: ${fundPerf.fiveYear ? `${fundPerf.fiveYear.toFixed(2)}%` : 'N/A'}

    Recent Analyst Opinions:
    ${analystsOpinions.slice(0, 3).map(opinion => 
      `- ${opinion.firm}: ${opinion.rating} (${opinion.date})`
    ).join('\n    ')}

    Insider Holdings:
    - Total Insiders: ${stockData.holders?.data?.[0]?.totalInsiders || 'N/A'}
    - Total Shares Held: ${stockData.holders?.data?.[0]?.totalShares 
      ? formatNumber(stockData.holders.data[0].totalShares) 
      : 'N/A'}

    Key Statistics:
    - Beta: ${stockData.statistics?.data?.[0]?.beta?.toFixed(2) || 'N/A'}
    - PE Ratio: ${stockData.statistics?.data?.[0]?.forwardPE?.toFixed(2) || 'N/A'}
    - EPS (TTM): ${stockData.statistics?.data?.[0]?.trailingEps?.toFixed(2) || 'N/A'}
    - Dividend Yield: ${stockData.statistics?.data?.[0]?.dividendYield 
      ? `${(stockData.statistics.data[0].dividendYield * 100).toFixed(2)}%` 
      : 'N/A'}

    Performance Scores:
    - Value Score: ${stockData.score?.data?.[0]?.valueScore || 'N/A'}/100
    - Growth Score: ${stockData.score?.data?.[0]?.growthScore || 'N/A'}/100
    - Momentum Score: ${stockData.score?.data?.[0]?.momentumScore || 'N/A'}/100
    - Overall Score: ${stockData.score?.data?.[0]?.totalScore || 'N/A'}/100

    Please provide a comprehensive analysis including:
    1. Technical Analysis Summary (considering price action, volume, and market position)
    2. Financial Health Assessment (based on margins, ratios, and growth metrics)
    3. Market Sentiment (based on analyst recommendations and insider activity)
    4. Risk Factors (considering beta, volatility, and market conditions)
    5. Future Growth Potential (based on analyst projections and industry trends)
    6. Clear Buy/Sell/Hold Recommendation with confidence level
  `;
};
const calculateTechnicalIndicators = (stockData) => {
  try {
    const priceData = stockData.price?.data?.[0] || stockData.price;
    const statistics = stockData.statistics?.data?.[0] || stockData.statistics;
    
    if (!priceData) {
      console.warn('No price data available');
      return null;
    }

    const indicators = {
      currentPrice: priceData.regularMarketPrice || priceData.close,
      previousClose: priceData.regularMarketPreviousClose || priceData.previousClose,
      dailyRange: {
        high: priceData.regularMarketDayHigh || priceData.high,
        low: priceData.regularMarketDayLow || priceData.low
      },
      priceChange: (((priceData.regularMarketPrice || priceData.close) - 
                     (priceData.regularMarketPreviousClose || priceData.previousClose)) / 
                    (priceData.regularMarketPreviousClose || priceData.previousClose) * 100),
      volume: priceData.regularMarketVolume || priceData.volume,
      averageVolume: statistics?.averageDailyVolume10Day || statistics?.volume,
      marketCap: priceData.marketCap
    };

    return indicators;
  } catch (error) {
    console.error('Error calculating technical indicators:', error);
    return null;
  }
};



const formatComparisonData = (symbol1, symbol2, indicators1, indicators2, stockData1, stockData2) => {
  return `
    Current Prices:
    ${symbol1}: $${indicators1.currentPrice?.toFixed(2)} | ${symbol2}: $${indicators2.currentPrice?.toFixed(2)}

    ${symbol1} Market Data:
    - Price Change: ${indicators1.priceChange?.toFixed(2)}%
    - Volume: ${indicators1.volume?.toLocaleString()}
    ${indicators1.marketCap ? `- Market Cap: $${(indicators1.marketCap / 1e9).toFixed(2)}B` : ''}
    
    ${symbol2} Market Data:
    - Price Change: ${indicators2.priceChange?.toFixed(2)}%
    - Volume: ${indicators2.volume?.toLocaleString()}
    ${indicators2.marketCap ? `- Market Cap: $${(indicators2.marketCap / 1e9).toFixed(2)}B` : ''}

    Market Analysis Availability:
    ${symbol1}:
    - Analyst Recommendations: ${stockData1.recommendation ? 'Available' : 'N/A'}
    - Insider Holdings: ${stockData1.holders ? 'Available' : 'N/A'}
    - Performance Scores: ${stockData1.score ? 'Available' : 'N/A'}
    - Financial Data: ${stockData1.financialData ? 'Available' : 'N/A'}
    - Fund Performance: ${stockData1.fundPerformance ? 'Available' : 'N/A'}
    - Analyst Opinions: ${stockData1.analystsOpinions ? 'Available' : 'N/A'}
    - Recommendation Trends: ${stockData1.recommendationTrend ? 'Available' : 'N/A'}
    
    ${symbol2}:
    - Analyst Recommendations: ${stockData2.recommendation ? 'Available' : 'N/A'}
    - Insider Holdings: ${stockData2.holders ? 'Available' : 'N/A'}
    - Performance Scores: ${stockData2.score ? 'Available' : 'N/A'}
    - Financial Data: ${stockData2.financialData ? 'Available' : 'N/A'}
    - Fund Performance: ${stockData2.fundPerformance ? 'Available' : 'N/A'}
    - Analyst Opinions: ${stockData2.analystsOpinions ? 'Available' : 'N/A'}
    - Recommendation Trends: ${stockData2.recommendationTrend ? 'Available' : 'N/A'}

    Please provide:
    1. Comparative Technical Analysis
    2. Relative Market Position
    3. Financial Performance Comparison
    4. Analyst Sentiment Comparison
    5. Fund Performance Comparison (if applicable)
    6. Risk/Reward Analysis
    7. Clear recommendation on which stock appears more promising
  `;
};


export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle audio request
      const formData = await req.formData();
      const audioFile = formData.get('audio');
      
      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: 'No audio file provided' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      try {
        // Initialize Google AI File Manager
        const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

        // Convert the audio file to buffer
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        // Create a temporary file path using OS temp directory
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `audio_query_${Date.now()}.webm`);

        // Ensure temp directory exists and write file
        await fs.writeFile(tempFilePath, audioBuffer);

        // Upload the file
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: audioFile.type,
          displayName: "Audio Query",
        });

        // Wait for processing with timeout
        let file = await fileManager.getFile(uploadResult.file.name);
        let attempts = 0;
        const maxAttempts = 30; // Maximum 1 minute of waiting (2s * 30)

        while (file.state === FileState.PROCESSING && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
          file = await fileManager.getFile(uploadResult.file.name);
          attempts++;
        }

        if (file.state === FileState.FAILED || attempts >= maxAttempts) {
          throw new Error("Audio processing failed or timed out.");
        }

        // Clean up temporary file
        await fs.unlink(tempFilePath).catch(console.error);

        // Get transcription using Gemini
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-exp-0827" });
        const transcriptionResult = await model.generateContent([
          "Transcribe this audio query about stocks. Extract only the spoken text:",
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: uploadResult.file.mimeType,
            },
          },
        ]);

        const transcribedText = transcriptionResult.response.text();
        console.log('Transcribed text:', transcribedText); // Debug log

        // Extract stock symbols from transcribed text
        const { symbols, isComparison } = await extractSymbolsFromQuery(transcribedText, google('gemini-1.5-pro-002'));

        if (symbols.length === 0) {
          return new Response(
            JSON.stringify({ 
              content: "I couldn't identify any stock symbols in your voice query. Could you please try again and mention the specific stock or company you'd like to analyze?",
              role: 'assistant'
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Process stock analysis based on transcribed text
        if (isComparison) {
          const [stockData1, stockData2] = await Promise.all([
            fetchStockData(symbols[0]),
            fetchStockData(symbols[1])
          ]);

          const indicators1 = calculateTechnicalIndicators(stockData1);
          const indicators2 = calculateTechnicalIndicators(stockData2);

          if (!indicators1 || !indicators2) {
            return new Response(
              JSON.stringify({ error: 'Insufficient data for comparison analysis' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          const analysisPrompt = formatComparisonData(
            symbols[0], symbols[1],
            indicators1, indicators2,
            stockData1, stockData2
          );

          const combinedMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Voice Query: ${transcribedText}` },
            { role: 'user', content: analysisPrompt }
          ];

          const response = await generateText({
            model: model,
            messages: combinedMessages,
          });

          return new Response(
            JSON.stringify({ 
              content: response.text,
              role: 'assistant'
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );

        } else {
          const stockData = await fetchStockData(symbols[0]);
          const technicalIndicators = calculateTechnicalIndicators(stockData);

          if (!technicalIndicators) {
            return new Response(
              JSON.stringify({ error: 'Insufficient data for analysis' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          const analysisPrompt = formatAnalysisData(symbols[0], technicalIndicators, stockData);
          
          const combinedMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Voice Query: ${transcribedText}` },
            { role: 'user', content: analysisPrompt }
          ];

          const response = await generateText({
            model: model,
            messages: combinedMessages,
          });

          return new Response(
            JSON.stringify({ 
              content: response.text,
              role: 'assistant'
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

      } catch (error) {
        console.error('Audio processing error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Audio processing failed', 
            message: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

    } else {
      // Handle regular JSON request
      const { messages } = await req.json();
      const latestMessage = messages[messages.length - 1].content;
      
      const model = google('gemini-1.5-pro-002');
      const { symbols, isComparison } = await extractSymbolsFromQuery(latestMessage, model);
      
      if (symbols.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid stock symbols found in query' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (isComparison) {
        const [stockData1, stockData2] = await Promise.all([
          fetchStockData(symbols[0]),
          fetchStockData(symbols[1])
        ]);

        const indicators1 = calculateTechnicalIndicators(stockData1);
        const indicators2 = calculateTechnicalIndicators(stockData2);

        if (!indicators1 || !indicators2) {
          return new Response(
            JSON.stringify({ error: 'Insufficient data for comparison analysis' }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        const analysisPrompt = formatComparisonData(
          symbols[0], symbols[1],
          indicators1, indicators2,
          stockData1, stockData2
        );

        const combinedMessages = [
          { role: 'system', content: systemPrompt },
          ...convertToCoreMessages(messages),
          { role: 'user', content: analysisPrompt }
        ];

        const response = await generateText({
          model: model,
          messages: combinedMessages,
        });

        return new Response(
          JSON.stringify({ 
            content: response.text,
            role: 'assistant'
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );

      } else {
        const stockData = await fetchStockData(symbols[0]);
        const technicalIndicators = calculateTechnicalIndicators(stockData);

        if (!technicalIndicators) {
          return new Response(
            JSON.stringify({ error: 'Insufficient data for analysis' }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        const analysisPrompt = formatAnalysisData(symbols[0], technicalIndicators, stockData);
        
        const combinedMessages = [
          { role: 'system', content: systemPrompt },
          ...convertToCoreMessages(messages),
          { role: 'user', content: analysisPrompt }
        ];

        const response = await generateText({
          model: model,
          messages: combinedMessages,
        });

        return new Response(
          JSON.stringify({ 
            content: response.text,
            role: 'assistant'
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

  } catch (error) {
    console.error('Route Handler Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}