import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getIssues } from '@/api/github';
import { FiMessageSquare, FiExternalLink, FiClock, FiTag, FiFilter } from 'react-icons/fi';
import { timeAgo } from '@/utils/format';

export default function RepoIssuesPage() {
  const { owner, repoName } = useParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('good-first-issue'); // '' | 'good-first-issue' | 'help-wanted' | 'bug'
  const [state, setState] = useState('open');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getIssues(owner, repoName, {
          state,
          labels: filter,
          sort: 'created',
          direction: 'desc',
          perPage: 30,
        });
        setIssues(Array.isArray(data) ? data.filter(i => !i.pull_request) : []);
      } catch {
        setIssues([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [owner, repoName, filter, state]);

  const labelFilters = [
    { key: 'good-first-issue', label: '🌱 Good First Issue' },
    { key: 'help-wanted', label: '🙋 Help Wanted' },
    { key: 'bug', label: '🐛 Bug' },
    { key: '', label: '📋 All Issues' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FiFilter className="text-gray-400 text-sm" />
        {labelFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
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

      {/* Issue List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 w-3/4 skeleton mb-2" />
              <div className="h-3 w-1/2 skeleton" />
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center gap-3">
          <img src="/Forkling_logo.png" alt="Forky" style={{ width: 72, height: 72 }} className="object-contain" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            {filter === 'good-first-issue' ? 'No Good First Issues Right Now' : 'No Issues Found'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Forky couldn't find anything here — try a different filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map(issue => (
            <div key={issue.id} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-accent-gold/50 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${issue.state === 'open' ? 'bg-signal-healthy' : 'bg-signal-danger'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent-gold transition-colors line-clamp-1">
                      {issue.title}
                    </h4>
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-accent-gold transition-colors flex-shrink-0"
                    >
                      <FiExternalLink className="text-xs" />
                    </a>
                  </div>

                  {/* Labels */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {issue.labels?.map(label => (
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
                      {timeAgo(issue.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMessageSquare className="text-[10px]" />
                      {issue.comments}
                    </span>
                    {issue.assignee && (
                      <span className="flex items-center gap-1">
                        <img src={issue.assignee.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                        {issue.assignee.login}
                      </span>
                    )}
                    <span className="text-gray-300 dark:text-gray-600">#{issue.number}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
