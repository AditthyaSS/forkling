import { useState, useEffect, useCallback } from 'react';
import { getTrendingRepos } from '@/api/github';
import RepoCard from '@/components/RepoCard';
import { FiTrendingUp, FiLoader, FiCode, FiGlobe, FiLayers } from 'react-icons/fi';
import { formatNumber } from '@/utils/format';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { key: 'daily',   label: 'Today' },
  { key: 'weekly',  label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
];

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
  'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C#', 'Shell',
];

const SKELETON_COUNT = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the repo was created in the last 7 days and has 100+ stars */
function isRisingStar(repo) {
  if (!repo.created_at) return false;
  const created = new Date(repo.created_at);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return created >= sevenDaysAgo && (repo.stargazers_count || 0) >= 100;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RepoCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 skeleton" />
          <div className="h-3 w-1/3 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full skeleton" />
        <div className="h-3 w-4/5 skeleton" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-14 skeleton rounded-full" />
        <div className="h-5 w-16 skeleton rounded-full" />
      </div>
      <div className="h-8 w-full skeleton rounded-xl mt-4" />
    </div>
  );
}

// ─── Rising Star Wrapper ──────────────────────────────────────────────────────

function TrendingRepoCard({ repo }) {
  const rising = isRisingStar(repo);

  return (
    <div className="relative">
      {rising && (
        <div className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-lg animate-fire-pulse">
          🔥 Rising
        </div>
      )}
      <RepoCard repo={repo} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const [timeRange, setTimeRange] = useState('weekly');
  const [language, setLanguage] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ repos: 0, languages: 0, topics: 0 });

  const fetchTrending = useCallback(async (range, lang, pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingRepos(range, lang, pg, 30);
      const items = data.items || [];
      setRepos(pg === 1 ? items : (prev) => [...prev, ...items]);
      setTotalCount(data.total_count || 0);

      if (items.length > 0) {
        const allLangs = new Set(items.map((r) => r.language).filter(Boolean));
        const allTopics = new Set(items.flatMap((r) => r.topics || []));
        setStats({
          repos: data.total_count || items.length,
          languages: allLangs.size,
          topics: allTopics.size,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch trending repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    setPage(1);
    fetchTrending(timeRange, language, 1);
  }, [timeRange, language, fetchTrending]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTrending(timeRange, language, nextPage);
  };

  return (
    <div className="min-h-screen">
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden pt-8 pb-12 md:pt-12 md:pb-16">
        {/* Ambient orbs — warm orange tones */}
        <div className="absolute -top-24 left-1/3 w-[500px] h-[500px] rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl pointer-events-none animate-pulse-orb" />
        <div
          className="absolute top-48 -right-16 w-96 h-96 rounded-full bg-amber-400/8 dark:bg-amber-400/4 blur-3xl pointer-events-none animate-pulse-orb"
          style={{ animationDelay: '-4s' }}
        />
        <div
          className="absolute top-32 -left-16 w-72 h-72 rounded-full bg-orange-300/6 dark:bg-orange-300/3 blur-3xl pointer-events-none animate-pulse-orb"
          style={{ animationDelay: '-2s' }}
        />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-30 dark:opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="hero-entry hero-entry-1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.18em]">
              Live Trending · Updated Hourly
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hero-entry hero-entry-2 font-headline font-extrabold tracking-tighter text-gray-900 dark:text-gray-50 mb-6"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', lineHeight: 1.05 }}
          >
            What's
            <br className="hidden sm:block" />
            <span className="trending-gradient-text">Trending Now</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-entry hero-entry-3 text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover the hottest new repositories gaining stars right now — filtered by time range and language.
          </p>

          {/* Time Range Selector */}
          <div className="hero-entry hero-entry-4 inline-flex items-center gap-1 p-1 bg-white/80 dark:bg-gray-800/80 glass border border-gray-200 dark:border-gray-700 rounded-xl">
            {TIME_RANGES.map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                  timeRange === range.key
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ QUICK STATS ═══════ */}
      <section className="bg-surface dark:bg-[#0F1117] py-8 border-y border-gray-200/40 dark:border-gray-800/40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                <FiCode className="text-orange-500 text-lg" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-orange-500 font-headline">
                {stats.repos > 0 ? formatNumber(stats.repos) : '—'}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trending Repos
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <FiGlobe className="text-signal-healthy text-lg" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-signal-healthy font-headline">
                {stats.languages > 0 ? stats.languages : '—'}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Languages
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                <FiLayers className="text-signal-active text-lg" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-signal-active font-headline">
                {stats.topics > 0 ? stats.topics : '—'}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Topics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ LANGUAGE FILTER + GRID ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Language chips */}
        <div className="mb-8 p-4 bg-white dark:bg-[#161A22] rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1">
              Language
            </span>
            <button
              onClick={() => setLanguage('')}
              className={`chip ${language === '' ? 'active' : ''}`}
            >
              All
            </button>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(language === lang ? '' : lang)}
                className={`chip ${language === lang ? 'active' : ''}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Repo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading && repos.length === 0
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <RepoCardSkeleton key={i} />
              ))
            : repos.map((repo) => (
                <TrendingRepoCard key={repo.id} repo={repo} />
              ))}
        </div>

        {/* Empty state */}
        {!loading && repos.length === 0 && !error && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <img
              src="/Forkling_logo.png"
              alt="Forky"
              style={{ width: 80, height: 80 }}
              className="object-contain"
            />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
              No trending repos found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Forky couldn't find anything trending right now — try a different time range or language.
            </p>
          </div>
        )}

        {/* Load more */}
        {repos.length > 0 && repos.length < totalCount && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiTrendingUp className="text-base" />}
              Load More Trending
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
