# Self-contained recovery audit

Date: 2026-08-07

## Authoritative application

`D:\APPS_root\Apps\English\English-07082026`

## Result

The current application is self-contained. Its Next.js frontend, NestJS API,
typed curriculum, optional Neon migration, local persistence, speech/audio,
backup/import, PWA files, Windows packaging source, tests, and root runnable
legacy archive do not read from `D:\APPS_root\deleted`.

The old `English_Grammer_Automaticity` folder was empty. `English_old` was an
intermediate Vinext starter with 41 eligible files, mixed English/German data,
and retired naming. It is not the canonical product source. Its required
learning capabilities are already represented by the root v27 archive and the
typed migrated implementation, while exact source/content parity is enforced
by `docs/LEGACY-PARITY.md` and the automated parity tests.

The intermediate source was deliberately not copied into the clean current
application because it would reintroduce retired naming and duplicate an older
architecture. Generated outputs, dependency folders, caches, old installers,
and copyright-quarantined material are likewise unnecessary.

The standard Shadcn configuration is valid. The Shadcn CLI resolves Next.js
16.2.12, React Server Components, TypeScript, Tailwind CSS v4, and 11 installed
UI primitives: accordion, badge, button, card, checkbox, empty, input, label,
progress, select, and textarea.
