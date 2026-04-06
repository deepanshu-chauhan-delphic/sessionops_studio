# SessionOps Studio — Design System & Theme Specification

> Apply this theme globally across EVERY component, page, and layout.
> Do NOT use default Tailwind colors or shadcn/ui default themes.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#00c9af` | Primary buttons, active states, links, toggles, focus rings, progress bars, badges (active), selected tabs, FAB, primary CTA |
| `--accent-hover` | `#00b39d` | Hover state for all accent elements |
| `--accent-muted` | `rgba(0, 201, 175, 0.1)` | Accent backgrounds, subtle highlights, selected row bg, accent badges bg |
| `--bg-primary` | `#ffffff` | Page background, main content area |
| `--bg-card` | `#efebe5` | Cards, form sections, sidebar sections, table headers, input backgrounds, modal backgrounds, dropdown menus |
| `--bg-dark` | `#1e2229` | Dark sections, sidebar, footer, hero sections, stat blocks |
| `--bg-dark-alt` | `#35393f` | Alternate dark sections, dark card variants, dark hover states, code blocks, tooltips |
| `--text-primary` | `#1e2229` | Primary body text on light backgrounds |
| `--text-secondary` | `#35393f` | Secondary/muted text on light backgrounds |
| `--text-on-dark` | `#ffffff` | Text on dark backgrounds |
| `--text-on-dark-muted` | `rgba(255, 255, 255, 0.7)` | Secondary text on dark backgrounds |
| `--text-on-accent` | `#ffffff` | Text on accent-colored buttons |
| `--border` | `#e0dcd6` | Borders, dividers, input borders on light bg |
| `--border-dark` | `rgba(255, 255, 255, 0.1)` | Borders on dark backgrounds |
| `--error` | `#e74c3c` | Error states, destructive actions, failed status |
| `--warning` | `#f39c12` | Warning states, needs-review status |
| `--success` | `#00c9af` | Success states (reuse accent) |

---

## Typography

### Font Import (globals.css)
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Saira+Stencil+One&display=swap');
```

### Fonts
- **Headings (feature/display):** `'Saira Stencil One', sans-serif` — Page titles, hero headings, section headers, feature labels
- **All other text:** `'Inter', sans-serif` — Body, labels, buttons, inputs, nav, tables, descriptions

### Type Scale

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page title / H1 | Saira Stencil One | 400 | 28–32px |
| Section heading / H2 | Saira Stencil One | 400 | 22–24px |
| Card heading / H3 | Saira Stencil One | 400 | 18–20px |
| Subheading / H4 | Inter | 600 | 16px |
| Body text | Inter | 400 | 14–15px |
| Small/caption text | Inter | 400 | 12–13px |
| Button text | Inter | 600 | 14px |
| Input text | Inter | 400 | 14px |
| Label text | Inter | 500 | 13px |
| Nav items | Inter | 500 | 14px |
| Badge/tag text | Inter | 600 | 12px |

---

## Component Styling Rules

### Buttons
- **Primary:** bg `#00c9af`, text `#ffffff`, hover bg `#00b39d`, rounded 8px, Inter 600, padding 10px 20px
- **Secondary/Outline:** bg transparent, border `1px solid #00c9af`, text `#00c9af`, hover bg `rgba(0, 201, 175, 0.1)`
- **Destructive:** bg `#e74c3c`, text `#ffffff`, hover bg `#c0392b`
- **Ghost:** bg transparent, text `#1e2229`, hover bg `#efebe5`
- **Disabled:** opacity 0.5, cursor not-allowed
- ALL buttons use Inter font, never Saira Stencil

### Cards
- bg `#efebe5`, rounded 12px, padding 20px 24px
- Shadow: `0 1px 3px rgba(0,0,0,0.05)` (very subtle or none)
- Card headings use Saira Stencil One
- Card body text uses Inter

### Dark Cards / Dark Sections
- bg `#1e2229` or `#35393f`, text `#ffffff`, rounded 12px
- Borders: `rgba(255, 255, 255, 0.1)`
- Muted text: `rgba(255, 255, 255, 0.7)`

### Inputs & Forms
- bg `#efebe5`, border `1px solid #e0dcd6`, rounded 8px, text `#1e2229`, Inter
- Focus: border `#00c9af`, ring `rgba(0, 201, 175, 0.2)`
- Placeholder: `rgba(30, 34, 41, 0.5)`
- Labels: Inter 500, 13px, color `#35393f`, margin-bottom 6px

