// Demo AI Insights Component - for showcasing the feature
// src/components/DemoAIInsights.tsx
import React from 'react';
import { Brain, Lightbulb, AlertTriangle, CheckCircle, TrendingUp, Droplets, Thermometer, Clock, DollarSign } from 'lucide-react';

const DemoAIInsights: React.FC = () => {
  const demoInsights = [
    {
      id: 'demo-1',
      title: '🎯 Perfect watering window coming up tonight!',
      insight: 'Hey! I just checked the weather and tonight is looking absolutely perfect for watering. The temperature is going to drop to a nice 68°F with 85% humidity - basically, this means way less water will evaporate, so your plants will actually get to drink what you give them! 💧',
      recommendation: 'Here\'s what I\'d do: set up your irrigation to run between 6-8 PM today. And since conditions are so ideal, why not extend the watering time by about 20%? It\'s like getting a bonus - the plants will soak up every drop!',
      confidence: 92,
      severity: 'medium' as const,
      category: 'timing' as const,
      actionItems: [
        'Set that irrigation timer for 6:00 PM - don\'t miss this window!',
        'Bump up watering time to 45 minutes (your plants will love it)',
        'Check the soil tomorrow morning - it should be beautifully moist'
      ],
      estimatedSavings: 'You could save 15-20% on water compared to daytime watering - nice!',
      riskFactors: undefined
    },
    {
      id: 'demo-2', 
      title: '🔥 Yikes! Tomorrow\'s going to be a scorcher',
      insight: 'Heads up! The forecast is showing 94°F tomorrow with low humidity - that\'s pretty intense! And since your tomatoes are flowering right now, they\'re extra sensitive. Think of them like they\'re wearing a tuxedo in summer heat - they need some help staying cool.',
      recommendation: 'Okay, let\'s get those plants some relief! I\'d start with some deep watering early in the morning, and if you\'ve got any shade cloth lying around, now\'s the time to use it. Your flowering tomatoes will thank you for the extra TLC! 🍅',
      confidence: 88,
      severity: 'high' as const,
      category: 'crop_health' as const,
      actionItems: [
        'Get up early and water deep around 5-6 AM (I know, I know... but they need it!)',
        'If you have shade cloth, throw it up - even temporary is better than nothing',
        'Maybe water twice today instead of once - they\'re going to be thirsty',
        'Keep an eye out for any droopy, sad-looking plants'
      ],
      estimatedSavings: undefined,
      riskFactors: ['Flowers might drop (and that means no tomatoes later!)', 'Fewer fruits will set', 'Plants will get stressed and grumpy']
    },
    {
      id: 'demo-3',
      title: '🌧️ Sweet! Free irrigation coming your way', 
      insight: 'Guess what? Mother Nature is about to do some watering for you! The weather models are showing about 1.2 inches of rain over the next couple days. That\'s like getting a free irrigation session - pretty nice, right?',
      recommendation: 'Here\'s my thinking: let\'s take advantage of this freebie! I\'d skip your next couple of watering sessions and let nature do the work. Then wait about a day after the rain stops before getting back to your normal routine. Easy money! 💰',
      confidence: 85,
      severity: 'low' as const,
      category: 'efficiency' as const,
      actionItems: [
        'Cancel tomorrow\'s watering - let the sky handle it!',
        'Take a walk around after the rain to see how things drained',
        'Look for any puddles or standing water (not great for plants)',
        'Plan to restart watering Thursday evening when things dry out a bit'
      ],
      estimatedSavings: 'You could save 30-40% on your water bill this week - ka-ching!',
      riskFactors: ['Watch for root rot if water doesn\'t drain well', 'Wet plants can get fungal issues (they don\'t like wet feet!)']
    },
    {
      id: 'demo-4',
      title: '💨 Whoa! Your plants are losing water like crazy',
      insight: 'Okay, so here\'s what\'s happening: it\'s been hot and windy lately, and your plants are basically sweating buckets! They\'re losing water about 40% faster than normal. Think of it like they\'re running a marathon in the desert - they need way more water to keep up!',
      recommendation: 'Let\'s help them out! I\'d bump up the watering frequency and maybe add a quick midday misting if you can swing it. The goal is to keep that soil consistently moist so they don\'t get stressed. They\'re working overtime right now! 💪',
      confidence: 95,
      severity: 'critical' as const,
      category: 'watering' as const,
      actionItems: [
        'Add a quick 30-minute midday watering - think of it as a refreshing drink break',
        'If you can set up some misting, that would be amazing right now',
        'Mulch around the plants to help them hold onto that precious water',
        'Check on them more often - maybe every few hours to see how they\'re doing'
      ],
      estimatedSavings: undefined,
      riskFactors: ['Plants could get really stressed out', 'You might see a smaller harvest', 'In worst case, some plants might not make it (but we\'re going to prevent that!)']
    }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'watering': return <Droplets className="w-4 h-4" />;
      case 'efficiency': return <DollarSign className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'weather': return <Thermometer className="w-4 h-4" />;
      case 'crop_health': return <CheckCircle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'high': return 'border-orange-300 bg-orange-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-blue-300 bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6" />
          <div>
            <h3 className="font-semibold text-lg">AI Crop Insights Demo</h3>
            <p className="text-sm text-blue-100">
              Example insights based on real agricultural scenarios
            </p>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="bg-blue-50 border-b border-blue-200 p-3">
        <div className="flex items-center space-x-2 text-blue-800 text-sm">
          <Lightbulb className="w-4 h-4" />
          <span className="font-medium">Demo Preview:</span>
          <span>These are example insights to show system capabilities. Enable AI Insights with real data above.</span>
        </div>
      </div>

      {/* Demo Insights */}
      <div className="p-4 space-y-4">
        {demoInsights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-lg p-4 ${getSeverityColor(insight.severity)}`}
          >
            {/* Insight Header */}
            <div className="flex items-start space-x-3 mb-3">
              {getSeverityIcon(insight.severity)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <div className="flex items-center space-x-1 text-xs">
                    {getCategoryIcon(insight.category)}
                    <span className="text-gray-600 capitalize">
                      {insight.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-2">
                  {insight.insight}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    insight.confidence >= 90 ? 'bg-green-100 text-green-800' :
                    insight.confidence >= 80 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {insight.confidence}% confidence
                  </span>
                  {insight.estimatedSavings && (
                    <span className="text-xs text-green-600 font-medium">
                      💰 {insight.estimatedSavings}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mb-3">
              <h5 className="font-medium text-gray-900 mb-1">💡 Recommendation</h5>
              <p className="text-gray-700 text-sm bg-white bg-opacity-50 p-2 rounded text-sm">
                {insight.recommendation}
              </p>
            </div>

            {/* Action Items */}
            <div className="mb-3">
              <h5 className="font-medium text-gray-900 mb-1">✅ Action Items</h5>
              <ul className="space-y-1">
                {insight.actionItems.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Factors */}
            {insight.riskFactors && (
              <div>
                <h5 className="font-medium text-gray-900 mb-1">⚠️ Risk Factors</h5>
                <div className="flex flex-wrap gap-2">
                  {insight.riskFactors.map((risk, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Demo Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">4</div>
            <div className="text-xs text-gray-600">Active Insights</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">2</div>
            <div className="text-xs text-red-600">High Priority</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">2</div>
            <div className="text-xs text-green-600">Cost Savings</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">90%</div>
            <div className="text-xs text-blue-600">Avg Confidence</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Brain className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold text-green-800 mb-1">Ready to Get Real AI Insights?</h4>
              <p className="text-green-700 text-sm mb-3">
                Enable the AI Insights checkbox above to start getting personalized recommendations for your crops and weather data.
              </p>
              <div className="text-xs text-green-600 space-y-1">
                <div>✅ Works immediately with local analysis (no setup required)</div>
                <div>🚀 Add OpenAI or Anthropic keys for advanced insights</div>
                <div>💰 Typical users save 15-25% on water costs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoAIInsights;