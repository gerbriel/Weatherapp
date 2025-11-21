import React, { useState, useEffect } from 'react';
import { X, Users, Search, Edit, Trash2, Shield, Building2, Calendar, Mail, UserPlus, Key, MapPin, Sprout, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextSimple';
import { supabase } from '../lib/supabase';
import { AdminCropSelector } from './AdminCropSelector';

interface UserManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // Optional back button handler
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  role: 'user' | 'admin' | 'superuser';
  created_at: string;
  updated_at: string;
}

interface InviteUserForm {
  email: string;
  fullName: string;
  role: 'user' | 'admin';
}

interface OrgSettings {
  name: string;
  description: string;
}

interface Location {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  description?: string;
  weatherstation_id?: string;
  weatherstation?: string;
  latitude: number;
  longitude: number;
  is_favorite: boolean;
  created_at: string;
}

interface LocationCrop {
  id: string;
  location_id: string;
  crop_id: string;
  crop_name: string;
  crop_variety?: string;
  planting_date: string;
  harvest_date?: string;
  area_acres?: number;
  irrigation_method?: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
  soil_type?: string;
  notes?: string;
  status: 'active' | 'harvested' | 'planned';
  created_at: string;
  updated_at: string;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ isOpen, onClose, onBack }) => {
  const { profile, locations, updateLocation, deleteLocation, addLocation } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'organization' | 'locations'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [selectedLocationForCrop, setSelectedLocationForCrop] = useState<string | null>(null);

  // Editing form state
  const [editFullName, setEditFullName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'superuser'>('user');

  // Invite user form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');

  // Organization settings state
  const [orgName, setOrgName] = useState(profile?.company || '');
  const [orgDescription, setOrgDescription] = useState('');

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Add location state
  const [newLocationStationId, setNewLocationStationId] = useState('');
  const [newLocationStationName, setNewLocationStationName] = useState('');

  // Crop management state
  const [crops, setCrops] = useState<LocationCrop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [showEditCropModal, setShowEditCropModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<LocationCrop | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  
  // Add/Edit Crop form state
  const [cropFormData, setCropFormData] = useState({
    crop_name: '',
    crop_variety: '',
    planting_date: new Date().toISOString().split('T')[0],
    harvest_date: '',
    area_acres: '',
    irrigation_method: 'drip' as 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface',
    soil_type: '',
    notes: '',
    status: 'active' as 'active' | 'harvested' | 'planned'
  });

  // Load all users in the organization
  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Get ALL users from the same organization (same company)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('company', profile?.company || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && profile?.company) {
      loadUsers();
      loadCrops();
    }
  }, [isOpen, profile?.company]);

  // Reload crops when locations change (e.g., when crops are added elsewhere)
  useEffect(() => {
    if (isOpen && locations.length > 0) {
      loadCrops();
    }
  }, [locations, isOpen]);

  // Set up real-time subscription for crop changes
  useEffect(() => {
    if (!isOpen || locations.length === 0) return;

    // Subscribe to changes in location_crops table
    // Note: Supabase real-time doesn't support filtering by multiple IDs in postgres_changes
    // We'll listen to all changes and filter on the client side
    const subscription = supabase
      .channel('location_crops_changes_admin')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'location_crops'
        },
        (payload) => {
          console.log('Crop change detected in admin panel:', payload);
          // Reload crops when any change is detected
          loadCrops();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, locations]);

  // Load all crops for the organization's locations
  const loadCrops = async () => {
    if (locations.length === 0) {
      setCrops([]);
      return;
    }

    setLoadingCrops(true);
    try {
      //  Try loading from localStorage first (main dashboard uses this)
      const localStorageCrops: LocationCrop[] = [];
      try {
        // Check for crop instances in localStorage (main dashboard format)
        const savedInstancesStr = localStorage.getItem('cropInstances');
        if (savedInstancesStr) {
          const savedInstances = JSON.parse(savedInstancesStr);
          
          // Convert main dashboard format to our format
          if (Array.isArray(savedInstances)) {
            savedInstances.forEach((instance: any) => {
              if (instance.locationId && locations.some(loc => loc.id === instance.locationId)) {
                // Get crop name from available crops or use cropId
                const cropName = instance.cropName || instance.cropId || 'Unknown Crop';
                
                const crop: LocationCrop = {
                  id: instance.id || `local_${Date.now()}_${Math.random()}`,
                  location_id: instance.locationId,
                  crop_id: instance.cropId || instance.id,
                  crop_name: cropName,
                  crop_variety: instance.variety || undefined,
                  planting_date: instance.plantingDate || new Date().toISOString().split('T')[0],
                  harvest_date: instance.harvestDate || undefined,
                  area_acres: instance.areaAcres || undefined,
                  irrigation_method: instance.irrigationMethod || 'drip',
                  soil_type: instance.soilType || undefined,
                  notes: instance.notes || undefined,
                  status: instance.status || 'active',
                  created_at: instance.created_at || new Date().toISOString(),
                  updated_at: instance.updated_at || new Date().toISOString()
                };
                localStorageCrops.push(crop);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error loading from localStorage:', err);
      }

      // Also try database (for future multi-device sync)
      let dbCrops: LocationCrop[] = [];
      try {
        const { data, error } = await supabase
          .from('location_crops')
          .select('*')
          .in('location_id', locations.map(loc => loc.id))
          .order('created_at', { ascending: false });

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          console.warn('Database fetch error (non-fatal):', error.message);
        } else if (data) {
          dbCrops = data;
        }
      } catch (dbError: any) {
        console.warn('Database not available, using localStorage only');
      }

      // Use localStorage as source of truth, fallback to database
      const finalCrops = localStorageCrops.length > 0 ? localStorageCrops : dbCrops;
      
      setCrops(finalCrops);
    } catch (error: any) {
      console.error('Error loading crops:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load crops' });
    } finally {
      setLoadingCrops(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    // Exclude superusers from admin panel
    if (user.role === 'superuser') return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  // Start editing a user
  const handleStartEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditCompany(user.company || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setShowEditModal(true);
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editFullName.trim() || null,
          company: editCompany.trim() || null,
          phone: editPhone.trim() || null,
          role: editRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'User updated successfully!' });
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update user' });
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove "${email}" from your organization? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Remove user from organization by clearing their company
      const { error } = await supabase
        .from('user_profiles')
        .update({
          company: null,
          role: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'User removed from organization successfully!' });
      await loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove user' });
    } finally {
      setLoading(false);
    }
  };

  // Invite new user
  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteFullName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // In a real app, you would send an invitation email
      // For now, we'll create a placeholder profile that the user can claim
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: Math.random().toString(36).slice(-12), // Temporary password
        options: {
          data: {
            full_name: inviteFullName,
            company: profile?.company,
            role: inviteRole,
          }
        }
      });

      if (error) throw error;

      // Also create/update the profile
      if (data.user) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email: inviteEmail,
          full_name: inviteFullName,
          company: profile?.company,
          role: inviteRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}!` });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('user');
      await loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to invite user' });
    } finally {
      setLoading(false);
    }
  };

  // Reset user password
  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Note: In Supabase, admins can't directly reset user passwords
      // This would typically require the admin API or a server-side function
      // For now, we'll show a message about sending a reset email
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `Password reset email sent to ${resetPasswordUser.email}` });
      setShowResetPasswordModal(false);
      setResetPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  // Update organization settings
  const handleUpdateOrganization = async () => {
    if (!orgName.trim()) {
      setMessage({ type: 'error', text: 'Organization name is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Update all users in the organization with the new company name
      const { error } = await supabase
        .from('user_profiles')
        .update({
          company: orgName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('company', profile?.company || '');

      if (error) throw error;

      setMessage({ type: 'success', text: 'Organization settings updated successfully!' });
      // Refresh the page to update the org name everywhere
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update organization' });
    } finally {
      setLoading(false);
    }
  };

  // Add new location
  const handleAddLocation = async () => {
    if (!newLocationStationId || !newLocationStationName) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await addLocation({
        name: newLocationStationName,
        description: `CIMIS Station ${newLocationStationId}`,
        weatherstation_id: newLocationStationId,
        weatherstation: newLocationStationName,
        latitude: 0,
        longitude: 0,
        city: '',
        state: 'CA',
        country: 'US',
        timezone: 'America/Los_Angeles',
        is_default: false,
        is_active: true,
        is_favorite: false,
        sort_order: locations.length,
        metadata: {}
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Location added successfully!' });
      setShowAddLocationModal(false);
      setNewLocationStationId('');
      setNewLocationStationName('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add location' });
    } finally {
      setLoading(false);
    }
  };

  // Delete location
  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${locationName}"? This will also remove all associated crops.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await deleteLocation(locationId);
      setMessage({ type: 'success', text: 'Location deleted successfully!' });
      // Reload crops to reflect deletion
      loadCrops();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete location' });
    } finally {
      setLoading(false);
    }
  };

  // Open Add Crop modal
  const handleOpenAddCrop = () => {
    setShowAddCropModal(true);
  };

  // Add new crop
  const handleAddCrop = async (cropData?: any) => {
    // Use provided cropData or fall back to cropFormData for backward compatibility
    const data = cropData || cropFormData;
    
    if (!selectedLocationForCrop || !data.crop_name) {
      setMessage({ type: 'error', text: 'Please fill in required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: insertedData, error } = await supabase
        .from('location_crops')
        .insert({
          location_id: selectedLocationForCrop,
          crop_id: `crop_${Date.now()}`,
          crop_name: data.crop_name,
          crop_variety: data.crop_variety || null,
          planting_date: data.planting_date,
          harvest_date: data.harvest_date || null,
          area_acres: data.area_acres ? parseFloat(data.area_acres) : null,
          irrigation_method: data.irrigation_method,
          soil_type: data.soil_type || null,
          notes: data.notes || null,
          status: data.status
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Crop added successfully!' });
      setShowAddCropModal(false);
      setSelectedLocationForCrop(null);
      await loadCrops(); // Auto-refresh
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add crop' });
    } finally {
      setLoading(false);
    }
  };

  // Add multiple crops to multiple locations
  const handleAddCropsToLocations = async (crops: any[], locationIds: string[]) => {
    if (crops.length === 0 || locationIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select crops and locations' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const cropsToInsert = [];
      const plantingDate = new Date().toISOString().split('T')[0];

      for (const locationId of locationIds) {
        for (const crop of crops) {
          cropsToInsert.push({
            location_id: locationId,
            crop_id: `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            crop_name: crop.name,
            crop_variety: null,
            planting_date: plantingDate,
            harvest_date: null,
            area_acres: null,
            irrigation_method: 'drip',
            soil_type: null,
            notes: `${crop.category} - ${crop.stages.length} growth stages`,
            status: 'active'
          });
        }
      }

      const { error } = await supabase
        .from('location_crops')
        .insert(cropsToInsert);

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: `Successfully added ${crops.length} crop(s) to ${locationIds.length} location(s)!` 
      });
      
      await loadCrops(); // Auto-refresh
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add crops' });
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Crop modal
  const handleOpenEditCrop = (crop: LocationCrop) => {
    setEditingCrop(crop);
    setCropFormData({
      crop_name: crop.crop_name,
      crop_variety: crop.crop_variety || '',
      planting_date: crop.planting_date,
      harvest_date: crop.harvest_date || '',
      area_acres: crop.area_acres?.toString() || '',
      irrigation_method: crop.irrigation_method || 'drip',
      soil_type: crop.soil_type || '',
      notes: crop.notes || '',
      status: crop.status
    });
    setShowEditCropModal(true);
  };

  // Save crop edits
  const handleEditCrop = async () => {
    if (!editingCrop || !cropFormData.crop_name) {
      setMessage({ type: 'error', text: 'Please fill in required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('location_crops')
        .update({
          crop_name: cropFormData.crop_name,
          crop_variety: cropFormData.crop_variety || null,
          planting_date: cropFormData.planting_date,
          harvest_date: cropFormData.harvest_date || null,
          area_acres: cropFormData.area_acres ? parseFloat(cropFormData.area_acres) : null,
          irrigation_method: cropFormData.irrigation_method,
          soil_type: cropFormData.soil_type || null,
          notes: cropFormData.notes || null,
          status: cropFormData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCrop.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Crop updated successfully!' });
      setShowEditCropModal(false);
      setEditingCrop(null);
      loadCrops();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update crop' });
    } finally {
      setLoading(false);
    }
  };

  // Delete crop
  const handleDeleteCrop = async (crop: LocationCrop) => {
    if (!window.confirm(`Are you sure you want to delete ${crop.crop_name}${crop.crop_variety ? ` (${crop.crop_variety})` : ''}?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('location_crops')
        .delete()
        .eq('id', crop.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Crop deleted successfully!' });
      loadCrops();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete crop' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle location expansion
  const toggleLocationExpansion = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  // Get crops for a specific location
  const getCropsForLocation = (locationId: string) => {
    return crops.filter(crop => crop.location_id === locationId);
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-800 dark:text-pink-200';
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
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
                  <div className="flex items-center space-x-2">
                    <Shield className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">Admin Panel</h2>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {profile?.company || 'Organization'}
                    </span>
                  </div>
                  <p className="text-purple-100 text-sm mt-1">
                    Manage users, roles, and organization settings
                  </p>
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
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'organization'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Organization Settings
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'locations'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
              Locations & Crops
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                  message.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}
              >
                <span>{message.text}</span>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {users.filter(u => u.role !== 'superuser').length}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Total Users</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {users.filter(u => u.role === 'admin').length}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-200">Admins</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {users.filter(u => u.role === 'user').length}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">Regular Users</div>
                  </div>
                </div>

                {/* Search and Actions */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users by name, email, or role..."
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Invite User</span>
                  </button>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'No users found matching your search' : 'No users in your organization'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium shadow-md">
                                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.full_name || 'No name set'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {user.phone || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                  <Shield className="h-3 w-3 mr-1" />
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(user.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleStartEdit(user)}
                                    className="p-2 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                    title="Edit user"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  {user.id !== profile?.id && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setResetPasswordUser(user);
                                          setShowResetPasswordModal(true);
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Reset password"
                                      >
                                        <Key className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                        className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remove from organization"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Organization Settings Tab */}
            {activeTab === 'organization' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Organization Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Enter organization name"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={orgDescription}
                        onChange={(e) => setOrgDescription(e.target.value)}
                        placeholder="Brief description of your organization"
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleUpdateOrganization}
                        disabled={loading || !orgName.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Saving...' : 'Save Organization Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Organization Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.role !== 'superuser').length}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Locations</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{locations.length}</p>
                      </div>
                      <MapPin className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Your Role</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{profile?.role || 'user'}</p>
                      </div>
                      <Shield className="h-8 w-8 text-pink-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Locations & Crops Tab */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                {/* Header with Add Location Button */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Organization Locations</h3>
                    {loadingCrops && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Auto-syncing...</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddLocationModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Location</span>
                  </button>
                </div>

                {/* Locations List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">Loading locations...</p>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No locations added yet</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Click "Add Location" to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
                            </div>
                            {location.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{location.description}</p>
                            )}
                            {location.weatherstation_id && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Station ID: {location.weatherstation_id}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteLocation(location.id, location.name)}
                            className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete location"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Crops:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {getCropsForLocation(location.id).length}
                            </span>
                          </div>

                          {/* Crop List */}
                          {getCropsForLocation(location.id).length > 0 && (
                            <div className="mb-2 space-y-1">
                              {getCropsForLocation(location.id).slice(0, expandedLocations.has(location.id) ? undefined : 2).map((crop) => (
                                <div
                                  key={crop.id}
                                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <Sprout className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                      <span className="font-medium text-gray-900 dark:text-white truncate">
                                        {crop.crop_name}
                                      </span>
                                      {crop.crop_variety && (
                                        <span className="text-gray-600 dark:text-gray-400 truncate">
                                          ({crop.crop_variety})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 ml-5">
                                      Planted: {new Date(crop.planting_date).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2">
                                    <button
                                      onClick={() => handleOpenEditCrop(crop)}
                                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                      title="Edit crop"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCrop(crop)}
                                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                      title="Delete crop"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {getCropsForLocation(location.id).length > 2 && (
                                <button
                                  onClick={() => toggleLocationExpansion(location.id)}
                                  className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {expandedLocations.has(location.id)
                                    ? 'Show less'
                                    : `Show ${getCropsForLocation(location.id).length - 2} more...`}
                                </button>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleOpenAddCrop()}
                            className="w-full px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                          >
                            <Sprout className="h-3 w-3" />
                            <span>Add Crops</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit User
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email (Read-only)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'user' | 'admin' | 'superuser')}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                  >
                    <option value="user">User - Basic Access</option>
                    <option value="admin">Admin - Manage Organization</option>
                    <option value="superuser">Superuser - Full System Access</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Invite New User
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="user">User - Basic Access</option>
                  <option value="admin">Admin - Manage Organization</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  The user will receive an invitation email with instructions to set their password and access the organization.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteFullName('');
                    setInviteRole('user');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={loading || !inviteEmail || !inviteFullName}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Reset Password for {resetPasswordUser.full_name || resetPasswordUser.email}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  A password reset email will be sent to {resetPasswordUser.email}. They will be able to set a new password using the link in the email.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setResetPasswordUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Add New Location
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Station ID *
                </label>
                <input
                  type="text"
                  value={newLocationStationId}
                  onChange={(e) => setNewLocationStationId(e.target.value)}
                  placeholder="e.g., 2, 6, 80"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Station Name *
                </label>
                <input
                  type="text"
                  value={newLocationStationName}
                  onChange={(e) => setNewLocationStationName(e.target.value)}
                  placeholder="e.g., Five Points, Pomology"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This location will be added to your organization and will appear on the main dashboard.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddLocationModal(false);
                    setNewLocationStationId('');
                    setNewLocationStationName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLocation}
                  disabled={loading || !newLocationStationId || !newLocationStationName}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Adding...' : 'Add Location'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Crop Modal - New Beautiful Design */}
      <AdminCropSelector
        isOpen={showAddCropModal}
        onClose={() => {
          setShowAddCropModal(false);
          setSelectedLocationForCrop(null);
        }}
        availableLocations={locations.map(loc => ({ id: loc.id, name: loc.name }))}
        onAddCrops={handleAddCropsToLocations}
      />

      {/* Edit Crop Modal */}
      {showEditCropModal && editingCrop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit Crop
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    value={cropFormData.crop_name}
                    onChange={(e) => setCropFormData({ ...cropFormData, crop_name: e.target.value })}
                    placeholder="e.g., Tomatoes, Almonds, Lettuce"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={cropFormData.crop_variety}
                    onChange={(e) => setCropFormData({ ...cropFormData, crop_variety: e.target.value })}
                    placeholder="e.g., Roma, Beefsteak"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area (acres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cropFormData.area_acres}
                    onChange={(e) => setCropFormData({ ...cropFormData, area_acres: e.target.value })}
                    placeholder="e.g., 5.5"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planting Date *
                  </label>
                  <input
                    type="date"
                    value={cropFormData.planting_date}
                    onChange={(e) => setCropFormData({ ...cropFormData, planting_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harvest Date
                  </label>
                  <input
                    type="date"
                    value={cropFormData.harvest_date}
                    onChange={(e) => setCropFormData({ ...cropFormData, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Irrigation Method
                  </label>
                  <select
                    value={cropFormData.irrigation_method}
                    onChange={(e) => setCropFormData({ ...cropFormData, irrigation_method: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="drip">Drip</option>
                    <option value="sprinkler">Sprinkler</option>
                    <option value="flood">Flood</option>
                    <option value="micro-spray">Micro-spray</option>
                    <option value="surface">Surface</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soil Type
                  </label>
                  <input
                    type="text"
                    value={cropFormData.soil_type}
                    onChange={(e) => setCropFormData({ ...cropFormData, soil_type: e.target.value })}
                    placeholder="e.g., Loam, Clay, Sandy"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={cropFormData.status}
                    onChange={(e) => setCropFormData({ ...cropFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="harvested">Harvested</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={cropFormData.notes}
                    onChange={(e) => setCropFormData({ ...cropFormData, notes: e.target.value })}
                    placeholder="Add any notes about this crop..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditCropModal(false);
                    setEditingCrop(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCrop}
                  disabled={loading || !cropFormData.crop_name}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
