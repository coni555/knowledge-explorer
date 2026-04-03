// src/lark.ts
import { execSync } from 'child_process';

interface LarkExecOptions {
  timeout?: number;  // ms, default 30000
}

function larkExec(args: string[], opts: LarkExecOptions = {}): string {
  const cmd = `lark-cli ${args.join(' ')}`;
  const result = execSync(cmd, {
    encoding: 'utf-8',
    timeout: opts.timeout ?? 30000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return result;
}

function larkJSON<T = unknown>(args: string[], opts?: LarkExecOptions): T {
  const raw = larkExec([...args, '--format', 'json'], opts);
  return JSON.parse(raw) as T;
}

// --- Search ---

interface SearchResult {
  items: Array<{
    doc_id: string;
    title: string;
    url: string;
    type: string;           // DOC, WIKI, SHEET, etc.
    owner_id?: string;
    create_time_iso?: string;
    edit_time_iso?: string;
  }>;
  has_more: boolean;
  page_token?: string;
}

export async function searchDocs(query: string, maxPages = 5): Promise<SearchResult['items']> {
  const allItems: SearchResult['items'] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const args = ['docs', '+search', '--query', JSON.stringify(query), '--page-size', '20'];
    if (pageToken) args.push('--page-token', pageToken);

    const result = larkJSON<SearchResult>(args);
    allItems.push(...(result.items ?? []));

    if (!result.has_more || !result.page_token) break;
    pageToken = result.page_token;
  }

  return allItems;
}

// --- Wiki Node Resolution ---

interface WikiNodeResult {
  node: {
    obj_type: string;      // docx, sheet, bitable, etc.
    obj_token: string;
    title: string;
    space_id: string;
    node_token: string;
  };
}

export async function resolveWikiNode(wikiToken: string): Promise<WikiNodeResult['node']> {
  const result = larkJSON<WikiNodeResult>(
    ['wiki', 'spaces', 'get_node', '--params', JSON.stringify({ token: wikiToken })]
  );
  return result.node;
}

// --- Fetch Document Content ---

interface FetchResult {
  title: string;
  markdown: string;
  has_more: boolean;
}

export async function fetchDocContent(docToken: string): Promise<{ title: string; markdown: string }> {
  const result = larkJSON<FetchResult>(
    ['docs', '+fetch', '--doc', docToken],
    { timeout: 60000 }
  );
  return { title: result.title, markdown: result.markdown };
}

// --- Create Document ---

interface CreateResult {
  doc_id: string;
  doc_url: string;
  message: string;
}

export async function createDoc(title: string, markdown: string, wikiSpace?: string): Promise<CreateResult> {
  const args = ['docs', '+create', '--title', JSON.stringify(title), '--markdown', JSON.stringify(markdown)];
  if (wikiSpace) args.push('--wiki-space', wikiSpace);

  return larkJSON<CreateResult>(args, { timeout: 60000 });
}
