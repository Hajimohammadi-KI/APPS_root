# Installation roadmap

The Windows installer follows the same understandable lifecycle as
`Cross_Repository_Code_Intelligence-Version2`, while remaining fully offline.
It does not require a separate Node, Bun, npm, or terminal installation.

| Action | Step 1 | Step 2 | Step 3 | Learning data |
| --- | --- | --- | --- | --- |
| First-time install | Validate the offline package | Install the app, API, and Bun runtime | Create shortcuts and prepare first launch | Created locally |
| Update | Check the new version | Replace program files with rollback protection | Return the app to a launchable state | Preserved |
| Repair | Inspect the installation | Restore the complete offline package | Recreate shortcuts | Preserved |
| Uninstall | Stop app processes | Remove program files and shortcuts | Apply the explicit data choice | Preserved by default |

## Safety boundaries

- Program files and personal data use separate directories.
- Update and Repair do not delete progress, settings, or recordings.
- Uninstall deletes learning data only after explicit selection.
- A failed update restores the previous installation.
- The setup executable and payload ZIP must remain next to one another.

## Verification

```powershell
bun run test:installer
bun run package:windows-exe
```

