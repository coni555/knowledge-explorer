#!/usr/bin/env node
// src/index.ts
import { CacheStore } from './cache.js';
import { collectDocuments } from './collect.js';
import { buildGraph } from './graph.js';
import { computeStructuralInsights, computeSemanticInsights, computeCollisionInsights } from './insights.js';
import { printTerminalReport, publishToFeishu } from './output.js';
import { initAIFromEnv } from './ai.js';
import type { ExploreResult } from './types.js';
import chalk from 'chalk';
import { join } from 'path';

async function explore(query?: string, maxPages?: number) {
  console.log(chalk.bold.cyan('\n🔍 Knowledge Explorer — 飞书知识探索器\n'));

  // Init AI
  initAIFromEnv();

  // Init cache
  const cacheDir = join(process.cwd(), '.knowledge-cache');
  const cache = new CacheStore(cacheDir);

  // Phase 1: Collect
  const nodes = await collectDocuments(cache, { query, maxPages });

  if (nodes.length === 0) {
    console.log(chalk.yellow('未找到任何文档。请检查搜索关键词或 lark-cli 登录状态。'));
    process.exit(0);
  }

  // Phase 2: Build Graph
  const { edges, clusters } = await buildGraph(nodes);
  await cache.writeEdges(edges);
  await cache.writeClusters(clusters);

  // Phase 3: Insights
  const structural = computeStructuralInsights(nodes, edges, clusters);
  const semantic = await computeSemanticInsights(nodes, clusters);
  const collisions = await computeCollisionInsights(nodes, edges, clusters);

  // Save final node state (with summaries)
  await cache.writeNodes(nodes.map(n => ({ ...n, content: undefined })));
  await cache.writeMeta({
    version: '0.1.0',
    scanned_at: new Date().toISOString(),
    query,
    node_count: nodes.length,
  });

  // Build result
  const result: ExploreResult = {
    nodes,
    edges,
    clusters,
    structural_insights: structural,
    semantic_insights: semantic,
    collision_insights: collisions,
    scanned_at: new Date().toISOString(),
  };

  // Phase 4: Output
  printTerminalReport(result);
  await publishToFeishu(result);

  console.log(chalk.bold.cyan('\n✨ 探索完成\n'));
}

// Parse CLI args
const args = process.argv.slice(2);
const query = args.find(a => !a.startsWith('-'));

// --max-pages flag
const maxPagesIdx = args.indexOf('--max-pages');
const maxPages = maxPagesIdx !== -1 ? parseInt(args[maxPagesIdx + 1], 10) : undefined;

explore(query, maxPages).catch(err => {
  console.error(chalk.red(`\n❌ 错误: ${err.message}`));
  process.exit(1);
});
