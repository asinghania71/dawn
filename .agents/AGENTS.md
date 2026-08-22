# Shopify Theme Development Standards

## Theme Architecture & Styling
- **Color Schemes vs. Color Pickers:** For general section wrappers and blocks, ALWAYS use Shopify's native `color_scheme` setting (e.g., `scheme-1`). However, for specific micro-components with multiple visual states (like progress bars, custom badges, or success text), you may use specific color pickers (e.g., `color` type in schema) to give merchants granular control over those distinct states.
- **Global CSS Variables:** NEVER hardcode hex colors or basic box-shadows. ALWAYS map components to Dawn's native global custom properties (e.g., `var(--product-card-corner-radius)`, `rgb(var(--color-badge-background))`). However, **DO NOT strip intentional design choices** (like specific unique shapes, `clip-path` designs, circular play buttons, or floating shadows) just for the sake of strict CSS variable inheritance. Maintain the specific design intent and shape, while mapping the *colors and base variables* to be consistent with the theme.
- **Reusable Components (DRY) & UI Consistency:** BEFORE implementing any new feature, always search the codebase to see if there is an existing similar-looking UI. If there is, you MUST reuse most of the components, CSS classes, and liquid snippets from it. Do not reinvent the wheel. Proactively introduce new reusable snippets for repeated UI patterns to keep the codebase clean and highly consistent.
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
- **Zero Hardcoded Strings in Schemas (Strict Tokenization):** NEVER write hardcoded English strings for `"name"`, `"label"`, `"content"`, or `"info"` in any section's `{% schema %}` block. ALWAYS use Shopify translation tokens (e.g. `"t:sections.<section_name>.<setting>"`, `"t:settings_schema.<group>.<setting>"`, or `"t:sections.all.*"`).
- **Multi-Language Synchronization:** Whenever introducing or modifying ANY translation key in `locales/en.default.schema.json` or `locales/en.default.json`, you MUST immediately propagate and provide translations across ALL other locale files (all 20 `*.schema.json` and 31 `*.json` files). A key must NEVER exist in `en.default` without being present in every other language file.
- **Canonical Icon Tokens:** When adding SVG icon selectors in schemas, ALWAYS reuse Dawn's standard icon tokens (`t:sections.collapsible_content.blocks.collapsible_row.settings.icon.options__...`) instead of inventing custom icon labels.
- **Storefront String Localization:** All user-facing frontend strings in `.liquid` templates and snippets MUST use the Liquid translation filter (`{{ 'general.xyz' | t }}`), with keys defined across all storefront locale files (`locales/*.json`).
- **Balanced Customization:** "Premium First" refers to the final frontend user experience, not backend code minimalism. Do not optimize for developer-centric DRYness (like removing schema options) at the expense of merchant control. ALWAYS include balanced, granular schema settings per section (like independent alignments, sizes, and styles) to ensure the theme is versatile enough for multiple stores to create diverse, custom layouts while maintaining premium defaults.
- **Ask When Confused:** If you are unsure about the user's design intent, how a specific component should look, or if a requirement is ambiguous, DO NOT make assumptions or guess. Stop and ask the user for clarification before proceeding.

---

## Anti-Iteration Rules
*(Derived from actual project mistakes — follow these to avoid repeated correction cycles)*

### CSS & Design
- **Visual Micro-Auditing Checklist:** Every UI component edit MUST be verified against 4 mandatory CSS checks:
  1. **Container Margin & Alignment:** Verify elements are placed inside standard section wrappers (e.g. `page-width`) or have explicit matching side padding so they align with adjacent grid items.
  2. **Edge Inset & Clearance:** Never anchor badges or floating elements at `0px` flush borders — always enforce a minimum `1.2rem` (12px) inset margin from container edges.
  3. **Layering & Hit Targets:** When placing visual overlays (labels, ribbons, icons) over buttons or image triggers, explicitly set `pointer-events: none` on non-interactive overlays so underlying buttons remain 100% clickable.
  4. **Multi-Line Flow & Line-Height:** Always style inline text elements with `line-height: 1.5+` and flex wrapping gaps so long strings wrap gracefully without clipping adjacent elements.
- **Shape vs. Color:** CSS variable inheritance applies to colors, shadows, and borders ONLY. NEVER replace intentional shape-defining values like `border-radius: 50%` (circle), `clip-path` polygons, or unique floating shadows with theme variables. Those are design intent, not theme tokens.
- **Audit Wide on Class-of-Error:** If a pattern-level mistake is found (e.g., shapes incorrectly standardized), immediately `grep` across ALL `/assets/*.css` files for the same error before declaring the fix done. Never fix just the reported file.
- **Read Before Planning:** ALWAYS `view_file` the actual current file before writing any plan or making edits. Never plan changes against an assumed or remembered state.

### Schema Design & Localization
- **100% Tokenized Options:** Every `select` option label in `{% schema %}` MUST use `"t:..."` translation references, including common reusable options like image ratios, heading sizes, colors, alignments, and icon sets.
- **Verify Key Existence Before Committing:** Before finishing any task, programmatically verify that every single `t:...` token across all section schemas resolves cleanly against `locales/en.default.schema.json` and all `*.schema.json` files with 0 missing keys.
- **Mirror Dawn's Standard Options Exactly:** Before writing any `select` schema setting, look up the equivalent in an existing Dawn section and copy its option values verbatim. Standard conventions:
  - `image_ratio`: `adapt`, `portrait`, `square` (never "landscape", never "adapt to image" as value)
  - `heading_size`: `h2`, `h1`, `h0`, `hxl`, `hxxl`
  - `text_style`: `body`, `subtitle`, `uppercase`
- **Always Group Settings with Headers:** Any section with more than 5 settings MUST use `"type": "header"` separators. Standard groups: Heading → Layout → [Feature-specific] → Color schemes → Section padding. This is mandatory, not optional.
- **Use Precise, Unambiguous Setting IDs:** Never reuse the same setting ID for two different concepts in the same section. E.g., use `video_ratio` for the video card shape and `image_ratio` for the product thumbnail shape.
- **Multi-State Components Need Independent Color Pickers:** For any component with multiple visual states (progress bar, badge, alert), each state MUST have its own color schema setting. Never combine them.

### Platform & Third-Party Features
- **Verify Platform Capability Before Building:** Before implementing any third-party embed (Instagram, TikTok, Pinterest, etc.), confirm whether the platform allows clean iframe embedding. Instagram Reels do NOT support iframe embeds — they block it via `X-Frame-Options`. The correct fallback is a poster image + link that opens the URL externally.
- **Validate Default/Example URLs:** Any example URL used in a section preset or template JSON must be a format the section's JS actually handles. Test regex patterns against example URLs before committing.


