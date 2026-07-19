import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getRepo, getContributors, getCommunityProfile, searchRepos } from '@/api/github';
import { FiPlus, FiX, FiSearch, FiStar, FiGitBranch, FiAlertCircle, FiShield, FiUsers, FiClock, FiTrash2 } from 'react-icons/fi';

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare, addToCompare } = useApp();
  const [repoData, setRepoData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch full data for compare list items
  useEffect(() => {
    async function loadAll() {
      if (compareList.length === 0) return;
      setLoading(true);
      const results = {};
      await Promise.all(
        compareList.map(async (item) => {
          try {
            const [repo, contribs, community] = await Promise.all([
              getRepo(item.owner, item.name),
              getContributors(item.owner, item.name, 5).catch(() => []),
              getCommunityProfile(item.owner, item.name).catch(() => null),
            ]);
            results[item.full_name] = {
              repo,
              contributors: Array.isArray(contribs) ? contribs.slice(0, 5) : [],
              health: community?.health_percentage || 0,
            };
          } catch {
            results[item.full_name] = null;
          }
        })
      );
      setRepoData(results);
      setLoading(false);
    }
    loadAll();
  }, [compareList]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await searchRepos(searchQuery, {}, 1, 5);
      setSearchResults(data.items || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddRepo = (repo) => {
    addToCompare(repo);
    setSearchQuery('');
    setSearchResults([]);
  };

  const slots = [0, 1, 2];
  const COMPARE_METRICS = [
    { key: 'stars', label: 'Stars', icon: <FiStar className="text-amber-500" />, getValue: (d) => formatNumber(d?.repo?.stargazers_count) },
    { key: 'forks', label: 'Forks', icon: <FiGitBranch />, getValue: (d) => formatNumber(d?.repo?.forks_count) },
    { key: 'issues', label: 'Open Issues', icon: <FiAlertCircle />, getValue: (d) => formatNumber(d?.repo?.open_issues_count) },
    { key: 'health', label: 'Health Score', icon: <FiShield />, getValue: (d) => d?.health ? `${d.health}%` : 'N/A' },
    { key: 'license', label: 'License', icon: <FiShield />, getValue: (d) => d?.repo?.license?.spdx_id || 'None' },
    { key: 'language', label: 'Language', icon: null, getValue: (d) => d?.repo?.language || '—' },
    { key: 'pushed', label: 'Last Push', icon: <FiClock />, getValue: (d) => formatDate(d?.repo?.pushed_at) },
    { key: 'created', label: 'Created', icon: <FiClock />, getValue: (d) => formatDate(d?.repo?.created_at) },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-gray-900 dark:text-gray-100 mb-3">
          Compare <span className="hero-gradient-text">Repos</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Select up to 3 repositories to compare side-by-side. Add repos from the home page or search below.
        </p>
      </div>

      {/* Repo Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {slots.map(i => {
          const item = compareList[i];
          const data = item ? repoData[item.full_name] : null;

          if (!item) {
            return (
              <div key={i} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] text-gray-400 dark:text-gray-500">
                <FiPlus className="text-3xl mb-2" />
                <span className="text-sm font-semibold">Add Repo</span>
              </div>
            );
          }

          return (
<div key={item.full_name} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 relative card-hover">              <button
                onClick={() => removeFromCompare(item.full_name)}
                className="absolute top-3 right-3 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
              >
                <FiX className="text-gray-400 hover:text-signal-danger text-sm" />
              </button>
              {loading || !data ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 w-10 rounded-xl skeleton" />
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-3 w-full skeleton" />
                </div>
              ) : (
                <>
                  <img src={data.repo?.owner?.avatar_url} alt="" className="w-10 h-10 rounded-xl mb-3 border border-gray-200 dark:border-gray-700" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{data.repo?.full_name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{data.repo?.description}</p>
                  {/* Top contributors avatars */}
                  <div className="flex -space-x-2 mt-3">
                    {data.contributors?.map(c => (
                      <img key={c.id} src={c.avatar_url} alt={c.login} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#161A22]" title={c.login} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Search to add */}
      {compareList.length < 3 && (
        <div className="max-w-lg mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-700 rounded-xl px-3">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search repos to compare..."
                className="flex-1 py-2.5 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <button type="submit" disabled={searching} className="px-5 py-2.5 text-sm font-bold bg-accent-gold text-white rounded-xl hover:bg-accent-gold-dark transition-colors">
              {searching ? '...' : 'Search'}
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 shadow-lg">
              {searchResults.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => handleAddRepo(repo)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <img src={repo.owner?.avatar_url} alt="" className="w-7 h-7 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate block">{repo.full_name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{repo.description}</span>
                  </div>
                  <FiPlus className="text-accent-gold flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {compareList.length > 0 && Object.keys(repoData).length > 0 && !loading && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Metric</th>
                {compareList.map(item => (
                  <th key={item.full_name} className="text-center px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {COMPARE_METRICS.map(metric => (
                <tr key={metric.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    {metric.icon} {metric.label}
                  </td>
                  {compareList.map(item => {
                    const d = repoData[item.full_name];
                    return (
                      <td key={item.full_name} className="text-center px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {metric.getValue(d)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clear all */}
      {compareList.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={clearCompare}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-signal-danger transition-colors"
          >
            <FiTrash2 className="text-sm" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
