import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getRateLimit } from '@/api/github';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ─── Theme ─────────────────────────────────────────
const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('forkling_theme');
    if (stored) return stored;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem('forkling_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Sync theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ─── Compare List (up to 3 repos) ─────────────────
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('forkling_compare') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('forkling_compare', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = useCallback((repo) => {
    setCompareList(prev => {
      if (prev.length >= 3) return prev;
      if (prev.some(r => r.full_name === repo.full_name)) return prev;
      return [...prev, { full_name: repo.full_name, owner: repo.owner?.login || repo.owner, name: repo.name }];
    });
  }, []);

  const removeFromCompare = useCallback((fullName) => {
    setCompareList(prev => prev.filter(r => r.full_name !== fullName));
  }, []);

  const isInCompare = useCallback((fullName) => {
    return compareList.some(r => r.full_name === fullName);
  }, [compareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  // ─── Rate Limit ────────────────────────────────────
  const [rateLimit, setRateLimit] = useState(null);

  const refreshRateLimit = useCallback(async () => {
    try {
      const data = await getRateLimit();
      setRateLimit(data.resources?.core || data.rate || null);
    } catch {
      // Silently fail
    }
  }, []);

  // Check rate limit on mount and every 2 minutes
  useEffect(() => {
    refreshRateLimit();
    const interval = setInterval(refreshRateLimit, 120000);
    return () => clearInterval(interval);
  }, [refreshRateLimit]);

  // ─── Recent Searches ──────────────────────────────
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('forkling_recent') || '[]');
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((query) => {
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(q => q !== query)].slice(0, 10);
      localStorage.setItem('forkling_recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─── Settings Modal ────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Context Value ─────────────────────────────────
  const value = {
    theme, setTheme, toggleTheme,
    compareList, addToCompare, removeFromCompare, isInCompare, clearCompare,
    rateLimit, refreshRateLimit,
    recentSearches, addRecentSearch,
    settingsOpen, setSettingsOpen,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
