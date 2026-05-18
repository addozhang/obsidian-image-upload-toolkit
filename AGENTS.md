# Obsidian Image Upload Toolkit

An Obsidian plugin for uploading local images to multiple cloud storage providers (Imgur, Gyazo, GitHub, AWS S3, Aliyun OSS, TencentCloud COS, Qiniu Kodo, ImageKit, Cloudflare R2, Backblaze B2). Also supports automatic mermaid diagram conversion to images during publish.

## Project Overview

This is a TypeScript-based Obsidian plugin that processes markdown documents, detects local images, uploads them to configured cloud storage, and replaces image references with remote URLs. The plugin supports multiple storage backends with a unified uploader interface. It also converts mermaid code blocks to PNG images during publish.

## Tech Stack

- **Language**: TypeScript 4.x
- **Target**: ES2021, CommonJS modules
- **Framework**: Obsidian Plugin API (minAppVersion 0.12.16)
- **Build Tool**: esbuild via custom `esbuild.config.mjs` (externals: `obsidian`, `electron`)
- **Test Runner**: Vitest 4.x
- **Platform**: Desktop only (Windows/macOS/Linux)

## Project Structure

```
src/
├── publish.ts                      # Main plugin entry point
├── imageStore.ts                   # Storage provider registry (with normalizeId() for legacy alias support)
├── styles.css                      # Plugin styles
├── ui/
│   ├── publishSettingTab.ts        # Settings UI
│   └── uploadProgressModal.ts      # Progress display modal
└── uploader/
    ├── imageUploader.ts            # Base uploader interface
    ├── imageUploaderBuilder.ts     # Factory for uploader instances
    ├── imageTagProcessor.ts        # Markdown image parser & processor
    ├── mermaidProcessor.ts         # Mermaid-to-PNG conversion (v1.3.0)
    ├── webImageDownloader.ts       # Web image download utility (v1.2.0)
    ├── uploaderUtils.ts            # Shared utilities
    ├── apiError.ts                 # Error handling
    ├── imgur/                      # Imgur implementation
    ├── gyazo/                      # Gyazo implementation (v1.6.0)
    ├── github/                     # GitHub implementation
    ├── s3/                         # AWS S3 implementation
    ├── r2/                         # Cloudflare R2 implementation
    ├── oss/                        # Aliyun OSS implementation
    ├── cos/                        # TencentCloud COS implementation
    ├── qiniu/                      # Qiniu Kodo implementation
    ├── imagekit/                   # ImageKit implementation
    └── b2/                         # Backblaze B2 implementation
```

## Build & Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Watch mode with hot reload
npm run build           # Production build
```

### Plugin Testing
1. Build the plugin: `npm run build`
2. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/image-upload-toolkit/` directory
3. Reload Obsidian and enable the plugin

## Key Concepts

### Storage Provider Architecture

Each storage provider implements the [`ImageUploader`](src/uploader/imageUploader.ts) interface:
```typescript
interface ImageUploader {
    upload(imageFilePath: string, filename: string): Promise<string>;
}
```

New providers are registered in [`ImageStore`](src/imageStore.ts) and instantiated via [`buildUploader()`](src/uploader/imageUploaderBuilder.ts).

### Image Processing Flow

1. **Detection**: [`ImageTagProcessor`](src/uploader/imageTagProcessor.ts) parses markdown for local and web images
2. **Mermaid Conversion** (v1.3.0): [`MermaidProcessor`](src/uploader/mermaidProcessor.ts) renders mermaid code blocks to PNG images and uploads them, replacing code blocks with image references in the clipboard output
3. **Web Image Handling** (v1.2.0): [`WebImageDownloader`](src/uploader/webImageDownloader.ts) downloads external images if `uploadWebImages` is enabled
4. **Upload**: Images are uploaded via the configured provider's `upload()` method
5. **Replace**: Local/web paths are replaced with remote URLs
6. **Output**: Updated markdown is copied to clipboard

#### Mermaid Diagram Conversion (v1.3.0)
- Converts mermaid code blocks (``` ```mermaid ``` ```) to PNG images during publish
- Uses Obsidian's built-in `loadMermaid()` API (no bundled mermaid dependency)
- Configurable scale factor (1-4x, default 2) for image quality
- Configurable theme (default/dark/forest/neutral/base)
- Mermaid source blocks are preserved in the original document — only the clipboard output gets image replacements
- Generated images are tracked via a `Set<string>` to prevent double-upload when "Upload web images" is enabled

