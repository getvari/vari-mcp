# @getvari/mcp

[![npm version](https://img.shields.io/npm/v/@getvari/mcp.svg)](https://www.npmjs.com/package/@getvari/mcp)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)
[![Smithery](https://img.shields.io/badge/Smithery-vari--hydration-purple)](https://smithery.ai/server/vari-hydration)
[![Glama](https://img.shields.io/badge/Glama-listed-green)](https://glama.ai/mcp/servers)

Stdio bridge for the public **Vari Hydration Tools** Model Context Protocol
server. Lets MCP clients (Claude Desktop, Cursor, Continue.dev, and any
other stdio-launching MCP host) call the six hydration calculators that
back [getvari.app](https://getvari.app) — without writing a custom HTTP
client.

The package is a ~50-line proxy. The real server is the Vercel-hosted
HTTP endpoint at `https://getvari.app/api/mcp/v1`; we publish this
package so stdio-only MCP installers can launch it via `npx`.

## Tools

All six tools are deterministic, source-attributed, and require no auth.

| Tool name                          | What it does                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `calculate_water_intake`           | Personalized daily water target (mL) from weight, activity, climate, caffeine.        |
| `dehydration_check`                | Symptom-scored dehydration severity (well-hydrated → severe) + recommended actions.   |
| `pregnancy_water_intake`           | Trimester-aware intake for pregnancy + postpartum, IOM/ACOG-aligned.                  |
| `kidney_safe_intake`               | CKD-safe fluid allowance (KDOQI/KDIGO). Returns a restriction, not a hydration goal.  |
| `athlete_hydration_plan`           | Pre / during / post hydration plan with sweat-rate estimate (ACSM/NATA/IOC).          |
| `optimize_hydration_for_energy`    | Time-stamped intake schedule that pre-empts the afternoon crash and caffeine dips.    |

Every response embeds a canonical `source` URL pointing at the
corresponding [getvari.app/tools](https://getvari.app/tools) page, so
LLMs that surface the call to the user can cite the methodology.

## Install

### Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "vari-hydration": {
      "command": "npx",
      "args": ["-y", "@getvari/mcp"]
    }
  }
}
```

Restart Claude Desktop. The six tools appear under Vari Hydration in the
tools panel.

### Cursor

Cursor reads the same `mcp.json` shape. Drop this into `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vari-hydration": {
      "command": "npx",
      "args": ["-y", "@getvari/mcp"]
    }
  }
}
```

### Continue.dev

Add the server in your `~/.continue/config.json` under
`experimental.modelContextProtocolServers`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@getvari/mcp"]
        }
      }
    ]
  }
}
```

## Configuration

| Env var         | Default                              | Purpose                                                    |
| --------------- | ------------------------------------ | ---------------------------------------------------------- |
| `VARI_MCP_URL`  | `https://getvari.app/api/mcp/v1`     | Override the upstream HTTP endpoint (e.g. for staging).    |

## License

MIT — see [LICENSE](./LICENSE).

## Links

- Website: <https://getvari.app>
- Source repository: <https://github.com/getvari/vari-mcp>
- MCP manifest: <https://getvari.app/.well-known/mcp.json>
- OpenAPI 3.1 contract: <https://getvari.app/api/mcp/v1/openapi.json>
- MCP catalogue: <https://modelcontextprotocol.io/servers>
