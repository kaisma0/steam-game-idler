# Fork Changes — Reproducible Instructions

These instructions describe how to transform the upstream `zevnda/steam-game-idler` repository into this fork (`kaisma0/steam-game-idler`). They are written to work against **any future version** of the upstream repo, not just one specific commit. Each step explains the intent so you can adapt if the code has changed.

---

## Step 1: Delete Files

Delete these files/directories. If any no longer exist in the upstream, skip them.

**Root files:**
- `README.md`
- `LICENSE`
- `SECURITY.md`
- `CONTRIBUTING.md`

**Git hooks & IDE config:**
- `.husky/` (entire directory)
- `.vscode/` (entire directory)

**GitHub config (everything except `release.yml`):**
- `.github/CODEOWNERS`
- `.github/FUNDING.yml`
- `.github/dependabot.yml`
- `.github/labeler.yml`
- `.github/crowdin.yml`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/` (entire directory)
- `.github/workflows/crowdin.yml`
- `.github/workflows/discord.yml`
- `.github/workflows/labeler.yml`
- `.github/workflows/labeler-history.yml`

**In-app ad and helpdesk components:**
- `src/shared/components/AdSlot.tsx` — Google Adsense banner embedded in the app UI
- `src/shared/components/titlebar/HelpDesk.tsx` — Chatway-based support widget in the titlebar

**Unused assets:**
- `public/logo.png`

---

## Step 2: Global Branding — `zevnda` → `kaisma0`

The goal is to rebrand the fork so all GitHub links, author fields, and AppData paths point to `kaisma0` instead of `zevnda`.

### What to replace

Run these find/replace operations across the **entire repo** (excluding `node_modules`, `.git`, `Cargo.lock`, and `src-tauri/Cargo.toml` line with `plugins-workspace-custom`):

| Find | Replace | Scope |
|------|---------|-------|
| `github.com/zevnda/steam-game-idler` | `github.com/kaisma0/steam-game-idler` | Everywhere |
| `api.github.com/repos/zevnda/steam-game-idler` | `api.github.com/repos/kaisma0/steam-game-idler` | `docs/` API fetches |
| `com.zevnda.steam-game-idler` | `com.kaisma0.steam-game-idler` | AppData paths in docs |
| `"author": "zevnda"` | `"author": "kaisma0"` | `package.json`, `docs/package.json` |
| `authors = ["zevnda"]` | `authors = ["kaisma0"]` | `src-tauri/Cargo.toml` |
| `name: 'zevnda'` | `name: 'kaisma0'` | `docs/app/layout.tsx` metadata |
| `url: 'https://github.com/zevnda'` | `url: 'https://github.com/kaisma0'` | `docs/app/layout.tsx` metadata |
| `creator: 'zevnda'` | `creator: 'kaisma0'` | `docs/app/layout.tsx` metadata |
| `Copyright © 2024-2026 zevnda` (or similar year range) | `Copyright © 2024-2026 kaisma0` | `src-tauri/tauri.conf.json` copyright |

### What to KEEP as `zevnda`

**Do not change** this line in `src-tauri/Cargo.toml`:
```toml
tauri-plugin-window-state = { git = "https://github.com/zevnda/plugins-workspace-custom" }
```
This is a third-party library dependency hosted in zevnda's repo. It must stay as-is or the Rust build will fail.

Also keep any `zevnda/steam-utility` references if they appear in changelogs — those are links to the original utility library repo.

---

## Step 3: Tauri Config — `src-tauri/tauri.conf.json`

In addition to the branding changes above, make these structural edits:

### Remove LICENSE from resources

The `bundle.resources` array will contain `"LICENSE"` — remove it. The array should keep `"libs/*"` and `".installed"` (and anything else), just not `"LICENSE"`.

### Remove licenseFile

Delete the `"licenseFile": "LICENSE"` line from the `bundle` section.

**Why:** The `LICENSE` file was deleted in Step 1. Without these changes, `tauri build` will fail looking for the missing file.

---

## Step 4: Clear Data Files

### `notifications.json`
Replace entire contents with:
```json
[]
```
**Why:** This file contained upstream notifications (update announcements, etc.) that don't apply to the fork.

### `latest.json`
Update the URL inside to point to `kaisma0` repo. The structure stays the same — just ensure any `zevnda` in the URL is replaced with `kaisma0`. The `signature` field should be set to a placeholder like `"PLACEHOLDER_WILL_BE_UPDATED_BY_WORKFLOW"` since the real signature is generated during the release build.

---

## Step 5: Remove AdSlot and HelpDesk References

After deleting the files in Step 1, you need to remove all imports and usages of these components from the rest of the codebase. Search for these and remove them:

### AdSlot

1. **`src/shared/components/index.ts`** — Remove the export line: `export { AdSlot } from './AdSlot'`
2. **`src/features/settings/components/Settings.tsx`** — Remove `AdSlot` from the import statement. Remove the `<AdSlot />` JSX element (it appears in the settings sidebar, between social buttons and the version text).
3. **`src/shared/components/Sidebar.tsx`** — Remove `AdSlot` from the import statement. Remove the `<AdSlot />` JSX element (it appears somewhere in the sidebar bottom area). **Remove excess blank lines** left behind.
4. **Any other file importing AdSlot** — Search for `AdSlot` across `src/` and remove all imports and usages.

### HelpDesk

1. **`src/shared/components/index.ts`** — Remove the export line: `export { HelpDesk } from './titlebar/HelpDesk'`
2. **`src/shared/components/titlebar/Titlebar.tsx`** — Remove `HelpDesk` from the import statement. Remove the `<HelpDesk />` JSX element (it appears between `<Notifications />` and `<Menu />` in the titlebar).
3. **Any other file importing HelpDesk** — Search for `HelpDesk` across `src/` and remove all imports and usages.

**Why:** AdSlot showed Google ads in the app UI (revenue went to upstream). HelpDesk was a Chatway support widget that sent messages to upstream's helpdesk.

---

## Step 6: Pro Feature Unlock

The upstream app has a subscription-based "Pro" tier that gates features behind a Stripe payment. This fork unlocks all Pro features for free.

### 6a. Store default — `src/shared/stores/userStore.ts`

Find the `isPro` field in the zustand store. It will be initialized to `null`:
```typescript
isPro: null,
```
Change it to:
```typescript
isPro: true,
```

### 6b. Pro check hook — `src/shared/hooks/useCheckForPro.ts`

Replace the **entire function body** of `useCheckForPro`. The original function fetches subscription status from an API (likely `apibase.vercel.app/api/pro-data` or similar) and conditionally sets `isPro`. Replace the entire file contents with:

```typescript
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { logEvent } from '@/shared/utils'

