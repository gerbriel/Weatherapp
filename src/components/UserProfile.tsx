import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Briefcase, Building, Save, MapPin, Plus, Trash2, Star } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { 
    profile, 
    organization, 
    locations, 
    updateProfile, 
    addLocation, 
    deleteLocation, 
    setDefaultLocation 
  } = useAuth();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    job_title: profile?.job_title || '',
    department: profile?.department || ''
  });

  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    address: '',
    city: '',
    state: '',
    country: 'US'
  });
  const [addingLocation, setAddingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await updateProfile(profileData);
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.latitude || !newLocation.longitude) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addLocation({
        ...newLocation,
        is_default: locations.length === 0, // First location becomes default
        is_active: true,
        metadata: {}
      });
      setNewLocation({
        name: '',
        description: '',
        latitude: 0,
        longitude: 0,
        address: '',
        city: '',
        state: '',
        country: 'US'
      });
      setAddingLocation(false);
    } catch (error) {
      console.error('Error adding location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      await deleteLocation(id);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultLocation(id);
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <User className="w-6 h-6 mr-2" />
            Profile Information
          </h2>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingProfile ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={profileData.job_title}
                  onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleProfileUpdate}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-900">{profile.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-900">{profile.job_title || 'Not provided'}</span>
            </div>
            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-900">{organization?.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Locations */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapPin className="w-6 h-6 mr-2" />
            My Locations
          </h2>
          <button
            onClick={() => setAddingLocation(!addingLocation)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </button>
        </div>

        {addingLocation && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Location</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Home Farm, North Field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newLocation.description}
                    onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={newLocation.latitude}
                    onChange={(e) => setNewLocation({ ...newLocation, latitude: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={newLocation.longitude}
                    onChange={(e) => setNewLocation({ ...newLocation, longitude: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={newLocation.state}
                    onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={newLocation.country}
                    onChange={(e) => setNewLocation({ ...newLocation, country: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddLocation}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Location
                </button>
                <button
                  onClick={() => setAddingLocation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`border rounded-lg p-4 ${location.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                    {location.is_default && (
                      <Star className="w-5 h-5 text-yellow-500 ml-2" fill="currentColor" />
                    )}
                  </div>
                  {location.description && (
                    <p className="text-gray-600 mt-1">{location.description}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Coordinates: {location.latitude}, {location.longitude}</p>
                    {location.address && <p>Address: {location.address}</p>}
                    {location.city && location.state && (
                      <p>Location: {location.city}, {location.state}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!location.is_default && (
                    <button
                      onClick={() => handleSetDefault(location.id)}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {locations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No locations added yet. Add your first location to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};