# Product roadmap

## Implemented

- Compact reference-matched dashboard
- Desktop, tablet, and mobile layouts
- Source-owned Shadcn-style UI primitives
- Local progress, missions, navigation feedback, reading ruler, and mobile drawer
- Dependency-free standalone version

## Recommended production integration

1. Replace local dashboard state with authenticated learner data.
2. Add route handlers or connect the dashboard to the existing NestJS API.
3. Store exercises, evidence, recordings, reviews, and daily plans in Neon PostgreSQL.
4. Connect Grammar Lab and Conversation Studio routes to the quick-launch actions.
5. Add real microphone recording, transcription, correction, and saved evidence.
6. Add unit, accessibility, and end-to-end tests for the completed flows.

No database was added to this visual dashboard because the reference does not require persistent data and the project has no supplied database credentials or schema.
