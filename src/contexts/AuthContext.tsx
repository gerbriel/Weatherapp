import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types for our authentication system
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  max_users: number;
  is_active: boolean;
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
        currentOrg = {
          id: 'demo-farm-coop',
          name: 'Central Valley Growers Cooperative',
          slug: 'cv-growers',
          description: 'Multi-farm cooperative managing 2,500 acres',
          subscription_plan: 'premium',
          max_users: 25,
          is_active: true
        };
      } else if (currentProfile.organization_id === 'enterprise-ag') {
        currentOrg = {
          id: 'enterprise-ag',
          name: 'AgriTech Enterprises',
          slug: 'agritech',
          description: 'Large-scale precision agriculture operations',
          subscription_plan: 'enterprise',
          max_users: 100,
          is_active: true
        };
      } else {
        // Default to personal account
        currentOrg = {
          id: 'local-org',
          name: 'Personal Account',
          slug: 'personal',
          subscription_plan: 'free',
          max_users: 1,
          is_active: true
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
          is_active: true
        };
      } else if (organizationId === 'enterprise-ag') {
        newOrg = {
          id: 'enterprise-ag',
          name: 'AgriTech Enterprises',
          slug: 'agritech',
          description: 'Large-scale precision agriculture operations',
          subscription_plan: 'enterprise',
          max_users: 100,
          is_active: true
        };
      } else {
        // Default to personal account
        newOrg = {
          id: 'local-org',
          name: 'Personal Account',
          slug: 'personal',
          subscription_plan: 'free',
          max_users: 1,
          is_active: true
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
    refreshLocations
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};