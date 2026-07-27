import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPullRequests } from '@/api/github';
import { FiGitPullRequest, FiExternalLink, FiClock, FiMessageSquare, FiFilter, FiGitMerge, FiCheck } from 'react-icons/fi';
import { timeAgo } from '@/utils/format';

export default function RepoPullRequestsPage() {
  const { owner, repoName } = useParams();
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('open');
  const [sort, setSort] = useState('created');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getPullRequests(owner, repoName, {
          state,
          sort,
          direction: 'desc',
          perPage: 30,
        });
        setPulls(Array.isArray(data) ? data : []);
      } catch {
        setPulls([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [owner, repoName, state, sort]);

  const sortOptions = [
    { key: 'created', label: '🕐 Newest' },
    { key: 'updated', label: '🔄 Recently Updated' },
    { key: 'popularity', label: '🔥 Most Commented' },
    { key: 'long-running', label: '⏳ Long Running' },
  ];

  function getPRStatusInfo(pr) {
    if (pr.merged_at) {
      return { icon: <FiGitMerge className="text-[10px]" />, label: 'Merged', color: 'bg-violet-500', dotColor: 'bg-violet-500' };
    }
    if (pr.state === 'closed') {
      return { icon: <FiGitPullRequest className="text-[10px]" />, label: 'Closed', color: 'bg-signal-danger', dotColor: 'bg-signal-danger' };
    }
    if (pr.draft) {
      return { icon: <FiGitPullRequest className="text-[10px]" />, label: 'Draft', color: 'bg-gray-400', dotColor: 'bg-gray-400' };
    }
    return { icon: <FiGitPullRequest className="text-[10px]" />, label: 'Open', color: 'bg-signal-healthy', dotColor: 'bg-signal-healthy' };
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FiFilter className="text-gray-400 text-sm" />
        {sortOptions.map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`chip ${sort === s.key ? 'active' : ''}`}
          >
            {s.label}
          </button>
        ))}
        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button
          onClick={() => setState(state === 'open' ? 'closed' : 'open')}
          className={`chip ${state === 'closed' ? 'active' : ''}`}
        >
          {state === 'open' ? '🟢 Open' : '🔴 Closed'}
        </button>
      </div>

      {/* PR List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 w-3/4 skeleton mb-2" />
              <div className="h-3 w-1/2 skeleton" />
            </div>
          ))}
        </div>
      ) : pulls.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center gap-3">
          <img src="/Forkling_logo.png" alt="Forky" style={{ width: 72, height: 72 }} className="object-contain" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            No Pull Requests Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Forky couldn't find any PRs — try toggling the state filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pulls.map(pr => {
            const status = getPRStatusInfo(pr);
            return (
              <div key={pr.id} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-accent-gold/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${status.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent-gold transition-colors line-clamp-1">
                        {pr.title}
                      </h4>
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-accent-gold transition-colors flex-shrink-0"
                      >
                        <FiExternalLink className="text-xs" />
                      </a>
                    </div>

                    {/* Labels + Draft/Merged badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pr.draft && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                          Draft
                        </span>
                      )}
                      {pr.merged_at && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
                          Merged
                        </span>
                      )}
                      {pr.labels?.map(label => (
                        <span
                          key={label.id}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            color: `#${label.color}`,
                            border: `1px solid #${label.color}40`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiClock className="text-[10px]" />
                        {timeAgo(pr.created_at)}
                      </span>
                      {pr.comments > 0 && (
                        <span className="flex items-center gap-1">
                          <FiMessageSquare className="text-[10px]" />
                          {pr.comments}
                        </span>
                      )}
                      {pr.review_comments > 0 && (
                        <span className="flex items-center gap-1">
                          <FiCheck className="text-[10px]" />
                          {pr.review_comments} reviews
                        </span>
                      )}
                      {pr.user && (
                        <span className="flex items-center gap-1">
                          <img src={pr.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                          {pr.user.login}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
                        {status.icon}
                        <span>#{pr.number}</span>
                      </span>
                      {pr.head?.label && (
                        <span className="hidden sm:inline text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {pr.head.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
