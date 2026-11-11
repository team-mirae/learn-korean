// Vercel Function: the MCP server at /mcp (vercel.json rewrites it here). lib/mcp.mjs does the work.
import { handle } from "../lib/mcp.mjs";

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
