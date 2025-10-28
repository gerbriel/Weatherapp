import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout';
import { 
  CheckCircle,
  X,
  Star,
  MapPin,
  BarChart3,
  Zap,
  Headphones,
  Crown,
  Eye
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { useTrial } from '../../contexts/TrialContext';

export const PricingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const { enableTrialMode } = useTrial();

  const handleStartTrial = () => {
    enableTrialMode();
  };

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small farms and individual users",
      price: { monthly: 29, annually: 290 },
      features: [
        "Up to 3 locations",
        "Real-time weather data",
        "Basic ET calculations",
        "7-day forecasts",
        "Email notifications",
        "Mobile app access",
        "Basic support"
      ],
      limitations: [
        "No historical data export",
        "No API access",
        "No team collaboration"
      ],
      popular: false,
      color: "gray"
    },
    {
      name: "Professional",
      description: "Ideal for commercial operations and consultants",
      price: { monthly: 79, annually: 790 },
      features: [
        "Up to 25 locations",
        "Advanced ET models",
        "14-day forecasts",
        "Historical data (5 years)",
        "Data export (CSV, JSON)",
        "Custom alerts",
        "Team collaboration (5 users)",
        "API access (1000 calls/day)",
        "Priority support",
        "Automated reports"
      ],
      limitations: [
        "Limited API calls",
        "No white-label options"
      ],
      popular: true,
      color: "blue"
    },
    {
      name: "Enterprise",
      description: "For large organizations and research institutions",
      price: { monthly: 199, annually: 1990 },
      features: [
        "Unlimited locations",
        "All ET calculation methods",
        "Extended forecasts (21 days)",
        "Full historical archive",
        "Unlimited data export",
        "Advanced analytics",
        "Unlimited team members",
        "Unlimited API access",
        "24/7 dedicated support",
        "Custom integrations",
        "White-label options",
        "SLA guarantee (99.9%)",
        "On-premise deployment"
      ],
      limitations: [],
      popular: false,
      color: "purple"
    }
  ];

  const addons = [
    {
      name: "Additional Locations",
      description: "Add more monitoring locations to your plan",
      price: "$2/location/month",
      icon: <MapPin className="h-6 w-6" />
    },
    {
      name: "Advanced Analytics",
      description: "Machine learning insights and predictive models",
      price: "$49/month",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      name: "API Rate Increase",
      description: "Increase API calls for heavy integration users",
      price: "$0.001/call",
      icon: <Zap className="h-6 w-6" />
    },
    {
      name: "Premium Support",
      description: "Dedicated account manager and priority support",
      price: "$99/month",
      icon: <Headphones className="h-6 w-6" />
    }
  ];

  const faq = [
    {
      question: "What's included in the free trial?",
      answer: "The 14-day free trial includes full access to the Professional plan features, including up to 25 locations, API access, and team collaboration. No credit card required."
    },
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay by invoice."
    },
    {
      question: "Is there a setup fee?",
      answer: "No, there are no setup fees or hidden charges. You only pay the monthly or annual subscription fee for your chosen plan."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data remains accessible for 30 days after cancellation. You can export all your data during this period. After 30 days, data is permanently deleted."
    },
    {
      question: "Do you offer custom enterprise solutions?",
      answer: "Yes, we offer custom solutions for large enterprises, including on-premise deployments, custom integrations, and specialized SLAs. Contact our sales team for details."
    }
  ];

  const getButtonColor = (plan: any) => {
    if (plan.color === 'blue') return 'bg-blue-600 hover:bg-blue-700 text-white';
    if (plan.color === 'purple') return 'bg-purple-600 hover:bg-purple-700 text-white';
    return 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  const getPrice = (plan: any) => {
    const price = plan.price[billingPeriod];
    if (billingPeriod === 'annually') {
      return Math.round(price / 12);
    }
    return price;
  };

  const getSavings = (plan: any) => {
    const monthlyTotal = plan.price.monthly * 12;
    const savings = monthlyTotal - plan.price.annually;
    return Math.round((savings / monthlyTotal) * 100);
  };

  return (
    <MarketingLayout currentPage="pricing">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl lg:text-2xl text-blue-100 mb-6">
            Choose the plan that fits your needs. All plans include core weather monitoring and ET calculations.
          </p>
          
          {/* Free Demo CTA */}
          <div className="mb-8">
            <button
              onClick={handleStartTrial}
              className="bg-green-500 text-white text-lg font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center"
            >
              <Eye className="mr-2 h-5 w-5" />
              Try Free Demo (CA Locations)
            </button>
            <p className="text-blue-200 text-sm mt-2">No signup required • Instant access</p>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-white' : 'text-blue-200'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'annually' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingPeriod === 'annually' ? 'text-white' : 'text-blue-200'}`}>
              Annually
            </span>
            {billingPeriod === 'annually' && (
              <span className="ml-3 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                Save up to 17%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 px-4">
                    <span className="font-medium flex items-center justify-center">
                      <Star className="h-4 w-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">${getPrice(plan)}</span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                    {billingPeriod === 'annually' && (
                      <p className="text-sm text-green-600 mt-2">
                        Save {getSavings(plan)}% annually
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowAuthModal(true)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-6 ${getButtonColor(plan)}`}
                  >
                    Start Free Trial
                  </button>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Included features:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.limitations.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Not included:</h4>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, limitIndex) => (
                            <li key={limitIndex} className="flex items-start">
                              <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-500 text-sm">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Optional Add-ons
            </h2>
            <p className="text-xl text-gray-600">
              Enhance your plan with additional features and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addons.map((addon, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {addon.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{addon.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{addon.description}</p>
                <div className="text-lg font-bold text-blue-600">{addon.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h2>
            <p className="text-xl text-gray-600">
              Detailed feature comparison across all plans
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-blue-600">Professional</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-purple-600">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: "Locations", starter: "3", professional: "25", enterprise: "Unlimited" },
                  { feature: "Weather Data", starter: "✓", professional: "✓", enterprise: "✓" },
                  { feature: "ET Calculations", starter: "Basic", professional: "Advanced", enterprise: "All Methods" },
                  { feature: "Forecast Range", starter: "7 days", professional: "14 days", enterprise: "21 days" },
                  { feature: "Historical Data", starter: "1 year", professional: "5 years", enterprise: "Full Archive" },
                  { feature: "Team Members", starter: "1", professional: "5", enterprise: "Unlimited" },
                  { feature: "API Access", starter: "—", professional: "1K calls/day", enterprise: "Unlimited" },
                  { feature: "Data Export", starter: "—", professional: "✓", enterprise: "✓" },
                  { feature: "Custom Alerts", starter: "Basic", professional: "✓", enterprise: "✓" },
                  { feature: "Support", starter: "Email", professional: "Priority", enterprise: "24/7 Dedicated" },
                  { feature: "SLA", starter: "—", professional: "—", enterprise: "99.9%" }
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{row.starter}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{row.professional}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            {faq.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.question}</h3>
                <p className="text-gray-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Crown className="h-16 w-16 text-yellow-400" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            We offer custom enterprise solutions including on-premise deployments, 
            specialized integrations, and dedicated support teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 text-lg font-semibold px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors">
              Contact Sales
            </button>
            <button className="border-2 border-white text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-purple-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            No credit card required. Full access to Professional features for 14 days.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-white text-blue-600 text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Get Started Free
          </button>
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