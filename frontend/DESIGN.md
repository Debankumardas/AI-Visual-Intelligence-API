# Design reference

The dashboard is a **precision console** for people who run computer-vision models and need to trust what they see. It is dark-only, dense where data lives, and quiet everywhere else.

**Subject and job.** Audience: developers and analysts testing detection, segmentation, OCR and video tracking. Primary job: upload an image or video, see exactly what the model found, and judge whether to trust it.

**The one memorable thing.** The image viewer. Results are drawn on the image as precise, class-coloured boxes and masks inside a viewfinder frame. When results arrive the detections "lock on" (a short outline draw-in). The rest of the interface stays out of the way.

## Process notes

Built with three design skills from openskills.cc, installed outside the repo:

- **frontend-design** (Anthropic): design plan first, then a critique against generic defaults.
- **ui-ux-pro-max**: its generator suggested a playful block-based landing page, which does not fit a precision tool, so it was used for its checklists, chart and UX rules instead.
- **web-design-guidelines** (Vercel): the audit checklist run over the code before delivery.

Where skills disagree, this document decides. Example: Vercel suggests Title Case buttons, frontend-design suggests sentence case; we use sentence case.

### Critique of the first plan, and what changed

| First idea | Why it read as a default | Change |
|---|---|---|
| Geist + Geist Mono | The font everyone reaches for in dev tools | IBM Plex Sans + IBM Plex Mono: engineered, humanist, distinct |
| Overview as a row of KPI tiles | The "big number + small label" default | Overview opens with the latest analysis shown in the viewer; tiles are secondary |
| Same rounded card around everything | The SaaS-card kit | Radius follows hierarchy; panels are separated by tone and hairlines, not shadows |
| Fade-and-slide-up on sections, hover motion on cards | Scattered motion | One orchestrated moment (detections lock on); other motion only answers an action |
| Small ALL-CAPS labels above sections | Template chrome | Sentence-case labels, only where they carry information |
| Mono for every small label | Template chrome | Mono only for raw readouts: coordinates, timings, track IDs |

## Tokens

All colours are defined once as CSS variables in `src/index.css` (`@theme`). Contrast was computed, not eyeballed.

### Surfaces and text

| Token | Value | Notes |
|---|---|---|
| `ink` | `#0B0D10` | Page background |
| `sunken` | `#0E1115` | Inputs, wells, the viewer backdrop |
| `surface` | `#12151A` | Panels |
| `raised` | `#181C22` | Menus, popovers, hovered rows |
| `hairline` | `#232830` | Decorative dividers (1.2:1, never the only boundary) |
| `control-border` | `#646E7E` | Inputs and buttons; 3.3:1 or more on every surface |
| `text` | `#E7EAEE` | 15.2:1 on surface |
| `muted` | `#9099A8` | 6.0:1 or more everywhere; the weakest colour allowed for text |
| `faint` | `#6B7382` | Decoration only. Fails 4.5:1, never used for text |

### Accent and status

| Token | Value | Contrast on surface |
|---|---|---|
| `accent` | `#22D3EE` | 10.1 |
| `accent-hover` | `#67E8F9` | higher |
| `on-accent` | `#04181C` | 10.1 on accent |
| `success` | `#34D399` | 9.5 |
| `warning` | `#FBBF24` | 11.0 |
| `danger` | `#F87171` | 6.6 |

The accent is spent on four things only: focus rings, the primary button, the active navigation item and the selected tab. Status colours are never the only signal; each comes with an icon or text.

### Class colours (charts and overlays)

One palette, used for the same class everywhere: overlay boxes, result rows and charts. A class keeps its colour by hashing its name, so "dog" is the same colour in every view. Every colour is at least 6.7:1 on `surface` (3:1 is the WCAG minimum for graphics).

`#22D3EE` `#F59E0B` `#A78BFA` `#34D399` `#F472B6` `#60A5FA` `#FB923C` `#A3E635`

Colour never carries meaning alone: overlay boxes carry a text label, charts carry direct value labels and a table alternative.

## Typography

