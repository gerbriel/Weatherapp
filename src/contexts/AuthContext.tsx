import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types for our authentication system
export interface OrganizationCrop {
  name: string;
  acres: number;
  value: number;
  color: string;
}

interface FieldBlock {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  location_name: string;
  assigned_users: string[];
  crop_id: string;
  crop_name: string;
  acres: number;
  irrigation_method: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
  soil_type: string;
  date_planted: string;
  growth_stage: string;
  system_efficiency: number;
  water_allocation: number; // acre-feet per season
  status: 'active' | 'dormant' | 'harvested' | 'preparation';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Predefined color palette for crops
const CROP_COLORS: { [key: string]: string } = {
  'Lettuce': '#10B981',
  'Broccoli': '#8B5CF6', 
  'Almonds': '#EF4444',
  'Grapes': '#3B82F6',
  'Strawberries': '#F59E0B',
  'Corn': '#F59E0B',
  'Soybeans': '#10B981',
  'Wheat': '#8B5CF6',
  'Cotton': '#EF4444',
  'Tomatoes': '#3B82F6',
  'Carrots': '#EF4444',
  'Spinach': '#10B981'
};

// Helper function to calculate crop distribution from field blocks
const calculateCropDistribution = (fieldBlocks: FieldBlock[]): OrganizationCrop[] => {
  const cropMap = new Map<string, number>();
  
  // Sum acres by crop name
  fieldBlocks.forEach(block => {
    const existing = cropMap.get(block.crop_name) || 0;
    cropMap.set(block.crop_name, existing + block.acres);
  });
  
  // Calculate total acres
  const totalAcres = Array.from(cropMap.values()).reduce((sum, acres) => sum + acres, 0);
  
  // Convert to crop distribution with percentages
  return Array.from(cropMap.entries()).map(([cropName, acres]) => ({
    name: cropName,
    acres,
    value: Math.round((acres / totalAcres) * 100),
    color: CROP_COLORS[cropName] || '#6B7280' // Default gray if crop not in color map
  })).sort((a, b) => b.acres - a.acres); // Sort by acres descending
};

// Get field blocks for organization (simplified version - should match TrialDashboard data)
const getOrganizationFieldBlocks = (organizationId: string): FieldBlock[] => {
  switch (organizationId) {
    case 'demo-farm-coop':
      return [
        {
          id: 'block-1', organization_id: 'demo-farm-coop', name: 'Salinas North',
          description: 'Primary lettuce production', location_name: 'Salinas Valley',
          assigned_users: ['user-1', 'user-2'], crop_id: 'lettuce', crop_name: 'Lettuce',
          acres: 750, irrigation_method: 'drip', soil_type: 'Sandy Loam',
          date_planted: '2024-10-15', growth_stage: 'Vegetative', system_efficiency: 92,
          water_allocation: 425, status: 'active', notes: 'High-value organic lettuce rotation',
          created_at: '2024-10-15T08:00:00Z', updated_at: '2024-10-20T10:30:00Z'
        },
        {
          id: 'block-2', organization_id: 'demo-farm-coop', name: 'Fresno Central',
          description: 'Broccoli production area', location_name: 'Fresno County',
          assigned_users: ['user-3', 'user-4'], crop_id: 'broccoli', crop_name: 'Broccoli',
          acres: 625, irrigation_method: 'sprinkler', soil_type: 'Clay Loam',
          date_planted: '2024-09-10', growth_stage: 'Heading', system_efficiency: 85,
          water_allocation: 280, status: 'active', notes: 'Premium broccoli for export',
          created_at: '2024-09-10T07:00:00Z', updated_at: '2024-10-18T15:45:00Z'
        },
        {
          id: 'block-3', organization_id: 'demo-farm-coop', name: 'San Joaquin South',
          description: 'Mixed crop rotation', location_name: 'San Joaquin',
          assigned_users: ['user-5'], crop_id: 'almonds', crop_name: 'Almonds',
          acres: 500, irrigation_method: 'micro-spray', soil_type: 'Sandy Clay',
          date_planted: '2024-03-01', growth_stage: 'Nut Fill', system_efficiency: 83,
          water_allocation: 45.5, status: 'active', notes: 'Mature almond orchard',
          created_at: '2024-03-01T08:00:00Z', updated_at: '2024-10-15T12:00:00Z'
        },
        {
          id: 'block-4', organization_id: 'demo-farm-coop', name: 'Napa Valley East',
          description: 'Premium grape vineyard', location_name: 'Napa Valley',
          assigned_users: ['user-3', 'user-4'], crop_id: 'grapes', crop_name: 'Grapes',
          acres: 375, irrigation_method: 'drip', soil_type: 'Volcanic Clay',
          date_planted: '2024-04-15', growth_stage: 'Harvest', system_efficiency: 95,
          water_allocation: 225, status: 'active', notes: 'Cabernet Sauvignon for premium wine',
          created_at: '2024-04-15T08:00:00Z', updated_at: '2024-10-22T09:15:00Z'
        },
        {
          id: 'block-5', organization_id: 'demo-farm-coop', name: 'Monterey Coastal',
          description: 'Strawberry greenhouse complex', location_name: 'Monterey Bay',
          assigned_users: ['user-1', 'user-2'], crop_id: 'strawberries', crop_name: 'Strawberries',
          acres: 250, irrigation_method: 'drip', soil_type: 'Sandy Loam',
          date_planted: '2024-08-01', growth_stage: 'Fruiting', system_efficiency: 98,
          water_allocation: 320, status: 'active', notes: 'Year-round strawberry production',
          created_at: '2024-08-01T06:30:00Z', updated_at: '2024-10-28T11:00:00Z'
        }
      ];
    case 'enterprise-ag':
      return [
        {
          id: 'block-1', organization_id: 'enterprise-ag', name: 'Central Corn A',
          description: 'Primary corn production', location_name: 'Central Operations',
          assigned_users: ['user-1', 'user-2', 'user-3'], crop_id: 'corn', crop_name: 'Corn',
          acres: 2550, irrigation_method: 'sprinkler', soil_type: 'Silt Loam',
          date_planted: '2024-05-15', growth_stage: 'Grain Fill', system_efficiency: 88,
          water_allocation: 1425, status: 'active', notes: 'Hybrid corn for feed production',
          created_at: '2024-05-15T06:00:00Z', updated_at: '2024-10-25T14:30:00Z'
        },
        {
          id: 'block-2', organization_id: 'enterprise-ag', name: 'East Soybean Complex',
          description: 'Large-scale soybean production', location_name: 'Eastern Fields',
          assigned_users: ['user-4', 'user-5'], crop_id: 'soybeans', crop_name: 'Soybeans',
          acres: 2125, irrigation_method: 'sprinkler', soil_type: 'Clay Loam',
          date_planted: '2024-06-01', growth_stage: 'Pod Fill', system_efficiency: 85,
          water_allocation: 950, status: 'active', notes: 'Non-GMO soybeans for export',
          created_at: '2024-06-01T07:00:00Z', updated_at: '2024-10-20T16:45:00Z'
        },
        {
          id: 'block-3', organization_id: 'enterprise-ag', name: 'Western Wheat Fields',
          description: 'Winter wheat production', location_name: 'Western Operations',
          assigned_users: ['user-2', 'user-3'], crop_id: 'wheat', crop_name: 'Wheat',
          acres: 1700, irrigation_method: 'sprinkler', soil_type: 'Sandy Loam',
          date_planted: '2024-03-15', growth_stage: 'Maturity', system_efficiency: 82,
          water_allocation: 765, status: 'harvested', notes: 'Hard red winter wheat',
          created_at: '2024-03-15T08:00:00Z', updated_at: '2024-10-10T14:00:00Z'
        }
      ];
    case 'local-org':
      return [
        {
          id: 'block-1', organization_id: 'local-org', name: 'Home Garden North',
          description: 'Main vegetable garden', location_name: 'Back Yard',
          assigned_users: ['user-1'], crop_id: 'lettuce', crop_name: 'Lettuce',
          acres: 180, irrigation_method: 'drip', soil_type: 'Garden Soil',
          date_planted: '2024-10-01', growth_stage: 'Harvest', system_efficiency: 95,
          water_allocation: 105, status: 'active', notes: 'Organic lettuce for family',
          created_at: '2024-10-01T10:00:00Z', updated_at: '2024-10-25T12:00:00Z'
        },
        {
          id: 'block-2', organization_id: 'local-org', name: 'Greenhouse Complex',
          description: 'Indoor tomato production', location_name: 'Greenhouse',
          assigned_users: ['user-1'], crop_id: 'tomatoes', crop_name: 'Tomatoes',
          acres: 135, irrigation_method: 'drip', soil_type: 'Potting Mix',
          date_planted: '2024-09-15', growth_stage: 'Fruiting', system_efficiency: 98,
          water_allocation: 95, status: 'active', notes: 'Cherry tomatoes',
          created_at: '2024-09-15T09:00:00Z', updated_at: '2024-10-22T15:30:00Z'
        },
        {
          id: 'block-3', organization_id: 'local-org', name: 'Side Field East',
          description: 'Broccoli and green vegetables', location_name: 'East Field',
          assigned_users: ['user-1'], crop_id: 'spinach', crop_name: 'Spinach',
          acres: 100, irrigation_method: 'sprinkler', soil_type: 'Clay Loam',
          date_planted: '2024-09-20', growth_stage: 'Mature', system_efficiency: 90,
          water_allocation: 55, status: 'active', notes: 'Organic spinach rotation',
          created_at: '2024-09-20T08:00:00Z', updated_at: '2024-10-20T14:00:00Z'
        },
        {
          id: 'block-4', organization_id: 'local-org', name: 'South Plot',
          description: 'Root vegetables area', location_name: 'South Field',
          assigned_users: ['user-1'], crop_id: 'carrots', crop_name: 'Carrots',
          acres: 80, irrigation_method: 'drip', soil_type: 'Sandy Loam',
          date_planted: '2024-08-15', growth_stage: 'Harvest', system_efficiency: 92,
          water_allocation: 45, status: 'active', notes: 'Heirloom carrot varieties',
          created_at: '2024-08-15T07:30:00Z', updated_at: '2024-10-18T11:15:00Z'
        }
      ];
    default:
      return [];
  }
};

// Types for our authentication system
export interface OrganizationCrop {
  name: string;
  acres: number;
  value: number;
  color: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  max_users: number;
  is_active: boolean;
  cropDistribution?: OrganizationCrop[];
}

export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  role: 'super_admin' | 'org_admin' | 'manager' | 'user' | 'viewer';
  permissions: string[];
  preferences: Record<string, any>;
  is_active: boolean;
  last_login_at?: string;
  email_verified: boolean;
  organization?: Organization;
}

