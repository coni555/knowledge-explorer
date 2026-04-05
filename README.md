# Knowledge Explorer — 飞书知识探索器

> 飞书 CLI 创作者大赛参赛作品

Scan your Feishu (Lark) knowledge base, automatically discover hidden relationships between documents, and generate actionable insights.

扫描飞书知识库，自动发现文档间的隐藏关系，生成可行动的洞察。

## Why?

- 知识库越大越乱——文档间的关联只存在于你的脑子里
- 飞书没有 Obsidian 那样的图谱视图
- 团队可能在不同空间写了重复的内容，彼此不知情
- 你从来不知道哪两篇看似无关的文档碰在一起能产生新想法

## Quick Start

### Prerequisites

- [lark-cli](https://github.com/larksuite/cli) installed and authenticated (`lark-cli auth login`)
- Node.js >= 18
- An OpenAI-compatible API key (for AI insights)

### Install & Run

```bash
git clone https://github.com/coni555/knowledge-explorer.git
cd knowledge-explorer
npm install && npm run build
```

```bash
# Set your AI API key
export OPENAI_API_KEY=sk-xxx
# Optional: custom endpoint (e.g. Qwen, DeepSeek)
export OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Full scan — explore all accessible wiki spaces
npx knowledge-explorer

# Search specific topics
npx knowledge-explorer --query "产品规划"

# Only my documents
npx knowledge-explorer --owner me

# Scan a specific space
npx knowledge-explorer --space <space_id>

# List all accessible spaces
npx knowledge-explorer --list-spaces
```

### CLI Options

| Option | Description |
|--------|-------------|
| (no args) | Full scan: traverse all wiki spaces + global search |
| `--query <keyword>` | Keyword search mode (faster, narrower) |
| `--owner me\|others\|<name>` | Filter by document owner |
| `--space <space_id>` | Limit full scan to one space |
| `--max-pages <n>` | Max search pages in keyword mode (default: 10) |
| `--list-spaces` | List all accessible wiki spaces and exit |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI-compatible API key |
| `OPENAI_BASE_URL` | No | Custom API endpoint (default: OpenAI) |
| `AI_MODEL` | No | Model name (default: gpt-4o-mini) |

## What It Discovers

### Knowledge Health

- **Hub documents** — highly referenced, central to your knowledge
- **Orphan documents** — isolated, no connections to others
- **Bridge documents** — connect different topic clusters
- **Stale documents** — frequently referenced but not updated

### Topic Clusters

AI-powered semantic clustering groups related documents automatically — even without explicit links between them. Each cluster gets a theme label and cross-document analysis.

### Collision Insights

The most unique feature: finds documents from **different clusters** that share hidden connections, and generates creative suggestions for combining their ideas.

Example: *"Competitor Pricing" x "User Interviews" → Design a tiered pricing strategy based on willingness-to-pay data*

## How It Works

```
Phase 1: Collect       Traverse wiki spaces + search via lark-cli
    ↓
Phase 2: Build Graph   AI summaries → semantic clustering → auto-generate edges
    ↓
Phase 3: Insights      L1 structural → L2 semantic → L3 collision
    ↓
Phase 4: Output        Terminal report + Feishu document (auto-created)
```

**Semantic-first architecture**: Instead of looking for existing links between documents, the tool uses AI to understand content and build connections from scratch. This is critical because most personal knowledge bases have few or no explicit cross-references.

## Sample Output

```
🔍 Knowledge Explorer — 飞书知识探索器

📊 知识健康度
  ├ 枢纽文档 (3)：Q1规划、技术架构、用户画像
  ├ 孤岛文档 (5)：会议纪要-0312、...
  └ 可能过期 (2)：竞品分析(89天未更新，被7篇引用)

🔗 发现 4 个主题聚类
  ├ #用户增长 (12篇)  ├ #技术债务 (8篇)
  ├ #竞品情报 (6篇)   └ #团队协作 (5篇)

💡 碰撞洞察 (Top 3)
  1.《竞品定价》×《用户访谈》→ 可设计阶梯定价方案
  2.《技术债务清单》×《Q2招聘计划》→ 按债务优先级排招聘需求
  3.《用户流失分析》×《功能路线图》→ 流失Top原因未在路线图中

📄 完整报告已生成 → [飞书文档链接]
```

## Tech Stack

- TypeScript
- [lark-cli](https://github.com/larksuite/cli) (Feishu API layer)
- OpenAI-compatible API (AI analysis)
- Pure JSON caching (no database)

## As a Claude Code Skill

This project includes a `SKILL.md` that can be used as a [Claude Code](https://claude.ai/claude-code) skill. Copy the project to your skills directory to let your AI agent explore your Feishu knowledge base conversationally.

```bash
cp -r knowledge-explorer ~/.claude/skills/knowledge-explorer
```

## License

MIT
