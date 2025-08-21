# Multi-Agent Stock Analysis System

## Overview

This platform implements a comprehensive multi-agent AI system for stock market analysis, providing accurate, structured, and insightful stock recommendations. The system uses specialized AI agents that work together to analyze stocks from multiple perspectives.

## 🎯 Agent Roles

### 1. Data Agent
- **Purpose**: Fetches comprehensive stock market data and fundamentals
- **Capabilities**:
  - Real-time price, PE, market cap, volume, and range data
  - Balance sheet and income statement analysis
  - EPS, debt ratio, beta, and dividend yield calculations
  - Competitor data for benchmarking
- **Data Sources**: Yahoo Finance API
- **Output**: Structured fundamental data

### 2. News Agent
- **Purpose**: Analyzes news sentiment and identifies key events
- **Capabilities**:
  - Fetches recent financial news headlines
  - Performs sentiment analysis (positive/neutral/negative)
  - Identifies regulatory changes, product launches, and executive changes
  - Provides news summaries with context
- **Data Sources**: Yahoo Finance News API
- **Output**: Sentiment analysis and news insights

### 3. Risk Agent
- **Purpose**: Evaluates volatility, risk metrics, and scenario analysis
- **Capabilities**:
  - Calculates historical volatility and beta
  - Performs downside risk analysis
  - Runs scenario analysis (interest rate changes, market volatility)
  - Estimates probability of gains/losses
- **Data Sources**: Historical price data
- **Output**: Risk metrics and scenario analysis

### 4. Technical Agent
- **Purpose**: Performs comprehensive technical analysis
- **Capabilities**:
  - Moving averages (SMA 20, 50, 200)
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Candlestick pattern recognition
  - Trend identification (bullish/bearish/neutral)
- **Data Sources**: Historical price data
- **Output**: Technical signals and trend analysis

### 5. Advisor Agent
- **Purpose**: Synthesizes all agent outputs into clear recommendations
- **Capabilities**:
  - Combines all analysis into Buy/Hold/Sell recommendations
  - Provides confidence levels and rationale
  - Identifies key risks and opportunities
  - Sets price targets and time horizons
- **Data Sources**: All other agents' outputs
- **Output**: Structured recommendations in plain English

## 📊 Output Structure

The system always responds in this structured JSON format:

```json
{
  "stock": "<symbol>",
  "company": "<company name>",
  "summary": "<short plain-English overview>",
  "fundamentals": {
    "peRatio": ...,
    "marketCap": ...,
    "eps": ...,
    "debtRatio": ...
  },
  "newsSentiment": "<positive/negative/neutral with short reason>",
  "technicalAnalysis": {
    "trend": "<bullish/bearish/neutral>",
    "signals": ["RSI", "MACD", "Moving Averages"]
  },
  "riskAssessment": {
    "volatility": ...,
    "beta": ...,
    "scenarioAnalysis": "..."
  },
  "comparison": {
    "competitors": [
      {"symbol": "F", "pe": ..., "marketCap": ...},
      {"symbol": "GM", "pe": ..., "marketCap": ...}
    ]
  },
  "recommendation": {
    "action": "<Buy/Hold/Sell>",
    "rationale": "<plain English explanation combining all agents>",
    "confidence": "<High/Medium/Low>",
    "keyRisks": ["risk1", "risk2"],
    "keyOpportunities": ["opportunity1", "opportunity2"],
    "timeHorizon": "<Short-term/Medium-term/Long-term>",
    "priceTarget": "<specific price or range>"
  }
}
```

## 🚀 Usage Examples

### Basic Analysis
```
"Analyze AAPL with comprehensive multi-agent analysis"
```

### Comparison Analysis
```
"Compare TSLA vs F vs GM with full analysis"
```

### Specific Focus
```
"NVDA stock recommendation with risk assessment"
```

### Technical Focus
```
"MSFT technical analysis and sentiment"
```

## 🛠️ Technical Implementation

### API Endpoint
- **Route**: `/api/chat`
- **Method**: POST
- **Input**: JSON with messages array
- **Output**: Structured analysis with multi-agent results

### Key Features
- **Parallel Processing**: All agents run simultaneously for efficiency
- **Error Handling**: Graceful degradation if any agent fails
- **Data Validation**: Zod schemas ensure data integrity
- **Caching**: Intelligent caching for repeated requests
- **Rate Limiting**: Built-in protection against API abuse

### Dependencies
- `yahoo-finance2`: Real-time stock data
- `@ai-sdk/google`: Google Gemini AI models
- `zod`: Data validation
- `ai`: AI SDK for tool execution

## 🎨 User Interface

### Components
1. **Enhanced Market Insights**: Legacy analysis display
2. **Comprehensive Analysis**: New multi-agent results display
3. **Interactive Sections**: Expandable/collapsible analysis sections
4. **Visual Indicators**: Color-coded recommendations and trends

### Features
- **Real-time Updates**: Live data from multiple sources
- **Responsive Design**: Works on all device sizes
- **Dark Theme**: Professional financial interface
- **Interactive Elements**: Hover effects and animations

## 🔧 Configuration

### Environment Variables
```env
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=development
```

### API Limits
- Maximum 3 symbols per analysis (for comprehensive results)
- 60-second timeout for analysis completion
- Rate limiting to prevent abuse

## 🧪 Testing

Run the test script to verify the system:
```bash
node test-multi-agent.js
```

This will test:
- Symbol extraction
- Multi-agent execution
- Structured output generation
- Data validation

## 📈 Performance

### Optimization Features
- **Parallel Execution**: All agents run simultaneously
- **Smart Caching**: Reduces API calls for repeated symbols
- **Error Recovery**: Continues analysis even if some agents fail
- **Memory Management**: Efficient data handling

### Expected Response Times
- Single symbol: 10-20 seconds
- Multiple symbols: 15-30 seconds
- Complex analysis: 20-40 seconds

## 🔒 Security & Compliance

### Data Protection
- No personal data stored
- API keys secured in environment variables
- HTTPS encryption for all communications
- Rate limiting to prevent abuse

### Financial Disclaimer
- Analysis is for educational purposes only
- Not financial advice
- Always do your own research
- Past performance doesn't guarantee future results

## 🚀 Future Enhancements

### Planned Features
- **Portfolio Analysis**: Multi-stock portfolio recommendations
- **Sector Analysis**: Industry-wide comparisons
- **Options Analysis**: Options chain and strategy recommendations
- **Backtesting**: Historical strategy performance
- **Alerts**: Price and news-based notifications

### Technical Improvements
- **Machine Learning**: Enhanced prediction models
- **Real-time Streaming**: Live data updates
- **Advanced Charts**: Interactive technical analysis charts
- **API Integration**: Additional data sources

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify API keys are configured
3. Test with the provided test script
4. Review the structured output format

## 📄 License

This project is for educational and demonstration purposes. Please ensure compliance with all applicable financial regulations and terms of service for data providers.
