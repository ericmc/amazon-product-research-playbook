/**
 * App Lock utilities for password-based authentication
 */

// PBKDF2 implementation for client-side password hashing
export async function pbkdf2Hash(password: string, salt: string, iterations: number = 100000): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes = 256 bits
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if app lock is disabled in development
export function isAppLockDisabled(): boolean {
  return import.meta.env.VITE_APP_LOCK_DISABLED === 'true';
}

// Get stored hash and salt from environment
export function getAppLockCredentials() {
  return {
    hash: import.meta.env.VITE_APP_LOCK_HASH,
    salt: import.meta.env.VITE_APP_LOCK_SALT
  };
}

// Check if app is currently unlocked
export function isAppUnlocked(): boolean {
  if (isAppLockDisabled()) {
    return true;
  }

  try {
    const unlocked = localStorage.getItem('app_unlocked');
    if (!unlocked) return false;

    const data = JSON.parse(unlocked);
    // Check if unlock is still valid (optional: add expiration logic here)
    return data === '1' || (typeof data === 'object' && data.unlocked === true);
  } catch {
    return false;
  }
}

// Unlock the app
export function unlockApp(): void {
  const unlockData = JSON.stringify({
    unlocked: true,
    timestamp: Date.now()
  });
  localStorage.setItem('app_unlocked', unlockData);
}

// Lock the app
export function lockApp(): void {
  localStorage.removeItem('app_unlocked');
}

// Verify password against stored hash
export async function verifyPassword(password: string): Promise<boolean> {
  // Plaintext password fallback (for immediate access / simple setups)
  const plain = import.meta.env.VITE_APP_LOCK_PASSWORD as string | undefined;
  if (plain && typeof plain === 'string') {
    return password === plain;
  }

  const { hash, salt } = getAppLockCredentials();
  
  if (!hash || !salt) {
    console.warn('App lock hash or salt not configured');
    return false;
  }

  try {
    const computedHash = await pbkdf2Hash(password, salt);
    return computedHash === hash;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}