// Quick test to verify the API works
const testAPI = async () => {
  try {
    console.log('🧪 Quick API Test...');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'AAPL' }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success! Response:');
    console.log('Symbols:', data.symbols);
    console.log('Stock Data:', data.stocksData);
    console.log('Analysis length:', data.analysis?.length || 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Wait a bit for server to start, then test
setTimeout(testAPI, 3000);




