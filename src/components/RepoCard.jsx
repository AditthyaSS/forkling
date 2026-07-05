import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { FiStar, FiGitBranch, FiAlertCircle, FiEye, FiPlusCircle, FiCheck, FiCopy } from 'react-icons/fi';

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function getYearsActive(createdAt) {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now - created) / (365.25 * 86400000)));
}

export default function RepoCard({ repo }) {
  const { addToCompare, removeFromCompare, isInCompare, compareList } = useApp();
  const inCompare = isInCompare(repo.full_name);
  const years = getYearsActive(repo.created_at);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();

    navigator.clipboard.writeText(repo.full_name).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(repo.full_name);
    } else {
      addToCompare(repo);
    }
  };

  return (
    <div className="group bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 card-hover flex flex-col h-full">
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={repo.owner?.avatar_url || `https://ui-avatars.com/api/?name=${repo.owner?.login || 'R'}&background=D6A228&color=fff&size=40`}
          alt={repo.owner?.login}
          className="w-10 h-10 rounded-xl flex-shrink-0 border border-gray-200 dark:border-gray-700"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-accent-gold transition-colors">
            {repo.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{repo.owner?.login}</p>
        </div>
        <button
          onClick={handleCopy}
          title="Copy repo name"
          aria-label="Copy repository name"
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
        >
          {isCopied ? <FiCheck className="text-emerald-500" /> : <FiCopy className="text-sm" />}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2 flex-1">
        {repo.description || 'No description available.'}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {years > 0 && (
          <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
            {years}y active
          </span>
        )}
        {repo.language && (
          <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {repo.language}
          </span>
        )}
        {repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' && (
          <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            {repo.license.spdx_id}
          </span>
        )}
      </div>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics.slice(0, 4).map(topic => (
            <span key={topic} className="text-[10px] font-medium bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
              {topic}
            </span>
          ))}
          {repo.topics.length > 4 && (
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-1">
              +{repo.topics.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="flex items-center gap-1" title="Stars">
          <FiStar className="text-amber-500" />
          {formatNumber(repo.stargazers_count)}
        </span>
        <span className="flex items-center gap-1" title="Forks">
          <FiGitBranch className="text-gray-400" />
          {formatNumber(repo.forks_count)}
        </span>
        <span className="flex items-center gap-1" title="Open Issues">
          <FiAlertCircle className="text-gray-400" />
          {formatNumber(repo.open_issues_count)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCompare}
          disabled={!inCompare && compareList.length >= 3}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${inCompare
            ? 'bg-accent-gold/10 border-accent-gold text-accent-gold'
            : compareList.length >= 3
              ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent-gold hover:text-accent-gold'
            }`}
        >
          {inCompare ? <FiCheck className="text-sm" /> : <FiPlusCircle className="text-sm" />}
          {inCompare ? 'Added' : 'Compare'}
        </button>
        <Link
          to={`/repo/${repo.owner?.login}/${repo.name}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-accent-gold hover:text-white dark:hover:bg-accent-gold dark:hover:text-white transition-all duration-200"
        >
          <FiEye className="text-sm" />
          View
        </Link>
      </div>
    </div>
  );
}