export interface UserLocation {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  timezone?: string;
  is_default: boolean;
  is_active: boolean;
  metadata: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  organization: Organization | null;
  locations: UserLocation[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: any; error: any }>;
  addLocation: (location: Omit<UserLocation, 'id' | 'user_id' | 'organization_id'>) => Promise<{ data: any; error: any }>;
  updateLocation: (id: string, updates: Partial<UserLocation>) => Promise<{ data: any; error: any }>;
  deleteLocation: (id: string) => Promise<{ error: any }>;
  setDefaultLocation: (id: string) => Promise<{ error: any }>;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  addOrganizationCrop: (crop: OrganizationCrop) => Promise<{ error: any }>;
  updateOrganizationCrop: (cropName: string, updates: Partial<OrganizationCrop>) => Promise<{ error: any }>;
  removeOrganizationCrop: (cropName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and organization data (simplified - no database dependency)
  const fetchProfile = async (userId: string) => {
    try {
      // First check if we have saved profile data
      const savedProfile = localStorage.getItem(`userProfile_${userId}`);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      } else {
        // Create different demo user profiles based on email to simulate different organizational access
        const userEmail = user?.email || '';
        let localProfile: UserProfile;

        if (userEmail.includes('cvgrowers.com')) {
          // Cooperative member
          localProfile = {
            id: userId,
            organization_id: 'demo-farm-coop',
            email: userEmail,
            first_name: user?.user_metadata?.first_name || 'Sarah',
            last_name: user?.user_metadata?.last_name || 'Chen',
            display_name: user?.user_metadata?.display_name || userEmail.split('@')[0],
            job_title: 'Farm Manager',
            department: 'Operations',
            role: userEmail === 'admin@cvgrowers.com' ? 'org_admin' : 'manager',
            permissions: ['view_crops', 'manage_irrigation', 'view_reports', 'manage_blocks'],
            preferences: {},
            is_active: true,
            email_verified: user?.email_confirmed_at ? true : false
          };
        } else if (userEmail.includes('agritech.com')) {
          // Enterprise member
          localProfile = {
            id: userId,
            organization_id: 'enterprise-ag',
            email: userEmail,
            first_name: user?.user_metadata?.first_name || 'Michael',
            last_name: user?.user_metadata?.last_name || 'Rodriguez',
            display_name: user?.user_metadata?.display_name || userEmail.split('@')[0],
            job_title: 'Regional Manager',
            department: 'Production',
            role: userEmail === 'manager@agritech.com' ? 'manager' : 'user',
            permissions: ['view_crops', 'manage_irrigation', 'view_reports', 'manage_blocks', 'view_analytics'],
            preferences: {},
            is_active: true,
            email_verified: user?.email_confirmed_at ? true : false
          };
        } else {
          // Personal account user
          localProfile = {
            id: userId,
            organization_id: 'local-org',
            email: userEmail,
            first_name: user?.user_metadata?.first_name,
            last_name: user?.user_metadata?.last_name,
            display_name: user?.user_metadata?.display_name || userEmail.split('@')[0],
            job_title: 'Farm Owner',
            role: 'user',
            permissions: ['view_crops', 'manage_irrigation', 'view_reports'],
            preferences: {},
            is_active: true,
            email_verified: user?.email_confirmed_at ? true : false
          };
        }

        setProfile(localProfile);
        localStorage.setItem(`userProfile_${userId}`, JSON.stringify(localProfile));
      }
      
      // Set organization based on user's profile organization_id
      const currentProfile = JSON.parse(localStorage.getItem(`userProfile_${userId}`) || '{}');
      let currentOrg: Organization;
      
      if (currentProfile.organization_id === 'demo-farm-coop') {
        const fieldBlocks = getOrganizationFieldBlocks('demo-farm-coop');
        currentOrg = {
          id: 'demo-farm-coop',
          name: 'Central Valley Growers Cooperative',
          slug: 'cv-growers',
          description: 'Multi-farm cooperative managing 2,500 acres',
          subscription_plan: 'premium',
          max_users: 25,
          is_active: true,
          cropDistribution: calculateCropDistribution(fieldBlocks)
        };
      } else if (currentProfile.organization_id === 'enterprise-ag') {
        const fieldBlocks = getOrganizationFieldBlocks('enterprise-ag');
        currentOrg = {
          id: 'enterprise-ag',
          name: 'AgriTech Enterprises',
          slug: 'agritech',
          description: 'Large-scale precision agriculture operations',
          subscription_plan: 'enterprise',
          max_users: 100,
          is_active: true,
          cropDistribution: calculateCropDistribution(fieldBlocks)
        };
      } else {
        // Default to personal account
        const fieldBlocks = getOrganizationFieldBlocks('local-org');
        currentOrg = {
          id: 'local-org',
          name: 'Personal Account',
          slug: 'personal',
          subscription_plan: 'free',
          max_users: 1,
          is_active: true,
          cropDistribution: calculateCropDistribution(fieldBlocks)
        };
      }
      
      setOrganization(currentOrg);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  // Fetch user locations (simplified - no database dependency)
  const fetchLocations = async (userId: string) => {
    try {
      // Use local storage for user locations instead of database
      const savedLocations = localStorage.getItem(`userLocations_${userId}`);
      if (savedLocations) {
        const parsedLocations = JSON.parse(savedLocations);
        setLocations(parsedLocations);
      } else {
        // Start with demo locations for new users to give them the trial experience
        const demoLocations: UserLocation[] = [
          {
            id: 'demo-1',
            user_id: userId,
            organization_id: 'local-org',
            name: 'Salinas Valley Farm',
            description: 'Central Valley operations',
            latitude: 36.6777,
            longitude: -121.6555,
            elevation: 56,
            address: 'Salinas, CA',
            city: 'Salinas',
            state: 'CA',
            country: 'United States',
            postal_code: '93901',
            timezone: 'America/Los_Angeles',
            is_default: true,
            is_active: true,
            metadata: {}
          },
          {
            id: 'demo-2',
            user_id: userId,
            organization_id: 'local-org',
            name: 'Fresno County Field',
            description: 'Secondary growing location',
            latitude: 36.7378,
            longitude: -119.7871,
            elevation: 94,
            address: 'Fresno, CA',
            city: 'Fresno',
            state: 'CA',
            country: 'United States',
            postal_code: '93721',
            timezone: 'America/Los_Angeles',
            is_default: false,
            is_active: true,
            metadata: {}
          }
        ];
        
        setLocations(demoLocations);
        localStorage.setItem(`userLocations_${userId}`, JSON.stringify(demoLocations));
      }
    } catch (error) {
      console.error('Error in fetchLocations:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchLocations(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
          await fetchLocations(session.user.id);
        } else {
          setProfile(null);
          setOrganization(null);
          setLocations([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return { data: null, error: { message: 'No user logged in' } };

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    // Save to localStorage
    localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(updatedProfile));

    return { data: updatedProfile, error: null };
  };

  const addLocation = async (location: Omit<UserLocation, 'id' | 'user_id' | 'organization_id'>) => {
    if (!user || !profile) return { data: null, error: { message: 'No user logged in' } };

    const newLocation: UserLocation = {
      ...location,
      id: Date.now().toString(),
      user_id: user.id,
      organization_id: profile.organization_id
    };

    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(updatedLocations));

    return { data: newLocation, error: null };
  };

  const updateLocation = async (id: string, updates: Partial<UserLocation>) => {
    if (!user) return { data: null, error: { message: 'No user logged in' } };

    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, ...updates } : loc
    );
    
    setLocations(updatedLocations);
    localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(updatedLocations));

    const updatedLocation = updatedLocations.find(loc => loc.id === id);
    return { data: updatedLocation, error: null };
  };

  const deleteLocation = async (id: string) => {
    if (!user) return { error: { message: 'No user logged in' } };

    const updatedLocations = locations.filter(loc => loc.id !== id);
    setLocations(updatedLocations);
    localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(updatedLocations));

    return { error: null };
  };

