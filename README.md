# mcp-statfin-fi

Statistics Finland (StatFin) PxWeb MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `subjects` | Navigate the subject tree. Entries with type "l" are folders (drill in with their id); type "t" are tables (id ends in ".px", use with table_meta / query_table). |
| `table_meta` | Table definition (dimensions, valid values). path must point at a ".px" table, e.g. "khi/statfin_khi_pxt_11xs.px". |
| `query_table` | Pull data from a ".px" table. body is a PxWeb query object. path e.g. "khi/statfin_khi_pxt_11xs.px". |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "statfin-fi": {
      "url": "https://gateway.pipeworx.io/statfin-fi/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Statfin Fi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