export function useCheckForPro() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsPro = useUserStore(state => state.setIsPro)

  // Always enable Pro features
  useEffect(() => {
    setIsPro(true)
  }, [setIsPro])
}
```

Keep the same imports that exist in the original file (the function signature may import `logEvent` or `useUserStore` — keep those to avoid lint errors from unused export changes elsewhere). The key change is: **delete all the API fetching / Stripe checking logic** and replace the useEffect body with just `setIsPro(true)`.

**Why:** This makes all Pro features (custom themes, auto-redeem free games, steam credential storage, card farming enhancements, etc.) available without a subscription.

---

## Step 7: Replace Release Workflow

Replace the ENTIRE contents of `.github/workflows/release.yml` with a simplified workflow. The key differences from upstream:

1. **Add a `check_quality` job** that runs before the build: installs pnpm, runs `pnpm typecheck` and `pnpm lint:all`
2. **Remove** the GitHub App token generation job (used for creating version bump PRs)
3. **Remove** the `create-pr` step that created pull requests for version changes
4. **Add caching**: `pnpm` cache via `actions/setup-node` with `cache: "pnpm"`, and Rust cache via `swatinem/rust-cache@v2` with `workspaces: "./src-tauri -> target"`
5. **Use dynamic repo URLs**: Replace any hardcoded `zevnda/steam-game-idler` or `kaisma0/steam-game-idler` in the workflow with `${{ github.repository }}`
6. **Keep** the core build flow: checkout → setup tools → install deps → bump version → build → create release → update latest.json → commit

The workflow should be `workflow_dispatch` triggered with a `tag_name` input. The build runs on `windows-latest`. The `build-and-release` job should have `needs: [check_quality]`.

Here is the complete replacement workflow:

```yaml
name: Build and Release

on:
  workflow_dispatch:
    inputs:
      tag_name:
        description: 'Tag name for release (e.g. v1.0.0)'
        required: true
        default: 'manual-release'

