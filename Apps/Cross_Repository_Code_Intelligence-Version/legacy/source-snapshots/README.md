# Read-only legacy source snapshots

Date: 2026-08-07

These ZIP files preserve the recoverable source and offline-preview evidence
that was inspected before the external `D:\APPS_root\deleted` archive is
removed. They are not imported by the application, are not included in its
runtime dependency graph, and must not replace the current Version2 source.

Excluded from every snapshot: `node_modules`, build output, caches, runtime
state, test reports, logs, downloads, `.env*` files, and filenames containing
secret, credential, or token.

| Snapshot | Purpose | SHA-256 |
| --- | --- | --- |
| `cross-new-source-2026-08-07.zip` | Intermediate React/Next/Nest source inspected during migration | `8F4A51867D1E2C969B1A34AA17A000D4A5314C8BF817961F0367E0BCB8539185` |
| `cross-version1-source-2026-08-07.zip` | Earlier Version1 source and assets | `4E63377F7381E886930703C7E8D8DFDF01213CFC3C3577D86FF9C54117BE0AEE` |
| `cross-7.5-packaging-source-2026-08-07.zip` | Superseded Windows packaging and verification source | `C54E506227224533A034CF2F303E7DFD9EF0BD1EE526238834E72293BDCFFDA3` |
| `ipad-preview-original-2026-08-07.zip` | Original offline iPad preview evidence | `B42E6F8661EF6252F482D20E1095E89EB4A285AE4B8C66570712EAABDC9AAA80` |

Version2 already contains every relative source path found in the two React
repositories. The snapshots exist only for forensic comparison and recovery.
The separately maintained `ipad-preview/` directory remains the runnable,
clearly labelled offline preview.
