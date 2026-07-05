# Shopify Theme Development Standards

## Theme Architecture & Styling
- **Color Schemes:** ALWAYS use Shopify's native `color_scheme` settings for new sections and blocks rather than creating hardcoded color pickers for backgrounds, text, and active states. Apply the standard `color-{{ section.settings.color_scheme }}` class to wrappers to inherit the theme's global palette natively.
- **Dawn Conventions:** Adhere strictly to the Shopify Dawn theme architecture. Prefer leveraging existing snippets, standard section groups (like `footer-group.json`), and native inline assets before creating custom, disjointed implementations.

## Shopify Dev MCP Usage
- You MUST proactively consult the `shopify-dev-mcp` tools before implementing major structural changes, introducing new Liquid APIs, or when unsure about standard theme conventions.
- Use `learn_shopify_api` to ingest the latest Liquid reference and theme architecture rules into your context.
- Use `search_docs_chunks` to verify standard implementation patterns (e.g. alternate templates, block rendering limits) to ensure absolute adherence to platform best practices.
