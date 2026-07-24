import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { FiSun, FiMoon, FiSettings, FiMenu, FiX, FiDownload } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

export default function Navbar() {
  const { theme, toggleTheme, setSettingsOpen, compareList, installPrompt, triggerInstall } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isModelsSection = location.pathname.startsWith('/models');

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/compare', label: 'Compare', badge: compareList.length > 0 ? compareList.length : null },
    { to: '/guide', label: 'Guide' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#0B0D11]/80 glass border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 max-w-7xl mx-auto w-full">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group transition-transform duration-300 hover:scale-[1.03]">
            {/* Axolotl mascot — actual PNG from /public/Forkling_logo.png */}
            <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <img
                src="/Forkling_logo.png"
                alt="Forkling mascot"
                width={96}
                height={96}
                className="object-contain"
                style={{ width: 96, height: 96 }}
              />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-50 font-headline">
              Fork<span className="text-accent-gold italic">ling</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold" aria-label="Main navigation">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive(link.to)
                    ? 'text-accent-gold dark:text-accent-gold bg-amber-50 dark:bg-amber-950/20'
                    : 'text-gray-600 hover:text-accent-gold dark:text-gray-400 dark:hover:text-accent-gold hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-gold text-white text-[10px] font-bold flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Divider */}
            <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-2" />

            {/* LLM Explorer link — violet accent */}
            <Link
              to="/models"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isModelsSection
                  ? 'text-accent-models dark:text-accent-models bg-violet-50 dark:bg-violet-950/20'
                  : 'text-accent-models/70 hover:text-accent-models dark:text-violet-400/70 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20'
              }`}
            >
              <HiOutlineSparkles className="text-base" />
              Explore LLMs
            </Link>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Install App — only visible when browser offers PWA install */}
          {installPrompt && (
            <button
              onClick={triggerInstall}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition-colors"
              aria-label="Install Forkling app"
            >
              <FiDownload className="text-sm" />
              Install
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <FiSun className="text-gray-400 text-lg" />
            ) : (
              <FiMoon className="text-gray-600 text-lg" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full transition-colors"
            aria-label="Settings"
          >
            <FiSettings className="text-gray-600 dark:text-gray-400 text-lg" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <FiX className="text-gray-600 dark:text-gray-400 text-xl" />
            ) : (
              <FiMenu className="text-gray-600 dark:text-gray-400 text-xl" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0D11] p-5 shadow-xl animate-fade-in-up">
          <nav className="flex flex-col gap-3 text-sm font-semibold" aria-label="Mobile navigation">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(link.to)
                    ? 'text-accent-gold bg-amber-50 dark:bg-amber-950/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-accent-gold hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-2 w-5 h-5 inline-flex items-center justify-center rounded-full bg-accent-gold text-white text-[10px] font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-1">
              <Link
                to="/models"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                  isModelsSection
                    ? 'text-accent-models bg-violet-50 dark:bg-violet-950/20'
                    : 'text-accent-models/70 hover:text-accent-models hover:bg-violet-50 dark:hover:bg-violet-950/20'
                }`}
              >
                <HiOutlineSparkles />
                Explore Open-Source LLMs
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
