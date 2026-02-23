import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SimpleSignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SimpleSignupForm: React.FC<SimpleSignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Fetch existing companies from database
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('company')
        .not('company', 'is', null);
      
      if (data) {
        const uniqueCompanies = [...new Set(data.map(d => d.company).filter(Boolean))];
        setCompanies(uniqueCompanies);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.toLowerCase().includes(company.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(email, password, {
      fullName,
      company,
      phone
    });

    if (signUpError) {
      // Check if email already exists
      if (signUpError.message?.toLowerCase().includes('already registered') || 
          signUpError.message?.toLowerCase().includes('user already exists') ||
          signUpError.message?.toLowerCase().includes('email already')) {
        setError('This email is already registered. Please sign in instead.');
        setLoading(false);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onSwitchToLogin?.();
        }, 2000);
      } else {
        setError(signUpError.message || 'Failed to sign up');
        setLoading(false);
      }
    } else {
      setLoading(false);
      setShowEmailConfirmation(true);
      // Don't call onSuccess immediately - let user see the confirmation message
    }
  };

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a confirmation email to <span className="font-semibold">{email}</span>
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-200 text-left space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the confirmation link</li>
              <li>You'll be automatically logged into the app</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setShowEmailConfirmation(false)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              try again
            </button>
          </p>
          <button
            onClick={onSuccess}
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Get Started</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            {error.includes('already registered') && onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Go to Sign In →
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setShowCompanyDropdown(true);
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your company name"
            />
          </div>
          {showCompanyDropdown && filteredCompanies.length > 0 && company && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredCompanies.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCompany(c);
                    setShowCompanyDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        {onSwitchToLogin && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
