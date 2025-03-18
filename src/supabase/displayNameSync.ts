import { supabase } from './supabaseClient';

/**
 * This utility function updates the user_display_name field in the user_stats table
 * for all users based on their Auth metadata.
 * 
 * Run this function once after adding the user_display_name column to the database.
 */
export async function syncDisplayNames() {
  try {
    console.log('Starting display name sync...');
    
    // First check if the column exists
    try {
      const { error } = await supabase
        .from('user_stats')
        .select('user_display_name')
        .limit(1);
      
      if (error) {
        console.error('Column user_display_name might not exist:', error.message);
        console.log('Please run the SQL migration to add the column first.');
        return;
      }
    } catch (err) {
      console.error('Error checking column:', err);
      return;
    }
    
    // Get all user stats records
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('id');
    
    if (statsError) {
      throw statsError;
    }
    
    if (!statsData || statsData.length === 0) {
      console.log('No user stats records found.');
      return;
    }
    
    console.log(`Found ${statsData.length} user stats records.`);
    
    // For each user stats record, get the current user session and metadata
    let updatedCount = 0;
    let errorCount = 0;
    
    // First get our current user's metadata to update them at least
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    
    if (currentUser) {
      console.log(`Updating current user: ${currentUser.id}`);
      
      try {
        const displayName = currentUser.user_metadata?.display_name || 
                           currentUser.user_metadata?.full_name || 
                           currentUser.email?.split('@')[0] || 
                           `Player ${currentUser.id.substring(0, 4)}`;
        
        // Update user_stats record
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({ user_display_name: displayName })
          .eq('id', currentUser.id);
        
        if (updateError) {
          console.error(`Error updating display name for user ${currentUser.id}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`Updated display name for user ${currentUser.id} to "${displayName}"`);
        }
      } catch (err) {
        console.error(`Unexpected error processing current user:`, err);
        errorCount++;
      }
    }
    
    // For other users, we'll use a basic fallback approach with Player IDs
    // Note: In a real app with proper admin privileges, you'd use admin API methods
    for (const stat of statsData) {
      // Skip if this is the current user (already handled)
      if (currentUser && stat.id === currentUser.id) {
        continue;
      }
      
      try {
        // For non-admin access, we'll just use a placeholder
        const displayName = `Player ${stat.id.substring(0, 8)}`;
        
        // Update user_stats record
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({ user_display_name: displayName })
          .eq('id', stat.id);
        
        if (updateError) {
          console.error(`Error updating display name for user ${stat.id}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`Updated display name for user ${stat.id} to "${displayName}"`);
        }
      } catch (err) {
        console.error(`Unexpected error processing user ${stat.id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`
Sync complete:
- ${updatedCount} users updated successfully
- ${errorCount} errors encountered
    `);
    
    console.log(`
NOTE: Only the current user received their actual display name.
Other users received generic player IDs since admin-level API access is not available.
For a complete sync with real names, you would need to implement this in a server-side
function with admin credentials.
    `);
    
  } catch (error) {
    console.error('Error syncing display names:', error);
  }
}

/**
 * Run this function to execute the sync:
 * import { syncDisplayNames } from './supabase/displayNameSync';
 * 
 * // Then in an admin-only component or utility:
 * await syncDisplayNames();
 */ 