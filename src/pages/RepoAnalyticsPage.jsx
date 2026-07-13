import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCommitActivity, getParticipation } from '@/api/github';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import ForkyState from '@/components/ForkyState';

export default function RepoAnalyticsPage() {
  const { owner, repoName } = useParams();
  const [commitActivity, setCommitActivity] = useState([]);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [activityData, partData] = await Promise.all([
          getCommitActivity(owner, repoName).catch(() => []),
          getParticipation(owner, repoName).catch(() => null),
        ]);
        setCommitActivity(Array.isArray(activityData) ? activityData : []);
        setParticipation(partData);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [owner, repoName]);

  const weeklyData = commitActivity.map((week, i) => ({
    week: `W${i + 1}`,
    commits: week.total || 0,
    date: new Date(week.week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const participationData = participation?.all?.map((count, i) => ({
    week: `W${i + 1}`,
    all: count,
    owner: participation.owner?.[i] || 0,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="h-4 w-40 skeleton mb-4" />
            <div className="h-48 skeleton rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commit Activity */}
      {weeklyData.length > 0 && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Commit Activity (Last Year)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D6A228" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D6A228" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} width={35} />
              <Tooltip
                contentStyle={{ background: '#161A22', border: '1px solid #23272F', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#F3F4F6', fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="commits" stroke="#D6A228" fill="url(#commitGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Participation (Owner vs All) */}
      {participationData.length > 0 && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Participation — Owner vs Community</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Weekly commit counts over the last year</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={participationData}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={7} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} width={35} />
              <Tooltip
                contentStyle={{ background: '#161A22', border: '1px solid #23272F', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#F3F4F6', fontWeight: 700 }}
              />
              <Line type="monotone" dataKey="all" stroke="#6366F1" strokeWidth={2} dot={false} name="Community" />
              <Line type="monotone" dataKey="owner" stroke="#D6A228" strokeWidth={2} dot={false} name="Owner" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-signal-active inline-block" /> Community</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-accent-gold inline-block" /> Owner</span>
          </div>
        </div>
      )}

      {weeklyData.length === 0 && participationData.length === 0 && (
        <div className="py-12">
          <ForkyState
            message="Forky is waiting on GitHub to crunch the numbers — check back in a moment."
            size="lg"
          />
        </div>
      )}
    </div>
  );
}
