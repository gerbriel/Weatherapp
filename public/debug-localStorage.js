// Debug script for troubleshooting localStorage persistence
// Run this in browser console to debug location persistence issues

function debugLocalStorage() {
  console.log('🔍 === ET Weather App Debug Info ===');
  
  // Find all localStorage keys related to the app
  const keys = Object.keys(localStorage).filter(key => 
    key.includes('userLocations_') || 
    key.includes('userProfile_') || 
    key.includes('weatherLocations') ||
    key.includes('supabase')
  );
  
  console.log('📦 Found localStorage keys:', keys);
  
  // Display location data
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value);
      if (key.includes('userLocations_')) {
        console.log(`📍 ${key}:`, parsed.length, 'locations');
        parsed.forEach((loc, i) => {
          console.log(`  ${i+1}. ${loc.name} (${loc.latitude}, ${loc.longitude})`);
        });
      } else if (key.includes('userProfile_')) {
        console.log(`👤 ${key}:`, parsed.email || 'No email');
      } else {
        console.log(`🔧 ${key}:`, typeof parsed === 'object' ? Object.keys(parsed) : parsed);
      }
    } catch (e) {
      console.log(`🔧 ${key}:`, value ? value.substring(0, 100) + '...' : 'null');
    }
  });
  
  // Current user info
  console.log('🔑 Current session keys:', Object.keys(localStorage).filter(k => k.includes('supabase')));
  
  return {
    keys,
    clearUserData: (userId) => {
      const userKeys = Object.keys(localStorage).filter(key => key.includes(userId));
      console.log('🗑️ Clearing data for user:', userId, userKeys);
      userKeys.forEach(key => localStorage.removeItem(key));
      console.log('✅ Cleared user data. Refresh the page.');
    },
    clearAllAppData: () => {
      const appKeys = Object.keys(localStorage).filter(key => 
        key.includes('userLocations_') || 
        key.includes('userProfile_') || 
        key.includes('weatherLocations')
      );
      console.log('🗑️ Clearing all app data:', appKeys);
      appKeys.forEach(key => localStorage.removeItem(key));
      console.log('✅ Cleared all app data. Refresh the page.');
    }
  };
}

// Add to window for easy access
window.debugLocalStorage = debugLocalStorage;

console.log('🛠️ Debug tools loaded! Run debugLocalStorage() in console for details');