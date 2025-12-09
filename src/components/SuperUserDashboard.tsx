import React, { useState, useEffect } from 'react';
import { X, Users, Building2, Shield, BarChart3, Settings, Search, Edit2, Trash2, Check, XCircle, Plus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContextSimple';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  member_count?: number;
  location_count?: number;
  crop_count?: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  created_at: string;
  primary_organization_id: string | null;
  organization_name?: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  email?: string;
  full_name?: string;
}

interface OrgLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  organization_id: string;
  created_at: string;
}

interface OrgCrop {
  id: string;
  crop_name: string;
  location_id: string;
  location_name?: string;
  acres?: number;
  organization_id: string;
  created_at: string;
}

interface SuperUserDashboardProps {
  onClose: () => void;
}

export function SuperUserDashboard({ onClose }: SuperUserDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'stats'>('organizations');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [orgLocations, setOrgLocations] = useState<OrgLocation[]>([]);
  const [orgCrops, setOrgCrops] = useState<OrgCrop[]>([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showDeleteOrgConfirm, setShowDeleteOrgConfirm] = useState<string | null>(null);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<string | null>(null);
  
  // Member management state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedOrgForMembers, setSelectedOrgForMembers] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    totalLocations: 0,
    activeOrgs: 0
  });

  useEffect(() => {
    if (profile?.role === 'superuser') {
      loadData();
    }
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'organizations') {
        await loadOrganizations();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'stats') {
        await loadStats();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error loading organizations:', error);
        // If table doesn't exist, just set empty array
        setOrganizations([]);
        return;
      }

      // Get counts separately for each org
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org: any) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Get location count
          const { count: locationCount } = await supabase
            .from('locations')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Get crop count
          const { count: cropCount } = await supabase
            .from('location_crops')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          return {
            ...org,
            member_count: memberCount || 0,
            location_count: locationCount || 0,
            crop_count: cropCount || 0
          };
        })
      );

      setOrganizations(orgsWithCounts);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setOrganizations([]);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading users:', error);
        setUsers([]);
        return;
      }

      // Get org names separately to avoid query errors
      const usersWithOrg = await Promise.all(
        (data || []).map(async (user: any) => {
          let organizationName = 'No Organization';
          
          if (user.primary_organization_id) {
            try {
              const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', user.primary_organization_id)
                .single();
              
              if (orgData) organizationName = orgData.name;
            } catch (err) {
              // Org table might not exist yet
            }
          }
          
          return {
            ...user,
            organization_name: organizationName
          };
        })
      );

      setUsers(usersWithOrg);
    } catch (err) {
      console.error('❌ Failed to load users:', err);
      setUsers([]);
    }
  };

  const loadOrgMembers = async (orgId: string) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user_profiles(email, full_name)
      `)
      .eq('organization_id', orgId);

    if (error) throw error;

    const membersWithDetails = data.map((member: any) => ({
      ...member,
      email: member.user_profiles?.email,
      full_name: member.user_profiles?.full_name
    }));

    setOrgMembers(membersWithDetails);
  };

  const loadOrgLocations = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrgLocations(data || []);
    } catch (err) {
      console.error('Error loading org locations:', err);
      setOrgLocations([]);
    }
  };

  const loadOrgCrops = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('location_crops')
        .select(`
          *,
          locations(name)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const cropsWithLocation = (data || []).map((crop: any) => ({
        ...crop,
        location_name: crop.locations?.name
      }));
      
      setOrgCrops(cropsWithLocation);
    } catch (err) {
      console.error('Error loading org crops:', err);
      setOrgCrops([]);
    }
  };

  const loadStats = async () => {
    try {
      // Try to load stats, but handle if tables don't exist
      let totalOrgs = 0;
      let activeOrgs = 0;
      let totalUsers = 0;
      let totalLocations = 0;

      // Organizations
      try {
        const { count, data } = await supabase
          .from('organizations')
          .select('id, is_active', { count: 'exact' });
        totalOrgs = count || 0;
        activeOrgs = data?.filter((org: any) => org.is_active).length || 0;
      } catch (err) {
        console.warn('Organizations table not available yet');
      }

      // Users
      try {
        const { count } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact' });
        totalUsers = count || 0;
      } catch (err) {
        console.warn('User profiles table issue');
      }

      // Locations
      try {
        const { count } = await supabase
          .from('locations')
          .select('id', { count: 'exact' });
        totalLocations = count || 0;
      } catch (err) {
        console.warn('Locations table issue');
      }

      setStats({
        totalOrgs,
        totalUsers,
        totalLocations,
        activeOrgs
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStats({
        totalOrgs: 0,
        totalUsers: 0,
        totalLocations: 0,
        activeOrgs: 0
      });
    }
  };

  const toggleOrgStatus = async (orgId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: !currentStatus })
      .eq('id', orgId);

    if (error) {
      console.error('Error toggling org status:', error);
      return;
    }

    await loadOrganizations();
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return;
    }

    await loadUsers();
    setSelectedUser(null);
  };

  // Organization CRUD operations
  const createOrganization = async (orgData: Partial<Organization>) => {
    const { error } = await supabase
      .from('organizations')
      .insert([{
        name: orgData.name,
        slug: orgData.slug || orgData.name?.toLowerCase().replace(/\s+/g, '-'),
        description: orgData.description,
        industry: orgData.industry,
        website: orgData.website,
        is_active: orgData.is_active ?? true
      }]);

    if (error) {
      console.error('Error creating organization:', error);
      alert('Error creating organization: ' + error.message);
      return false;
    }

    await loadOrganizations();
    setShowOrgModal(false);
    setEditingOrg(null);
    return true;
  };

  const updateOrganization = async (orgId: string, orgData: Partial<Organization>) => {
    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgData.name,
        slug: orgData.slug,
        description: orgData.description,
        industry: orgData.industry,
        website: orgData.website,
        is_active: orgData.is_active
      })
      .eq('id', orgId);

    if (error) {
      console.error('Error updating organization:', error);
      alert('Error updating organization: ' + error.message);
      return false;
    }

    await loadOrganizations();
    setShowOrgModal(false);
    setEditingOrg(null);
    return true;
  };

  const deleteOrganization = async (orgId: string) => {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) {
      console.error('Error deleting organization:', error);
      alert('Error deleting organization: ' + error.message);
      return false;
    }

    await loadOrganizations();
    setShowDeleteOrgConfirm(null);
    return true;
  };

  // User CRUD operations
  const updateUser = async (userId: string, userData: Partial<User>) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: userData.full_name,
        company: userData.company,
        phone: userData.phone,
        role: userData.role,
        primary_organization_id: userData.primary_organization_id
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
      return false;
    }

    await loadUsers();
    setShowUserModal(false);
    setEditingUser(null);
    return true;
  };

  const deleteUser = async (userId: string) => {
    // Note: This will cascade delete in Supabase due to foreign key constraints
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + error.message);
      return false;
    }

    await loadUsers();
    setShowDeleteUserConfirm(null);
    return true;
  };

  // Organization member operations
  const addMemberToOrg = async (orgId: string, userId: string, role: string = 'member') => {
    const { error } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: orgId,
        user_id: userId,
        role: role,
        is_active: true
      }]);

    if (error) {
      console.error('Error adding member:', error);
      alert('Error adding member: ' + error.message);
      return false;
    }

    await loadOrgMembers(orgId);
    return true;
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role:', error);
      return false;
    }

    if (selectedOrg) {
      await loadOrgMembers(selectedOrg.id);
    }
    return true;
  };

  const removeMemberFromOrg = async (memberId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      return false;
    }

    if (selectedOrg) {
      await loadOrgMembers(selectedOrg.id);
    }
    return true;
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ is_active: !currentStatus })
      .eq('id', memberId);

    if (error) {
      console.error('Error toggling member status:', error);
      return false;
    }

    if (selectedOrg) {
      await loadOrgMembers(selectedOrg.id);
    }
    return true;
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role !== 'superuser') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-bold text-red-600 mb-2">Access Denied</h3>
          <p className="text-gray-700 dark:text-gray-300">
            You must be a superuser to access this dashboard.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                SuperUser Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System-wide management and administration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'organizations'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Organizations
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Users className="h-4 w-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Statistics
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data...</p>
              </div>
            </div>
          )}

          {/* Organizations Tab */}
          {!loading && activeTab === 'organizations' && (
            <div className="space-y-4">
              {/* Search and Create */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingOrg(null);
                    setShowOrgModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Create Organization
                </button>
              </div>

              {/* Organizations List */}
              {filteredOrgs.length === 0 && !loading ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-lg p-8 text-center">
                  <Building2 className="h-16 w-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    No Organizations Yet
                  </h3>
                  <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                    Run the organization system migration in Supabase to enable multi-tenant features.
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Check <code className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 rounded">QUICK_SETUP_ORGS.sql</code> in your project root
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredOrgs.map(org => (
                  <div
                    key={org.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {org.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            org.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {org.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {org.slug} • {org.industry || 'No industry'}
                        </p>
                        {org.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            {org.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>{org.member_count} members</span>
                          <span>•</span>
                          <span>{org.location_count} locations</span>
                          <span>•</span>
                          <span>{org.crop_count || 0} crops</span>
                          <span>•</span>
                          <span>Created {new Date(org.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            setSelectedOrg(org);
                            await Promise.all([
                              loadOrgMembers(org.id),
                              loadOrgLocations(org.id),
                              loadOrgCrops(org.id)
                            ]);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View details"
                        >
                          <Users className="h-5 w-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingOrg(org);
                            setShowOrgModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Edit organization"
                        >
                          <Edit2 className="h-5 w-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => toggleOrgStatus(org.id, org.is_active)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title={org.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {org.is_active ? (
                            <EyeOff className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeleteOrgConfirm(org.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Delete organization"
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {!loading && activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredUsers.length} users total
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.full_name || user.email}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {user.organization_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'superuser'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : user.role === 'org_admin'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg inline-flex"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => setShowDeleteUserConfirm(user.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg inline-flex"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {!loading && activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Organizations</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalOrgs}</p>
                  </div>
                  <Building2 className="h-12 w-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Organizations</p>
                    <p className="text-3xl font-bold mt-2">{stats.activeOrgs}</p>
                  </div>
                  <Check className="h-12 w-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-12 w-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Total Locations</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalLocations}</p>
                  </div>
                  <BarChart3 className="h-12 w-12 opacity-80" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Org Members Modal */}
        {selectedOrg && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{selectedOrg.name} - Members</h3>
                  <button
                    onClick={() => {
                      setSelectedOrg(null);
                      setOrgMembers([]);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {orgMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div>
                        <div className="font-medium">{member.full_name || member.email}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{member.email}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'org_admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organization Create/Edit Modal */}
        {showOrgModal && (
          <OrganizationModal
            org={editingOrg}
            onClose={() => {
              setShowOrgModal(false);
              setEditingOrg(null);
            }}
            onSave={async (orgData) => {
              if (editingOrg) {
                return await updateOrganization(editingOrg.id, orgData);
              } else {
                return await createOrganization(orgData);
              }
            }}
          />
        )}

        {/* Organization Delete Confirm */}
        {showDeleteOrgConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-red-600 mb-4">Delete Organization?</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this organization? This will remove all members and cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteOrgConfirm(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOrganization(showDeleteOrgConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Edit Modal */}
        {showUserModal && editingUser && (
          <UserEditModal
            user={editingUser}
            organizations={organizations}
            onClose={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
            onSave={async (userData) => {
              return await updateUser(editingUser.id, userData);
            }}
            onLoadOrganizations={loadOrganizations}
          />
        )}

        {/* User Delete Confirm */}
        {showDeleteUserConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-red-600 mb-4">Delete User?</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteUserConfirm(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(showDeleteUserConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Organization Members Modal */}
        {selectedOrg && (
          <OrgMembersModal
            org={selectedOrg}
            members={orgMembers}
            locations={orgLocations}
            crops={orgCrops}
            allUsers={users}
            onClose={() => {
              setSelectedOrg(null);
              setOrgMembers([]);
              setOrgLocations([]);
              setOrgCrops([]);
            }}
            onAddMember={addMemberToOrg}
            onUpdateMemberRole={updateMemberRole}
            onRemoveMember={removeMemberFromOrg}
            onToggleMemberStatus={toggleMemberStatus}
          />
        )}

        {/* Legacy Edit User Modal (kept for backward compatibility) */}
        {selectedUser && !showUserModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Edit User Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">User</label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Role</label>
                  <select
                    defaultValue={selectedUser.role}
                    onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="user">User</option>
                    <option value="org_admin">Org Admin</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Organization Modal Component
function OrganizationModal({ 
  org, 
  onClose, 
  onSave 
}: { 
  org: Organization | null; 
  onClose: () => void; 
  onSave: (data: Partial<Organization>) => Promise<boolean>;
}) {
  const [formData, setFormData] = useState({
    name: org?.name || '',
    slug: org?.slug || '',
    description: org?.description || '',
    industry: org?.industry || '',
    website: org?.website || '',
    is_active: org?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(formData);
    if (success) onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {org ? 'Edit Organization' : 'Create Organization'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g. Agriculture, Technology"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active Organization
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {org ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Edit Modal Component
function UserEditModal({
  user,
  organizations,
  onClose,
  onSave,
  onLoadOrganizations
}: {
  user: User;
  organizations: Organization[];
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<boolean>;
  onLoadOrganizations: () => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    company: user.company || '',
    phone: user.phone || '',
    role: user.role,
    primary_organization_id: user.primary_organization_id || ''
  });
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState(user.company || '');

  // Load organizations when modal opens if empty
  useEffect(() => {
    if (organizations.length === 0) {
      onLoadOrganizations();
    }
    // Auto-find matching organization by company name
    if (user.company && !user.primary_organization_id && organizations.length > 0) {
      const matchingOrg = organizations.find(
        org => org.name.toLowerCase() === user.company?.toLowerCase()
      );
      if (matchingOrg) {
        setFormData(prev => ({
          ...prev,
          primary_organization_id: matchingOrg.id
        }));
      }
    }
  }, [organizations]);

  // Update company name when organization changes
  const handleOrgChange = (orgId: string) => {
    if (orgId === 'CREATE_NEW') {
      setShowCreateOrg(true);
      return;
    }
    
    const selectedOrg = organizations.find(org => org.id === orgId);
    setFormData({
      ...formData,
      primary_organization_id: orgId,
      company: selectedOrg?.name || ''
    });
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    
    const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: newOrgName,
        slug: slug,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      alert('Error creating organization: ' + error.message);
      return;
    }

    if (data) {
      await onLoadOrganizations();
      setFormData({
        ...formData,
        primary_organization_id: data.id,
        company: data.name
      });
      setShowCreateOrg(false);
    }
  };

  // Helper to create org from existing company name
  const handleCreateOrgFromCompany = async () => {
    if (!user.company) return;
    setNewOrgName(user.company);
    await handleCreateOrg();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(formData);
    if (success) onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email (Read-only)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Organization / Company</label>
            {user.company && !formData.primary_organization_id && (
              <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  User's company: <strong>{user.company}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewOrgName(user.company || '');
                    setShowCreateOrg(true);
                  }}
                  className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Create "{user.company}" Organization
                </button>
              </div>
            )}
            {!showCreateOrg ? (
              <>
                <select
                  value={formData.primary_organization_id}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">No Organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                  <option value="CREATE_NEW">+ Create New Organization</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {organizations.length === 0 ? (
                    <>No organizations found. <button type="button" onClick={() => setShowCreateOrg(true)} className="text-blue-500 hover:underline">Create one</button> or select "Create New Organization"</>
                  ) : (
                    <>The selected organization name will be saved as the user's company ({organizations.length} available)</>
                  )}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Enter organization name"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleCreateOrg}
                    disabled={!newOrgName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Creating organization: <strong>{newOrgName || '(enter name above)'}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="org_admin">Org Admin</option>
                <option value="superuser">Superuser</option>
              </select>
            </div>
            <div className="flex items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formData.role === 'superuser' && '👑 Full system access'}
                {formData.role === 'org_admin' && '🏢 Can manage organization'}
                {formData.role === 'admin' && '⚙️ Administrative privileges'}
                {formData.role === 'user' && '👤 Standard user'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Organization Members Modal Component
function OrgMembersModal({
  org,
  members,
  locations,
  crops,
  allUsers,
  onClose,
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
  onToggleMemberStatus
}: {
  org: Organization;
  members: OrganizationMember[];
  locations: OrgLocation[];
  crops: OrgCrop[];
  allUsers: User[];
  onClose: () => void;
  onAddMember: (orgId: string, userId: string, role: string) => Promise<boolean>;
  onUpdateMemberRole: (memberId: string, role: string) => Promise<boolean>;
  onRemoveMember: (memberId: string) => Promise<boolean>;
  onToggleMemberStatus: (memberId: string, currentStatus: boolean) => Promise<boolean>;
}) {
  const [activeTab, setActiveTab] = useState<'members' | 'locations' | 'crops'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');

  const availableUsers = allUsers.filter(
    user => !members.some(member => member.user_id === user.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    const success = await onAddMember(org.id, selectedUserId, selectedRole);
    if (success) {
      setShowAddMember(false);
      setSelectedUserId('');
      setSelectedRole('member');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">{org.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''} • {locations.length} location{locations.length !== 1 ? 's' : ''} • {crops.length} crop{crops.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'locations'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Locations ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab('crops')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'crops'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Crops ({crops.length})
          </button>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            {/* Add Member Section */}
            {!showAddMember ? (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full mb-4 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Member
              </button>
            ) : (
              <div className="mb-4 p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-medium mb-3">Add New Member</h4>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="col-span-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Select user...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="org_admin">Org Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setSelectedUserId('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.full_name || member.email}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) => onUpdateMemberRole(member.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="org_admin">Org Admin</option>
                    </select>
                    <button
                      onClick={() => onToggleMemberStatus(member.id, member.is_active)}
                      className={`px-3 py-1 text-xs rounded font-medium ${
                        member.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                      title={member.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Remove this member from the organization?')) {
                          onRemoveMember(member.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No members yet. Add your first member above.
              </div>
            )}
          </>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-2">
            {locations.map(location => (
              <div
                key={location.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    📍 Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Created {new Date(location.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No locations found for this organization.
              </div>
            )}
          </div>
        )}

        {/* Crops Tab */}
        {activeTab === 'crops' && (
          <div className="space-y-2">
            {crops.map(crop => (
              <div
                key={crop.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {crop.crop_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    📍 Location: {crop.location_name}
                  </div>
                  {crop.acres && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      🌾 {crop.acres} acres
                    </div>
                  )}
                </div>
              </div>
            ))}
            {crops.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No crops found for this organization.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
