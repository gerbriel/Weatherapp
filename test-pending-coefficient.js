import { supabase } from './src/lib/supabase.js';

// Test script to add a pending coefficient for testing the admin panel
async function createTestPendingCoefficient() {
  try {
    // First, get a crop variety to use for testing
    const { data: varieties } = await supabase
      .from('crop_varieties')
      .select('id, name')
      .limit(1);
    
    if (!varieties || varieties.length === 0) {
      console.log('No crop varieties found');
      return;
    }
    
    const testVariety = varieties[0];
    console.log('Using crop variety:', testVariety);
    
    // Create a test pending coefficient
    const pendingCoeff = {
      crop_variety_id: testVariety.id,
      kc_initial: 0.4,
      kc_development: 0.7,
      kc_mid: 1.15,
      kc_late: 0.8,
      initial_stage_days: 25,
      development_stage_days: 35,
      mid_stage_days: 40,
      late_stage_days: 30,
      source: 'Test User Submission',
      submitted_by_email: 'testuser@example.com',
      submitted_by_name: 'Test User',
      notes: 'This is a test coefficient submission for testing the admin panel review workflow.'
    };
    
    const { data, error } = await supabase
      .from('pending_crop_coefficients')
      .insert([pendingCoeff])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating test pending coefficient:', error);
    } else {
      console.log('Test pending coefficient created:', data);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createTestPendingCoefficient();