import React, { useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

const getRecommendation = (indicators) => {
  const { rsi, priceChange, currentPrice, ma5, ma14 } = indicators;
  
  // Convert string values to numbers for comparison
  const rsiValue = parseFloat(rsi);
  const currentPriceValue = parseFloat(currentPrice);
  const ma5Value = parseFloat(ma5);
  const ma14Value = parseFloat(ma14);

  // RSI Analysis
  const isOversold = rsiValue < 30;
  const isOverbought = rsiValue > 70;
  
  // Moving Average Analysis
  const aboveMA5 = currentPriceValue > ma5Value;
  const aboveMA14 = currentPriceValue > ma14Value;
  const maUptrend = ma5Value > ma14Value;

  // Generate recommendation
  let recommendation = {
    action: 'HOLD',
    reasoning: '',
    confidence: 'NEUTRAL'
  };

  if (isOversold && maUptrend) {
    recommendation = {
      action: 'BUY',
      reasoning: `Strong buy signal with RSI showing oversold conditions (${rsiValue.toFixed(2)}) and positive moving average trend. Price appears to be at a potential support level.`,
      confidence: 'HIGH'
    };
  } else if (isOverbought && !maUptrend) {
    recommendation = {
      action: 'SELL',
      reasoning: `Technical indicators suggest overbought conditions with RSI at ${rsiValue.toFixed(2)} and weakening moving average trend. Consider taking profits.`,
      confidence: 'HIGH'
    };
  } else if (isOversold) {
    recommendation = {
      action: 'BUY',
      reasoning: `RSI indicates oversold conditions (${rsiValue.toFixed(2)}), suggesting a potential bounce, but watch moving averages for confirmation.`,
      confidence: 'MEDIUM'
    };
  } else if (isOverbought) {
    recommendation = {
      action: 'SELL',
      reasoning: `RSI shows overbought levels (${rsiValue.toFixed(2)}). Technical indicators suggest taking some profits.`,
      confidence: 'MEDIUM'
    };
  } else if (maUptrend && aboveMA5 && aboveMA14) {
    recommendation = {
      action: 'BUY',
      reasoning: `Price is above both moving averages with positive trend. Shows good momentum despite neutral RSI.`,
      confidence: 'MEDIUM'
    };
  }

  return recommendation;
};

const StockAnalysisDashboard = ({ analysis }) => {
  const recommendation = useMemo(() => getRecommendation(analysis), [analysis]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'BUY':
        return <ArrowUpCircle className="w-6 h-6 text-green-500" />;
      case 'SELL':
        return <ArrowDownCircle className="w-6 h-6 text-red-500" />;
      default:
        return <MinusCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Technical Analysis</h2>
        {getActionIcon(recommendation.action)}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Current Price</h3>
          <p className="text-xl font-semibold">${analysis.currentPrice}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">24h Change</h3>
          <p className={`text-xl font-semibold ${parseFloat(analysis.priceChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analysis.priceChange}%
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">RSI (14)</h3>
          <p className="text-xl font-semibold">{parseFloat(analysis.rsi).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Volume</h3>
          <p className="text-xl font-semibold">{parseInt(analysis.volume).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${
          recommendation.action === 'BUY' ? 'bg-green-50 border border-green-200' :
          recommendation.action === 'SELL' ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Recommendation: {recommendation.action}</h3>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
              {recommendation.confidence} Confidence
            </span>
          </div>
          <p className="text-sm">{recommendation.reasoning}</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Moving Averages</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">5-Day MA</p>
              <p className="font-semibold">${analysis.ma5}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">14-Day MA</p>
              <p className="font-semibold">${analysis.ma14}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysisDashboard;