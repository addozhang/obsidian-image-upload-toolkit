/**
 * Minimal mock of the obsidian module for unit testing.
 * Only stubs the APIs actually imported by our source files.
 */

// --- DOM helpers (polyfills for Obsidian's HTMLElement extensions) ---
type ElOpts = string | { cls?: string; text?: string; attr?: Record<string, string> };

function applyOpts(el: HTMLElement, opts?: ElOpts): HTMLElement {
  if (!opts) return el;
  if (typeof opts === "string") {
    el.className = opts;
    return el;
  }
  if (opts.cls) el.className = opts.cls;
  if (opts.text !== undefined) el.textContent = opts.text;
  if (opts.attr) {
    for (const [k, v] of Object.entries(opts.attr)) el.setAttribute(k, v);
  }
  return el;
}

function installDomExtensions(): void {
  const proto = (globalThis as any).HTMLElement?.prototype;
  if (!proto || (proto as any).__iutMockInstalled) return;
  proto.createEl = function (tag: string, opts?: ElOpts) {
    const child = document.createElement(tag);
    applyOpts(child, opts);
    this.appendChild(child);
    return child;
  };
  proto.createDiv = function (opts?: ElOpts) {
    return this.createEl("div", opts);
  };
  proto.createSpan = function (opts?: ElOpts) {
    return this.createEl("span", opts);
  };
  proto.setText = function (text: string) {
    this.textContent = text;
    return this;
  };
  proto.empty = function () {
    while (this.firstChild) this.removeChild(this.firstChild);
    return this;
  };
  (proto as any).__iutMockInstalled = true;
}

installDomExtensions();

// activeWindow / activeDocument shims used by the modal
(globalThis as any).activeWindow = globalThis;
(globalThis as any).activeDocument = (globalThis as any).document;

// --- Utility functions ---
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export async function requestUrl(_opts: any): Promise<any> {
  throw new Error("requestUrl is not implemented in test mock");
}

export async function loadMermaid(): Promise<any> {
  throw new Error("loadMermaid is not implemented in test mock");
}

export function setIcon(el: HTMLElement, name: string): void {
  el.setAttribute("data-icon", name);
}

// --- Classes ---
export class Notice {
  constructor(_message: string, _timeout?: number) {}
}

export class Plugin {
  app: any;
  manifest: any;
  loadData(): Promise<any> { return Promise.resolve({}); }
  saveData(_data: any): Promise<void> { return Promise.resolve(); }
  addCommand(_cmd: any): any { return {}; }
  addSettingTab(_tab: any): void {}
  addStatusBarItem(): any { return document.createElement("div"); }
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any = document.createElement("div");
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }
  display(): void {}
  hide(): void {}
}

export class Modal {
  app: any;
  contentEl: HTMLElement = document.createElement("div");
  modalEl: HTMLElement = document.createElement("div");
  titleEl: HTMLElement = document.createElement("div");
  constructor(app: any) {
    this.app = app;
    // Match Obsidian's behavior: titleEl is attached inside modalEl
    this.modalEl.appendChild(this.titleEl);
    this.modalEl.appendChild(this.contentEl);
  }
  open(): void {
    document.body.appendChild(this.modalEl);
  }
  close(): void {
    if (this.modalEl.parentNode) this.modalEl.parentNode.removeChild(this.modalEl);
  }
  onClose?(): void;
}

export class Setting {
  settingEl: any = document.createElement("div");
  constructor(_containerEl: any) {}
  setName(_name: string): this { return this; }
  setDesc(_desc: string): this { return this; }
  addText(_cb: any): this { return this; }
  addToggle(_cb: any): this { return this; }
  addDropdown(_cb: any): this { return this; }
  addSlider(_cb: any): this { return this; }
}

export class FileSystemAdapter {
  getBasePath(): string { return "/mock/vault"; }
  readBinary(_path: string): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
}

export class MarkdownView {
  editor: any = null;
}

export class App {
  vault: any = {
    adapter: new FileSystemAdapter(),
    getAbstractFileByPath: (_p: string) => null,
  };
  workspace: any = {
    getActiveViewOfType: (_type: any) => null,
    getActiveFile: () => null,
  };
  metadataCache: any = {
    getFirstLinkpathDest: (_link: string, _source: string) => null,
  };
}

// --- Types (no-ops for import satisfaction) ---
export type Editor = any;
