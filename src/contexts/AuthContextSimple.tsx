import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Simple user profile type
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  role: 'superuser' | 'admin' | 'user';
  primary_organization_id: string | null;
  created_at: string;
  updated_at: string;
}

// Organization types (for TrialDashboard compatibility)
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

export interface UserLocation {
  id: string;
  user_id: string;
  organization_id: string | null;
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
  is_favorite: boolean;
  sort_order: number;
  weatherstation?: string;
  weatherstation_id?: string;
  metadata: Record<string, any>;
}

// Simple auth context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  organization: Organization | null;
  locations: UserLocation[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: { fullName?: string; company?: string; phone?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  resetPasswordForEmail: (email: string, redirectTo?: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  // Location management (for TrialDashboard compatibility)
  addLocation: (location: Omit<UserLocation, 'id' | 'user_id' | 'organization_id'>) => Promise<{ data: any; error: any }>;
  updateLocation: (id: string, updates: Partial<UserLocation>) => Promise<{ data: any; error: any }>;
  deleteLocation: (id: string) => Promise<{ error: any }>;
  setDefaultLocation: (id: string) => Promise<{ error: any }>;
  toggleLocationFavorite: (id: string) => Promise<{ error: any }>;
  reorderLocations: (locationIds: string[]) => Promise<{ error: any }>;
  refreshLocations: () => Promise<void>;
  resetToTrialLocations: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Create timeout promise (10 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      // Create fetch promise
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Race them
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error: any) {
      if (error.message === 'Profile fetch timeout') {
        console.error('Profile fetch timed out after 10 seconds');
      } else {
        console.error('Error in fetchProfile:', error);
      }
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(userProfile);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        const userProfile = await fetchProfile(data.user.id);
        setProfile(userProfile);
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, userData?: { fullName?: string; company?: string; phone?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.fullName,
            company: userData?.company,
            phone: userData?.phone,
          },
        },
      });

      if (error) return { error };

      // Profile will be created automatically by trigger
      if (data.user) {
        // Wait a moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        const userProfile = await fetchProfile(data.user.id);
        setProfile(userProfile);
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
    return { error };
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: { message: 'No user logged in' } };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) return { error };

      // Refresh profile
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  // Reset password - send email with reset link
  const resetPasswordForEmail = async (email: string, redirectTo?: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // Update password (used after clicking reset link)
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // Create default locations for new users
  const createDefaultUserLocations = (userId: string): UserLocation[] => {
    const trialLocations = [
      {
        id: 'cimis-125',
        name: 'Bakersfield',
        weatherstation: 'Arvin-Edison',
        latitude: 35.205583,
        longitude: -118.77841,
        state: 'California',
        region: 'Bakersfield',
        cimisStationId: '125'
      },
      {
        id: 'cimis-80',
        name: 'Fresno',
        weatherstation: 'Fresno State',
        latitude: 36.820833,
        longitude: -119.74231,
        state: 'California',
        region: 'Fresno',
        cimisStationId: '80'
      },
      {
        id: 'cimis-71',
        name: 'Modesto',
        weatherstation: 'Modesto',
        latitude: 37.645222,
        longitude: -121.18776,
        state: 'California',
        region: 'Modesto',
        cimisStationId: '71'
      },
      {
        id: 'cimis-250',
        name: 'Colusa',
        weatherstation: 'Williams',
        latitude: 39.210667,
        longitude: -122.16889,
        state: 'California',
        region: 'Colusa',
        cimisStationId: '250'
      },
      {
        id: 'cimis-77',
        name: 'Napa',
        weatherstation: 'Oakville',
        latitude: 38.428475,
        longitude: -122.41021,
        state: 'California',
        region: 'Napa',
        cimisStationId: '77'
      },
      {
        id: 'cimis-214',
        name: 'Salinas',
        weatherstation: 'Salinas South II',
        latitude: 36.625619,
        longitude: -121.537889,
        state: 'California',
        region: 'Salinas',
        cimisStationId: '214'
      },
      {
        id: 'cimis-202',
        name: 'Santa Maria',
        weatherstation: 'Nipomo',
        latitude: 35.028281,
        longitude: -120.56003,
        state: 'California',
        region: 'Santa Maria',
        cimisStationId: '202'
      },
      {
        id: 'cimis-258',
        name: 'Exeter',
        weatherstation: 'Lemon Cove',
        latitude: 36.376917,
        longitude: -119.037972,
        state: 'California',
        region: 'Exeter',
        cimisStationId: '258'
      },
      {
        id: 'cimis-2',
        name: 'Five Points',
        weatherstation: 'Five Points',
        latitude: 36.336222,
        longitude: -120.11291,
        state: 'California',
        region: 'Five Points',
        cimisStationId: '2'
      }
    ];

    return trialLocations.map((loc, index) => ({
      id: `user-${loc.id}`,
      user_id: userId,
      organization_id: 'local-org',
      name: loc.name,
      description: `${loc.name} agricultural weather station`,
      latitude: loc.latitude,
      longitude: loc.longitude,
      elevation: 100,
      address: `${loc.name}, ${loc.state}`,
      city: loc.name,
      state: 'CA',
      country: 'United States',
      postal_code: '00000',
      timezone: 'America/Los_Angeles',
      is_default: index === 0,
      is_active: true,
      is_favorite: false,
      sort_order: index,
      weatherstation: loc.weatherstation,
      weatherstation_id: loc.cimisStationId,
      metadata: {
        cimisStationId: loc.cimisStationId,
        region: loc.region,
        source: 'trial_locations'
      }
    }));
  };

  // Load locations from localStorage
  const loadLocations = (userId: string): UserLocation[] => {
    const stored = localStorage.getItem(`userLocations_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // If we have less than 9 locations, it's old/incomplete data - regenerate
      if (parsed.length < 9) {
        const defaultLocations = createDefaultUserLocations(userId);
        localStorage.setItem(`userLocations_${userId}`, JSON.stringify(defaultLocations));
        saveDefaultLocationsToDatabase(userId, defaultLocations);
        return defaultLocations;
      }
      
      return parsed;
    } else {
      // Create and save default locations for new users
      const defaultLocations = createDefaultUserLocations(userId);
      localStorage.setItem(`userLocations_${userId}`, JSON.stringify(defaultLocations));
      
      // Also save to database asynchronously
      saveDefaultLocationsToDatabase(userId, defaultLocations);
      
      return defaultLocations;
    }
  };

  // Save default locations to database
  const saveDefaultLocationsToDatabase = async (userId: string, defaultLocations: UserLocation[]) => {
    try {
      // Insert all default locations into the database
      const { error } = await supabase
        .from('user_locations')
        .insert(defaultLocations.map(loc => ({
          id: loc.id,
          user_id: loc.user_id,
          organization_id: loc.organization_id,
          name: loc.name,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          elevation: loc.elevation,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          postal_code: loc.postal_code,
          timezone: loc.timezone,
          is_default: loc.is_default,
          is_active: loc.is_active,
          is_favorite: loc.is_favorite,
          sort_order: loc.sort_order,
          weatherstation: loc.weatherstation,
          weatherstation_id: loc.weatherstation_id,
          metadata: loc.metadata
        })));
      
      if (error) {
        console.error('Error saving default locations to database:', error);
      }
    } catch (error) {
      console.error('Exception saving default locations:', error);
    }
  };

  // Save locations to localStorage
  const saveLocations = (locs: UserLocation[]) => {
    if (user) {
      localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(locs));
      setLocations(locs);
    }
  };

  // Load organization (stub implementation)
  const loadOrganization = (userProfile: UserProfile | null): Organization | null => {
    if (!userProfile?.company) return null;
    return {
      id: 'org-1',
      name: userProfile.company,
      slug: userProfile.company.toLowerCase().replace(/\s+/g, '-'),
      subscription_plan: userProfile.role === 'superuser' ? 'enterprise' : 'free',
      max_users: 100,
      is_active: true,
    };
  };

  // Refresh locations from storage
  const refreshLocations = async () => {
    if (user) {
      const locs = loadLocations(user.id);
      setLocations(locs);
    }
  };

  // Add location
  const addLocation = async (location: Omit<UserLocation, 'id' | 'user_id' | 'organization_id'>) => {
    if (!user) return { data: null, error: { message: 'No user logged in' } };

    const newLocation: UserLocation = {
      ...location,
      id: `loc-${Date.now()}`,
      user_id: user.id,
      organization_id: organization?.id || null,
      sort_order: locations.length,
      is_active: true,
      is_favorite: false,
      is_default: locations.length === 0,
      metadata: location.metadata || {},
      country: location.country || 'US',
    };

    // Save to database without organization_id (keep it simple)
    const { error: dbError } = await supabase
      .from('user_locations')
      .insert({
        id: newLocation.id,
        user_id: newLocation.user_id,
        name: newLocation.name,
        description: newLocation.description,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        elevation: newLocation.elevation,
        address: newLocation.address,
        city: newLocation.city,
        state: newLocation.state,
        country: newLocation.country,
        postal_code: newLocation.postal_code,
        timezone: newLocation.timezone,
        is_default: newLocation.is_default,
        is_active: newLocation.is_active,
        is_favorite: newLocation.is_favorite,
        sort_order: newLocation.sort_order,
        weatherstation: newLocation.weatherstation,
        weatherstation_id: newLocation.weatherstation_id,
        metadata: newLocation.metadata
      });

    if (dbError) {
      console.error('Error adding location to database:', dbError);
      return { data: null, error: dbError };
    }

    // Update state and localStorage
    const updated = [...locations, newLocation];
    setLocations(updated);
    saveLocations(updated);
    return { data: newLocation, error: null };
  };

  // Update location
  const updateLocation = async (id: string, updates: Partial<UserLocation>) => {
    // Save to database
    const { error: dbError } = await supabase
      .from('user_locations')
      .update(updates)
      .eq('id', id);

    if (dbError) {
      console.error('Error updating location in database:', dbError);
      return { data: null, error: dbError };
    }

    // Update state and localStorage
    const updated = locations.map(loc =>
      loc.id === id ? { ...loc, ...updates } : loc
    );
    setLocations(updated);
    saveLocations(updated);
    return { data: updated.find(l => l.id === id), error: null };
  };

  // Delete location
  const deleteLocation = async (id: string) => {
    // Delete from database
    const { error: dbError } = await supabase
      .from('user_locations')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting location from database:', dbError);
      return { error: dbError };
    }

    // Update state and localStorage
    const updated = locations.filter(loc => loc.id !== id);
    setLocations(updated);
    saveLocations(updated);
    return { error: null };
  };

  // Set default location
  const setDefaultLocation = async (id: string) => {
    const updated = locations.map(loc => ({
      ...loc,
      is_default: loc.id === id,
    }));
    setLocations(updated);
    saveLocations(updated);
    return { error: null };
  };

  // Toggle location favorite
  const toggleLocationFavorite = async (id: string) => {
    const updated = locations.map(loc =>
      loc.id === id ? { ...loc, is_favorite: !loc.is_favorite } : loc
    );
    setLocations(updated);
    saveLocations(updated);
    return { error: null };
  };

  // Reorder locations
  const reorderLocations = async (locationIds: string[]) => {
    const updated = locationIds.map((id, index) => {
      const loc = locations.find(l => l.id === id);
      return loc ? { ...loc, sort_order: index } : null;
    }).filter(Boolean) as UserLocation[];
    setLocations(updated);
    saveLocations(updated);
    return { error: null };
  };

  // Reset to default trial locations (9 CIMIS stations)
  const resetToTrialLocations = async () => {
    if (!user) return { error: { message: 'No user logged in' } };

    try {
      // Delete all existing locations from database
      const { error: deleteError } = await supabase
        .from('user_locations')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting existing locations:', deleteError);
        return { error: deleteError };
      }

      // Create fresh default locations
      const defaultLocations = createDefaultUserLocations(user.id);
      
      // Insert into database
      const { error: insertError } = await supabase
        .from('user_locations')
        .insert(defaultLocations.map(loc => ({
          id: loc.id,
          user_id: loc.user_id,
          organization_id: loc.organization_id,
          name: loc.name,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          elevation: loc.elevation,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          postal_code: loc.postal_code,
          timezone: loc.timezone,
          is_default: loc.is_default,
          is_active: loc.is_active,
          is_favorite: loc.is_favorite,
          sort_order: loc.sort_order,
          weatherstation: loc.weatherstation,
          weatherstation_id: loc.weatherstation_id,
          metadata: loc.metadata
        })));

      if (insertError) {
        console.error('Error inserting default locations:', insertError);
        return { error: insertError };
      }

      // Update state and localStorage
      setLocations(defaultLocations);
      localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(defaultLocations));
      
      return { error: null };
    } catch (error: any) {
      console.error('Exception resetting locations:', error);
      return { error };
    }
  };

  // Load locations and organization when user/profile changes
  useEffect(() => {
    if (user) {
      // Fetch locations from database first
      const fetchLocationsFromDatabase = async () => {
        const { data: dbLocations, error } = await supabase
          .from('user_locations')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error fetching locations from database:', error);
          // Fall back to localStorage
          const locs = loadLocations(user.id);
          setLocations(locs);
        } else if (dbLocations && dbLocations.length > 0) {
          setLocations(dbLocations as UserLocation[]);
          // Sync to localStorage as cache
          localStorage.setItem(`userLocations_${user.id}`, JSON.stringify(dbLocations));
        } else {
          // No locations in database, create defaults
          const locs = loadLocations(user.id);
          setLocations(locs);
        }
      };

      fetchLocationsFromDatabase();
      
      if (profile) {
        const org = loadOrganization(profile);
        setOrganization(org);
      }
    } else {
      setLocations([]);
      setOrganization(null);
    }
  }, [user, profile]);

  const value = {
    user,
    profile,
    session,
    organization,
    locations,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPasswordForEmail,
    updatePassword,
    addLocation,
    updateLocation,
    deleteLocation,
    setDefaultLocation,
    toggleLocationFavorite,
    reorderLocations,
    refreshLocations,
    resetToTrialLocations,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
