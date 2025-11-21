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

interface SuperUserDashboardProps {
  onClose: () => void;
}

export function SuperUserDashboard({ onClose }: SuperUserDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'permissions' | 'stats'>('organizations');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
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
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members(count),
        locations(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orgsWithCounts = data.map((org: any) => ({
      ...org,
      member_count: org.organization_members?.[0]?.count || 0,
      location_count: org.locations?.[0]?.count || 0
    }));

    setOrganizations(orgsWithCounts);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        organizations(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const usersWithOrg = data.map((user: any) => ({
      ...user,
      organization_name: user.organizations?.name || 'No Organization'
    }));

    setUsers(usersWithOrg);
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

  const loadStats = async () => {
    const [orgsData, usersData, locationsData] = await Promise.all([
      supabase.from('organizations').select('id, is_active', { count: 'exact' }),
      supabase.from('user_profiles').select('id', { count: 'exact' }),
      supabase.from('locations').select('id', { count: 'exact' })
    ]);

    setStats({
      totalOrgs: orgsData.count || 0,
      totalUsers: usersData.count || 0,
      totalLocations: locationsData.count || 0,
      activeOrgs: orgsData.data?.filter(org => org.is_active).length || 0
    });
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
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Shield className="h-4 w-4" />
            Permissions
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
          {/* Organizations Tab */}
          {activeTab === 'organizations' && (
            <div className="space-y-4">
              {/* Search */}
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
              </div>

              {/* Organizations List */}
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
                          <span>Created {new Date(org.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            loadOrgMembers(org.id);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View members"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleOrgStatus(org.id, org.is_active)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title={org.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {org.is_active ? (
                            <EyeOff className="h-5 w-5 text-red-600" />
                          ) : (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
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
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg inline-flex"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
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

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Permissions management UI coming soon. Currently managed through RLS policies in the database.
                </p>
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

        {/* Edit User Modal */}
        {selectedUser && (
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
