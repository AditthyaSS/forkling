<div align="center">
  <img src="public/fl.png" alt="Forky the axolotl" width="370" />
</div>

> 🦎 **Hey, I'm Forky** — an axolotl who lives inside this project. I'll be your guide as you look around.  
> Axolotls regenerate limbs when they lose them, which felt fitting for a tool about forks and lineages. Anyway — let's dig in.

Forkling is a deep-dive tool for open-source repos — health scores, contributor networks, issue triage, and more. It also has a section for browsing open-weight LLMs, in case you're picking a model for your project.

**Live app:** https://forkling.vercel.app/

---

## 🧡 What Forky can show you

- **Repo Explorer** — search any GitHub org or `owner/repo` and get the full picture: health score, contributor bus-factor, a code-ownership network graph, commit/issue analytics, and a "good first issue" triage panel. Forky's favorite part — this is where you find out if a repo is actually worth your time.
- **Compare** — line up to 3 repos side-by-side (stars, forks, license, health, activity)
- **Open-Source LLM Explorer** — a leaderboard of open-weight models (Llama, Mistral, Qwen, DeepSeek, and more), filterable by license, size, and context window
- **Contributor Guide** — a plain-language path for anyone making their first open-source contribution — Forky wrote this one specifically for first-timers, so don't be shy.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router 6 |
| Styling | TailwindCSS 4 (`@theme` design tokens) |
| Visualization | D3.js (network graph) + Recharts (trend charts) |
| Data | GitHub REST API + Hugging Face Hub API — no backend, no server-side code |
| Caching | IndexedDB (1-hour TTL response cache) + localStorage (user settings) |

---

## 🚀 Getting Started

> *Forky: setting this up takes about two minutes. Here's the whole thing.*

```bash
git clone https://github.com/<your-org>/forkling.git
cd forkling
npm install
npm run dev
```

The app runs entirely client-side. You don't need any API keys to try it out, but you'll hit GitHub's unauthenticated rate limit fast (60 requests/hour). To raise that to 5,000/hour:

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) — no special scopes needed for public data
2. Open the app's **Settings panel** and paste it in — it's stored only in your browser's `localStorage`, never sent anywhere except directly to GitHub's API

---

## 📁 Project Structure

```
forkling/
├── public/
│   ├── Forkling_logo.png        # Forky mascot (navbar + footer)
│   ├── fl.png                   # README hero image
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── cache.js             # IndexedDB fetchWithCache() — 1hr TTL
│   │   ├── github.js            # GitHub REST API v3 wrapper
│   │   └── huggingface.js       # Hugging Face Hub API wrapper
│   ├── assets/                  # Static images
│   ├── components/
│   │   ├── FilterChips.jsx      # Language / topic / status filter row
│   │   ├── Footer.jsx           # Site footer
│   │   ├── ForkyState.jsx       # Forky mascot — empty states & loading
│   │   ├── ModelIcon.jsx        # Org avatar → react-icon fallback for LLM cards
│   │   ├── Navbar.jsx           # Fixed top nav with dark mode + settings
│   │   ├── RateLimitBanner.jsx  # GitHub API rate limit indicator
│   │   ├── RepoCard.jsx         # Home grid card (Compare + View actions)
│   │   ├── RepoLayout.jsx       # Shared tabbed layout for /repo/:owner/:name
│   │   ├── ScrollButtons.jsx    # Floating scroll-to-top / scroll-to-bottom
│   │   └── SettingsModal.jsx    # GitHub PAT + HF token entry
│   ├── context/
│   │   └── AppContext.jsx       # Theme, compare list, rate limit, recent searches
│   ├── pages/
│   │   ├── HomePage.jsx         # Hero + stats + filters + repo card grid
│   │   ├── ComparePage.jsx      # 3-slot side-by-side repo comparison
│   │   ├── GuidePage.jsx        # Static contributor guide (editorial)
│   │   ├── ModelsPage.jsx       # LLM Explorer — model grid + category pills
│   │   ├── ModelDetailPage.jsx  # Single model detail
│   │   ├── RepoOverviewPage.jsx       # Tab: metrics, languages, recent commits
│   │   ├── RepoContributorsPage.jsx   # Tab: contributor list + bar chart
│   │   ├── RepoNetworkPage.jsx        # Tab: D3 force graph (code ownership / issues)
│   │   ├── RepoAnalyticsPage.jsx      # Tab: commit activity + participation charts
│   │   ├── RepoIssuesPage.jsx         # Tab: good-first-issue triage
│   │   └── RepoGovernancePage.jsx     # Tab: community health + license check
│   ├── App.jsx                  # Router + layout shell
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind v4 @theme tokens + global styles
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── bug-report.md
│       └── feature-request.md
├── CONTRIBUTING.md
├── SECURITY.md
├── index.html
├── vite.config.js
└── package.json
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) — Forky walks through it there.

---

## 🗺️ Roadmap

Current version is fully static (no backend). Planned for a future version (see open issues for details):

- Trending repos/orgs and trending models
- Personal "what should I work on today" feed
- Notifications for repo/model activity
- Embeddable repo-health badges

---

## 📄 License

MIT

---

## 🙏 Acknowledgements

Forkling's repo-exploration concept builds on ideas from [AOSSIE's OrgExplorer](https://gitlab.com/aossie/org-explorer).

---

> 🦎 *Forky: that's the whole tour. Go poke around, fork something, and if you get stuck — CONTRIBUTING.md has you covered. See you in the network graph.*
