import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import UploadProgressModal from "../../src/ui/uploadProgressModal";

function makeModal(): UploadProgressModal {
    const app = {} as any;
    const m = new UploadProgressModal(app);
    return m;
}

describe("UploadProgressModal", () => {
    let modal: UploadProgressModal;

    beforeEach(() => {
        vi.useFakeTimers();
        modal = makeModal();
    });

    afterEach(() => {
        vi.useRealTimers();
        try { modal.close(); } catch { /* noop */ }
    });

    it("renders Complete + auto-close timer on full success", () => {
        modal.initialize([{name: "a.png"}, {name: "b.png"}]);
        modal.updateProgress("a.png", true);
        modal.updateProgress("b.png", true);

        const text = modal.modalEl.textContent ?? "";
        expect(text).toContain("Complete");
        expect(text).toContain("2/2 (100%)");
        expect(text).toContain("2 succeeded");
        expect(text).not.toContain("failed");

        // auto-close fires after 3s on full success
        const closeSpy = vi.spyOn(modal, "close");
        vi.advanceTimersByTime(3000);
        expect(closeSpy).toHaveBeenCalled();
    });

    it("renders Failed and does NOT auto-close when all uploads fail", () => {
        modal.initialize([{name: "a.png"}]);
        modal.updateProgress("a.png", false);

        const text = modal.modalEl.textContent ?? "";
        expect(text).toContain("Failed");
        expect(text).toContain("0 succeeded");
        expect(text).toContain("1 failed");

        const closeSpy = vi.spyOn(modal, "close");
        vi.advanceTimersByTime(10000);
        expect(closeSpy).not.toHaveBeenCalled();
    });

    it("renders 'Completed with errors' on partial failure and does NOT auto-close", () => {
        modal.initialize([{name: "ok.png"}, {name: "bad.png"}, {name: "alsobad.png"}]);
        modal.updateProgress("ok.png", true);
        modal.updateProgress("bad.png", false);
        modal.updateProgress("alsobad.png", false);

        const text = modal.modalEl.textContent ?? "";
        expect(text).toContain("Completed with errors");
        expect(text).toContain("2 failed");
        expect(text).toContain("1 succeeded");
        expect(text).toContain("2 failed");

        const closeSpy = vi.spyOn(modal, "close");
        vi.advanceTimersByTime(10000);
        expect(closeSpy).not.toHaveBeenCalled();
    });

    it("marks failed image icons distinctly from pending", () => {
        modal.initialize([{name: "ok.png"}, {name: "bad.png"}]);
        modal.updateProgress("ok.png", true);
        modal.updateProgress("bad.png", false);

        const icons = modal.modalEl.querySelectorAll(".image-status-icon");
        const classes = Array.from(icons).map(el => el.className);
        expect(classes.some(c => c.includes("success"))).toBe(true);
        expect(classes.some(c => c.includes("failed"))).toBe(true);
        // No icon should be left in `pending` after both images report
        expect(classes.some(c => c.includes("pending"))).toBe(false);
    });

    it("adds has-failures class to the progress bar when any upload fails", () => {
        modal.initialize([{name: "a.png"}, {name: "b.png"}]);
        modal.updateProgress("a.png", true);
        modal.updateProgress("b.png", false);

        const bar = modal.modalEl.querySelector(".progress-bar");
        expect(bar?.classList.contains("has-failures")).toBe(true);
    });
});
