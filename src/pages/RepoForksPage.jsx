import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { getForks, getCompare } from '@/api/github';
import ForkyState from '@/components/ForkyState';
import {
  FiStar,
  FiGitBranch,
  FiArrowUp,
  FiArrowDown,
  FiExternalLink,
  FiActivity,
  FiClock,
} from 'react-icons/fi';

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function RepoForksPage() {
  const { owner, repoName } = useParams();
  const { repo } = useOutletContext();
  const [forks, setForks] = useState([]);
  const [compareData, setCompareData] = useState({});
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getForks(owner, repoName, 30, 1);
        const items = Array.isArray(data) ? data : [];
        setForks(items);

        // Fetch compare data for top forks to show ahead/behind
        if (items.length > 0) {
          setComparing(true);
          const base = repo.default_branch || 'main';
          const results = {};

          // Batch compare calls (max 10 to respect rate limits)
          const toCompare = items.slice(0, 10);
          const settled = await Promise.allSettled(
            toCompare.map(async (fork) => {
              const forkBranch = fork.default_branch || 'main';
              const forkOwner = fork.owner?.login;
              if (!forkOwner) return null;
              try {
                const cmp = await getCompare(owner, repoName, base, `${forkOwner}:${forkBranch}`);
                return { key: fork.full_name, data: cmp };
              } catch {
                return null;
              }
            })
          );

          settled.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              results[result.value.key] = result.value.data;
            }
          });

          setCompareData(results);
          setComparing(false);
        }
      } catch {
        setForks([]);
      } finally {
        setLoading(false);
        setComparing(false);
      }
    }
    load();
  }, [owner, repoName, repo.default_branch]);

  const isDivergent = (fork) => {
    const cmp = compareData[fork.full_name];
    if (cmp) {
      if (cmp.ahead_by > 5) return true;
      if (cmp.behind_by > 20) return true;
    }
    // Active if pushed recently (within 90 days)
    const pushed = fork.pushed_at ? new Date(fork.pushed_at).getTime() : 0;
    if (pushed && Date.now() - pushed < 90 * 86400000 && fork.stargazers_count > 0) return true;
    return false;
  };

  const filteredForks = forks.filter((fork) => {
    if (filter === 'divergent') return isDivergent(fork);
    if (filter === 'ahead') {
      const cmp = compareData[fork.full_name];
      return cmp && cmp.ahead_by > 0;
    }
    if (filter === 'active') {
      const pushed = fork.pushed_at ? new Date(fork.pushed_at).getTime() : 0;
      return pushed && Date.now() - pushed < 90 * 86400000;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 skeleton rounded-lg" />
          <div className="h-8 w-24 skeleton rounded-lg" />
          <div className="h-8 w-24 skeleton rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 skeleton" />
              <div className="h-3 w-64 skeleton" />
            </div>
            <div className="h-6 w-16 skeleton rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (forks.length === 0) {
    return (
      <div className="py-16">
        <ForkyState message="No forks found for this repository." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold font-headline text-gray-900 dark:text-gray-100">
            {formatNumber(forks.length)} Fork{forks.length !== 1 ? 's' : ''}
          </h2>
          {comparing && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium animate-pulse">
              Checking ahead/behind...
            </span>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'divergent', label: 'Divergent' },
            { key: 'ahead', label: 'Ahead' },
            { key: 'active', label: 'Active' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filter === f.key
                  ? 'bg-white dark:bg-gray-700 text-accent-gold shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-signal-active" /> Divergent fork (ahead or significantly modified)
        </span>
        <span className="flex items-center gap-1">
          <FiArrowUp className="text-signal-healthy" /> Ahead of upstream
        </span>
        <span className="flex items-center gap-1">
          <FiArrowDown className="text-signal-danger" /> Behind upstream
        </span>
      </div>

      {/* Fork list */}
      <div className="space-y-3">
        {filteredForks.map((fork) => {
          const cmp = compareData[fork.full_name];
          const divergent = isDivergent(fork);
          const ahead = cmp?.ahead_by || 0;
          const behind = cmp?.behind_by || 0;

          return (
            <div
              key={fork.full_name}
              className={`bg-white dark:bg-[#161A22] border rounded-2xl p-5 transition-all hover:shadow-md ${
                divergent
                  ? 'border-signal-active/30 dark:border-signal-active/20'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <img
                  src={fork.owner?.avatar_url}
                  alt={fork.owner?.login}
                  className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={fork.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-accent-gold dark:hover:text-accent-gold transition-colors"
                    >
                      {fork.full_name}
                    </a>
                    <FiExternalLink className="text-xs text-gray-400" />
                    {divergent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-signal-active/10 text-signal-active rounded-full">
                        <FiActivity className="text-[10px]" />
                        Divergent
                      </span>
                    )}
                  </div>

                  {fork.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {fork.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <FiStar className="text-amber-500" />
                      {formatNumber(fork.stargazers_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiGitBranch />
                      {formatNumber(fork.forks_count)} forks
                    </span>
                    {fork.language && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[11px] font-medium">
                        {fork.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiClock className="text-[11px]" />
                      Updated {timeAgo(fork.pushed_at)}
                    </span>
                  </div>
                </div>

                {/* Ahead / Behind badges */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {cmp && (
                    <>
                      {ahead > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-signal-healthy/10 text-signal-healthy rounded-full">
                          <FiArrowUp className="text-[11px]" />
                          {ahead} ahead
                        </span>
                      )}
                      {behind > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-signal-danger/10 text-signal-danger rounded-full">
                          <FiArrowDown className="text-[11px]" />
                          {behind} behind
                        </span>
                      )}
                      {ahead === 0 && behind === 0 && (
                        <span className="px-2 py-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                          Up to date
                        </span>
                      )}
                    </>
                  )}
                  {!cmp && !comparing && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full">
                      —
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredForks.length === 0 && forks.length > 0 && (
        <div className="py-12">
          <ForkyState message={`No ${filter} forks found.`} size="sm" />
        </div>
      )}
    </div>
  );
}
