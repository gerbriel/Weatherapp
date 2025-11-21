import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout';
import { 
  Droplets, 
  BarChart3, 
  MapPin, 
  Users, 
  Clock, 
  Shield, 
  CheckCircle,
  Star,
  Eye,
  Wheat,
  TrendingUp,
  DollarSign,
  Zap,
  Brain,
  Sprout
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { useTrial } from '../../contexts/TrialContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { enableTrialMode } = useTrial();

  const handleStartTrial = () => {
    enableTrialMode();
    navigate('/trial');
  };

  const features = [
    {
      icon: <Wheat className="h-6 w-6" />,
      title: "Multi-Crop Intelligence",
      description: "Get crop-specific ET calculations and watering schedules for 50+ crops including tomatoes, almonds, grapes, and field crops."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Yield Optimization",
      description: "AI-powered insights help you maximize crop yields while minimizing water usage and operational costs."
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Cost Savings Tracking",
      description: "Monitor water cost reductions and ROI with detailed financial reports showing exactly how much you're saving."
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Smart Irrigation Timing",
      description: "Receive precise irrigation schedules based on weather patterns, soil conditions, and crop growth stages."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Automated Field Alerts",
      description: "Get instant notifications for irrigation windows, weather threats, and optimal harvest timing."
    },
    {
      icon: <Sprout className="h-6 w-6" />,
      title: "Growth Stage Monitoring",
      description: "Track crop development and adjust irrigation strategies based on real-time plant water needs."
    }
  ];

  const testimonials = [
    {
      name: "Carlos Martinez",
      role: "Tomato Grower",
      company: "Martinez Family Farms - 1,200 acres",
      content: "This system paid for itself in 3 months. Our tomato yields increased 22% while cutting water costs by $180k annually. The crop-specific insights are game-changing.",
      rating: 5,
      avatar: "CM"
    },
    {
      name: "Jennifer Thompson",
      role: "Vineyard Manager", 
      company: "Sonoma Premium Vineyards",
      content: "The precision irrigation scheduling has transformed our grape quality. We're producing premium fruit while using 35% less water than neighboring vineyards.",
      rating: 5,
      avatar: "JT"
    },
    {
      name: "Robert Chen",
      role: "Agricultural Consultant",
      company: "Central Valley Ag Solutions",
      content: "I recommend this to all my grower clients. The ROI is immediate - most see 15-20% water savings and better crop uniformity in the first season.",
      rating: 5,
      avatar: "RC"
    }
  ];

  const stats = [
    { label: "Farms Using Our System", value: "2,500+" },
    { label: "Acres Under Management", value: "850,000+" },
    { label: "Water Saved Annually", value: "1.2B Gallons" },
    { label: "Average Yield Increase", value: "18%" }
  ];

  return (
    <MarketingLayout currentPage="home">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-gray-900 text-white overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Maximize Crop Yields with 
                <span className="text-green-300"> Smart Irrigation</span>
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                Boost your farm's profitability with precision ET calculations, crop-specific watering schedules, 
                and AI-powered agricultural insights designed for modern growers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartTrial}
                  className="bg-green-500 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                >
                  Start Free Farm Trial
                  <Eye className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={handleStartTrial}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  See How It Works
                </button>
              </div>
              <p className="text-blue-200 text-sm mt-4">
                ✓ 14-day free trial • ✓ Multi-crop intelligence • ✓ No credit card required
              </p>
            </div>
            
            {/* Hero Image/Dashboard Preview */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
                <div className="bg-gradient-to-br from-green-50 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-800 dark:text-gray-200 font-semibold">Field Dashboard - Tomatoes</h3>
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">Live Data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">0.24"</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Crop ET Today</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">18%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Water Saved</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">+12%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Yield Increase</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">$2.4k</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Savings/Month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Complete Farm Intelligence System
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything modern growers need to maximize yields, reduce costs, and grow more efficiently 
              in today's competitive agricultural market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-xl transition-all">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Increase Profits While Saving Water
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Our precision irrigation system helps growers boost crop yields by 10-25% 
                while reducing water costs and improving farm sustainability.
              </p>
              
              <div className="space-y-4">
                {[
                  "Increase crop yields by 10-25%",
                  "Cut water costs by 20-40%", 
                  "Reduce irrigation labor by 60%",
                  "Prevent overwatering damage",
                  "Optimize harvest quality",
                  "Meet water compliance requirements"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" />
                    <span className="text-gray-700 dark:text-gray-200 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleStartTrial}
                  className="bg-green-500 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start Farm Trial
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Calculate Savings
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Water Savings Calculator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Monthly Water Bill</label>
                    <input 
                      type="text" 
                      placeholder="$500"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Irrigated Area (acres)</label>
                    <input 
                      type="text" 
                      placeholder="10"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-semibold">Potential Annual Savings</div>
                    <div className="text-2xl font-bold text-green-600">$1,800</div>
                    <div className="text-sm text-green-600">Based on 30% water reduction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about ET Weather
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-200 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-800 py-16 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Optimize Your Irrigation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who trust ET Weather for their irrigation decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartTrial}
              className="bg-green-500 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Free Demo
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-blue-600 text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Start Your Free Demo
            </button>
            <button className="border-2 border-white text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
              Schedule a Demo
            </button>
          </div>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • Full featured demo • Instant access
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