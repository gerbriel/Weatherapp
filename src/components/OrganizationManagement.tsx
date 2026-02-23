import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Building, Users, Mail, Plus, Trash2, Crown, Shield, User as UserIcon } from 'lucide-react';

interface OrganizationUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

export const OrganizationManagement: React.FC = () => {
  const { profile, organization, user } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'org_admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchInvitations();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  };

  const fetchInvitations = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error('Error in fetchInvitations:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!organization?.id || !newInvitation.email) return;

    setInviting(true);
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organization.id,
          email: newInvitation.email.toLowerCase(),
          role: newInvitation.role,
          invited_by: user?.id
        });

      if (error) {
        console.error('Error sending invitation:', error);
        alert('Error sending invitation: ' + error.message);
        return;
      }

      setNewInvitation({ email: '', role: 'user' });
      await fetchInvitations();
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error in handleInviteUser:', error);
      alert('An unexpected error occurred');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!confirm('Are you sure you want to update this user\'s role?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        alert('Error updating user role: ' + error.message);
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error in handleUpdateUserRole:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating user:', error);
        alert('Error deactivating user: ' + error.message);
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error in handleDeactivateUser:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error deleting invitation:', error);
        alert('Error deleting invitation: ' + error.message);
        return;
      }

      await fetchInvitations();
    } catch (error) {
      console.error('Error in handleDeleteInvitation:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'org_admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'manager':
        return <UserIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'org_admin':
        return 'Organization Admin';
      case 'manager':
        return 'Manager';
      case 'user':
        return 'User';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            You need administrator privileges to access organization management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Organization Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Building className="w-6 h-6 mr-2 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Organization Management</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{organization?.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Plan:</span>
              <span className="ml-2 font-medium capitalize">{organization?.subscription_plan}</span>
            </div>
            <div>
              <span className="text-gray-600">Max Users:</span>
              <span className="ml-2 font-medium">{organization?.max_users}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Users:</span>
              <span className="ml-2 font-medium">{users.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${organization?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {organization?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Users */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Mail className="w-6 h-6 mr-2 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900">Invite Users</h3>
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={newInvitation.email}
              onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@example.com"
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={newInvitation.role}
              onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="org_admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleInviteUser}
              disabled={inviting || !newInvitation.email}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {inviting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Invite
            </button>
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Invitations</h3>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{invitation.email}</span>
                  <span className="ml-2 text-sm text-gray-600">({getRoleDisplayName(invitation.role)})</span>
                  <div className="text-xs text-gray-500">
                    Sent: {new Date(invitation.created_at).toLocaleDateString()}
                    • Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteInvitation(invitation.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Delete invitation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organization Users */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Users className="w-6 h-6 mr-2 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Organization Users</h3>
        </div>

        <div className="space-y-3">
          {users.map((orgUser) => (
            <div key={orgUser.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              orgUser.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-75'
            }`}>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {orgUser.first_name?.[0] || orgUser.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {orgUser.display_name || `${orgUser.first_name || ''} ${orgUser.last_name || ''}`.trim() || orgUser.email}
                    </span>
                    {getRoleIcon(orgUser.role)}
                    <span className="text-sm text-gray-600">({getRoleDisplayName(orgUser.role)})</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {orgUser.email}
                    {orgUser.last_login_at && (
                      <span className="ml-2">
                        • Last login: {new Date(orgUser.last_login_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {orgUser.id !== user?.id && (
                <div className="flex items-center space-x-2">
                  <select
                    value={orgUser.role}
                    onChange={(e) => handleUpdateUserRole(orgUser.id, e.target.value)}
                    disabled={loading}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="org_admin">Admin</option>
                  </select>
                  {orgUser.is_active && (
                    <button
                      onClick={() => handleDeactivateUser(orgUser.id)}
                      disabled={loading}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      title="Deactivate user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};