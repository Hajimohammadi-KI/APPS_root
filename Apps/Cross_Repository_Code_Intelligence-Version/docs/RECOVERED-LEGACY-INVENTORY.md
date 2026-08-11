# Recovered legacy inventory

Date: 2026-08-07

## Sources inspected

- D:\APPS_root\deleted\Cross_Repository_Code_Intelligence\Cross_Repository_Code_Intelligence_new
- D:\APPS_root\deleted\Cross_Repository_Code_Intelligence\Cross_Repository_Code_Intelligence-07082026-move-remainder\deleted\Version1
- D:\APPS_root\deleted\Cross_Repository_Code_Intelligence\Cross_Repository_Code_Intelligence7.5
- D:\APPS_root\deleted\Cross_Repository_Code_Intelligence\ipad-preview

The external paths above record where the comparison was performed. Their
recoverable, non-secret source is now preserved inside Version2 under
`legacy/source-snapshots/`; Version2 does not require the external archive.

The two intermediate React repositories contain tracker, plan data, PDF reader,
Settings, persistence routes, database schema, NestJS source, migrations, and
the Exposé. Version2 contains those product areas plus the NLP lab, additional
tests, release verification, persistent runtime fixes, and the accessible
purple redesign.

The recovered standalone HTML is START-IPAD.html. It is an offline iPad
preview, not the canonical desktop tracker source. It must remain labelled
IPAD PREVIEW.

## File-level comparison result

- `Cross_Repository_Code_Intelligence_new`: 124 eligible files; 89 are
  byte-identical at the same path and the remaining 35 have newer Version2
  revisions. No eligible relative path is missing.
- `Version1`: 140 eligible source/configuration/asset files. No eligible
  relative path is missing from Version2.
- `Cross_Repository_Code_Intelligence7.5`: 21 old packaging and verification
  files. They are preserved as a read-only snapshot because the old installer
  implementation is superseded and must not replace the repaired setup flow.
- `ipad-preview`: all three files are present in Version2. The current
  `START-IPAD.html` is the corrected preview; the exact original is retained
  in the snapshot.

## Missing canonical evidence

No copy or filename variant of
StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html was found under:

- D:\APPS_root
- D:\Bachelor-Thesis
- D:\Setting
- the current user's Documents, Downloads, or Desktop

Therefore exact parity for every legacy string, layout, asset, event, and
storage key remains unprovable. The current product can be verified as working,
but must not be labelled canonical legacy parity complete until that source is
recovered and the fixture gate passes.
