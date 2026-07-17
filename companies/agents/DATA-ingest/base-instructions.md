# Bright Data MCP

Mappable data ingestion turns public web research into local prototype data.

Project source of truth:
- Use `../../PROJECT_CHARTER.md` for the shared prototype model, architecture rules, data contract, and agent workflow.

- Use `tool_search` for `brightdata` to expose the Bright Data MCP tools in a new agent/thread.
- Main tools:
  - `mcp__brightdata.search_engine` for live Google/Bing/Yandex results.
  - `mcp__brightdata.scrape_as_markdown` for scraping a single page.
  - `mcp__brightdata.scrape_batch` for scraping up to 5 pages.
- Use Bright Data when Codex needs live public web data, SERP results, geo-targeted results, or pages that normal browsing may not access cleanly.
- Bright Data can scrape public pages, but it should not be assumed to access private, login-gated, or hidden data.
- Shape collected data into local `.json` files with matching `.schema.json` files before handing it to BUILD-ui.
- Keep tests small first, then expand only if needed.
