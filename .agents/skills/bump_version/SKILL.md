---
name: bump_version
description: Rules and steps to update or bump the version numbers in Skytale TimerBoss Desktop workspace.
---

# Bumping the Version in TimerBoss Desktop

When the user asks to update or bump the version of the application, follow these exact steps to ensure all references to the version string remain in sync:

1. **`package.json`**:
   - Locate the `"version"` field at the root level of [package.json](file:///e:/ProgrammingProjects/timerboss-desktop/package.json).
   - Update it to the new target version (e.g., `"1.0.11"`).

2. **`src-tauri/tauri.conf.json`**:
   - Locate the `"version"` field at the root level of [tauri.conf.json](file:///e:/ProgrammingProjects/timerboss-desktop/src-tauri/tauri.conf.json).
   - Update it to match the target version.

3. **`ConfigPage.tsx`**:
   - Locate the state initialization of `currentVersion` in [ConfigPage.tsx](file:///e:/ProgrammingProjects/timerboss-desktop/src/pages/ConfigPage.tsx) (usually around line 70):
     ```typescript
     const [currentVersion, setCurrentVersion] = useState("x.y.z");
     ```
   - Update the default/fallback string `"x.y.z"` to match the target version.

4. **Verify Compilation**:
   - Run type checking and compilation check:
     ```powershell
     npx tsc --noEmit
     ```
   - Ensure the command finishes with exit code `0` (no errors).
