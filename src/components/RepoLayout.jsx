import { useState, useEffect } from "react";
import {
  Outlet,
  useParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import { getRepo, getLanguages, getContributors } from "@/api/github";
import {
  FiStar,
  FiGitBranch,
  FiEye,
  FiExternalLink,
  FiAlertCircle,
  FiGithub,
  FiUsers,
} from "react-icons/fi";

function formatNumber(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

const TABS = [
  { path: "", label: "Overview" },
  { path: "/contributors", label: "Contributors" },
  { path: "/network", label: "Network" },
  { path: "/analytics", label: "Analytics" },
  { path: "/issues", label: "Issues" },
  { path: "/governance", label: "Governance" },
  { path: "/forks", label: "Forks" },
];

export default function RepoLayout() {
  const { owner, repoName } = useParams();
  const location = useLocation();
  const [repo, setRepo] = useState(null);
  const [languages, setLanguages] = useState({});
  const [contributorCount, setContributorCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [repoData, langData, contributorsData] = await Promise.all([
          getRepo(owner, repoName),
          getLanguages(owner, repoName),
          getContributors(owner, repoName, 100, 1),
        ]);
        setRepo(repoData);
        setLanguages(langData);
        setContributorCount(
          Array.isArray(contributorsData) ? contributorsData.length : null,
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [owner, repoName]);

  const basePath = `/repo/${owner}/${repoName}`;
  const currentTab = location.pathname.replace(basePath, "") || "";

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl skeleton" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 skeleton" />
              <div className="h-4 w-96 skeleton" />
            </div>
          </div>
          <div className="h-12 skeleton rounded-xl" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center flex flex-col items-center gap-3">
        <img
          src="/Forkling_logo.png"
          alt="Forky"
          style={{ width: 80, height: 80 }}
          className="object-contain"
        />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
          Repository Not Found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Forky got lost — this repo may have moved or been deleted.
        </p>
        <Link
          to="/"
          className="text-accent-gold hover:underline text-sm font-semibold mt-1"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  const totalLangBytes = Object.values(languages).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Repo Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
        <img
          src={repo.owner?.avatar_url}
          alt={repo.owner?.login}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-gray-200 dark:border-gray-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 font-headline">
              <span className="text-gray-500 dark:text-gray-400 font-semibold">
                {repo.owner?.login}/
              </span>
              {repo.name}
            </h1>

            {/* Homepage link */}
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-gold hover:underline"
                aria-label="Project homepage"
              >
                <FiExternalLink className="text-sm" />
              </a>
            )}

            {/* View on GitHub link */}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <FiGithub />
              <span>View on GitHub</span>
            </a>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {repo.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FiStar className="text-amber-500" />{" "}
              {formatNumber(repo.stargazers_count)}
            </span>
            <span className="flex items-center gap-1">
              <FiGitBranch /> {formatNumber(repo.forks_count)}
            </span>
            <span className="flex items-center gap-1">
              <FiEye /> {formatNumber(repo.watchers_count)}
            </span>
            <span className="flex items-center gap-1">
              <FiAlertCircle /> {formatNumber(repo.open_issues_count)}
            </span>
            {contributorCount !== null && (
              <span className="flex items-center gap-1">
                <FiUsers className="text-signal-active" />{" "}
                {formatNumber(contributorCount)}
                {contributorCount === 100 ? "+" : ""}
              </span>
            )}
            {repo.license?.spdx_id &&
              repo.license.spdx_id !== "NOASSERTION" && (
                <span className="badge-healthy text-xs font-bold px-2 py-0.5 rounded-full">
                  {repo.license.spdx_id}
                </span>
              )}
          </div>

          {/* Language bar */}
          {totalLangBytes > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex">
                {Object.entries(languages)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([lang, bytes], i) => {
                    const pct = (bytes / totalLangBytes) * 100;
                    const colors = [
                      "bg-accent-gold",
                      "bg-signal-active",
                      "bg-signal-healthy",
                      "bg-signal-warn",
                      "bg-violet-500",
                      "bg-pink-500",
                    ];
                    return (
                      <div
                        key={lang}
                        className={`${colors[i]} h-full`}
                        style={{ width: `${pct}%` }}
                        title={`${lang}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {repo.language}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        <nav className="flex gap-0.5 min-w-max" aria-label="Repo tabs">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.path;
            return (
              <Link
                key={tab.path}
                to={`${basePath}${tab.path}`}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-accent-gold border-accent-gold"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <Outlet context={{ repo, languages, contributorCount }} />
    </div>
  );
}
