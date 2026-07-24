# Shopify Theme Development Standards

## Theme Architecture & Styling
- **Color Schemes:** ALWAYS use Shopify's native `color_scheme` settings for new sections and blocks rather than creating hardcoded color pickers for backgrounds, text, and active states. Apply the standard `color-{{ section.settings.color_scheme }}` class to wrappers to inherit the theme's global palette natively.
- **Global CSS Variables:** NEVER hardcode hex colors or basic box-shadows. ALWAYS map components to Dawn's native global custom properties (e.g., `var(--product-card-corner-radius)`, `rgb(var(--color-badge-background))`). However, **DO NOT strip intentional design choices** (like specific unique shapes, `clip-path` designs, circular play buttons, or floating shadows) just for the sake of strict CSS variable inheritance. Maintain the specific design intent and shape, while mapping the *colors and base variables* to be consistent with the theme.
- **Reusable Components (DRY):** Whenever designing or modifying any section, ALWAYS try to use existing reusable snippets (like `section-heading.liquid`). Proactively introduce new reusable snippets for repeated UI patterns (e.g., buttons, badges, price displays) to keep the codebase clean, DRY, and easy to maintain.
- **Dawn Conventions:** Adhere strictly to the Shopify Dawn theme architecture. Prefer leveraging existing snippets, standard section groups (like `footer-group.json`), and native inline assets before creating custom, disjointed implementations.
- **Customizability Requirements:** ANY new feature built MUST be extremely customizable from the Shopify Theme Editor. Ensure that every option can be toggled on/off or adjusted. Carefully evaluate whether settings should be **global** (placed in `config/settings_schema.json`) or **section-specific** (placed in the Liquid file's `{% schema %}`). Use global settings for elements that span the whole theme (like floating badges or UI overrides), and section settings for component-specific configurations.

## Shopify Dev MCP Usage
- You MUST proactively consult the `shopify-dev-mcp` tools before implementing major structural changes, introducing new Liquid APIs, or when unsure about standard theme conventions.
- Use `learn_shopify_api` to ingest the latest Liquid reference and theme architecture rules into your context.
- Use `search_docs_chunks` to verify standard implementation patterns (e.g. alternate templates, block rendering limits) to ensure absolute adherence to platform best practices.

## Core Principles

- **Premium First:** The interface should resemble a luxury magazine rather than a catalog. Use large whitespace, strong typography, editorial layouts, high-quality imagery, and minimal distractions.
- **Mobile First:** Every experience should be designed for mobile before desktop. Desktop should extend—not redesign—the experience.
- **Performance First:** Every component must justify its existence. Targets: Lighthouse 95+, LCP <2s, CLS <0.05, INP <200ms.
- **Conversion First:** Every screen should help users purchase. Every component should reduce friction.
- **Accessibility First:** Meet WCAG AA standards. Support keyboard navigation, screen readers, focus states, high contrast, and reduced motion.
- **Schema Translations:** ALWAYS verify that a translation key (e.g. `t:sections.all.heading_alignment.label`) exists in `locales/en.default.schema.json` before using it in a section's `{% schema %}`. If it does not exist, you must add it to the locale file to prevent missing translation errors across different locales (like `en-IN` or `en`).
- **Balanced Customization:** "Premium First" refers to the final frontend user experience, not backend code minimalism. Do not optimize for developer-centric DRYness (like removing schema options) at the expense of merchant control. ALWAYS include balanced, granular schema settings per section (like independent alignments, sizes, and styles) to ensure the theme is versatile enough for multiple stores to create diverse, custom layouts while maintaining premium defaults.
