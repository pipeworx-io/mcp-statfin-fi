interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Statistics Finland (StatFin) PxWeb MCP.
 */


const BASE = 'https://pxdata.stat.fi/PXWeb/api/v1/en/StatFin';
const UA = 'pipeworx-mcp-statfin-fi/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'subjects',
    description:
      'Navigate the subject tree. Entries with type "l" are folders (drill in with their id); type "t" are tables (id ends in ".px", use with table_meta / query_table).',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Sub-path under /StatFin/ (default empty = root). e.g. "khi" or "synt".' } },
    },
  },
  {
    name: 'table_meta',
    description: 'Table definition (dimensions, valid values). path must point at a ".px" table, e.g. "khi/statfin_khi_pxt_11xs.px".',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'e.g. "khi/statfin_khi_pxt_11xs.px" (folder/table.px)' } },
      required: ['path'],
    },
  },
  {
    name: 'query_table',
    description: 'Pull data from a ".px" table. body is a PxWeb query object. path e.g. "khi/statfin_khi_pxt_11xs.px".',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'folder/table.px, e.g. "khi/statfin_khi_pxt_11xs.px"' },
        body: { type: 'object', description: '{query: [{code, selection: {filter, values}}], response: {format: "json-stat2"}}' },
      },
      required: ['path', 'body'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'subjects': {
      const path = (args.path as string | undefined)?.replace(/^\/+|\/+$/g, '') ?? '';
      return statfinGet(path ? `/${path}` : '');
    }
    case 'table_meta':
      return statfinGet(`/${reqStr(args, 'path', '"khi/statfin_khi_pxt_11xs.px"').replace(/^\/+|\/+$/g, '')}`);
    case 'query_table': {
      const path = reqStr(args, 'path', '"khi/statfin_khi_pxt_11xs.px"').replace(/^\/+|\/+$/g, '');
      const body = args.body;
      if (!body || typeof body !== 'object') throw new Error('body must be a PxWeb query object.');
      const res = await fetch(`${BASE}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`StatFin: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
      return res.json();
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function statfinGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`StatFin: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
