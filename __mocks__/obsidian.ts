/**
 * Minimal mock of the obsidian module for unit testing.
 * Only stubs the APIs actually imported by our source files.
 */

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
  contentEl: any = document.createElement("div");
  modalEl: any = document.createElement("div");
  constructor(app: any) { this.app = app; }
  open(): void {}
  close(): void {}
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