### Tables
- Header bg `#efebe5`, text `#35393f`, Inter 600
- Row bg `#ffffff`, alternate row bg `rgba(239, 235, 229, 0.4)`
- Hover row bg `rgba(0, 201, 175, 0.05)`
- Selected row bg `rgba(0, 201, 175, 0.1)`
- Border color `#e0dcd6`

### Sidebar / Navigation
- bg `#1e2229`, text `#ffffff`
- Active item: bg `rgba(0, 201, 175, 0.15)`, text `#00c9af`, left border `3px solid #00c9af`
- Hover item: bg `#35393f`
- Section labels: Inter 500, 11px, uppercase, tracking wide, `rgba(255, 255, 255, 0.5)`
- Logo/app name: Saira Stencil One, `#00c9af`

### Badges / Status Pills

| Status | bg | text | border |
|--------|----|------|--------|
| Draft | `rgba(243, 156, 18, 0.15)` | `#f39c12` | `rgba(243, 156, 18, 0.3)` |
| Published | `rgba(0, 201, 175, 0.15)` | `#00c9af` | `rgba(0, 201, 175, 0.3)` |
| Archived | `rgba(53, 57, 63, 0.15)` | `#35393f` | `rgba(53, 57, 63, 0.2)` |
| Active (session) | `rgba(0, 201, 175, 0.15)` | `#00c9af` | — (pulsing dot) |
| Failed | `rgba(231, 76, 60, 0.15)` | `#e74c3c` | — |
| Needs Review | `rgba(243, 156, 18, 0.15)` | `#f39c12` | — |

All badges: rounded-full, Inter 600, 12px, padding 4px 12px

### Modals / Dialogs
- Overlay: `rgba(30, 34, 41, 0.6)` with backdrop-blur 4px
- Modal bg: `#ffffff`, rounded 16px, padding 24px
- Modal heading: Saira Stencil One

### Toasts / Notifications
- Success: left border `4px solid #00c9af`, bg `#ffffff`
- Error: left border `4px solid #e74c3c`, bg `#ffffff`
- Warning: left border `4px solid #f39c12`, bg `#ffffff`

### Tabs
- Inactive: text `#35393f`, Inter 500
- Active: text `#00c9af`, border-bottom `2px solid #00c9af`
- Hover: text `#00c9af`

### Scrollbar (polish)
- Track: `#efebe5`, thumb: `#00c9af`, border-radius 4px

---

## Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#00c9af',
          hover: '#00b39d',
          muted: 'rgba(0, 201, 175, 0.1)',
        },
        surface: {
          DEFAULT: '#ffffff',
          card: '#efebe5',
          dark: '#1e2229',
          'dark-alt': '#35393f',
        },
        border: {
          DEFAULT: '#e0dcd6',
          dark: 'rgba(255, 255, 255, 0.1)',
        },
        status: {
          error: '#e74c3c',
          warning: '#f39c12',
          success: '#00c9af',
        },
      },
      fontFamily: {
        display: ['"Saira Stencil One"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        modal: '16px',
      },
    },
  },
};
```

---

## CSS Variables (globals.css)

```css
:root {
  --accent: #00c9af;
  --accent-hover: #00b39d;
  --accent-muted: rgba(0, 201, 175, 0.1);
  --bg-primary: #ffffff;
  --bg-card: #efebe5;
  --bg-dark: #1e2229;
  --bg-dark-alt: #35393f;
  --text-primary: #1e2229;
  --text-secondary: #35393f;
  --text-on-dark: #ffffff;
  --border: #e0dcd6;
  --error: #e74c3c;
  --warning: #f39c12;
  --success: #00c9af;
  --font-display: 'Saira Stencil One', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

---

## Global Rules

- NEVER use default blue/indigo/violet colors from Tailwind or shadcn defaults
- ALL interactive elements use `#00c9af` as accent
- ALL headings that serve as page titles, section titles, or feature labels use Saira Stencil One
- ALL body text, UI text, buttons, inputs, labels use Inter
- ALL cards and form containers use `#efebe5` background
- App background is always `#ffffff`
- Dark sections (`#1e2229`, `#35393f`) used for sidebar, footer, stat blocks ONLY — never main page background
- Override shadcn/ui CSS variables to match this spec
- Consistent 8px radius on buttons/inputs, 12px on cards
- App name "SessionOps Studio" in sidebar/header: Saira Stencil One, `#00c9af`
