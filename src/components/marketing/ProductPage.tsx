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
  Layers
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

export const ProductPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('weather');

  const weatherFeatures = [
    {
      icon: <Thermometer className="h-8 w-8" />,
      title: "Temperature Monitoring",
      description: "Real-time temperature data with min/max tracking and heat stress alerts"
    },
    {
      icon: <CloudRain className="h-8 w-8" />,
      title: "Precipitation Tracking",
      description: "Accurate rainfall measurements and forecasts for irrigation planning"
    },
    {
      icon: <Wind className="h-8 w-8" />,
      title: "Wind Speed & Direction",
      description: "Wind data for spray applications and ET calculations"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Solar Radiation",
      description: "UV index and solar radiation measurements for crop growth optimization"
    },
    {
      icon: <Gauge className="h-8 w-8" />,
      title: "Humidity & Pressure",
      description: "Atmospheric conditions that affect plant growth and disease pressure"
    },
    {
      icon: <Sun className="h-8 w-8" />,
      title: "Evapotranspiration",
      description: "Precise ET calculations using Penman-Monteith and FAO methods"
    }
  ];

  const analyticsFeatures = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Historical Analysis",
      description: "Access years of weather data to identify patterns and trends"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Predictive Models",
      description: "AI-powered forecasting for better irrigation planning"
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Data Export",
      description: "Export data in multiple formats for external analysis"
    },
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Smart Alerts",
      description: "Customizable notifications for weather events and irrigation needs"
    }
  ];

  const integrationFeatures = [
    {
      icon: <Wifi className="h-8 w-8" />,
      title: "API Access",
      description: "RESTful API for integrating with your existing systems"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile App",
      description: "Native iOS and Android apps for field monitoring"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Web Dashboard",
      description: "Responsive web interface accessible from any device"
    },
    {
      icon: <Layers className="h-8 w-8" />,
      title: "Third-party Tools",
      description: "Integrate with irrigation controllers and farm management software"
    }
  ];

  const tabs = [
    { id: 'weather', label: 'Weather Data', features: weatherFeatures },
    { id: 'analytics', label: 'Analytics', features: analyticsFeatures },
    { id: 'integration', label: 'Integration', features: integrationFeatures }
  ];

  return (
    <MarketingLayout currentPage="product">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Advanced Weather Intelligence for Smart Irrigation
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto">
              Get precise evapotranspiration calculations, real-time weather monitoring, 
              and intelligent analytics to optimize your irrigation decisions.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-blue-700 text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Try Free Demo
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

          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gray-800 px-6 py-4 flex items-center">
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Conditions</h3>
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Weather Intelligence Platform
            </h2>
            <p className="text-xl text-gray-600">
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
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tabs.find(tab => tab.id === activeTab)?.features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-gray-50">
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
      <section className="bg-blue-600 py-16">
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