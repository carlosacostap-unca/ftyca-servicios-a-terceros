import PocketBase from 'pocketbase';

// Use environment variable for URL, default to local if not set
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create a singleton instance for client-side usage
let pb: PocketBase | undefined;

export function getPocketBaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create a new instance
    return new PocketBase(POCKETBASE_URL);
  }
  
  // Client-side: reuse instance
  if (!pb) {
    pb = new PocketBase(POCKETBASE_URL);
  }
  
  return pb;
}

export async function getPocketBaseAdminClient() {
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("PocketBase Admin credentials not found in environment variables (POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD). Falling back to regular client.");
    return getPocketBaseClient();
  }

  // Always create a new instance for admin operations to avoid state pollution
  const adminPb = new PocketBase(POCKETBASE_URL);
  
  try {
    await adminPb.admins.authWithPassword(adminEmail, adminPassword);
    return adminPb;
  } catch (error) {
    console.error("Failed to authenticate as PocketBase admin:", error);
    return getPocketBaseClient(); // Fallback to regular client
  }
}
