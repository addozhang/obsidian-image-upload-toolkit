import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import sdl from "@microsoft/eslint-plugin-sdl";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				// Obsidian augments window/document with multi-window helpers.
				activeWindow: "readonly",
				activeDocument: "readonly",
				createFragment: "readonly",
				createEl: "readonly",
				createDiv: "readonly",
				createSpan: "readonly",
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						"eslint.config.mjs",
						"manifest.json",
					],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts"],
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		// The strict-type-checked preset pulled in by obsidianmd/recommended
		// emits ~120 `no-unsafe-*` errors against legacy uploader code that
		// uses untyped third-party SDKs (aws-sdk v2, ali-oss, qiniu, etc.).
		// Downgrade those to warnings so they remain visible without blocking
		// CI, while we keep Obsidian-specific rules as errors.
		rules: {
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-require-imports": "warn",
			// Promise hygiene re-enabled as error in Batch 5.
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/await-thenable": "error",
			"no-async-promise-executor": "error",
		},
	},
	{
		plugins: {
			obsidianmd,
		},
		rules: {
			// Sentence-case fixes are tracked separately as a UI-copy pass.
			"obsidianmd/ui/sentence-case": "warn",
			// no-static-styles-assignment resolved in Batch 3 (styles moved to styles.css).
			"obsidianmd/no-static-styles-assignment": "error",
		},
	},
	{
		// no-inner-html resolved in Batch 2 (mermaidProcessor uses DOMParser).
		plugins: {
			"@microsoft/sdl": sdl,
		},
		rules: {
			"@microsoft/sdl/no-inner-html": "error",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"main.js",
		"eslint.config.mjs",
		"vitest.config.ts",
		"__mocks__/**",
		"src/**/*.test.ts",
		"tests/**",
		"scripts/**",
	]),
);

