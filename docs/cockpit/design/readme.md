# model-bench — Design System

Design system for **model-bench**, a cockpit used by a tech YouTube creator to launch AI coding models on a battery of concrete projects (3D scene, landing page, game, API), watch them work live, and compare what they built. The cockpit is a working tool *and* appears on camera — it must read well filmed at 1080p.

**Sources:** the design brief pasted in chat (French) and the `Cockpit.dc.html` prototype in this project. No codebase, Figma, or logo was provided. Visual reference points named in the brief: Hugging Face, OpenRouter.

## Index
- `styles.css` — entry point (imports only)
- `tokens/` — `primitives.css` (raw scales), `semantic.css` (dark default + light), `typography.css`, `spacing.css` (space, radius, controls, motion), `fonts.css`, `base.css`
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand)
- `components/forms` — Button, Input, Checkbox, Radio, Switch, Segmented, Chip
- `components/data` — StatusBadge, ScoreBar, SegmentBar, Stat, Kbd
- `components/layout` — Panel, Tabs, Toast, CommandPalette
- `ui_kits/cockpit` — full app (embeds `Cockpit.dc.html`)
- `SKILL.md` — Agent Skill entry

## Token architecture
Two layers. **Primitives** (`--zinc-*`, `--blue-*`, `--green-*`, `--amber-*`, `--red-*`) are raw values and never used in components. **Semantic** tokens use shadcn/ui names (`--background`, `--card`, `--muted`, `--border`, `--input`, `--foreground`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--ring`, `--accent`, `--destructive`) plus additions (`--subtle-foreground`, `--active-foreground`, `--success(-soft)`, `--warning(-soft)`, `--destructive-soft`, `--stopped(-soft)`). Dark is `:root`; light is `[data-theme="light"]`. For Tailwind 4, map them in `@theme inline { --color-background: var(--background); … }` (the Tokens screen in the cockpit prints a ready `globals.css`).

## CONTENT FUNDAMENTALS
- Language: French UI, terse. Labels lower-case in mono (`progression`, `coût`, `durée`, `en attente`); buttons sentence-case verbs (`Lancer un run`, `Comparer`, `Arrêter`, `Relancer`).
- Identifiers are OpenRouter-style slugs: `anthropic/opus-5.5`, `3d/black-hole`, run IDs `r-0923a`. Show the slug first, the human name second.
- Numbers are the heroes: `20.45 $`, `1h46`, `10/10`, `412k`, `07:12 / 30:00`. Dot decimal, `$` after, no thousands separators under 10k.
- Addressing: no "je/vous" in UI; imperative verbs only. No marketing copy, no exclamation marks, no emoji.
- Meta rows joined with ` · ` (e.g. `via Claude Code · 23/09/2026 08:12 · 10 projets`).

## VISUAL FOUNDATIONS
- **Vibe:** developer tool, dark-first, data-dense. Zinc neutrals (cool, not warm), hairline borders, flat surfaces. The UI stays grey so demo captures (3D renders, games, pages) are the only color.
- **Color use:** one accent — blue — reserved for *active*: running state, pulse dot, live timers, progress fill, selected filters, focus ring, rank #1 bar. Primary actions are **monochrome** (white on dark / black on light), never blue. Status colors only inside badges and progress segments.
- **Type:** Inter for UI chrome and prose; JetBrains Mono for anything technical and for all labels/metrics. Page titles 22px/600; section 15px/600; body 14px; mono meta 12.5px; labels 11.5px. Score hero 56px mono. Nothing below 10.5px.
- **Backgrounds:** solid only. No gradients, textures, illustrations or imagery in chrome. Demo stages are `#030304` regardless of theme.
- **Borders:** 1px `--border` on every surface; `--input` (stronger) on controls. Tables are rows separated by hairlines, 58px min height, 38px header in mono labels.
- **Elevation:** no shadows on cards. `--shadow-popover` only on dropdowns, palette, toasts.
- **Radii:** 4–6px controls/badges, 8px buttons/inputs, 10px panels & cards, 12px palette. No pills except the switch track.
- **Cards:** bordered surface, 16:9 thumbnail flush on top with a hairline under it, mono slug + sans subtitle, meta row. Overlay labels on imagery use `rgba(0,0,0,.78)` capsules with white text.
- **Hover:** background → `--muted` or border → `--input`; primary buttons drop to 88% opacity. **Press:** none beyond native. **Focus:** 2px `--ring` outline.
- **Motion:** minimal. 120–180ms ease-out on color/position; the only loop is the running pulse (1.4s). No bounces, no entrance animations.
- **Transparency/blur:** only for the modal scrim and image overlay labels. No backdrop blur.
- **Layout:** sticky 56px top bar (logo, nav, ⌘K search, live-run pill, theme, primary CTA), breadcrumb row below where every level is a dropdown, 1440px max content width, 28px gutters; grids use minmax/auto-fill to hold on tablet.
- **States:** pending (dashed outline, grey ○), running (blue soft bg + pulse), livré (green ✓), ne démarre pas (red outline ▲), erreur (red fill ✕), timeout (amber ◷), arrêté (grey ■), v2 (outlined mono tag). Always glyph + color + label.

## ICONOGRAPHY
No icon set was provided and the design deliberately uses almost none. Status and actions rely on Unicode glyphs rendered in the mono font: ✓ ✕ ▲ ◷ ■ ○ ↻ → ▼ › ⌘. Model avatars are 2-letter mono initials in a bordered square (`AN`, `OA`). No emoji. If a real icon set is needed later, Lucide (1.5px stroke) is the closest match — flag before adopting.

## Brand / logo
No logo was provided. The wordmark is plain type: a 22px bordered square containing `mb` in mono + "model-bench" in Inter 600. Replace when a real mark exists.

## Fonts
Inter and JetBrains Mono are loaded from Google Fonts (the brief asked for "Inter ou équivalent" / "JetBrains Mono ou équivalent"). Self-host the files for production.

## Intentional additions
- `StatusBadge`, `SegmentBar`, `ScoreBar`, `Stat`: domain primitives for runs/results required by the brief.
- `CommandPalette`: the ⌘K navigation required by the brief.
