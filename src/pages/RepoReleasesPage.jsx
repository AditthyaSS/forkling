import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getReleases } from '@/api/github';
import { timeAgo, formatNumber } from '@/utils/format';
import ForkyState from '@/components/ForkyState';
import {
  FiTag,
  FiDownload,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
  FiCalendar,
  FiClock,
  FiStar,
} from 'react-icons/fi';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'latest', label: 'Latest' },
  { key: 'prerelease', label: 'Pre-release' },
];

function ReleaseSummary({ releases }) {
  const latest = releases.find((r) => !r.prerelease && !r.draft) || releases[0];
  const totalDownloads = releases.reduce((sum, r) => {
    return sum + (r.assets || []).reduce((a, asset) => a + (asset.download_count || 0), 0);
  }, 0);

  const oldest = releases[releases.length - 1];
  const newest = releases[0];
  let spanLabel = '';
  if (oldest && newest && oldest !== newest) {
    const diffMs = new Date(newest.published_at || newest.created_at) - new Date(oldest.published_at || oldest.created_at);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days >= 365) {
      spanLabel = `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}mo`;
    } else if (days >= 30) {
      spanLabel = `${Math.floor(days / 30)} months`;
    } else {
      spanLabel = `${days} days`;
    }
  }

  const stats = [
    { icon: FiPackage, label: 'Total Releases', value: releases.length },
    { icon: FiTag, label: 'Latest', value: latest?.tag_name || '—' },
    { icon: FiDownload, label: 'Downloads', value: formatNumber(totalDownloads) },
    { icon: FiClock, label: 'Span', value: spanLabel || '—' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center"
        >
          <stat.icon className="mx-auto text-accent-gold text-lg mb-1.5" />
          <div className="text-lg font-extrabold text-gray-900 dark:text-gray-100 font-headline">
            {stat.value}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReleaseCard({ release, side, index }) {
  const [expanded, setExpanded] = useState(false);

  const date = release.published_at || release.created_at;
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const totalDownloads = (release.assets || []).reduce(
    (sum, a) => sum + (a.download_count || 0),
    0
  );

  const body = release.body || '';
  const isLong = body.length > 200;
  const displayBody = expanded ? body : body.slice(0, 200);

  const isLatest = !release.prerelease && !release.draft && index === 0;

  return (
    <div
      className={`timeline-card ${side}`}
      style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
    >
      <div
        className={`bg-white dark:bg-[#161A22] border rounded-2xl p-5 ${
          isLatest
            ? 'border-accent-gold/40 dark:border-accent-gold/30 shadow-lg shadow-accent-gold/5'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <FiTag className="text-accent-gold flex-shrink-0" />
            <span className="font-extrabold text-gray-900 dark:text-gray-100 font-headline text-sm">
              {release.tag_name}
            </span>
            {isLatest && (
              <span className="badge-healthy text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Latest
              </span>
            )}
            {release.prerelease && (
              <span className="badge-warn text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Pre-release
              </span>
            )}
            {release.draft && (
              <span className="badge-danger text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Draft
              </span>
            )}
          </div>
          <a
            href={release.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-accent-gold transition-colors flex-shrink-0"
            aria-label="View on GitHub"
          >
            <FiExternalLink className="text-sm" />
          </a>
        </div>

        {/* Title */}
        {release.name && release.name !== release.tag_name && (
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
            {release.name}
          </h4>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <FiCalendar className="text-[11px]" />
            {formattedDate}
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>{timeAgo(date)}</span>
          {release.author && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="flex items-center gap-1.5">
                <img
                  src={release.author.avatar_url}
                  alt={release.author.login}
                  className="w-4 h-4 rounded-full"
                />
                {release.author.login}
              </span>
            </>
          )}
        </div>

        {/* Body */}
        {body && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words font-mono bg-gray-50 dark:bg-[#0B0D11] rounded-xl p-3 border border-gray-100 dark:border-gray-800/50 max-h-64 overflow-y-auto">
              {displayBody}
              {isLong && !expanded && '…'}
            </div>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1.5 text-[11px] font-semibold text-accent-gold hover:text-accent-gold-dark flex items-center gap-0.5 transition-colors"
              >
                {expanded ? (
                  <>
                    Show less <FiChevronUp className="text-xs" />
                  </>
                ) : (
                  <>
                    Show more <FiChevronDown className="text-xs" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Assets summary */}
        {(release.assets || []).length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <FiPackage className="text-[11px]" />
              {release.assets.length} asset{release.assets.length !== 1 ? 's' : ''}
            </span>
            {totalDownloads > 0 && (
              <span className="flex items-center gap-1 text-signal-active font-semibold">
                <FiDownload className="text-[11px]" />
                {formatNumber(totalDownloads)} downloads
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RepoReleasesPage() {
  const { owner, repoName } = useParams();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getReleases(owner, repoName);
        setReleases(Array.isArray(data) ? data : []);
      } catch {
        setReleases([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [owner, repoName]);

  const filtered = releases.filter((r) => {
    if (filter === 'latest') return !r.prerelease && !r.draft;
    if (filter === 'prerelease') return r.prerelease;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-4"
            >
              <div className="h-5 w-5 skeleton rounded-full mx-auto mb-2" />
              <div className="h-6 w-16 skeleton mx-auto mb-1" />
              <div className="h-3 w-20 skeleton mx-auto" />
            </div>
          ))}
        </div>
        {/* Timeline skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className="w-[45%] bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <div className="h-4 w-24 skeleton mb-3" />
              <div className="h-3 w-48 skeleton mb-2" />
              <div className="h-16 skeleton rounded-xl mb-2" />
              <div className="h-3 w-32 skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="py-12">
        <ForkyState
          message="No releases found — this repo hasn't published any releases yet."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Summary Stats */}
      <ReleaseSummary releases={releases} />

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => {
          const count =
            f.key === 'all'
              ? releases.length
              : f.key === 'latest'
              ? releases.filter((r) => !r.prerelease && !r.draft).length
              : releases.filter((r) => r.prerelease).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`chip ${filter === f.key ? 'active' : ''}`}
            >
              {f.label}
              <span
                className={`text-[11px] ml-0.5 ${
                  filter === f.key
                    ? 'text-white/70'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-8">
          <ForkyState
            message="No releases match this filter."
            size="md"
          />
        </div>
      ) : (
        <div className="relative pb-12">
          {/* Rail */}
          <div className="timeline-rail" />

          {/* Release entries */}
          <div className="space-y-10">
            {filtered.map((release, i) => {
              const side = i % 2 === 0 ? 'left' : 'right';
              const isLatest = !release.prerelease && !release.draft && i === 0;

              return (
                <div key={release.id} className="relative">
                  {/* Node on the rail */}
                  <div
                    className={`timeline-node ${isLatest ? 'latest' : ''}`}
                    style={{ top: '24px' }}
                  />
                  {/* Card */}
                  <ReleaseCard release={release} side={side} index={i} />
                </div>
              );
            })}
          </div>

          {/* End cap */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#0B0D11]" />
        </div>
      )}
    </div>
  );
}
