# 🔍 Knowledge Explorer — 飞书知识探索器

Scan your Feishu (Lark) knowledge base, automatically discover hidden relationships between documents, and generate actionable insights.

扫描飞书知识库，自动发现文档间的隐藏关系，生成可行动的洞察。

## Why?

- Your knowledge base grows messy as it scales — connections between documents live only in your head
- Feishu has no graph view like Obsidian
- Your team might be writing duplicate content without knowing

## Quick Start

### Prerequisites

- [lark-cli](https://github.com/nicepkg/lark-cli) installed and authenticated
- Node.js >= 18
- An OpenAI-compatible API key (for AI insights)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/knowledge-explorer.git
cd knowledge-explorer
npm install
npm run build
```

### Run

```bash
# Set your AI API key
export OPENAI_API_KEY=sk-xxx

# Explore all accessible documents
npx knowledge-explorer

# Search specific topics
npx knowledge-explorer "产品规划"
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI-compatible API key |
| `OPENAI_BASE_URL` | No | Custom API endpoint (default: OpenAI) |
| `AI_MODEL` | No | Model name (default: gpt-4o-mini) |

## What It Discovers

### 📊 Knowledge Health
- **Hub documents** — highly referenced, central to your knowledge
- **Orphan documents** — isolated, no connections to others
- **Bridge documents** — connect different topic clusters
- **Stale documents** — frequently referenced but not updated

### 🔗 Topic Clusters
Automatically groups related documents and identifies common themes, contradictions, and duplicates within each cluster.

### 💡 Collision Insights
Finds documents from different clusters that share hidden connections, and generates creative suggestions for combining their ideas.

## How It Works

```
Phase 1: Collect     Search & fetch documents via lark-cli
    ↓
Phase 2: Build Graph     Discover links, mentions, semantic relations
    ↓
Phase 3: Insights     L1 structural → L2 semantic → L3 collision
    ↓
Phase 4: Output     Terminal report + Feishu document
```

## Output

- **Terminal**: Colored summary with key findings
- **Feishu Document**: Auto-created report with full analysis, document links, and action suggestions

## Tech Stack

- TypeScript
- lark-cli (Feishu API layer)
- OpenAI-compatible API (AI analysis)
- Pure JSON caching (no database)

## License

MIT
