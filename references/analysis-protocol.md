# Analysis Protocol (Path A: Coding Agent)

> This protocol is executed by the AI agent during Step 2 of the Coding Agent workflow.
> JSON schemas for all cache files: see `references/cache-schema.md`.

## Input

Read `.knowledge-cache/nodes.json` — an array of document nodes, each with:
- `id` — unique document token
- `title` — document title
- `content` — full markdown text (available after `--collect-only`)
- `url` — Feishu document URL
- `updated_at` — last edit time (ISO 8601)

## Analysis Steps

Execute sequentially. Report progress to user after each step.

### Step 1: Summarize + Extract Keywords

For each node with `content`:
- Generate `summary`: one-line Chinese summary, max 100 chars
- Extract `keywords`: 5-8 keywords in three layers:
  - **Topic** (core subject): e.g. "用户增长", "留学规划"
  - **Domain** (field): e.g. "产品运营", "教育"
  - **Entity** (specific nouns): e.g. "MBTI", "飞书", "英国"

Write to `.knowledge-cache/summaries.json`.

### Step 2: Semantic Clustering

Group documents by semantic theme:
- Target: `ceil(N/4)` to `ceil(N/2)` clusters
- Max 5 docs per cluster — split into sub-topics if larger
- Prefer over-splitting to under-splitting
- Each cluster gets a 2-6 char Chinese label
- Unclustered docs go into an "other" cluster

Write to `.knowledge-cache/clusters.json`.

### Step 3: Build Edges

For each pair of documents in the same cluster:
- Create a `semantic` edge with `weight` 0.5-1.0 based on relatedness
- Set `reason` to the cluster label

Write to `.knowledge-cache/edges.json`.

### Step 4: Structural Insights

Compute from the graph (no AI needed):

| Type | Condition |
|------|-----------|
| `hub` | In-degree >= 2 (many edges pointing to it) |
| `orphan` | Zero edges (completely isolated) |
| `bridge` | Appears in edges crossing different clusters |
| `stale` | >30 days since `updated_at` AND in-degree >= 2 |

Write to `.knowledge-cache/structural_insights.json`.

### Step 5: Semantic Insights (per cluster)

For each cluster with >= 2 docs:
- Identify common themes across the docs
- Find contradictions or conflicting viewpoints
- Flag potential duplicates (similar content in different docs)
- Write a one-line cluster summary

Write to `.knowledge-cache/semantic_insights.json`.

### Step 6: Collision Insights

The core differentiator. Find 3-5 document pairs that:
- Belong to **different** clusters
- Have **no direct edge** between them
- Could produce actionable value when combined

For each pair, generate:
- `suggestion`: one concrete, actionable recommendation (not vague)
- `reasoning`: 2-3 sentences explaining WHY these two docs create new value together

Quality bar: "Could someone read this suggestion and take action today?"

Write to `.knowledge-cache/collision_insights.json`.

## Output

After completing all 6 steps, tell the user analysis is done and proceed to Step 3 (Render).