jobs:
  check_quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: latest

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint:all

  build-and-release:
    runs-on: windows-latest
    needs: [check_quality]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: latest

      - name: Setup MSBuild
        uses: microsoft/setup-msbuild@v2

      - name: Build .NET libraries
        run: MSBuild.exe .\libs\SteamUtility.csproj
        shell: pwsh

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Rust Cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: "./src-tauri -> target"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Bump version in tauri.conf.json
        run: |
          $version = "${{ github.event.inputs.tag_name }}" -replace '^v', ''
          $tauriConfPath = "src-tauri/tauri.conf.json"
          
          # Read, replace version, and write back
          $json = Get-Content $tauriConfPath -Raw
          $json = $json -replace '"version": ".*?"', """version"": ""$version"""
          $json | Set-Content $tauriConfPath
          
          Write-Host "Bumped tauri.conf.json version to $version"
        shell: pwsh

      - name: Build Tauri app
        run: |
          $env:NEXT_TELEMETRY_DISABLED = "1"
          pnpm tauri build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          STEAM_API_KEY: ${{ secrets.STEAM_API_KEY }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}

      - name: Prepare portable executable
        run: |
          $portableDir = "./portable-package"
          New-Item -ItemType Directory -Force -Path $portableDir
          
          # Copy the executable
          Copy-Item "./src-tauri/target/release/Steam Game Idler.exe" -Destination "$portableDir/Steam Game Idler.exe"
          
          # Copy the libs folder
          Copy-Item "./src-tauri/libs" -Destination "$portableDir/libs" -Recurse -Force
          
          # Create the portable zip
          Compress-Archive -Path "$portableDir/*" -DestinationPath "./src-tauri/target/release/Steam Game Idler_${{ github.event.inputs.tag_name }}_x64-portable.zip" -Force
          
          # Clean up temporary directory
          Remove-Item -Recurse -Force $portableDir
        shell: pwsh

      - name: Create Release
        uses: softprops/action-gh-release@v1
        if: success()
        with:
          tag_name: ${{ github.event.inputs.tag_name }}
          name: Release ${{ github.event.inputs.tag_name }}
          body: "New Release"
          draft: false
          prerelease: false
          files: |
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/nsis/*.zip

            src-tauri/target/release/*-portable.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Update latest.json for auto-updater
        if: success()
        run: |
          $version = "${{ github.event.inputs.tag_name }}" -replace '^v', ''
          
          # Read the signature from the .sig file generated by tauri build
          $sigFile = Get-ChildItem -Path "./src-tauri/target/release/bundle/nsis/*.nsis.zip.sig" | Select-Object -First 1
          $signature = Get-Content $sigFile.FullName -Raw
          $signature = $signature.Trim()
          
          # Get the correct filename from the signature file (remove .sig)
          $zipName = $sigFile.Name.Replace(".sig", "")
          # Replace spaces with dots to match actual release filenames
          $urlZipName = $zipName.Replace(" ", ".")
          
          # Build the download URL
          $url = "https://github.com/${{ github.repository }}/releases/download/${{ github.event.inputs.tag_name }}/$urlZipName"
          
          # Create the latest.json content
          $latestJson = @{
            version = $version
            major = $false
            notes = "Release ${{ github.event.inputs.tag_name }}"
            platforms = @{
              "windows-x86_64" = @{
                signature = $signature
                url = $url
              }
            }
          } | ConvertTo-Json -Depth 4
          
          # Write to file
          $latestJson | Out-File -FilePath "./latest.json" -Encoding utf8 -NoNewline
          
          Write-Host "Updated latest.json with version: $version"
          Write-Host "Signature: $signature"
          Write-Host "URL: $url"
        shell: pwsh

      - name: Commit and push latest.json
        if: success()
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add latest.json
          git commit -m "chore: update latest.json for ${{ github.event.inputs.tag_name }}"
          git push origin HEAD:main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ALLOW_MAIN_COMMIT: "1"
```

---

## Step 8: Changelog Edits

If any changelog files in `docs/content/changelog/` contain links to `zevnda/steam-game-idler/discussions/` (e.g. translation guide links), remove those specific lines or the discussion link portion. These are upstream community links that don't apply to the fork.

For example, in `4.0.3.mdx`, the original had:
```
- Added support for **Macedonian** and **German** languages. If you would like to contribute...refer to the **[translation guide](https://github.com/zevnda/steam-game-idler/discussions/148)**...
```
This should be simplified to:
```
- Added support for **Macedonian** and **German** languages..
```

Other changelog files can keep their content but should have `zevnda` GitHub links updated to `kaisma0` per Step 2.

---

## Step 9: Husky Cleanup

Since `.husky/` was deleted in Step 1, you need to handle the orphaned references in `package.json`:

Remove the husky `prepare` script and dependency:
- Delete `"prepare": "husky"` from the `scripts` section
- Delete `"husky": "^X.X.X"` from `devDependencies`
- **Also remove the 3 `husky` entries from `pnpm-lock.yaml`** (importer devDep, package resolution, and snapshot). Otherwise `pnpm install --frozen-lockfile` will fail in CI.


## Step 10: Remove Chatway Widget from App Layout

In `src/shared/components/layouts/Layout.tsx`:

1. **Remove the two `<Script>` tags** that load the Chatway widget. Search for `chatway` — you'll find a `<Script id='chatway' src='https://cdn.chatway.app/widget.js?id=...' />` and a `<Script id='chatway-hide-icon' ...>` block. Delete both elements entirely.
2. **Remove the `import Script from 'next/script'`** line if `Script` is no longer used anywhere else in the file.
3. **Remove excess blank lines** left behind by the deletion (keep at most 1 blank line between elements to satisfy `no-multiple-empty-lines` lint rule).

In `src/styles/globals.css`:

3. **Remove the `.chatway--frame-container` CSS rule** (search for "Chatway" comment block). This styled the now-deleted widget.

**Why:** The Chatway widget connected to upstream's helpdesk — user support messages would go to zevnda, not you.

---

## Step 11: Remove Stripe Billing Link

In `src/features/settings/components/general/GeneralSettings.tsx`:

Find and remove the conditional block that renders a "Manage Subscription" button linking to Stripe's billing portal. It looks like:

```tsx
{isPro && (
  <ExtLink href='https://billing.stripe.com/p/login/...'>
    <div ...>
      {t('settings.general.manageSubscription')}
    </div>
  </ExtLink>
)}
```

Delete the entire `{isPro && (...)}` block.

**Why:** Clicking "Manage Subscription" would take users to zevnda's Stripe customer portal.

---

## Step 12: Neutralize Docs Ads and Helpdesk

These changes affect the docs site (`docs/` directory) only.

### Google Adsense

1. **`docs/app/layout.tsx`** — Remove the `<script async src='...adsbygoogle.js?client=ca-pub-...' />` tag from the `<head>`. Also remove `'google-adsense-account': 'ca-pub-...'` from the `other` metadata object. **Remove excess blank lines** left behind.

2. **`docs/app/components/AdOverlay.tsx`** — Replace the entire component body to return `null`.

3. **`docs/app/supported-games/[appName]/AdComponent.tsx`** — Replace entire component body to return `null`.

4. **`docs/app/supported-games/[appName]/AdComponentTwo.tsx`** — Replace entire component body to return `null`.

For all three ad components, the simplified replacement is:
```tsx
'use client'

export default function ComponentName() {
  return null
}
```

### Chatway in Docs

5. **`docs/app/components/HelpDesk.tsx`** — Replace the entire component body to return `null` (same pattern as the ad components above). The original uses `usePathname` and loads a Chatway script.

**Why:** Without these changes, ad revenue and support messages go to upstream.

---

## Step 13: Clean Up Unused Variables and Imports

After Steps 10-12, several files have leftover `isPro` variables and imports that are no longer used. The CI lint (`unused-imports/no-unused-vars`) will fail if these remain.

1. **`src/features/settings/components/Settings.tsx`** — Remove `const isPro = useUserStore(...)` and remove `useUserStore` from the import (only `useNavigationStore` should remain).
2. **`src/features/settings/components/general/GeneralSettings.tsx`** — Remove `const isPro = useUserStore(...)`.
3. **`src/shared/components/Sidebar.tsx`** — Remove `const isPro = useUserStore(...)`.
4. **`src/shared/hooks/useCheckForPro.ts`** — Remove `import { logEvent }` and `const userSummary = useUserStore(...)` — leftover from the original pro-checking logic.

---

## Step 14: Fix Release Workflow Step Ordering

In `.github/workflows/release.yml`, the `build-and-release` job has `Setup Node.js` (with `cache: "pnpm"`) **before** `Install pnpm`. The `cache: "pnpm"` option requires pnpm to already be installed. Swap them so `Install pnpm` comes first, matching the order in the `check_quality` job.


## Summary of What Stays Unchanged

1. **Pro UI components** (`GoProModal.tsx`, `GoPro.tsx`, `ProBadge.tsx`, `powered-by-stripe.svg`) — These never activate because `isPro` is always `true`. Removing them would require editing ~15 files. They are dead code but harmless.

2. **`steamgameidler.com` domain** — Links throughout the app and docs point to this domain for documentation. These are functional URLs to the actual docs site.

