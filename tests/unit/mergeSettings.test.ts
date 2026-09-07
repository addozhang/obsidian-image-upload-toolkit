import {describe, expect, it} from "vitest";
import {mergeSettings} from "../../src/publish";

const defaults = {
    flag: true,
    nested: {a: "keep", b: "also-keep"},
    provider: {token: "", region: "auto", path: ""},
};

describe("mergeSettings", () => {
    it("returns the defaults when nothing was persisted", () => {
        expect(mergeSettings(defaults, null)).toEqual(defaults);
        expect(mergeSettings(defaults, undefined)).toEqual(defaults);
    });

    it("does not share nested object references with the defaults", () => {
        const merged = mergeSettings(defaults, null);
        merged.provider.token = "mutated-in-place-by-settings-ui";

        expect(defaults.provider.token).toBe("");
    });

    it("drops prototype-polluting keys from persisted settings", () => {
        const loaded = JSON.parse('{"flag": false, "__proto__": {"polluted": true}, "nested": {"constructor": {"x": 1}}}');
        const merged = mergeSettings(defaults, loaded);

        expect(merged.flag).toBe(false);
        expect((merged as any).polluted).toBeUndefined();
        expect(({} as any).polluted).toBeUndefined();
        expect(merged.nested).toEqual(defaults.nested);
    });

    it("merges nested objects per field so new fields fall back to defaults", () => {
        // data.json written by an older version missing the `path` field
        const loaded = {provider: {token: "t", region: "eu"}};
        const merged = mergeSettings(defaults, loaded);
        expect(merged.provider).toEqual({token: "t", region: "eu", path: ""});
    });

    it("keeps the gyazo-style special case working through the generic path", () => {
        const merged = mergeSettings(
            {gyazoSetting: {accessToken: "", accessPolicy: "anyone", desc: ""}},
            {gyazoSetting: {accessToken: "tok"}} as any,
        );
        expect(merged.gyazoSetting).toEqual({accessToken: "tok", accessPolicy: "anyone", desc: ""});
    });

    it("overrides scalars and replaces arrays wholesale", () => {
        const merged = mergeSettings(
            {flag: true, list: [1, 2, 3], nested: defaults.nested} as any,
            {flag: false, list: [9]} as any,
        );
        expect(merged.flag).toBe(false);
        expect((merged as any).list).toEqual([9]);
        expect((merged as any).nested).toEqual(defaults.nested);
    });

    it("ignores explicit undefined values instead of wiping defaults", () => {
        const merged = mergeSettings(defaults, {flag: undefined} as any);
        expect(merged.flag).toBe(true);
    });

    it("does not mutate the defaults object", () => {
        mergeSettings(defaults, {provider: {token: "t", region: "eu", path: "p"}});
        expect(defaults.provider).toEqual({token: "", region: "auto", path: ""});
    });
});
