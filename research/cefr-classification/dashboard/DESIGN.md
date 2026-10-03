---
name: CEFR Open-Source Model Evaluation
description: Evidence-first model capability and measured performance dashboard.
colors:
  foundation: ["bg/primary", "bg/secondary", "bg/tertiary", "border/light", "border/default", "text/primary", "text/secondary", "text/tertiary", "icon/accent"]
  charts: ["blue/500", "green/700", "purple/500"]
typography:
  family: "System Sans Variable"
  tokens: ["text/xs/normal", "text/xs/semibold", "text/sm/normal", "text/sm/medium", "heading/md/medium", "heading/2xl"]
spacing:
  card-gap: "space-12"
  section-gap: "space-24"
rounded:
  card: "corner-radius/cr-24"
surfaces:
  dashboard: { shell_width: "1140px", content_width: "800px minimum reading region", top_bar: "48px", outer_padding: "24px" }
components:
  top-bar: "Compact title, snapshot date, and partial-status indicator"
  metric-card: "One source-backed headline per card"
  report-block: "Bounded evidence and decision notes"
  chart-block: "Native accessible comparison charts"
  table-list: "Sortable dense model and corpus matrices"
  popover-menu: "Keyboard-friendly source and filter menus"
implementation:
  artifact: "artifact.json"
  renderer: "Data Analytics portable artifact reader"
---

# CEFR dashboard design contract

## Overview

The dashboard separates model capability facts from measured CEFR outcomes. A partial status and access notices remain visible until approved-corpus runs exist. Users may customize safe labels, ordering, filters, and compatible chart types without removing provenance or the fixture exclusion.

## Colors

Use `bg/primary`, `bg/secondary`, and `bg/tertiary` for hierarchy; `border/light` and `border/default` for structure; `text/primary`, `text/secondary`, and `text/tertiary` for readable contrast; and `icon/accent` only for controls. Charts use `blue/500`, `green/700`, and `purple/500`, with text labels so color is never the only signal.

## Typography

Use `System Sans Variable`. Apply `heading/2xl` to the page title, `heading/md/medium` to major evidence groups, `text/sm/medium` and `text/sm/normal` to panel content, and `text/xs/semibold` plus `text/xs/normal` to dense table metadata.

## Layout

Use the 1140px dashboard shell, retain an 800px readable minimum for narrative, a 48px top bar, and 24px outer padding. `space-12` separates related cards and `space-24` separates major sections. The order is decision, metrics, size comparison, model matrix, then corpus gate.

## Elevation & Depth

Use `elevation/01` only for the shell and true overlays. Tables and chart panels rely on borders and spacing rather than stacked shadows.

## Shapes

Use `corner-radius/cr-24` for major cards and the shared smaller design-system radius for controls. Status pills must include explicit text such as Partial, Measured, or N/A.

## Components

The `top-bar` owns title and freshness. Each `metric-card` has one headline. A `report-block` carries the decision boundary. The `chart-block` compares parameters. The `table-list` provides sortable exact lookup. The `popover-menu` exposes source details and filters with keyboard behavior.

## Do's and Don'ts

Do keep null performance values visibly associated with “N/A — no approved-corpus run.” Do preserve source metadata and fixture exclusion. Do allow users to customize presentation without changing evidence. Don't rank architectures before identical real-data runs. Don't convert planning hardware estimates into measured requirements. Don't represent one text-level prediction as a learner's definitive proficiency.

