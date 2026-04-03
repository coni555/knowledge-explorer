// src/collect.ts
import { searchDocs, resolveWikiNode, fetchDocContent } from './lark.js';
import { CacheStore } from './cache.js';
import type { KnowledgeNode } from './types.js';
import chalk from 'chalk';

interface CollectOptions {
  query?: string;
  maxPages?: number;
}

export async function collectDocuments(cache: CacheStore, opts: CollectOptions = {}): Promise<KnowledgeNode[]> {
  const query = opts.query ?? '';
  console.log(chalk.blue('📡 正在搜索飞书文档...'));

  // Step 1: Search
  const searchResults = await searchDocs(query, opts.maxPages ?? 5);
  console.log(chalk.blue(`   找到 ${searchResults.length} 篇文档`));

  // Step 2: Load existing cached nodes for freshness check
  const cachedNodes = await cache.readNodes();
  const cachedMap = new Map(cachedNodes.map(n => [n.id, n]));

  // Step 3: Deduplicate search results by doc_id
  const seen = new Set<string>();
  const uniqueResults = searchResults.filter(item => {
    if (seen.has(item.doc_id)) return false;
    seen.add(item.doc_id);
    return true;
  });
  console.log(chalk.blue(`   去重后 ${uniqueResults.length} 篇`));

  // Step 4: Resolve and fetch each document
  const nodes: KnowledgeNode[] = [];
  let fetchCount = 0;

  for (const item of uniqueResults) {
    const id = item.doc_id;
    const existingNode = cachedMap.get(id);

    // Check freshness: if cached and not updated, reuse
    if (existingNode && existingNode.fetched_at && item.edit_time_iso) {
      if (new Date(existingNode.fetched_at) >= new Date(item.edit_time_iso)) {
        nodes.push(existingNode);
        continue;
      }
    }

    // Fetch content
    try {
      let markdown = '';
      let title = item.title;
      let docType: KnowledgeNode['type'] = 'doc';

      // Skip unsupported types (SLIDES, SHEET, BITABLE, etc.)
      const supportedTypes = ['DOC', 'DOCX', 'WIKI'];
      if (!supportedTypes.includes(item.type)) {
        continue;
      }

      if (item.type === 'WIKI') {
        // Resolve wiki token first
        try {
          const wikiNode = await resolveWikiNode(id);
          docType = 'wiki';
          if (wikiNode.obj_type === 'docx' || wikiNode.obj_type === 'doc') {
            const content = await fetchDocContent(wikiNode.obj_token);
            markdown = content.markdown;
            title = content.title || title;
          }
          // sheets/bitable: skip content fetch for MVP
        } catch {
          // If wiki resolve fails, try direct fetch
          const content = await fetchDocContent(id);
          markdown = content.markdown;
        }
      } else if (item.type === 'DOC' || item.type === 'DOCX') {
        const content = await fetchDocContent(id);
        markdown = content.markdown;
        title = content.title || title;
      } else if (item.type === 'SHEET') {
        docType = 'sheet';
        // Skip content fetch for sheets in MVP
      }

      const node: KnowledgeNode = {
        id,
        type: docType,
        title,
        space: '',  // search API doesn't return space info
        url: item.url,
        updated_at: item.edit_time_iso ?? new Date().toISOString(),
        summary: '',     // filled in Phase 2 by AI
        keywords: [],    // filled in Phase 2 by AI
        word_count: markdown.length,
        fetched_at: new Date().toISOString(),
        content: markdown,
      };

      nodes.push(node);
      fetchCount++;
      process.stdout.write(chalk.gray(`\r   已抓取 ${fetchCount} 篇文档...`));
    } catch (err) {
      console.warn(chalk.yellow(`\n   ⚠ 跳过 ${item.title}: ${(err as Error).message}`));
    }
  }

  console.log(chalk.green(`\n   ✓ 成功收集 ${nodes.length} 篇文档（新抓取 ${fetchCount} 篇）`));

  // Save to cache
  await cache.writeNodes(nodes);
  return nodes;
}
