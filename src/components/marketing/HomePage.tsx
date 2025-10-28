import React, { useState } from 'react';
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
  Eye
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { useTrial } from '../../contexts/TrialContext';

export const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { enableTrialMode } = useTrial();

  const handleStartTrial = () => {
    enableTrialMode();
    // The AppRouter will automatically redirect to /trial
  };

  const features = [
    {
      icon: <Droplets className="h-6 w-6" />,
      title: "Precise ET Calculations",
      description: "Advanced evapotranspiration calculations using the latest meteorological data and proven agricultural models."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Live weather monitoring with 14-day forecasts and historical data analysis for informed decision making."
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Multi-location Support",
      description: "Monitor unlimited locations with precise coordinates and customizable alerts for each site."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Share data with your team, manage user permissions, and collaborate on irrigation decisions."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Automated Reports",
      description: "Schedule daily, weekly, or monthly reports delivered directly to your email inbox."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-level security with encrypted data transmission and secure user authentication."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Farm Manager",
      company: "Green Valley Farms",
      content: "ET Weather Pro has revolutionized our irrigation scheduling. We've reduced water usage by 30% while improving crop yields.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Mike Rodriguez",
      role: "Landscape Contractor", 
      company: "Desert Oasis Landscaping",
      content: "The precision of the ET calculations is incredible. Our clients love the water savings and healthier landscapes.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Dr. Emily Chen",
      role: "Research Scientist",
      company: "Agricultural Research Institute",
      content: "The data quality and accessibility makes this tool invaluable for our research projects and field studies.",
      rating: 5,
      avatar: "EC"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10,000+" },
    { label: "Locations Monitored", value: "50,000+" },
    { label: "Water Saved", value: "1.2B Gallons" },
    { label: "Countries", value: "25+" }
  ];

  return (
    <MarketingLayout currentPage="home">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Professional Weather & 
                <span className="text-blue-300"> ET Monitoring</span>
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                Make smarter irrigation decisions with precise evapotranspiration calculations, 
                real-time weather data, and automated reporting for agriculture and landscaping professionals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartTrial}
                  className="bg-green-500 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                >
                  Try Free Demo
                  <Eye className="ml-2 h-5 w-5" />
                </button>
                                                <button
                  onClick={handleStartTrial}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Free Demo
                </button>
              </div>
              <p className="text-blue-200 text-sm mt-4">
                ✓ Free demo with CA locations • ✓ Full functionality • ✓ No credit card required
              </p>
            </div>
            
            {/* Hero Image/Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-lg shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-800 font-semibold">Today's Weather</h3>
                    <span className="text-green-600 text-sm font-medium">Live Data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-800">78°F</div>
                      <div className="text-sm text-gray-600">High Temp</div>
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
                      <div className="text-sm text-gray-600">Wind Speed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 text-sm lg:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Smart Irrigation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and data you need to optimize 
              water usage and improve crop health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Reduce Water Usage by Up to 40%
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Make data-driven irrigation decisions that save water, reduce costs, 
                and improve plant health with our advanced ET monitoring system.
              </p>
              
              <div className="space-y-4">
                {[
                  "Save 20-40% on water costs",
                  "Improve crop yields and quality", 
                  "Reduce labor with automation",
                  "Meet sustainability goals"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleStartTrial}
                  className="bg-green-500 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Try Demo Now
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
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
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about ET Weather Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Optimize Your Irrigation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who trust ET Weather Pro for their irrigation decisions.
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