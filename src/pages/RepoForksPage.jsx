/**
 * RepoForksPage — Forks tab for the Repository Detail view.
 *
 * Sections:
 *   1. Overview summary cards (total forks, most starred, recently updated, active divergent)
 *   2. Top forks sorted by stars
 *   3. Recently active forks with activity badges
 *   4. Ahead / Behind status compared to upstream
 *   5. Active Divergent Fork Detector (heuristic badges)
 *   6. Stars distribution bar chart (Recharts)
 *   7. Search & filter controls
 *   8/9/10. Empty / Loading / Error states via ForkyState
 *
 * API:  GET /repos/{owner}/{repo}/forks?sort=stargazers  (getForks)
 *       GET /repos/{owner}/{repo}/compare/{base}...{head} (compareRefs) — batched
 * Cache: IndexedDB via fetchWithCache (automatic through api/github.js)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import {
  FiGitBranch, FiStar, FiAlertCircle, FiExternalLink,
  FiClock, FiArrowUp, FiArrowDown, FiMinus, FiFilter,
  FiSearch, FiUsers, FiZap,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import ForkyState from '@/components/ForkyState';
import { getForks, compareRefs } from '@/api/github';
import { formatNumber, timeAgo } from '@/utils/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Derive heuristic divergence badges for a fork.
 * Returns an array of badge descriptors { label, color, title }.
 * These are clearly labelled as heuristic indicators, not guarantees.
 */
