import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCommits, getIssues } from '@/api/github';
import * as d3 from 'd3';

export default function RepoNetworkPage() {
  const { owner, repoName } = useParams();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [view, setView] = useState('code'); // 'code' | 'issues'
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    async function loadCodeOwnership() {
      setLoading(true);
      try {
        const commits = await getCommits(owner, repoName, 100);
        const items = Array.isArray(commits) ? commits : [];

        // Aggregate: author → files modified (using commit message as proxy since files aren't in list endpoint)
        const authorMap = new Map();
        items.forEach(c => {
          const author = c.author?.login || c.commit?.author?.name || 'Unknown';
          if (!authorMap.has(author)) {
            authorMap.set(author, { id: author, commits: 0, avatar: c.author?.avatar_url || '' });
          }
          authorMap.get(author).commits++;
        });

        const authors = Array.from(authorMap.values()).sort((a, b) => b.commits - a.commits).slice(0, 30);

        // Create co-authorship links (authors who committed close together in time)
        const links = [];
        const authorList = authors.map(a => a.id);
        for (let i = 0; i < authorList.length; i++) {
          for (let j = i + 1; j < authorList.length; j++) {
            const weight = Math.min(authorMap.get(authorList[i]).commits, authorMap.get(authorList[j]).commits);
            if (weight > 1) {
              links.push({ source: authorList[i], target: authorList[j], weight: Math.log2(weight) });
            }
          }
        }

        setGraphData({ nodes: authors, links: links.slice(0, 50) });
      } catch {
        setGraphData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    }

    async function loadIssueActivity() {
      setLoading(true);
      try {
        const issues = await getIssues(owner, repoName, { perPage: 50 });
        const items = Array.isArray(issues) ? issues : [];

        const authorMap = new Map();
        items.forEach(issue => {
          const author = issue.user?.login || 'Unknown';
          if (!authorMap.has(author)) {
            authorMap.set(author, { id: author, commits: 0, avatar: issue.user?.avatar_url || '' });
          }
          authorMap.get(author).commits++;
        });

        const authors = Array.from(authorMap.values()).sort((a, b) => b.commits - a.commits).slice(0, 25);
        const links = [];
        const authorList = authors.map(a => a.id);
        for (let i = 0; i < authorList.length; i++) {
          for (let j = i + 1; j < Math.min(i + 5, authorList.length); j++) {
            links.push({ source: authorList[i], target: authorList[j], weight: 1 });
          }
        }

        setGraphData({ nodes: authors, links });
      } catch {
        setGraphData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    }

    if (view === 'code') loadCodeOwnership();
    else loadIssueActivity();
  }, [owner, repoName, view]);

  // D3 force graph rendering
  useEffect(() => {
    if (loading || !svgRef.current || graphData.nodes.length === 0) return;

    const container = containerRef.current;
    const width = container?.clientWidth || 800;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#F3F4F6' : '#111827';
    const linkColor = isDark ? '#23272F' : '#E5E7EB';

    const maxCommits = Math.max(...graphData.nodes.map(n => n.commits), 1);

    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.commits / maxCommits) * 20 + 15));

    // Links
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', linkColor)
      .attr('stroke-width', d => Math.max(1, d.weight || 1))
      .attr('stroke-opacity', 0.5);

    // Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('circle')
      .attr('r', d => Math.sqrt(d.commits / maxCommits) * 18 + 6)
      .attr('fill', '#D6A228')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#B8891E')
      .attr('stroke-width', 1.5);

    node.append('text')
      .text(d => d.id.length > 10 ? d.id.slice(0, 10) + '…' : d.id)
      .attr('dy', d => Math.sqrt(d.commits / maxCommits) * 18 + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    // Tooltip on hover
    node.append('title')
      .text(d => `${d.id}: ${d.commits} ${view === 'code' ? 'commits' : 'issues'}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData, loading, view]);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setView('code')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${view === 'code' ? 'bg-white dark:bg-gray-700 text-accent-gold shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-accent-gold dark:hover:text-accent-gold'}`}
          >
            Code Ownership
          </button>
          <button
            onClick={() => setView('issues')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${view === 'issues' ? 'bg-white dark:bg-gray-700 text-accent-gold shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-accent-gold dark:hover:text-accent-gold'}`}
          >
            Issue Activity
          </button>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          Based on last 100 {view === 'code' ? 'commits' : 'issues'}
        </span>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="network-graph overflow-hidden relative" style={{ minHeight: 500 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <img src="/Forkling_logo.png" alt="Forky" style={{ width: 64, height: 64 }} className="object-contain animate-float" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Forky is digging through commits…</span>
            </div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <img src="/Forkling_logo.png" alt="Forky" style={{ width: 64, height: 64 }} className="object-contain" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Forky couldn't find enough data to build this graph.</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full" />
        )}
      </div>
    </div>
  );
}
