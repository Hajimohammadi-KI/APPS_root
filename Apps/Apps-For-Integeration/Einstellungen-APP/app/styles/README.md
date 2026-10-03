# Settings App visual files

- `00-foundation-and-shell.css` — colors, base layout, navigation and shared cards
- `pages/settings.css` — settings page sections
- `components/settings-module.css` — reusable embedded settings module
- `99-modern-overrides.css` — latest visual refinements
- `91-accessibility.css` — global reading ruler

All files are loaded in order by `../globals.css`; `layout.tsx` imports only that entry point.
