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

  // Fetch user profile and organization data
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);
      setOrganization(profileData.organization);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  // Fetch user locations
  const fetchLocations = async (userId: string) => {
    try {
      const { data: locationsData, error: locationsError } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        return;
      }

      setLocations(locationsData || []);
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
    if (!user) return { data: null, error: { message: 'No user logged in' } };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  const addLocation = async (location: Omit<UserLocation, 'id' | 'user_id' | 'organization_id'>) => {
    if (!user || !profile) return { data: null, error: { message: 'No user logged in' } };

    const { data, error } = await supabase
      .from('user_locations')
      .insert({
        ...location,
        user_id: user.id,
        organization_id: profile.organization_id
      })
      .select()
      .single();

    if (!error && data) {
      setLocations(prev => [...prev, data]);
    }

    return { data, error };
  };

  const updateLocation = async (id: string, updates: Partial<UserLocation>) => {
    const { data, error } = await supabase
      .from('user_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setLocations(prev => prev.map(loc => loc.id === id ? data : loc));
    }

    return { data, error };
  };

  const deleteLocation = async (id: string) => {
    const { error } = await supabase
      .from('user_locations')
      .delete()
      .eq('id', id);

    if (!error) {
      setLocations(prev => prev.filter(loc => loc.id !== id));
    }

    return { error };
  };

  const setDefaultLocation = async (id: string) => {
    if (!user) return { error: { message: 'No user logged in' } };

    // First, unset all other default locations
    await supabase
      .from('user_locations')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Then set the new default
    const { error } = await supabase
      .from('user_locations')
      .update({ is_default: true })
      .eq('id', id);

    if (!error) {
      setLocations(prev => prev.map(loc => ({
        ...loc,
        is_default: loc.id === id
      })));
    }

    return { error };
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
    refreshProfile,
    refreshLocations
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};