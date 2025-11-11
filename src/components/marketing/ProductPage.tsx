import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout';
import { 
  BarChart3, 
  CheckCircle,
  TrendingUp,
  Thermometer,
  Wind,
  Eye,
  Gauge,
  Database,
  CloudRain,
  Sun,
  AlertTriangle,
  Wifi,
  Smartphone,
  Globe,
  Layers,
  Wheat,
  Droplets,
  DollarSign,
  Brain,
  Calendar,
  Zap,
  Sprout,
  Target,
  Timer
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

export const ProductPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('crops');

  const cropIntelligenceFeatures = [
    {
      icon: <Wheat className="h-8 w-8" />,
      title: "Multi-Crop Database",
      description: "50+ crop varieties with specific ET coefficients, growth stages, and water requirements"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Insights", 
      description: "Machine learning algorithms analyze crop conditions and provide optimization recommendations"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Growth Stage Tracking",
      description: "Monitor crop development and adjust irrigation based on plant phenology"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Yield Optimization",
      description: "Maximize production while maintaining quality through precision water management"
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "ROI Tracking",
      description: "Monitor water cost savings and yield improvements with detailed financial analytics"
    },
    {
      icon: <Sprout className="h-8 w-8" />,
      title: "Stress Prevention",
      description: "Early detection of water stress to prevent yield loss and crop damage"
    }
  ];

  const irrigationManagementFeatures = [
    {
      icon: <Droplets className="h-8 w-8" />,
      title: "Precision Scheduling",
      description: "Automated irrigation schedules based on real-time crop water needs and weather conditions"
    },
    {
      icon: <Timer className="h-8 w-8" />,
      title: "Optimal Timing",
      description: "Calculate the best irrigation windows to maximize water efficiency and minimize runoff"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Controller Integration",
      description: "Connect with popular irrigation controllers for automated valve control"
    },
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Field Alerts",
      description: "Instant notifications for irrigation needs, weather threats, and equipment issues"
    }
  ];

  const fieldAnalyticsFeatures = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Performance Analytics",
      description: "Track yield improvements, water usage efficiency, and cost savings across fields"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Trend Analysis",
      description: "Historical data analysis to identify seasonal patterns and optimize future seasons"
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Custom Reports",
      description: "Generate detailed reports for compliance, investors, or operational analysis"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Farm Management Integration",
      description: "Connect with John Deere, Climate FieldView, and other farm management platforms"
    }
  ];  const tabs = [
    { id: 'crops', label: 'Crop Intelligence', features: cropIntelligenceFeatures },
    { id: 'irrigation', label: 'Irrigation Management', features: irrigationManagementFeatures },
    { id: 'analytics', label: 'Field Analytics', features: fieldAnalyticsFeatures }
  ];

  return (
    <MarketingLayout currentPage="product">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-800 dark:from-green-800 dark:to-blue-900 text-white py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Complete Crop Intelligence Platform for Modern Growers
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto">
              Maximize yields and profits with crop-specific irrigation schedules, AI-powered insights, 
              and precision agriculture tools built for today's farming operations.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-green-700 text-lg font-semibold px-8 py-4 rounded-lg hover:bg-green-50 transition-colors"
            >
              Start Farm Trial
            </button>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              See ET Weather in Action
            </h2>
            <p className="text-xl text-gray-600">
              Experience the power of professional weather monitoring
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden transition-colors">
            <div className="bg-gray-800 dark:bg-gray-900 px-6 py-4 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 text-center">
                <span className="text-gray-300 text-sm">ET Weather Dashboard</span>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Weather */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Current Conditions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-800">78°F</div>
                      <div className="text-sm text-gray-600">Temperature</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">0.15"</div>
                      <div className="text-sm text-gray-600">ET Today</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-gray-600">Humidity</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600">8 mph</div>
                      <div className="text-sm text-gray-600">Wind</div>
                    </div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">7-Day ET Forecast</h3>
                  <div className="h-32 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-end justify-between p-4">
                    {[0.12, 0.15, 0.18, 0.14, 0.16, 0.13, 0.17].map((value, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-blue-500 rounded-t w-6" 
                          style={{ height: `${value * 200}px` }}
                        ></div>
                        <span className="text-xs text-gray-600 mt-1">{value}"</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Smart Alerts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-800">Irrigation completed</span>
                    </div>
                    <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm text-yellow-800">High ET expected tomorrow</span>
                    </div>
                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CloudRain className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm text-blue-800">Rain forecast: 0.3" Monday</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Tabs Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Weather Intelligence Platform
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need for professional irrigation management
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tabs.find(tab => tab.id === activeTab)?.features.map((feature: any, index: number) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Built for Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Enterprise-grade reliability and accuracy you can depend on
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Data Sources */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Data Sources & Accuracy</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">NCEP GFS Global Weather Model</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">NOAA Weather Station Network</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Satellite Imagery Integration</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">FAO Penman-Monteith ET Calculations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">99.9% Uptime SLA</span>
                </div>
              </div>
            </div>

            {/* API & Integration */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">API & Integration</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">RESTful API with rate limiting</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">WebSocket real-time data streams</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">CSV, JSON, XML data export</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Webhook notifications</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">SDK for popular languages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ET Weather?
            </h2>
            <p className="text-xl text-gray-600">
              See how we compare to other weather services
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-blue-600">ET Weather</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Generic Weather</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Basic ET Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: "Precise ET Calculations", us: true, generic: false, basic: true },
                  { feature: "Real-time Weather Data", us: true, generic: true, basic: false },
                  { feature: "14-day Forecasts", us: true, generic: true, basic: false },
                  { feature: "Multiple Location Support", us: true, generic: false, basic: false },
                  { feature: "Team Collaboration", us: true, generic: false, basic: false },
                  { feature: "API Access", us: true, generic: false, basic: false },
                  { feature: "Automated Reports", us: true, generic: false, basic: false },
                  { feature: "24/7 Support", us: true, generic: false, basic: false }
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.us ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.generic ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.basic ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-800 py-16 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Experience Professional Weather Intelligence?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free demo today and see the difference accurate data makes.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-white text-blue-600 text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Sign Up
          </button>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • Full access for 14 days
          </p>
        </div>
      </section>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </MarketingLayout>
  );
};