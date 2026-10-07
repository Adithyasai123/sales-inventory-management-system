/**
 * Cookie Management Utilities for SIMS
 * Stores authentication tokens and application keys in browser cookies instead of localStorage
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

/**
 * Write a cookie with specified options
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') return;

  const {
    days = 7,
    path = '/',
    sameSite = 'Lax',
    secure = typeof window !== 'undefined' && window.location.protocol === 'https:',
  } = options;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=${path}; SameSite=${sameSite}`;
  if (secure) {
    cookieStr += '; Secure';
  }

  document.cookie = cookieStr;
};

/**
 * Read a cookie by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${encodedName}=`)) {
      return decodeURIComponent(cookie.substring(encodedName.length + 1));
    }
  }

  return null;
};

/**
 * Remove a cookie by expiring it
 */
export const removeCookie = (name: string, path: string = '/'): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`;
};

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME_MODE: 'theme-mode',
} as const;

/**
 * Dedicated auth storage manager operating exclusively on cookies
 * with automatic seamless migration from localStorage
 */
export const authStorage = {
  getAccessToken: (): string | null => {
    // 1. Primary: read from cookies
    const cookieToken = getCookie(TOKEN_KEYS.ACCESS_TOKEN);
    if (cookieToken) return cookieToken;

    // 2. LocalStorage resilience (cross-site/incognito support)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
        if (localToken) return localToken;
      } catch {}
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    // 1. Primary: read from cookies
    const cookieRefresh = getCookie(TOKEN_KEYS.REFRESH_TOKEN);
    if (cookieRefresh) return cookieRefresh;

    // 2. LocalStorage resilience
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localRefresh = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
        if (localRefresh) return localRefresh;
      } catch {}
    }
    return null;
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    // Store in cookies
    setCookie(TOKEN_KEYS.ACCESS_TOKEN, accessToken, {
      days: 1,
      sameSite: isHttps ? 'None' : 'Lax',
      secure: isHttps,
    });
    setCookie(TOKEN_KEYS.REFRESH_TOKEN, refreshToken, {
      days: 7,
      sameSite: isHttps ? 'None' : 'Lax',
      secure: isHttps,
    });

    // Store in localStorage for complete cross-origin reliability
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
      } catch {}
    }
  },

  clearTokens: (): void => {
    removeCookie(TOKEN_KEYS.ACCESS_TOKEN);
    removeCookie(TOKEN_KEYS.REFRESH_TOKEN);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      } catch {}
    }
  },
};
