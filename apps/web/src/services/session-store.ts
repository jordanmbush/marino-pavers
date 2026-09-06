/**
 * Where the admin session lives between page loads. localStorage so the
 * client isn't asked to sign in every time they open the tab; the refresh
 * token it holds is what makes that possible for up to 30 days.
 */

const KEY = "marino.admin.session";

export type StoredSession = {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms when the id token expires. */
  expiresAt: number;
  username: string;
};

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const loadSession = (): StoredSession | null => {
  try {
    const raw = storage()?.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
};

export const saveSession = (session: StoredSession): void => {
  try {
    storage()?.setItem(KEY, JSON.stringify(session));
  } catch {
    // Private mode or a full quota: the sign-in still works for this page load.
  }
};

export const clearSession = (): void => {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
};
