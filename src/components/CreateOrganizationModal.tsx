import React, { useState } from 'react';
import { Building2, X, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateOrganizationModalProps {
  onClose: () => void;
  onSuccess: (orgId: string) => void;
}

export function CreateOrganizationModal({ onClose, onSuccess }: CreateOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    industry: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call the database function to create org and make user admin
      const { data, error: rpcError } = await supabase.rpc('create_organization_with_admin', {
        org_name: formData.name,
        org_slug: formData.slug,
        org_description: formData.description || null
      });

      if (rpcError) throw rpcError;

      // Update organization details if needed
      if (formData.industry || formData.website) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            industry: formData.industry || null,
            website: formData.website || null
          })
          .eq('id', data);

        if (updateError) throw updateError;
      }

      onSuccess(data);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Organization
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You'll be the admin of this organization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  Failed to create organization
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Acme Farms, Green Valley Agriculture"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Organization Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Slug *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">yourapp.com/</span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="acme-farms"
                pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What does your organization do?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Industry
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an industry...</option>
              <option value="agriculture">Agriculture</option>
              <option value="vineyard">Vineyard</option>
              <option value="orchard">Orchard</option>
              <option value="landscaping">Landscaping</option>
              <option value="golf_course">Golf Course</option>
              <option value="research">Research</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                <strong>What happens next:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>You'll become the admin of this organization</li>
                  <li>You can invite other users to join</li>
                  <li>All your locations and data will be associated with this org</li>
                  <li>You can manage members and their permissions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.slug}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4" />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
