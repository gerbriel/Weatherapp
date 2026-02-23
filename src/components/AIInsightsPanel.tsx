// AI Insights Component for displaying crop watering insights
// src/components/AIInsightsPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Droplets, 
  Thermometer, 
  Clock,
  DollarSign,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { aiInsightsService, type CropInsight, type InsightContext } from '../services/aiInsightsService';

interface AIInsightsPanelProps {
  cropType: string;
  location: string;
  plantingDate: string;
  currentStage: string;
  weatherData: any[];
  irrigationData?: any[];
  fieldSize?: number;
  irrigationType?: string;
  soilType?: string;
  enabled: boolean;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  cropType,
  location,
  plantingDate,
  currentStage,
  weatherData,
  irrigationData = [],
  fieldSize,
  irrigationType,
  soilType,
  enabled
}) => {
  const [insights, setInsights] = useState<CropInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [currentProvider, setCurrentProvider] = useState('local');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (enabled && weatherData.length > 0) {
      generateInsights();
    }
    
    // Load available providers
    const providers = aiInsightsService.getAvailableProviders();
    setAvailableProviders(providers);
    setCurrentProvider(aiInsightsService.getCurrentProvider());
  }, [enabled, cropType, location, weatherData, currentStage]);

  const generateInsights = async () => {
    if (!enabled || weatherData.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Convert weather data to the format expected by the AI service
      const chartData = weatherData.map((day: any) => ({
        date: day.date || day.time,
        temperature: day.temperature_2m_max || day.temperature || 0,
        humidity: day.relative_humidity_2m || day.humidity || 0,
        precipitation: day.precipitation || day.rain || 0,
        evapotranspiration: day.et0_fao_evapotranspiration || day.evapotranspiration || 0,
        soilMoisture: day.soil_moisture_0_to_1cm || undefined,
        irrigationAmount: 0, // Would come from irrigation system if available
        cropStage: currentStage,
        weatherConditions: day.weather_code ? getWeatherDescription(day.weather_code) : 'Clear'
      }));

      const context: InsightContext = {
        cropType,
        location,
        plantingDate,
        currentStage,
        fieldSize,
        irrigationType,
        soilType,
        weatherHistory: chartData.slice(-14), // Last 2 weeks
        irrigationHistory: chartData.slice(-7)  // Last week for irrigation data
      };

      const generatedInsights = await aiInsightsService.generateInsights(context);
      setInsights(generatedInsights);
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers'
    };
    return weatherCodes[code] || 'Unknown';
  };

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
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-emerald-500 bg-emerald-900/20';
      default: return 'border-blue-500 bg-blue-900/20';
    }
  };

  const getSeverityColorBorder = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-emerald-500';
      default: return 'border-blue-500';
    }
  };

  const toggleInsightExpansion = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const changeProvider = async (providerId: string) => {
    setCurrentProvider(providerId);
    aiInsightsService.setProvider(providerId);
    if (enabled && weatherData.length > 0) {
      await generateInsights();
    }
  };

  if (!enabled) {
    return null;
  }

  // Compact mode - match ChartAIInsights style
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (!isExpanded && !insights) {
      generateInsights();
    }
    setIsExpanded(!isExpanded);
  };

  // Compact button when not expanded (like other AI insights)
  if (!isExpanded) {
    return (
      <div className="flex justify-center my-4">
        <button
          onClick={handleToggle}
          className="flex items-center gap-3 px-6 py-3 text-base rounded-xl border-3 border-blue-300 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 animate-pulse hover:animate-none"
          style={{
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3), 0 0 20px rgba(16, 185, 129, 0.4)',
            border: '3px solid #3B82F6'
          }}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-white animate-bounce" />
            <span className="font-bold text-lg text-white">GET AI CROP INSIGHTS</span>
            <span className="text-sm bg-orange-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">NEW!</span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-600 dark:border-gray-600 bg-gradient-to-r from-blue-800/30 to-emerald-800/30 dark:from-gray-800 dark:to-gray-750 rounded-t-lg"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-blue-400" />
          <div>
            <h4 className="text-sm font-bold text-white dark:text-white">
              AI Crop Insights - Field Analysis
            </h4>
            <p className="text-xs text-gray-300 dark:text-gray-300 font-medium">
              What this data means for your irrigation decisions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              generateInsights();
            }}
            disabled={loading}
            className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} text-blue-400`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            className="p-2 bg-gray-500/20 rounded-lg hover:bg-gray-500/30 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <ChevronUp className="h-5 w-5 text-gray-300" />
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-600 p-4 bg-gray-700">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              AI Provider
            </label>
            <select
              value={currentProvider}
              onChange={(e) => changeProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableProviders.map((provider) => (
                <option key={provider.id} value={provider.id} disabled={!provider.configured}>
                  {provider.name} {!provider.configured ? '(Not Configured)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Configure API keys in environment variables to use external AI providers.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4" style={{ backgroundColor: '#334155' }}>
        {loading && (
          <div className="flex items-center gap-3 text-blue-400 py-6 justify-center">
            <Brain className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">Analyzing crop data...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 py-3 px-4 bg-red-900/30 rounded-lg border border-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={generateInsights}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && insights.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-2 text-gray-500" />
            <p className="text-gray-300">No insights available yet</p>
            <p className="text-sm text-gray-400">Check back when there's more data to analyze</p>
          </div>
        )}

        {!loading && insights.length > 0 && (
          <div className="space-y-4">
            {insights.map((insight) => {
              const isExpanded = expandedInsights.has(insight.id);
              
              return (
                <div
                  key={insight.id}
                  className={`bg-gray-700 rounded-xl p-4 shadow-sm border-l-4 ${getSeverityColorBorder(insight.severity)}`}
                >
                  {/* Insight Header */}
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleInsightExpansion(insight.id)}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      {getSeverityIcon(insight.severity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white">{insight.title}</h4>
                          <div className="flex items-center space-x-1 text-xs">
                            {getCategoryIcon(insight.category)}
                            <span className="text-gray-300 capitalize">
                              {insight.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {insight.insight}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.confidence >= 80 ? 'bg-emerald-800/30 text-emerald-200 border border-emerald-700' :
                            insight.confidence >= 60 ? 'bg-yellow-800/30 text-yellow-200 border border-yellow-700' :
                            'bg-gray-600 text-gray-200'
                          }`}>
                            {insight.confidence}% confidence
                          </span>
                          {insight.estimatedSavings && (
                            <span className="text-xs text-emerald-400 font-medium">
                              💰 {insight.estimatedSavings}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      {/* Recommendation */}
                      <div className="mb-4">
                        <h5 className="font-medium text-white mb-2">💡 Recommendation</h5>
                        <p className="text-gray-200 text-sm bg-gray-600 p-3 rounded">
                          {insight.recommendation}
                        </p>
                      </div>

                      {/* Action Items */}
                      {insight.actionItems.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-white mb-2">✅ Action Items</h5>
                          <ul className="space-y-1">
                            {insight.actionItems.map((action, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm text-gray-200">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Factors */}
                      {insight.riskFactors && insight.riskFactors.length > 0 && (
                        <div>
                          <h5 className="font-medium text-white mb-2">⚠️ Risk Factors</h5>
                          <div className="flex flex-wrap gap-2">
                            {insight.riskFactors.map((risk, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-orange-800/30 text-orange-200 text-xs rounded border border-orange-700"
                              >
                                {risk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-600 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {insights.length}
                </div>
                <div className="text-xs text-gray-300">Total Insights</div>
              </div>
              <div className="bg-red-800/30 border border-red-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {insights.filter(i => i.severity === 'critical' || i.severity === 'high').length}
                </div>
                <div className="text-xs text-red-300">High Priority</div>
              </div>
              <div className="bg-emerald-800/30 border border-emerald-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {insights.filter(i => i.estimatedSavings).length}
                </div>
                <div className="text-xs text-emerald-300">Cost Savings</div>
              </div>
              <div className="bg-blue-800/30 border border-blue-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
                </div>
                <div className="text-xs text-blue-300">Avg Confidence</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;