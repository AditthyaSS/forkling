import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { searchRepos } from "@/api/github";
import RepoCard from "@/components/RepoCard";
import FilterChips from "@/components/FilterChips";
import {
  FiSearch,
  FiShuffle,
  FiCode,
  FiGlobe,
  FiLayers,
  FiLoader,
} from "react-icons/fi";

const SKELETON_COUNT = 6;

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

export default function HomePage() {
  const { addRecentSearch } = useApp();
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    language: "",
    topic: "",
    maintenance: "",
    pushed: "",
    hasGoodFirstIssue: false,
  });
  const [stats, setStats] = useState({ repos: 0, languages: 0, topics: 0 });

  const fetchRepos = useCallback(
    async (searchQuery, searchFilters, searchPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchRepos(
          searchQuery,
          searchFilters,
          searchPage,
          30,
        );
        const items = data.items || [];
        setRepos(searchPage === 1 ? items : (prev) => [...prev, ...items]);
        setTotalCount(data.total_count || 0);

        // Compute live stats
        if (items.length > 0) {
          const allLangs = new Set(
            items.map((r) => r.language).filter(Boolean),
          );
          const allTopics = new Set(items.flatMap((r) => r.topics || []));
          setStats({
            repos: data.total_count || items.length,
            languages: allLangs.size,
            topics: allTopics.size,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to fetch repositories");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const searchRef = useRef(null);
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "/") return;
      const active = document.activeElement;

      if (
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      )
        return;
      e.preventDefault();
      searchRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Initial load — most-starred repos
  useEffect(() => {
    fetchRepos("", filters, 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    fetchRepos(query, newFilters, 1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    setPage(1);
    fetchRepos(query, filters, 1);
  };

  const handleSurpriseMe = async () => {
    const randomQueries = [
      "react",
      "rust cli",
      "python ml",
      "go web",
      "typescript api",
      "swift ios",
      "kotlin android",
      "devtools",
      "data visualization",
      "game engine",
    ];
    const randomQuery =
      randomQueries[Math.floor(Math.random() * randomQueries.length)];
    setQuery(randomQuery);
    setPage(1);
    fetchRepos(randomQuery, filters, 1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRepos(query, filters, nextPage);
  };

  return (
    <div className="min-h-screen">
      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative overflow-hidden pt-8 pb-12 md:pt-12 md:pb-16">
        {/* Ambient orbs */}
        <div className="absolute -top-24 left-1/3 w-[500px] h-[500px] rounded-full bg-accent-gold/10 dark:bg-accent-gold/5 blur-3xl pointer-events-none animate-pulse-orb" />
        <div
          className="absolute top-48 -right-16 w-96 h-96 rounded-full bg-amber-400/8 dark:bg-amber-400/4 blur-3xl pointer-events-none animate-pulse-orb"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="absolute top-32 -left-16 w-72 h-72 rounded-full bg-amber-300/6 dark:bg-amber-300/3 blur-3xl pointer-events-none animate-pulse-orb"
          style={{ animationDelay: "-2s" }}
        />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-30 dark:opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="hero-entry hero-entry-1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-accent-gold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-gold" />
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.18em]">
              Open Source Explorer · Live Data
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hero-entry hero-entry-2 font-headline font-extrabold tracking-tighter text-gray-900 dark:text-gray-50 mb-6"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", lineHeight: 1.05 }}
          >
            Every Great Contribution
            <br className="hidden sm:block" />
            <span className="hero-gradient-text">Starts With a Fork</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-entry hero-entry-3 text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Explore repos, analyze contributors, track issues, and compare
            projects side-by-side — all powered by live GitHub data.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="hero-entry hero-entry-4 max-w-2xl mx-auto mb-6"
          >
            <div className="flex items-center bg-white dark:bg-[#161A22] border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-black/30 focus-within:border-accent-gold focus-within:shadow-accent-gold/20 transition-all duration-200">
              <FiSearch className="ml-5 text-gray-400 text-lg flex-shrink-0" />
              <input
                type="text"
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search repos, orgs, or owner/repo..."
                className="flex-1 px-4 py-4 bg-transparent text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="mr-2 px-5 py-2.5 bg-accent-gold text-white text-sm font-bold rounded-xl hover:bg-accent-gold-dark transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Surprise Me */}
          <button
            onClick={handleSurpriseMe}
            className="hero-entry hero-entry-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 glass border border-gray-200 dark:border-gray-700 rounded-xl hover:border-accent-gold hover:text-accent-gold dark:hover:text-accent-gold transition-all duration-200 hover:scale-[1.03]"
          >
            <FiShuffle className="text-base" />
            Surprise Me
          </button>
        </div>
      </section>

      {/* ═══════ QUICK STATS ═══════ */}
      <section className="bg-surface dark:bg-[#0F1117] py-8 border-y border-gray-200/40 dark:border-gray-800/40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <FiCode className="text-accent-gold text-lg" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-accent-gold font-headline">
                {stats.repos > 0 ? formatCompactNumber(stats.repos) : "—"}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Repos Found
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <FiGlobe className="text-signal-healthy text-lg" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-signal-healthy font-headline">
                {stats.languages > 0 ? stats.languages : "—"}
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
                {stats.topics > 0 ? stats.topics : "—"}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Topics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FILTERS + GRID ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filters */}
        <div className="mb-8 p-4 bg-white dark:bg-[#161A22] rounded-2xl border border-gray-200 dark:border-gray-800">
          <FilterChips
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
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
            : repos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
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
              No repos found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Forky couldn't find anything here — try a different search.
            </p>
          </div>
        )}

        {/* Load more */}
        {repos.length > 0 && repos.length < totalCount && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:border-accent-gold hover:text-accent-gold transition-all duration-200 disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin" /> : null}
              Load More Repos
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function formatCompactNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}
