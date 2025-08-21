# Stock Analyzer AI Agent Setup Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn**

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with the following variables:

```env
# Google AI API Key for Gemini models
GOOGLE_API_KEY=your_google_ai_api_key_here

# SerpAPI Key for stock data
SERPAPI_KEY=your_serpapi_key_here
```

## Getting API Keys

### Google AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env.local` file

### SerpAPI Key
1. Go to [SerpAPI](https://serpapi.com/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy the key to your `.env.local` file

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- **Voice Input**: Use your microphone to ask questions about stocks
- **Text Input**: Type stock symbols or questions directly
- **Stock Analysis**: Get comprehensive analysis using AI
- **Real-time Data**: Fetch current stock information via SerpAPI
- **Professional Recommendations**: AI-powered investment insights

## Usage Examples

### Voice Commands
- "Analyze Apple and Microsoft stocks"
- "Compare Tesla and Ford"
- "What's the outlook for Google stock?"

### Text Input
- "AAPL MSFT GOOGL"
- "Compare Apple and Microsoft"
- "Analyze the tech sector"

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your API keys are correctly set in `.env.local`
2. **Microphone Access**: Allow microphone permissions in your browser
3. **Stock Data Issues**: Check if SerpAPI key is valid and has sufficient credits

### Error Messages

- **"Failed to fetch stock data"**: Check SerpAPI key and internet connection
- **"Audio processing failed"**: Ensure microphone permissions and Google AI API key
- **"No valid stock symbols found"**: Try using more specific company names or ticker symbols

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure and don't share them publicly
- Monitor your API usage to avoid unexpected charges

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Ensure all dependencies are installed
4. Check your internet connection

