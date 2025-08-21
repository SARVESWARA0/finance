// Simple test script for the stock analyzer API
const testAPI = async () => {
  try {
    console.log('Testing Stock Analyzer API...');
    
    // Test with text input
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Analyze AAPL and MSFT' }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
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
testAPI();

