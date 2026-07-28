import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { testPAT } from '@/api/github';
import { testHFToken } from '@/api/huggingface';
import { clearCache } from '@/api/cache';
import { FiX, FiKey, FiCheck, FiAlertCircle, FiTrash2, FiLoader, FiDownload } from 'react-icons/fi';

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, refreshRateLimit, installPrompt, triggerInstall } = useApp();
  const [ghPat, setGhPat] = useState(() => localStorage.getItem('forkling_github_pat') || '');
  const [hfToken, setHfToken] = useState(() => localStorage.getItem('forkling_hf_token') || '');
  const [ghStatus, setGhStatus] = useState(null); // null | 'testing' | 'valid' | 'invalid'
  const [hfStatus, setHfStatus] = useState(null);

  if (!settingsOpen) return null;

  const handleSaveGH = async () => {
    if (!ghPat.trim()) {
      localStorage.removeItem('forkling_github_pat');
      setGhStatus(null);
      refreshRateLimit();
      return;
    }
    setGhStatus('testing');
    const valid = await testPAT(ghPat.trim());
    if (valid) {
      localStorage.setItem('forkling_github_pat', ghPat.trim());
      setGhStatus('valid');
      refreshRateLimit();
    } else {
      setGhStatus('invalid');
    }
  };

  const handleSaveHF = async () => {
    if (!hfToken.trim()) {
      localStorage.removeItem('forkling_hf_token');
      setHfStatus(null);
      return;
    }
    setHfStatus('testing');
    const valid = await testHFToken(hfToken.trim());
    if (valid) {
      localStorage.setItem('forkling_hf_token', hfToken.trim());
      setHfStatus('valid');
    } else {
      setHfStatus('invalid');
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    alert('Cache cleared successfully.');
  };

  const statusIcon = (status) => {
    if (status === 'testing') return <FiLoader className="animate-spin text-gray-400" />;
    if (status === 'valid') return <FiCheck className="text-signal-healthy" />;
    if (status === 'invalid') return <FiAlertCircle className="text-signal-danger" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSettingsOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-[#161A22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-headline">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="text-lg text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* GitHub PAT */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiKey className="text-accent-gold" />
              GitHub Personal Access Token
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Increases rate limit from 60 to 5,000 req/hr. Create one at{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent-gold hover:underline">
                github.com/settings/tokens
              </a>.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={ghPat}
                onChange={e => { setGhPat(e.target.value); setGhStatus(null); }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/50 focus:border-accent-gold text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              />
              <button
                onClick={handleSaveGH}
                className="px-4 py-2 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition-colors flex items-center gap-1.5"
              >
                {statusIcon(ghStatus)}
                Save
              </button>
            </div>
            {ghStatus === 'invalid' && (
              <p className="text-xs text-signal-danger mt-1.5">Invalid token. Please check and try again.</p>
            )}
            {ghStatus === 'valid' && (
              <p className="text-xs text-signal-healthy mt-1.5">✓ Token verified successfully!</p>
            )}
          </div>

          {/* HF Token */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FiKey className="text-accent-models" />
              Hugging Face Token
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Optional. Improves rate limits for the LLM Explorer. Get one at{' '}
              <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent-models hover:underline">
                huggingface.co/settings/tokens
              </a>.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={hfToken}
                onChange={e => { setHfToken(e.target.value); setHfStatus(null); }}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-models/50 focus:border-accent-models text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              />
              <button
                onClick={handleSaveHF}
                className="px-4 py-2 text-sm font-semibold bg-accent-models text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1.5"
              >
                {statusIcon(hfStatus)}
                Save
              </button>
            </div>
            {hfStatus === 'invalid' && (
              <p className="text-xs text-signal-danger mt-1.5">Invalid token. Please check and try again.</p>
            )}
            {hfStatus === 'valid' && (
              <p className="text-xs text-signal-healthy mt-1.5">✓ Token verified successfully!</p>
            )}
          </div>

          {/* Install App */}
          {installPrompt && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={triggerInstall}
                className="flex items-center gap-2 text-sm font-medium text-accent-gold hover:text-accent-gold-dark transition-colors"
              >
                <FiDownload className="text-sm" />
                Install Forkling as App
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Add Forkling to your home screen for quick access and offline support.
              </p>
            </div>
          )}

          {/* Clear Cache */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-signal-danger transition-colors"
            >
              <FiTrash2 className="text-sm" />
              Clear cached data
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Removes all cached API responses from IndexedDB.
            </p>
          </div>
        </div>

        {/* Footer warning */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            🔒 Tokens are stored in localStorage on your device only. Never shared with any server.
          </p>
        </div>
      </div>
    </div>
  );
}
