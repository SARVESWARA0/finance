// Test script to examine SerpAPI response structure and test stock data extraction
const testStockData = async () => {
  try {
    console.log('🔍 Testing Stock Data Extraction...');
    
    // Test with text input
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Analyze AAPL' }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n✅ API Response Structure:');
    console.log('========================');
    console.log('Symbols:', data.symbols);
    console.log('\nStock Data:');
    console.log(JSON.stringify(data.stocksData, null, 2));
    console.log('\nAnalysis:');
    console.log(data.analysis);
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure the development server is running: npm run dev');
    }
    
    if (error.message.includes('500')) {
      console.log('💡 Check your API keys in .env.local file');
      console.log('💡 Required: GOOGLE_API_KEY and SERPAPI_KEY');
    }
  }
};

// Run the test
console.log('🚀 Starting Stock Data Test...');
console.log('Make sure your development server is running (npm run dev)');
console.log('And you have set up your API keys in .env.local\n');

testStockData();

