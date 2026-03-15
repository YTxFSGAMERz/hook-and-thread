# ⚡ Hook & Thread

> **Transform raw ideas into high-engagement LinkedIn posts.** AI-powered post generator, hook creator, rewriter, carousel builder, and viral angle generator for founders, developers, and creators.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat-square&logo=supabase)
![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=flat-square&logo=netlify)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔥 **Post Generator** | Enter a raw idea → get a polished, ready-to-post LinkedIn post with hooks, takeaways, and CTAs |
| 🎣 **Hook Creator** | Generate 3 alternative hooks (punchy, curiosity-driven, contrarian) to A/B test |
| ✏️ **Rewriter** | Paste an existing post → AI transforms it using a chosen framework and audience |
| 📑 **Carousel Builder** | Auto-generate 3–10 slide carousels with titles and content for each slide |
| ⚡ **Viral Angle Generator** | Enter a topic → get 5 viral content angles, click one to auto-generate a full post |
| 💾 **Post History** | All generated posts are saved with one click and browsable in the sidebar |

### 🎯 Viral Angle Generator (New!)

Type any topic and get **5 clickable viral angles**:

- 🔥 **Controversial Opinion** — a bold, slightly polarizing take
- 💥 **Personal Failure Story** — a relatable "I messed up" narrative
- 📊 **Industry Insight** — a data-driven or insider perspective
- 🛠️ **Step-by-Step Framework** — a structured how-to breakdown
- 🚨 **Myth-Busting Post** — debunking a common misconception

Click any angle → a full post is generated from it.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion
- **Auth & DB**: Supabase (Auth + Postgres)
- **AI**: LLM endpoint via streaming JSON responses
- **Deployment**: Netlify (auto-deploy from GitHub)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/YTxFSGAMERz/post-spark-ai.git
cd post-spark-ai

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── editor/
│   │   ├── ForgePane.tsx    # Left panel — input, tabs, framework & audience selectors
│   │   ├── StagePane.tsx    # Right panel — post preview, hooks, carousel, viral angles
│   │   └── HistorySidebar.tsx
│   └── ui/                  # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx       # Supabase auth provider
├── lib/
│   ├── constants.ts          # Frameworks, audiences, editor modes
│   └── stream.ts             # LLM streaming client
├── pages/
│   ├── Editor.tsx            # Main editor — prompt builder, generate handler
│   ├── Landing.tsx           # Landing page
│   └── Auth.tsx              # Login/signup
└── index.css                 # Tailwind config + design tokens
```

---

## 📄 License

MIT — build what you want with it.

---

<p align="center">
  Built with ☕ and AI by <a href="https://github.com/YTxFSGAMERz">Farhan</a>
</p>