- **IBM Plex Sans** (variable, self-hosted): all interface text. Tabular figures (`font-variant-numeric: tabular-nums`) wherever numbers line up.
- **IBM Plex Mono** (self-hosted): raw technical readouts only, namely bounding-box coordinates, inference times and track IDs.
- Scale (rem): 0.75, 0.8125, 0.875 (body in dense areas), 1 (default body), 1.125, 1.375, 1.75. Page titles 1.375 / 600, tight leading. Body line-height 1.5; prose lines under 70 characters.
- Headings use `text-wrap: balance`. Sentence case everywhere. Ellipsis character `…` for loading and truncation.

## Shape and depth

- Radius by role: controls 6 px, panels 10 px, overlays and dialogs 14 px, badges and switches fully round.
- No decorative shadows. Depth comes from tone (`sunken` < `surface` < `raised`) and 1 px borders. Only floating layers (menus, drawers, dialogs) get a shadow, plus a border.
- z-index scale: 10 sticky, 20 dropdown, 30 drawer, 50 dialog and toast.

## Layout

```
┌────────┬──────────────────────────────────────────────┐
│ Rail   │ Page title                      ● API  🔔  ⌄ │  top bar, 56 px
│ 232 px ├──────────────────────────────┬───────────────┤
│        │  Viewer (the image, 2/3)     │ Inspector     │  Image lab:
│ Overview│  boxes + masks + labels     │ results, tabs │  viewer left,
│ Image   │                              │ sticky        │  inspector right
│ Video   ├──────────────────────────────┴───────────────┤
│ Analytics│ Timings                                     │
│ Settings │                                             │
└────────┴──────────────────────────────────────────────┘
```

- Content is left-aligned with a 1280 px maximum; wide charts may use the full width.
- Below 1024 px the rail becomes a drawer opened from the top bar; below 640 px the inspector stacks under the viewer. Targets are at least 44 px on touch.
- Every page has four states: loading (skeletons that match the final layout), empty (says what to do next), error (says what failed and how to fix it), success.

## Motion

- Functional transitions 150–200 ms, `ease-out` entering, `ease-in` leaving, on `transform`, `opacity` and colour only. Never `transition: all`.
- The single orchestrated moment: when image results arrive, boxes draw in over 240 ms, staggered by 30 ms for up to 8 detections.
- Everything stops under `prefers-reduced-motion`.

## Accessibility rules (from the skills)

- Visible `:focus-visible` ring on every interactive element; skip link to `<main>`; semantic landmarks.
- Icon-only buttons have `aria-label`; decorative icons are `aria-hidden`.
- Async updates use `aria-live="polite"`; errors use `role="alert"` and appear next to the field.
- Forms: real labels, `autocomplete`, correct `type`, no blocked paste, submit shows progress and stays disabled during the request.
- Tabs follow the ARIA tabs pattern (roving tabindex, arrow keys).
- Drag and drop always has a keyboard-operable alternative (the dropzone is a real button).
- Charts have a table alternative and direct labels.
- No emoji as icons (lucide SVGs only), no `user-scalable=no`.

## Copy

- Active voice, sentence case, specific labels: "Analyze image", not "Submit".
- An action keeps its name through the flow: "Download annotated image" produces "Annotated image downloaded".
- Errors say what happened and what to do next; they never apologise.
- Numbers use `Intl.NumberFormat`; times use `Intl.DateTimeFormat` or the relative helper in `src/utils/time.js`.

## Component inventory

Primitives in `src/components/ui`: Button, IconButton, Card, Badge, StatCard, MetricTile, Tabs, Field, Dropzone, Skeleton, Spinner, EmptyState, Alert, ElapsedTimer, Menu, Switch.
Layout in `src/components/layout`: AppShell, Sidebar, Topbar, MobileDrawer.
Domain in `src/components/vision`: ImageViewer (SVG overlay), DetectionList, SegmentList, OcrList, ClassSwatch.
Domain in `src/components/analytics`: ClassBarChart, PresenceChart, TrackTimeline, InteractionNetwork, DataTable.
