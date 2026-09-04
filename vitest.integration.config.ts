import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        fileParallelism: false,
        globals: true,
        include: ["tests/integration/**/*.test.ts"],
        globalSetup: ["./tests/integration/global-setup.ts"],
        testTimeout: 120_000,
        hookTimeout: 240_000,
    },
});
