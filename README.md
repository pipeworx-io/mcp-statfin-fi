# statfin-fi

Statistics Finland (StatFin) — the full catalogue of Finnish official statistics published by Tilastokeskus, served over its PxWeb API: population, education, employment, consumer prices, housing, health and national accounts.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | What it returns |
|---|---|
| `subjects` | The StatFin subject tree. `path` empty lists ~135 subject folders; `path: "vkour"` lists that folder's tables. Entries with `type: "l"` are folders, `type: "t"` are tables. |
| `table_meta` | One table's dimensions and every valid value, when you want to see what a table breaks down by. |
| `query_table` | Actual figures. Give it `select` in plain English and it resolves the codes itself; give it `body` and it passes your PxWeb query straight through. |

### Table paths

A table path is `<folder>/<id>.px` where the id is the **bare 4-character table code**:

```
vkour/15ig.px      Population aged 15 or over by level of education, gender, age and origin
khi/11xs.px        Consumer price index
```

The longer `statfin_<folder>_pxt_<id>.px` form appears throughout older StatFin
documentation. It was retired upstream and now returns **400 on every table**;
this pack rewrites it to the current form, so a caller arriving with the
documented-but-dead path still gets data (fleet #497).

### Asking in plain English

`select` maps a dimension to a value using either the English label or the
native code, and `query_table` resolves both against the table's own metadata:

```json
{ "path": "vkour/15ig.px", "select": { "Information": "tertiary level qualification" } }
```

→ `1672232` Finns aged 15+ hold a tertiary qualification (2025), alongside the
matching share, `34.5%`.

Dimensions you don't name are filled in for you: the year defaults to the
latest published, dimensions StatFin can eliminate are aggregated to their
total, and a dimension with an explicit total value (`SSS`, `Total`, or an
open-ended range starting at the table's own floor such as age `15-`) uses it.
**Every one of those choices comes back in `selection_resolved`**, and a
dimension with no defensible total is returned in full rather than silently
collapsed — a defaulted dimension nobody can see is how a wrong number gets
read as a right one.

A value that matches several rows returns all of them rather than picking one,
so `{"Information": "tertiary level qualification"}` yields both the count and
the percentage. If it matches more than 20, that is reported as too broad.

Results also carry `figures`: the json-stat2 `value[]` array paired with its
dimension labels, for results up to 60 cells. That is the readable form —
json-stat2's flat array over an implicit cartesian product is not.

### Dimension codes are native Finnish

Even on the `/en/` endpoint the dimension *codes* are Finnish, and some labels
are untranslated. There is no way to guess them, which is what `select` exists
to spare you; pass `body` yourself and you need `table_meta` first.
For `vkour/15ig.px`:

| Code | Meaning | Total value |
|---|---|---|
| `ikaryhma_10_20180101` | Age | `15-` (**not** `SSS`) |
| `sukupuoli_9_20180101` | Gender | `SSS` |
| `syntypera_101_20180101` | Origin (label renders as `Syntyperä`) | `SSS` |
| `timeperiod_y` | Year | — |
| `contentscode` | Measure, e.g. `kaste5T8` = population with a tertiary level qualification | — |

Worked call — population aged 15+ with a tertiary qualification, 2024:

```json
{
  "path": "vkour/15ig.px",
  "body": {
    "query": [
      { "code": "ikaryhma_10_20180101", "selection": { "filter": "item", "values": ["15-"] } },
      { "code": "sukupuoli_9_20180101", "selection": { "filter": "item", "values": ["SSS"] } },
      { "code": "syntypera_101_20180101", "selection": { "filter": "item", "values": ["SSS"] } },
      { "code": "timeperiod_y", "selection": { "filter": "item", "values": ["2024"] } },
      { "code": "contentscode", "selection": { "filter": "item", "values": ["kaste5T8"] } }
    ],
    "response": { "format": "json-stat2" }
  }
}
```

→ `value: [1641336]`, table updated 2026-06-18.

## Auth

None. Keyless, no registration, no rate-limit key. Reachable from Cloudflare egress.

## Data sources

- API root: `https://pxdata.stat.fi/PXWeb/api/v1/en/StatFin`
- Portal: https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/
- Publisher: Statistics Finland / Tilastokeskus — https://stat.fi/en
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/statfin-fi/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Statfin Fi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
