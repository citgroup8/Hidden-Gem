import { cookies } from 'next/headers';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export type CurrentProfile = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  defaultLocationPrivacy: string;
  profileComplete: boolean;
};

/**
 * Server-side call to the backend that forwards the visitor's cookies.
 * Returns null when the visitor is not signed in (or the account no longer exists).
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status} for /api/users/me`);
  const data = (await response.json()) as { user: CurrentProfile };
  return data.user;
}
