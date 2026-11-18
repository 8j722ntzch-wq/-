# Portfolio hover and typography review — 18.11.2026

Source of interaction: Figma \`container_Портфолио\`, master 72:3751, State=Default/Hover for Ruckit and Hello Kitty on Desktop/Mobile. The reference Hover state underlines **only the values** after "Проект:" and "Объём:"; the labels stay unadorned.

## Implementation

\`src/components/cards/PortfolioCard.astro\` now wraps the project title and order quantity in separate spans (\`.portfolio-project-value\` and \`.portfolio-volume-value\`). A single rule scoped to the whole \`.portfolio-card:is(:hover,:focus-within)\` applies the underline from any point in the card, including image, metadata, label and button. Focus within the card provides the equivalent keyboard state without turning the entire card into a duplicate link.

## Full source audit: letter spacing -2% → 0%

Searched **all 62 Astro/TS/JSON/CSS source files** under \`src\`, including shared components, page-specific CSS, data and UI-kit. Updated every CSS \`letter-spacing: -.02em\` / \`-0.02em\` to \`0em\`, including:

- \`src/styles/typography.css\`: H2, H6, H7, H8
- \`src/components/blocks/Footer.astro\`: column headings
- \`src/components/blocks/PortfolioCatalog.astro\`: portfolio filter buttons
- \`src/components/ui/SectionHeading.astro\`: section heading
- \`src/components/ui/ServiceOption.astro\`: service options
- \`src/pages/contacts/index.astro\`: contact section labels

Total: **9 CSS declarations**. The **4 affected values** in the locally stored \`src/data/figma-styles.json\` were normalized to 0%, so the local UI-kit agrees with its rendered CSS. The original Figma file was **not mutated**: the local design system reflects the user-requested override of the earlier -2% source styles.

Existing, separately calibrated pixel-specific letter-spacing values on Mobile 404 and Mobile Policy (respectively -1.5px and -0.7px) are not -2% settings and were not modified, to avoid changing previously approved wrapping without another explicit request.

## Verification

\`tests/ui/portfolio-hover-typography.spec.ts\` checks both Figma project types, hover from multiple card regions, label-vs-value decoration, keyboard focus, the six catalog placements, mobile hover, and the lack of residual -2% CSS or local type tokens. Existing Playwright regressions and the release gate are unchanged. Only \`development\` is modified.