  const setDefaultLocation = async (id: string) => {
    if (!user) return { error: { message: 'No user logged in' } };

    const updatedLocations = locations.map(loc => ({
      ...loc,
      is_default: loc.id === id
    }));

    setLocations(updatedLocations);
    localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(updatedLocations));

    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshLocations = async () => {
    if (user) {
      await fetchLocations(user.id);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    try {
      // Update the organization in the context
      let newOrg: Organization;
      
      if (organizationId === 'demo-farm-coop') {
        newOrg = {
          id: 'demo-farm-coop',
          name: 'Central Valley Growers Cooperative',
          slug: 'cv-growers',
          description: 'Multi-farm cooperative managing 2,500 acres',
          subscription_plan: 'premium',
          max_users: 25,
          is_active: true,
          cropDistribution: [
            { name: 'Lettuce', acres: 750, value: 30, color: '#10B981' },
            { name: 'Broccoli', acres: 625, value: 25, color: '#8B5CF6' },
            { name: 'Almonds', acres: 500, value: 20, color: '#EF4444' },
            { name: 'Grapes', acres: 375, value: 15, color: '#3B82F6' },
            { name: 'Strawberries', acres: 250, value: 10, color: '#F59E0B' }
          ]
        };
      } else if (organizationId === 'enterprise-ag') {
        newOrg = {
          id: 'enterprise-ag',
          name: 'AgriTech Enterprises',
          slug: 'agritech',
          description: 'Large-scale precision agriculture operations',
          subscription_plan: 'enterprise',
          max_users: 100,
          is_active: true,
          cropDistribution: [
            { name: 'Corn', acres: 2550, value: 30, color: '#F59E0B' },
            { name: 'Soybeans', acres: 2125, value: 25, color: '#10B981' },
            { name: 'Wheat', acres: 1700, value: 20, color: '#8B5CF6' },
            { name: 'Cotton', acres: 1275, value: 15, color: '#EF4444' },
            { name: 'Tomatoes', acres: 850, value: 10, color: '#3B82F6' }
          ]
        };
      } else {
        // Default to personal account
        newOrg = {
          id: 'local-org',
          name: 'Personal Account',
          slug: 'personal',
          subscription_plan: 'free',
          max_users: 1,
          is_active: true,
          cropDistribution: [
            { name: 'Lettuce', acres: 180, value: 40, color: '#10B981' },
            { name: 'Tomatoes', acres: 135, value: 30, color: '#F59E0B' },
            { name: 'Broccoli', acres: 90, value: 20, color: '#8B5CF6' },
            { name: 'Carrots', acres: 45, value: 10, color: '#EF4444' }
          ]
        };
      }
      
      setOrganization(newOrg);
      
      // Optionally update user profile's default organization
      if (profile && user) {
        const updatedProfile = { ...profile, organization_id: organizationId };
        setProfile(updatedProfile);
        localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  // Organization crop management functions
  const addOrganizationCrop = async (crop: OrganizationCrop) => {
    try {
      if (!organization) {
        return { error: { message: 'No organization selected' } };
      }

      const updatedCropDistribution = [...(organization.cropDistribution || []), crop];
      const updatedOrganization = { ...organization, cropDistribution: updatedCropDistribution };
      
      setOrganization(updatedOrganization);
      
      // Save to localStorage for persistence (in real app, this would be database)
      localStorage.setItem(`organization_${organization.id}`, JSON.stringify(updatedOrganization));
      
      return { error: null };
    } catch (error) {
      console.error('Error adding organization crop:', error);
      return { error };
    }
  };

  const updateOrganizationCrop = async (cropName: string, updates: Partial<OrganizationCrop>) => {
    try {
      if (!organization) {
        return { error: { message: 'No organization selected' } };
      }

      const updatedCropDistribution = organization.cropDistribution?.map(crop =>
        crop.name === cropName ? { ...crop, ...updates } : crop
      ) || [];
      
      const updatedOrganization = { ...organization, cropDistribution: updatedCropDistribution };
      
      setOrganization(updatedOrganization);
      localStorage.setItem(`organization_${organization.id}`, JSON.stringify(updatedOrganization));
      
      return { error: null };
    } catch (error) {
      console.error('Error updating organization crop:', error);
      return { error };
    }
  };

  const removeOrganizationCrop = async (cropName: string) => {
    try {
      if (!organization) {
        return { error: { message: 'No organization selected' } };
      }

      const updatedCropDistribution = organization.cropDistribution?.filter(crop =>
        crop.name !== cropName
      ) || [];
      
      const updatedOrganization = { ...organization, cropDistribution: updatedCropDistribution };
      
      setOrganization(updatedOrganization);
      localStorage.setItem(`organization_${organization.id}`, JSON.stringify(updatedOrganization));
      
      return { error: null };
    } catch (error) {
      console.error('Error removing organization crop:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    organization,
    locations,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    addLocation,
    updateLocation,
    deleteLocation,
    setDefaultLocation,
    switchOrganization,
    refreshProfile,
    refreshLocations,
    addOrganizationCrop,
    updateOrganizationCrop,
    removeOrganizationCrop
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};