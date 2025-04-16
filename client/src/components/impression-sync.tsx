import { useEffect } from "react";
import { setupPeriodicSync, syncWithServer } from "@/lib/impressionStorage";

/**
 * Component to handle the periodic syncing of locally stored impressions and click-throughs.
 * This component doesn't render anything, it just sets up the sync process when mounted.
 */
export function ImpressionSync() {
  useEffect(() => {
    // Initial sync when the component mounts
    syncWithServer().catch(console.error);
    
    // Set up periodic sync every 5 minutes
    const cleanup = setupPeriodicSync(5);
    
    // Sync when user is about to leave the page or close the browser
    const handleBeforeUnload = () => {
      syncWithServer().catch(console.error);
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Clean up when component unmounts
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}