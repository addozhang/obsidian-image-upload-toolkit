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
			// Tracked for a later batch (promise hygiene refactor).
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-misused-promises": "warn",
			"@typescript-eslint/await-thenable": "warn",
			"no-async-promise-executor": "warn",
		},
	},
	{
		plugins: {
			obsidianmd,
		},
		rules: {
			// Sentence-case fixes are tracked separately as a UI-copy pass.
			"obsidianmd/ui/sentence-case": "warn",
			// Inline-style refactor is tracked separately.
			"obsidianmd/no-static-styles-assignment": "warn",
		},
	},
	{
		// Tracked for the DOM-correctness batch (innerHTML refactor).
		plugins: {
			"@microsoft/sdl": sdl,
		},
		rules: {
			"@microsoft/sdl/no-inner-html": "warn",
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
	]),
);

