// src/lark.ts
import { execSync, execFileSync } from 'child_process';

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

interface SearchResultItem {
  doc_id: string;
  title: string;
  url: string;
  type: string;           // DOC, WIKI, SHEET, etc.
  owner_id?: string;
  create_time_iso?: string;
  edit_time_iso?: string;
}

interface RawSearchResponse {
  ok: boolean;
  data: {
    has_more: boolean;
    page_token?: string;
    results: Array<{
      entity_type: string;
      result_meta: {
        token: string;
        url: string;
        doc_types: string;
        owner_name?: string;
        create_time_iso?: string;
        update_time_iso?: string;
      };
      title_highlighted: string;
    }>;
  };
}

function parseSearchResults(raw: RawSearchResponse): { items: SearchResultItem[]; has_more: boolean; page_token?: string } {
  const items = (raw.data.results ?? []).map(r => ({
    doc_id: r.result_meta.token,
    title: r.title_highlighted.replace(/<\/?h[b]?>/g, ''),  // strip highlight tags
    url: r.result_meta.url,
    type: r.result_meta.doc_types ?? r.entity_type,  // DOCX, SLIDES, SHEET, etc.
    create_time_iso: r.result_meta.create_time_iso,
    edit_time_iso: r.result_meta.update_time_iso,
  }));
  return { items, has_more: raw.data.has_more, page_token: raw.data.page_token };
}

export async function searchDocs(query: string, maxPages = 10): Promise<SearchResultItem[]> {
  const allItems: SearchResultItem[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const args = ['docs', '+search', '--query', JSON.stringify(query), '--page-size', '20'];
    if (pageToken) args.push('--page-token', pageToken);

    const raw = larkJSON<RawSearchResponse>(args);
    const { items, has_more, page_token } = parseSearchResults(raw);
    allItems.push(...items);

    if (!has_more || !page_token) break;
    pageToken = page_token;
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

interface RawWikiResponse {
  ok: boolean;
  data: { node: WikiNodeResult['node'] };
}

export async function resolveWikiNode(wikiToken: string): Promise<WikiNodeResult['node']> {
  const raw = larkJSON<RawWikiResponse>(
    ['wiki', 'spaces', 'get_node', '--params', JSON.stringify({ token: wikiToken })]
  );
  return raw.data.node;
}

// --- Fetch Document Content ---

interface RawFetchResponse {
  ok: boolean;
  data: {
    doc_id: string;
    markdown: string;
    message: string;
    title?: string;
  };
}

export async function fetchDocContent(docToken: string): Promise<{ title: string; markdown: string }> {
  const raw = larkJSON<RawFetchResponse>(
    ['docs', '+fetch', '--doc', docToken],
    { timeout: 60000 }
  );
  return { title: raw.data.title ?? '', markdown: raw.data.markdown };
}

// --- Create Document ---

interface CreateResult {
  doc_id: string;
  doc_url: string;
  message: string;
}

interface RawCreateResponse {
  ok: boolean;
  data: CreateResult;
}

export async function createDoc(title: string, markdown: string, wikiSpace?: string): Promise<CreateResult> {
  // Use execFileSync to bypass shell — avoids all escaping issues with markdown content
  const args = ['docs', '+create', '--title', title, '--markdown', markdown];
  if (wikiSpace) args.push('--wiki-space', wikiSpace);

  const raw = execFileSync('lark-cli', args, {
    encoding: 'utf-8',
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  });

  try {
    const parsed = JSON.parse(raw) as RawCreateResponse;
    return parsed.data;
  } catch {
    const urlMatch = raw.match(/https?:\/\/[^\s"]+/);
    return { doc_id: '', doc_url: urlMatch?.[0] ?? '', message: raw.trim() };
  }
}
