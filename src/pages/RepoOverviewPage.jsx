import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { getCommits } from '@/api/github';
import { FiClock, FiGitCommit, FiStar, FiGitBranch, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { formatNumber, timeAgo } from '@/utils/format';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function RepoOverviewPage() {
  const { repo, languages } = useOutletContext();
  const { owner, repoName } = useParams();
  const [commits, setCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCommits(owner, repoName, 10);
        setCommits(Array.isArray(data) ? data : []);
      } catch {
        setCommits([]);
      } finally {
        setLoadingCommits(false);
      }
    }
    load();
  }, [owner, repoName]);

  const totalLangBytes = Object.values(languages || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <FiStar className="text-amber-500" />, label: 'Stars', value: formatNumber(repo.stargazers_count), bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { icon: <FiGitBranch className="text-signal-active" />, label: 'Forks', value: formatNumber(repo.forks_count), bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
          { icon: <FiAlertCircle className="text-signal-warn" />, label: 'Open Issues', value: formatNumber(repo.open_issues_count), bg: 'bg-orange-50 dark:bg-orange-950/20' },
          { icon: <FiCalendar className="text-signal-healthy" />, label: 'Created', value: formatDate(repo.created_at), bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
        ].map(metric => (
          <div key={metric.label} className={`${metric.bg} rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50`}>
            <div className="flex items-center gap-2 mb-1">{metric.icon}<span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{metric.label}</span></div>
            <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100 font-headline">{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Language Breakdown */}
      {totalLangBytes > 0 && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Languages</h3>
          <div className="space-y-2">
            {Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([lang, bytes]) => {
              const pct = ((bytes / totalLangBytes) * 100).toFixed(1);
              return (
                <div key={lang} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-24 truncate">{lang}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-accent-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {repo.topics.map(topic => (
              <span key={topic} className="text-xs font-medium bg-accent-gold/10 text-accent-gold px-2.5 py-1 rounded-full border border-accent-gold/20">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Commits */}
      <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <FiGitCommit className="text-accent-gold" />
          Recent Commits
        </h3>
        {loadingCommits ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 skeleton" />
                  <div className="h-3 w-1/3 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : commits.length > 0 ? (
          <div className="space-y-3">
            {commits.map((commit, i) => (
              <div key={commit.sha || i} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <img
                  src={commit.author?.avatar_url || `https://ui-avatars.com/api/?name=${commit.commit?.author?.name || 'U'}&size=32&background=D6A228&color=fff`}
                  alt={commit.commit?.author?.name}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-1 font-medium">{commit.commit?.message?.split('\n')[0]}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <FiClock className="text-[10px]" />
                    {commit.commit?.author?.name} · {timeAgo(commit.commit?.author?.date)}
                  </p>
                </div>
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-gray-400 hover:text-accent-gold transition-colors flex-shrink-0"
                >
                  {commit.sha?.slice(0, 7)}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <img src="/Forkling_logo.png" alt="Forky" style={{ width: 48, height: 48 }} className="object-contain" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Forky couldn't find any commits here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
