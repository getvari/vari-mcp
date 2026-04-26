#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// @vari/mcp — stdio bridge for the Vari Hydration Tools MCP server
//
// MCP clients like Claude Desktop, Cursor, and Continue.dev launch tools
// over stdio. Our actual server is HTTP — it lives in the same Vercel
// project as getvari.app at /api/mcp/v1. This package is a thin proxy
// that:
//
//   1. Speaks MCP over stdio to the local client.
//   2. Forwards tools/list and tools/call to the HTTP endpoint.
//   3. Returns the HTTP response verbatim back over stdio.
//
// Override the upstream URL with VARI_MCP_URL when you want to point at
// staging or a local Next dev server (default
// https://getvari.app/api/mcp/v1).
//
// Why we ship a bridge instead of an installer for stdio: a single
// authoritative HTTP endpoint means we deploy once. The npm package only
// changes when the protocol shape changes — which is rare.
// ═══════════════════════════════════════════════════════════════════════

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const HTTP_BASE =
  process.env.VARI_MCP_URL || "https://getvari.app/api/mcp/v1";

const PACKAGE_VERSION = "1.0.0";

interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

async function rpc<T>(
  method: "tools/list" | "tools/call",
  params?: unknown
): Promise<T> {
  const body: Record<string, unknown> = {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
  };
  if (params !== undefined) body.params = params;

  const res = await fetch(HTTP_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `vari-mcp/${PACKAGE_VERSION}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as JsonRpcResponse<T>;

  if (json.error) {
    const err = new Error(json.error.message);
    (err as Error & { code?: number }).code = json.error.code;
    throw err;
  }
  if (json.result === undefined) {
    throw new Error("Vari MCP returned an empty result");
  }
  return json.result;
}

async function main(): Promise<void> {
  const server = new Server(
    { name: "vari-hydration", version: PACKAGE_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return rpc<{ tools: unknown[] }>("tools/list");
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    return rpc<{ content: unknown[] }>("tools/call", req.params);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // Crashing here surfaces in the client's stderr panel — useful for
  // diagnosing misconfigured VARI_MCP_URL or network issues.
  // eslint-disable-next-line no-console
  console.error(`[vari-mcp] fatal:`, err);
  process.exit(1);
});