function getDivergenceBadges(fork, comparison) {
  const badges = [];
  const aheadBy = comparison?.ahead_by ?? 0;
  const starsCount = fork.stargazers_count ?? 0;
  const age = daysAgo(fork.pushed_at);
  const isRecentlyActive = age <= 90;

  // Potential Successor: very far ahead AND actively maintained
  if (aheadBy >= 50 && isRecentlyActive && starsCount >= 10) {
    badges.push({ label: 'Potential Successor', color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/40' });
  }

  // Actively Maintained: pushed within 30 days
  if (age <= 30) {
    badges.push({ label: 'Actively Maintained', color: 'text-signal-healthy bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40' });
  }

  // Community Favourite: high stars relative to parent
  if (starsCount >= 100) {
    badges.push({ label: 'Community Favorite', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40' });
  }

  // Alternative Project: significantly ahead and has its own star presence
  if (aheadBy >= 20 && starsCount >= 5) {
    badges.push({ label: 'Alternative Project', color: 'text-signal-active bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40' });
  }

  return badges;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Summary card matching the Overview page metric card style */
function SummaryCard({ icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100 font-headline truncate">
        {value}
      </div>
    </div>
  );
}

/**
 * Badge indicating ahead / behind status versus upstream.
 * Uses the GitHub compare endpoint result.
 */
function ComparisonBadge({ comparison, loading }) {
  if (loading) {
    return <span className="w-24 h-5 skeleton rounded-full inline-block" />;
  }
  if (!comparison) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">Unknown</span>;
  }

  const { ahead_by: ahead = 0, behind_by: behind = 0, status } = comparison;

  if (status === 'identical' || (ahead === 0 && behind === 0)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full badge-healthy">
        <FiMinus className="text-[9px]" /> Synchronized
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 flex-wrap text-[10px] font-bold">
      {ahead > 0 && (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
          <FiArrowUp className="text-[9px]" /> {ahead} ahead
        </span>
      )}
      {behind > 0 && (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-signal-warn border border-orange-200 dark:border-orange-800/40">
          <FiArrowDown className="text-[9px]" /> {behind} behind
        </span>
      )}
    </span>
  );
}

/** Activity recency badge shown on recently-active forks */
function ActivityBadge({ pushedAt }) {
  const days = daysAgo(pushedAt);
  if (days <= 7) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-healthy">Active this week</span>;
  if (days <= 30) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-healthy">Active this month</span>;
  if (days <= 90) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-warn">Active this quarter</span>;
  return null;
}

/**
 * Single fork card used in the Top Forks and Divergent Forks lists.
 * Shows all required metadata plus comparison status and divergence badges.
 */
function ForkCard({ fork, comparison, compLoading, showDivergence = false }) {
  const badges = showDivergence ? getDivergenceBadges(fork, comparison) : [];

  return (
    <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:border-accent-gold/50 transition-colors group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={fork.owner?.avatar_url || `https://ui-avatars.com/api/?name=${fork.owner?.login}&size=40&background=D6A228&color=fff`}
          alt={fork.owner?.login}
          className="w-9 h-9 rounded-xl flex-shrink-0 border border-gray-200 dark:border-gray-700"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">{fork.owner?.login} /</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent-gold transition-colors truncate">
              {fork.name}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
            {fork.description || <span className="italic">No description</span>}
          </p>
        </div>
        <a
          href={fork.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-gray-400 hover:text-accent-gold transition-colors"
          aria-label={`Open ${fork.full_name} on GitHub`}
        >
          <FiExternalLink className="text-sm" />
        </a>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span className="flex items-center gap-1" title="Stars">
          <FiStar className="text-amber-500" /> {formatNumber(fork.stargazers_count)}
        </span>
        <span className="flex items-center gap-1" title="Forks">
          <FiGitBranch /> {formatNumber(fork.forks_count)}
        </span>
        <span className="flex items-center gap-1" title="Open Issues">
          <FiAlertCircle /> {formatNumber(fork.open_issues_count)}
        </span>
        <span className="flex items-center gap-1" title="Last updated">
          <FiClock /> {timeAgo(fork.pushed_at)}
        </span>
        {fork.default_branch && (
          <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {fork.default_branch}
          </span>
        )}
      </div>

      {/* Comparison badge + divergence badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <ComparisonBadge comparison={comparison} loading={compLoading} />
        {badges.map((b) => (
          <span key={b.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color}`} title="Heuristic indicator — not a guarantee">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Loading skeleton for a fork card */
function ForkCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-40 skeleton" />
          <div className="h-3 w-56 skeleton" />
        </div>
      </div>
      <div className="flex gap-4 mb-3">
        <div className="h-3 w-10 skeleton" />
        <div className="h-3 w-10 skeleton" />
        <div className="h-3 w-10 skeleton" />
        <div className="h-3 w-16 skeleton" />
      </div>
      <div className="h-5 w-28 skeleton rounded-full" />
    </div>
  );
}

/**
 * Stars distribution bar chart.
 * Buckets forks into star ranges and visualises their distribution.
 */
function StarsDistributionChart({ forks }) {
  // Build logarithmic star buckets
  const buckets = [
    { label: '0', min: 0, max: 0 },
    { label: '1–4', min: 1, max: 4 },
    { label: '5–19', min: 5, max: 19 },
    { label: '20–99', min: 20, max: 99 },
    { label: '100–499', min: 100, max: 499 },
    { label: '500+', min: 500, max: Infinity },
  ];

  const data = buckets.map((b) => ({
    range: b.label,
    count: forks.filter((f) => f.stargazers_count >= b.min && f.stargazers_count <= b.max).length,
  }));

  // Only render if there's meaningful variance
  if (data.every((d) => d.count === 0)) return null;

  return (
    <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Stars Distribution</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">How many forks fall into each star bracket</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: -10 }}>
          <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#161A22', border: '1px solid #23272F', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#F3F4F6', fontWeight: 700 }}
            itemStyle={{ color: '#D6A228' }}
            formatter={(v) => [v, 'Forks']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.count > 0 ? '#D6A228' : '#374151'}
                fillOpacity={entry.count > 0 ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function RepoForksPage() {
  const { owner, repoName } = useParams();
  // repo.forks_count comes from the parent layout context
  const { repo } = useOutletContext();

  // ── State ──
  const [forks, setForks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // comparisons keyed by fork full_name → { ahead_by, behind_by, status }
  const [comparisons, setComparisons] = useState({});
  // track which comparisons are still in-flight
  const [compLoading, setCompLoading] = useState({});

  // Search & filter
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('stars'); // 'stars' | 'updated' | 'diverged' | 'owner'

  // ── Fetch forks ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setForks([]);
      setComparisons({});

      try {
        // Fetch up to 100 forks sorted by stars (covers the vast majority of repos)
        const data = await getForks(owner, repoName, 'stargazers', 100, 1);
        if (cancelled) return;
        const items = Array.isArray(data) ? data : [];
        setForks(items);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load forks');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [owner, repoName]);

  // ── Fetch comparisons for the top 15 forks by stars ──────────────────────
  // We limit to 15 to stay within rate limits for unauthenticated users.
  // With a PAT the limit is higher; users can authenticate via Settings.
  useEffect(() => {
    if (forks.length === 0 || !repo?.default_branch) return;

    // Operate on the top 15 forks by stars — already sorted from the API
    const targets = forks.slice(0, 15);

    async function fetchComparisons() {
      for (const fork of targets) {
        const key = fork.full_name;
        // head ref format: "fork_owner:fork_default_branch"
        const head = `${fork.owner.login}:${fork.default_branch || 'main'}`;

        setCompLoading((prev) => ({ ...prev, [key]: true }));
        try {
          const result = await compareRefs(owner, repoName, repo.default_branch, head);
          setComparisons((prev) => ({
            ...prev,
            [key]: {
              ahead_by: result.ahead_by ?? 0,
              behind_by: result.behind_by ?? 0,
              status: result.status ?? 'unknown',
            },
          }));
        } catch {
          // Comparison failed (e.g. no common ancestor) — mark as unknown
          setComparisons((prev) => ({ ...prev, [key]: null }));
        } finally {
          setCompLoading((prev) => ({ ...prev, [key]: false }));
        }
      }
    }

    fetchComparisons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forks, repo?.default_branch]);

  // ── Derived values ────────────────────────────────────────────────────────

  /** Most starred fork */
  const mostStarred = useMemo(
    () => forks.reduce((best, f) => (f.stargazers_count > (best?.stargazers_count ?? -1) ? f : best), null),
    [forks],
  );

  /** Most recently pushed fork */
  const recentlyUpdated = useMemo(
    () => forks.reduce((best, f) => {
      if (!best) return f;
      return new Date(f.pushed_at) > new Date(best.pushed_at) ? f : best;
    }, null),
    [forks],
  );

  /** Count of forks with meaningful divergence (ahead by ≥ 1) */
  const activeDivergentCount = useMemo(
    () => Object.values(comparisons).filter((c) => c && c.ahead_by >= 1).length,
    [comparisons],
  );

  /** Apply search filter and sort */
  const filteredForks = useMemo(() => {
    let list = [...forks];

    // Search by name or owner
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.name?.toLowerCase().includes(q) ||
          f.owner?.login?.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q),
      );
    }

    // Sort
    switch (sortBy) {
      case 'updated':
        list.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
        break;
      case 'diverged':
        // Sort by ahead_by descending; forks without comparison data go last
        list.sort((a, b) => {
          const aAhead = comparisons[a.full_name]?.ahead_by ?? -1;
          const bAhead = comparisons[b.full_name]?.ahead_by ?? -1;
          return bAhead - aAhead;
        });
        break;
      case 'owner':
        list.sort((a, b) => (a.owner?.login ?? '').localeCompare(b.owner?.login ?? ''));
        break;
      case 'stars':
      default:
        list.sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0));
        break;
    }

    return list;
  }, [forks, search, sortBy, comparisons]);

  /** Forks active within the last 90 days */
  const recentlyActiveForks = useMemo(
    () => filteredForks.filter((f) => daysAgo(f.pushed_at) <= 90),
    [filteredForks],
  );

  /** Forks with meaningful divergence badges */
  const divergentForks = useMemo(
    () =>
      filteredForks.filter((f) => {
        const cmp = comparisons[f.full_name];
        const badges = getDivergenceBadges(f, cmp);
        return badges.length > 0;
      }),
    [filteredForks, comparisons],
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 animate-pulse">
              <div className="h-3 w-20 skeleton mb-2" />
              <div className="h-7 w-16 skeleton" />
            </div>
          ))}
        </div>
        {/* Fork cards skeleton */}
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <div className="h-4 w-32 skeleton mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ForkCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="py-16 flex flex-col items-center gap-2">
        <ForkyState
          message={`Forky ran into a problem loading forks: ${error}`}
          size="lg"
        />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (forks.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-2">
        <ForkyState
          message="No forks yet — be the first to branch out!"
          size="lg"
        />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── 1. Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={<FiGitBranch className="text-signal-active" />}
          label="Total Forks"
          value={formatNumber(repo?.forks_count ?? forks.length)}
          bg="bg-indigo-50 dark:bg-indigo-950/20"
        />
        <SummaryCard
          icon={<FiStar className="text-amber-500" />}
          label="Most Starred"
          value={mostStarred ? `${formatNumber(mostStarred.stargazers_count)} ★` : '—'}
          bg="bg-amber-50 dark:bg-amber-950/20"
        />
        <SummaryCard
          icon={<FiClock className="text-signal-healthy" />}
          label="Recently Updated"
          value={recentlyUpdated ? timeAgo(recentlyUpdated.pushed_at) : '—'}
          bg="bg-emerald-50 dark:bg-emerald-950/20"
        />
        <SummaryCard
          icon={<FiZap className="text-violet-500" />}
          label="Active Divergent"
          value={activeDivergentCount > 0 ? activeDivergentCount : '—'}
          bg="bg-violet-50 dark:bg-violet-950/20"
        />
      </div>

      {/* ── 7. Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder="Search forks by name, owner, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-accent-gold transition-colors"
          />
        </div>
        {/* Sort chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <FiFilter className="text-gray-400 text-sm flex-shrink-0" />
          {[
            { key: 'stars', label: '⭐ Most Starred' },
            { key: 'updated', label: '🕐 Recently Updated' },
            { key: 'diverged', label: '⚡ Most Diverged' },
            { key: 'owner', label: '🔤 Owner Name' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`chip ${sortBy === opt.key ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered-empty state */}
      {filteredForks.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-2">
          <ForkyState
            message="Forky couldn't find any forks matching that search."
            size="md"
          />
        </div>
      )}

      {filteredForks.length > 0 && (
        <>
          {/* ── 6. Stars Distribution Chart ── */}
          <StarsDistributionChart forks={filteredForks} />

          {/* ── 2. Top Forks (sorted by stars by default) ── */}
          <section>
            <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <FiStar className="text-amber-500" />
                Top Forks
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Showing {filteredForks.length} fork{filteredForks.length !== 1 ? 's' : ''}.
                Comparison data available for the top 15 by stars.
              </p>
              <div className="space-y-3">
                {filteredForks.map((fork) => (
                  <ForkCard
                    key={fork.id}
                    fork={fork}
                    comparison={comparisons[fork.full_name]}
                    compLoading={!!compLoading[fork.full_name]}
                    showDivergence={false}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ── 3. Recently Active Forks ── */}
          {recentlyActiveForks.length > 0 && (
            <section>
              <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <FiClock className="text-signal-healthy" />
                  Recently Active Forks
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Forks that have seen activity in the last 90 days.
                </p>
                <div className="space-y-3">
                  {recentlyActiveForks.map((fork) => (
                    <div
                      key={fork.id}
                      className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-accent-gold/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={fork.owner?.avatar_url}
                          alt={fork.owner?.login}
                          className="w-8 h-8 rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent-gold transition-colors truncate">
                              {fork.owner?.login}/{fork.name}
                            </span>
                            <a
                              href={fork.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-accent-gold transition-colors"
                              aria-label="Open on GitHub"
                            >
                              <FiExternalLink className="text-xs" />
                            </a>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FiClock className="text-[10px]" />
                              Updated {timeAgo(fork.pushed_at)}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(fork.pushed_at)}
                            </span>
                            <ActivityBadge pushedAt={fork.pushed_at} />
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <FiStar className="text-amber-500" />
                            {formatNumber(fork.stargazers_count)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 4 + 5. Ahead/Behind Status + Active Divergent Fork Detector ── */}
          {divergentForks.length > 0 && (
            <section>
              <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiZap className="text-violet-500" />
                    Active Divergent Forks
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Forks showing signs of active independent development.
                  Badges are heuristic indicators — not guarantees.
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4 italic">
                  Signals: commits ahead of upstream · recently pushed · high stars · active maintenance
                </p>
                <div className="space-y-3">
                  {divergentForks.map((fork) => (
                    <ForkCard
                      key={fork.id}
                      fork={fork}
                      comparison={comparisons[fork.full_name]}
                      compLoading={!!compLoading[fork.full_name]}
                      showDivergence
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Fallback when comparisons haven't loaded yet for the divergent section */}
          {divergentForks.length === 0 && Object.keys(comparisons).length < Math.min(forks.length, 15) && (
            <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                <FiZap className="text-violet-500" />
                Active Divergent Forks
              </h3>
              <div className="flex items-center gap-3">
                <ForkyState
                  message="Forky is comparing forks against upstream — hang tight."
                  size="sm"
                  spin
                />
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
