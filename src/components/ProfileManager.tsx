import React, { useState } from 'react';
import { X, User, Mail, Building2, Phone, Key, Save, Eye, EyeOff, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextSimple';
import { supabase } from '../lib/supabase';

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // Optional back button handler
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ isOpen, onClose, onBack }) => {
  const { profile, user, deleteAccount } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'account'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Update profile information
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          company: company.trim() || null,
          phone: phone.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Refresh the page to update profile data everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  // Update email
  const handleUpdateEmail = async (newEmail: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Confirmation email sent! Please check your inbox to verify your new email.' 
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update email' });
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      setMessage({ type: 'error', text: 'Please type "delete my account" to confirm' });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const { error } = await deleteAccount();
      
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
        setIsDeleting(false);
        return;
      }

      // Account deleted successfully - redirect to home
      window.location.href = '/';
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' });
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Back to Organization Management"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold">Manage Profile</h2>
                <p className="text-blue-100 text-sm mt-1">Update your personal information and security settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeSection === 'profile'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeSection === 'security'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Key className="h-4 w-4 inline mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeSection === 'account'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Account
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Information Section */}
          {activeSection === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Current Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-3 text-xs text-gray-500 dark:text-gray-400">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Contact support to change your email address
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Company/Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter your company or organization name"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Account Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Role
                </label>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile?.role === 'superuser'
                      ? 'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-800 dark:text-pink-200'
                      : profile?.role === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {profile?.role || 'user'}
                  </span>
                  {profile?.role === 'superuser' && (
                    <span className="px-2 py-1 bg-yellow-400 text-purple-900 text-xs rounded-full font-bold">
                      SUPER
                    </span>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Security tip:</strong> Use a strong password with at least 6 characters, including uppercase, lowercase, numbers, and symbols.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Password Strength:</span>
                    <span className={`font-medium ${
                      newPassword.length >= 12 ? 'text-green-600 dark:text-green-400' :
                      newPassword.length >= 8 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {newPassword.length >= 12 ? 'Strong' :
                       newPassword.length >= 8 ? 'Medium' :
                       'Weak'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        newPassword.length >= 12 ? 'bg-green-500 w-full' :
                        newPassword.length >= 8 ? 'bg-yellow-500 w-2/3' :
                        'bg-red-500 w-1/3'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Update Password Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Key className="h-4 w-4" />
                  <span>{loading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Account Settings Section */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              {/* Danger Zone */}
              <div className="border-2 border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
                <div className="flex items-start space-x-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>

                {!showDeleteConfirmation ? (
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </button>
                ) : (
                  <div className="mt-4 space-y-4 border-t-2 border-red-300 dark:border-red-800 pt-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-300 dark:border-red-700">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Are you absolutely sure?
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                        This will permanently delete:
                      </p>
                      <ul className="text-sm text-red-800 dark:text-red-200 mb-4 list-disc list-inside space-y-1 ml-2">
                        <li>Your profile and settings</li>
                        <li>All your locations and crops</li>
                        <li>All saved irrigation calculations and reports</li>
                        <li>Email notification preferences</li>
                        <li>All other associated data</li>
                      </ul>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                        Type <span className="font-mono bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">delete my account</span> to confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="delete my account"
                        className="w-full px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isDeleting}
                      />
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete my account'}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmText('');
                            setMessage(null);
                          }}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional account information */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Information</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">Account Created:</span> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-medium">Role:</span> {profile?.role || 'user'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