#### Web Image Upload Feature (v1.2.0)
- Automatically downloads web images (http/https URLs) when enabled
- Skips images already hosted on configured storage (via `isAlreadyHosted()`)
- Prevents link rot from external sources
- Configurable via `uploadWebImages` setting (default: disabled)

### Path Variables

Support dynamic path generation using these variables:
- `{year}` - Current year (4 digits)
- `{mon}` - Current month (2 digits)
- `{day}` - Current day (2 digits)
- `{filename}` - Original filename
- `{random}` - Random string

Example: `/{year}/{mon}/{day}/{filename}` → `/2024/01/17/image.jpg`

## Code Style & Conventions

### TypeScript Guidelines
- TypeScript strict mode is **not** currently enabled in [`tsconfig.json`](tsconfig.json); the lint suite covers most type-safety gaps via `typescript-eslint`. New code should still be written as if strict were on
- Prefer interfaces over type aliases for public APIs
- Use async/await over raw promises
- Handle errors gracefully with try-catch blocks

### Naming Conventions
- Classes: PascalCase (e.g., `ImageUploader`, `PublishSettingTab`)
- Interfaces: PascalCase with descriptive names (e.g., `PublishSettings`)
- Files: camelCase (e.g., `imageUploader.ts`, `publishSettingTab.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `IMGUR_PLUGIN_CLIENT_ID`)

### File Organization
- One class per file
- Group related functionality in subdirectories (e.g., `uploader/imgur/`)
- Keep UI components in `ui/` directory
- Shared utilities in root or dedicated `utils/` directory

## Adding a New Storage Provider

To add a new storage provider:

1. **Create provider directory**: `src/uploader/your-provider/`

2. **Implement uploader class**:
   ```typescript
   // src/uploader/your-provider/yourProviderUploader.ts
   import ImageUploader from "../imageUploader";
   
   export interface YourProviderSetting {
       apiKey: string;
       bucket: string;
       // ... other settings
   }
   
   export default class YourProviderUploader implements ImageUploader {
       constructor(private settings: YourProviderSetting) {}
       
       async upload(imageFilePath: string, filename: string): Promise<string> {
           // Implementation
           return remoteUrl;
       }
   }
   ```

3. **Register in ImageStore** ([`src/imageStore.ts`](src/imageStore.ts)):
   ```typescript
   static YOUR_PROVIDER = {id: "your-provider", description: "Your Provider"};
   static lists = [/* ... */, ImageStore.YOUR_PROVIDER];
   ```

4. **Add to builder** ([`src/uploader/imageUploaderBuilder.ts`](src/uploader/imageUploaderBuilder.ts)):
   ```typescript
   case ImageStore.YOUR_PROVIDER.id:
       return new YourProviderUploader(settings.yourProviderSetting);
   ```

5. **Update settings interface** ([`src/publish.ts`](src/publish.ts)):
   ```typescript
   export interface PublishSettings {
       // ... existing settings
       yourProviderSetting: YourProviderSetting;
   }
   ```

6. **Add UI settings** ([`src/ui/publishSettingTab.ts`](src/ui/publishSettingTab.ts)):
   - Create `drawYourProviderSetting(parentEL)` method
   - Add case to `drawImageStoreSettings()` switch

## Testing

### Automated Tests

Unit tests are located in `tests/unit/` and run via [Vitest](https://vitest.dev/):

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

Current test files:
- `gyazoUploader.test.ts` — Gyazo uploader (upload success, error handling, field omission)
- `imageStore.test.ts` — Provider registry and `normalizeId()` alias resolution
- `isAlreadyHosted.test.ts` — Hosted-URL detection for all providers
- `imageTagRegex.test.ts` — Markdown/Wiki image tag regex matching
- `uploaderUtils.test.ts` — Path template generation and domain customization
- `webImageDownloader.test.ts` — Web image download logic
- `mermaidProcessor.test.ts` — Mermaid-to-PNG conversion
- `mermaidRegex.test.ts` — Mermaid code block regex matching

### End-to-End Testing via Chrome DevTools Protocol

Unit tests can't catch Electron-specific runtime issues (e.g. Chromium rejecting an explicit `Host` header in `requestUrl`, which broke COS in the 1.6.2 release candidate). The repo ships a small suite of CDP-driven scripts under [`scripts/e2e/`](scripts/e2e/) that drive a **real Obsidian instance** to exercise the full publish flow against live cloud credentials.

See [`scripts/e2e/README.md`](scripts/e2e/README.md) for the full workflow. Quick summary:

1. Launch Obsidian with `--remote-debugging-port=9223` (e.g. `open -a Obsidian --args --remote-debugging-port=9223`).
2. Install the built plugin into a test vault that has live credentials for the providers you want to exercise. macOS TCC blocks `~/Documents` for non-Obsidian processes; place the test vault under `~/iCloud Drive/` or another accessible location.
3. Run a script via the helper:
   ```bash
   ./scripts/e2e/cdp.sh "$(cat scripts/e2e/cdp-e2e-all.js)"
   ```

The helper (`scripts/e2e/cdp.sh`) requires `websocat` and `python3` on `PATH`. The expression runs in the Obsidian renderer with full access to `app`, `app.plugins.plugins["image-upload-toolkit"]`, `app.vault`, `app.commands.executeCommandById(...)`, `navigator.clipboard`, and `activeDocument`.

Footguns worth knowing without opening the README:

- `require("obsidian")` and dynamic `import()` of the bundle don't work inside CDP — `obsidian` is an esbuild external and resolves to nothing at runtime in this context. Use the plugin instance.
- `editor.setValue()` does NOT persist to disk. When asserting on `replaceOriginalDoc`, read `leaf.view.editor.getValue()`, not `app.vault.read(file)`.
- Commands are `checkCallback`-based — use `app.commands.executeCommandById(...)`, not `.callback()`.
- The progress modal opens asynchronously; poll `activeDocument.querySelector(".modal.upload-progress-modal")` for a few hundred ms.

The scripts upload to **real buckets**. They prefix sentinel filenames (`iut-*`, `__iut-*`), snapshot/restore `plugin.settings`, and delete temp notes via `app.vault.delete(file)`.

### Manual Testing Checklist

1. Test each storage provider with sample images
2. Verify path variable substitution works correctly
3. Test with different image formats (PNG, JPG, GIF, SVG, WebP)
4. Verify progress modal and status bar indicators
5. Test with relative paths (`./`, `../`)
6. Check error handling for invalid credentials
7. Verify clipboard copy functionality
8. Test mermaid conversion with various diagram types (flowchart, sequence, class, etc.)
9. Verify mermaid scale factor produces correct image resolution (1x-4x)
10. Verify mermaid theme setting applies correctly (default/dark/forest/neutral/base)
11. Confirm mermaid source blocks are preserved when "Update original document" is enabled
12. Verify mermaid-generated images are not double-uploaded when "Upload web images" is enabled
13. Verify wiki-link image syntax (`![[image.png]]`) is uploaded and rewritten
14. Verify `ignoreProperties` strips YAML frontmatter from the clipboard output when enabled
15. Verify `imageAltText` populates alt text from the original filename when enabled

## Common Issues & Solutions

### Image Upload Failures
- **Check credentials**: Verify API keys/tokens are correct in settings
- **Check permissions**: Ensure storage bucket has proper read/write permissions
- **Check network**: Test with simple curl/postman requests first
- **Check file paths**: Use absolute paths for debugging

### Build Issues
- Clear `node_modules/` and reinstall: `rm -rf node_modules && npm install`
- Ensure TypeScript version matches: `npm ls typescript`
- Check Obsidian API version compatibility

### Adding Dependencies
```bash
npm install <package>           # Runtime dependency
npm install -D <package>        # Dev dependency
```

Update [`package.json`](package.json) dependencies and run `npm install`.

## Security Considerations

- **API Keys**: Never commit API keys or tokens to git
- **Credentials**: Store credentials in Obsidian's data.json (auto-encrypted)
- **HTTPS**: Always use HTTPS endpoints for cloud providers
- **Minimal Permissions**: Request only necessary permissions for storage access

## Git Workflow

### Commit Messages
Follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Branch Strategy
- `main` - Stable releases
- Feature branches: `feature/add-provider-x`
- Bug fixes: `fix/issue-123`

### Pull Request Guidelines
- Update README.md with new features
- Ensure code builds without errors
- Test with multiple storage providers
- Include clear description of changes

## Release Process

**IMPORTANT**: When creating a new release tag, you MUST update the version in both files to match the tag version:

1. **Update version in [`package.json`](package.json)**:
   ```json
   {
     "version": "1.2.0"
   }
   ```

2. **Update version in [`manifest.json`](manifest.json)**:
   ```json
   {
     "version": "1.2.0"
   }
   ```

3. **Commit the version changes**:
   ```bash
   git add package.json manifest.json
   git commit -m "chore: bump version to 1.2.0"
   ```

4. **Create git tag with descriptive message** (without `v` prefix):
   ```bash
   git tag -a 1.2.0 -m "Release 1.2.0 - Brief description of changes"
   git push origin 1.2.0
   ```

**Version Format**: Use semantic versioning without the `v` prefix (e.g., `1.2.0`, not `v1.2.0`). The version must be identical in both `package.json` and `manifest.json`.

**Tag Message Format**: Use the format "Release X.Y.Z - Brief description" (e.g., "Release 1.1.4 - Fix relative path resolution" or "add CloudFlare R2 support"). Keep it concise and describe the key changes.

## Dependencies

### Runtime
- `obsidian` (external, provided by the host; also exposes `requestUrl` and `loadMermaid`)
- `@aws-sdk/client-s3` — used by AWS S3, Cloudflare R2, and Backblaze B2 uploaders (v3 modular SDK)
- `@octokit/rest` — GitHub API client

> **Note**: Aliyun OSS, Tencent COS, Qiniu Kodo, ImageKit, Gyazo, and Imgur uploaders use Obsidian's built-in `requestUrl` API with inline request signing — no provider SDKs are bundled. Mermaid rendering uses Obsidian's built-in `loadMermaid()` API. Bundle size dropped from ~16 MB to ~644 KB (−96%) as a result of dropping `ali-oss`, `cos-nodejs-sdk-v5`, `qiniu`, `aws-sdk` v2, and `proxy-agent`.

### Development
- `typescript` — TypeScript compiler
- `esbuild` — JavaScript bundler (config in `esbuild.config.mjs`)
- `vitest` — Test runner
- `eslint` + `typescript-eslint` + `eslint-plugin-obsidianmd` — Linting (Obsidian-specific rules)
- `@types/node` — Node.js type definitions
- `jsdom` — DOM environment for unit tests

## Plugin Configuration

Settings are stored in `.obsidian/plugins/image-upload-toolkit/data.json`:
```json
{
  "imageAltText": true,
  "replaceOriginalDoc": false,
  "ignoreProperties": true,
  "imageStore": "imgur",
  "showProgressModal": true,
  "uploadWebImages": false,
  "convertMermaid": false,
  "mermaidScale": 2,
  "mermaidTheme": "default",
  "imgurAnonymousSetting": { "clientId": "..." },
  "gyazoSetting": {
    "accessToken": "...",
    "accessPolicy": "anyone",
    "description": ""
  },
  "b2Setting": {
    "keyId": "...",
    "applicationKey": "...",
    "bucketId": "...",
    "bucketName": "...",
    "customDomain": ""
  },
  // ... other provider-specific settings
}
```

## Boundaries

### Do Not Modify
- [`manifest.json`](manifest.json) - Only update version and description during releases
- [`package.json`](package.json) - Only update version, dependencies, and scripts as needed
- Build configuration in [`package.json`](package.json) scripts
- TypeScript compiler options in [`tsconfig.json`](tsconfig.json)

### Version Sync Required
- When updating version for a release, BOTH [`package.json`](package.json) and [`manifest.json`](manifest.json) must have the same version number
- Version format: `X.Y.Z` (without `v` prefix)

### Careful With
- [`src/publish.ts`](src/publish.ts) - Core plugin logic, changes affect all providers
- [`src/uploader/imageTagProcessor.ts`](src/uploader/imageTagProcessor.ts) - Image parsing, affects all workflows
- [`src/imageStore.ts`](src/imageStore.ts) - Provider registry, maintain backward compatibility

### Safe to Modify
- Individual provider implementations in `src/uploader/*/`
- UI components in `src/ui/`
- Utility functions in `src/uploader/uploaderUtils.ts`
- Web image downloader in `src/uploader/webImageDownloader.ts`
- Mermaid processor in `src/uploader/mermaidProcessor.ts`

## Resources

- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian API Reference](https://github.com/obsidianmd/obsidian-api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Current Version

1.6.2 — Refactored all SDK-heavy uploaders (OSS, COS, Qiniu, S3, R2, B2) to use Obsidian's `requestUrl` API with inline signing; migrated AWS-family uploaders to `@aws-sdk/client-s3` v3; reduced bundle size from ~16 MB to ~644 KB; fixed Imgur anonymous upload payload encoding; fixed COS upload regression caused by explicit `Host` header rejection in Electron's `requestUrl`.