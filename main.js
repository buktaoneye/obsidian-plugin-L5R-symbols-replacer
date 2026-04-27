'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const obsidian = require('obsidian');
const { RangeSetBuilder } = require('@codemirror/state');
const { Decoration, ViewPlugin, WidgetType } = require('@codemirror/view');

const TOKENS = ["op","su","ex","st","skill","ring","earth","water","fire","air","void","kiho","maho","ninjutsu","ritual","shuji","invocation","kata","prereq","inversion","mantra","imperial","crab","crabx","crane","cranex","dragon","dragonx","lion","lionx","mantis","mantisx","phoenix","phoenixx","scorpion","scorpionx","tortoise","tortoisex","unicorn","unicornx","ronin","courtier","bushi","shugenja"];
const TOKEN_SET = new Set(TOKENS);
const FILE_FOR = Object.fromEntries(TOKENS.map(k => [k, k + ".svg"]));

const DEFAULT_SETTINGS = {
  textFallback: true,
  iconSize: 18,
  baseUrl: "vault:/L5R_Icons",
  embedSize: 18
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class L5RIconWidget extends WidgetType {
  constructor(token, plugin) {
    super();
    this.token = token;
    this.plugin = plugin;
  }
  eq(other) {
    return other.token === this.token && other.plugin.settings.iconSize === this.plugin.settings.iconSize;
  }
  toDOM() {
    return this.plugin.makeIcon(this.token);
  }
}

function buildL5RExtension(plugin) {
  const pattern = new RegExp(String.raw`\((op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)\)`, "g");

  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view) {
      const builder = new RangeSetBuilder();
      for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text))) {
          const start = from + match.index;
          const end = start + match[0].length;
          
          const isCursorInside = view.state.selection.ranges.some(r => 
            (r.from >= start && r.from <= end) || (r.to >= start && r.to <= end)
          );
          
          if (!isCursorInside) {
             builder.add(start, end, Decoration.replace({
               widget: new L5RIconWidget(match[1], plugin)
             }));
          }
        }
      }
      return builder.finish();
    }
  }, {
    decorations: v => v.decorations
  });
}

class L5RSymbolsPlugin extends obsidian.Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new L5RSettingTab(this.app, this));

    // Live Preview Support (CodeMirror 6 extension)
    this.registerEditorExtension(buildL5RExtension(this));

    // Reading Mode Support
    this.registerMarkdownPostProcessor((el) => {
      try { this.process(el); } catch (e) { console.error("[L5R Symbols] postprocessor error:", e); }
    });

    // 1) Copy .svg from plugin location to a vault
    this.addCommand({
      id: "l5r-copy-icons-to-public-folder",
      name: "L5R: Copy bundled icons to folder (for Publish)",
      callback: () => this.copyBundledAssets().catch(err => console.error("[L5R Symbols] copy assets error:", err))
    });

    // 2) Convert (token) -> wiki-embed for current note (pipe escaped)
    this.addCommand({
      id: "l5r-convert-current-in-place",
      name: "L5R: Convert symbols to SVG (current note)",
      checkCallback: (checking) => {
        const file = this.getActiveFile();
        if (checking) return !!file;
        if (file) this.convertInPlace(file).catch(err => console.error("[L5R Symbols] convert error:", err));
      }
    });

    // 3) Convert (token) -> wiki-embed for whole vault (pipe escaped)
    this.addCommand({
      id: "l5r-convert-vault",
      name: "L5R: Convert symbols to SVG (entire vault)",
      callback: () => this.convertVault().catch(err => console.error("[L5R Symbols] convert vault error:", err))
    });

    // 4) Reset embeds -> (token) for current note (uses Base URL path; supports '|' or '\\|')
    this.addCommand({
      id: "l5r-revert-current",
      name: "L5R: Reset SVG embeds back to symbols (current note)",
      checkCallback: (checking) => {
        const file = this.getActiveFile();
        if (checking) return !!file;
        if (file) this.revertInPlace(file).catch(err => console.error("[L5R Symbols] revert error:", err));
      }
    });

    // 5) Reset embeds -> (token) for whole vault (uses Base URL path; supports '|' or '\\|')
    this.addCommand({
      id: "l5r-revert-vault",
      name: "L5R: Reset SVG embeds back to symbols (entire vault)",
      callback: () => this.revertVault().catch(err => console.error("[L5R Symbols] revert vault error:", err))
    });

    console.log("[L5R Symbols] Loaded 1.6.2 (path-aware revert + table-safe embeds)");
  }

  onunload() { console.log("[L5R Symbols] Unloaded"); }

  getActiveFile() {
    const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
    return view?.file || null;
  }

  resolveUrlMaybeVault(path) {
    if (!path) return null;
    if (/^(https?|app|file):\/\//i.test(path) || /^data:/i.test(path)) return path;
    if (/^vault:\//i.test(path)) {
      const rel = path.replace(/^vault:\//i, '');
      return this.app.vault.adapter.getResourcePath(rel);
    }
    if (!/^[a-z]+:\/\//i.test(path) && !path.startsWith('/')) {
      return this.app.vault.adapter.getResourcePath(path);
    }
    return path;
  }

  getUrlForToken(token) {
    const file = FILE_FOR[token];
    if (!file) return null;
    const base = (this.settings.baseUrl || "").replace(/\/$/, "");
    const candidate = base ? `${base}/${file}` : file;
    return this.resolveUrlMaybeVault(candidate);
  }

  // --- Runtime replacement in app (Reading & Live Preview) ---
  process(root) {
    const pattern = new RegExp(String.raw`\((op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)\)`, "g");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const changes = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue;
      if (!text || !pattern.test(text)) continue;
      pattern.lastIndex = 0;
      const parts = [];
      let idx = 0, m;
      while ((m = pattern.exec(text))) {
        const before = text.slice(idx, m.index);
        if (before) parts.push(document.createTextNode(before));
        const token = m[1];
        parts.push(this.makeIcon(token));
        idx = pattern.lastIndex;
      }
      const after = text.slice(idx);
      if (after) parts.push(document.createTextNode(after));
      changes.push({ node, parts });
    }
    for (const c of changes) {
      const parent = c.node.parentNode;
      if (!parent) continue;
      const frag = document.createDocumentFragment();
      for (const p of c.parts) frag.appendChild(p);
      parent.replaceChild(frag, c.node);
    }
  }

  makeIcon(token) {
    const span = document.createElement("span");
    span.classList.add("l5r-symbol");
    span.setAttribute("data-l5r", token);
    span.setAttribute("aria-label", token);
    span.setAttribute("title", token);
    span.style.setProperty("--l5r-size", `${this.settings.iconSize}px`);

    const url = this.getUrlForToken(token);
    if (url) {
      span.classList.add("l5r-has-icon");
      const safeUrl = url.replace(/"/g, '\\"').replace(/'/g, "\\'");
      span.style.setProperty("--l5r-url", "url('" + safeUrl + "')");
    } else if (this.settings.textFallback) {
      span.classList.add("l5r-fallback");
      span.textContent = `[${token}]`;
    }
    return span;
  }

  // --- helpers for base path ---
  getBasePath() {
    const base = (this.settings.baseUrl || "");
    // Strip vault:/ prefix for vault-relative embeds
    return /^vault:\//i.test(base) ? base.replace(/^vault:\//i, '') : base;
  }

  buildRevertRegex() {
    const basePath = (this.getBasePath() || "").replace(/\/$/, "");
    if (!basePath) return null;
    // Match: ![[<basePath>/<token>.svg|N]] or ![[<basePath>/<token>.svg\|N]] or without size
    const esc = escapeRegex(basePath);
    const tokenGroup = "(op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)";
    const source = String.raw`!\[\[\s*${esc}\/${tokenGroup}\.svg(?:\\?\|\d+)?\s*\]\]`;
    return new RegExp(source, "g");
  }

  // --- In-place convert for one file (escape pipe) ---
  async convertInPlace(file) {
    const basePath = this.getBasePath();
    if (!basePath) { new obsidian.Notice("L5R: Set Base URL (e.g., vault:/L5R_Icons)"); return; }
    const size = this.settings.embedSize || 18;
    const pattern = new RegExp(String.raw`\((op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)\)`, "g");
    const data = await this.app.vault.read(file);
    const replaced = data.replace(pattern, (_m, token) => {
      const fileName = FILE_FOR[token] || (token + ".svg");
      return `![[${basePath.replace(/\/$/, "")}/${fileName}|${size}]]`;
    });
    if (replaced !== data) { await this.app.vault.modify(file, replaced); }
    new obsidian.Notice("L5R: Converted current note.");
  }

  // --- In-place revert for one file (path-aware) ---
  async revertInPlace(file) {
    const data = await this.app.vault.read(file);
    const re = this.buildRevertRegex();
    let reverted = data;
    if (re) {
      reverted = reverted.replace(re, (_m, token) => TOKEN_SET.has(token) ? "(" + token + ")" : _m);
    }
    // Fallback: if Base URL missing or nothing matched, try generic tokens anywhere
    if (reverted === data) {
      const generic = new RegExp(String.raw`!\[\[[^\]|]*\/(op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)\.svg(?:\\?\|\d+)?\]\]`, "g");
      reverted = reverted.replace(generic, (_m, token) => "(" + token + ")");
    }
    if (reverted !== data) { await this.app.vault.modify(file, reverted); }
    new obsidian.Notice("L5R: Reverted current note.");
  }

  // --- Convert entire vault (escape pipe) ---
  async convertVault() {
    const basePath = this.getBasePath();
    if (!basePath) { new obsidian.Notice("L5R: Set Base URL first"); return; }
    const size = this.settings.embedSize || 18;
    const pattern = new RegExp(String.raw`\((op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)\)`, "g");
    const files = this.app.vault.getMarkdownFiles();
    let changed = 0;
    for (const f of files) {
      const before = await this.app.vault.read(f);
      const after = before.replace(pattern, (_m, token) => `![[${basePath.replace(/\/$/, "")}/${FILE_FOR[token]}|${size}]]`);
      if (after !== before) { await this.app.vault.modify(f, after); changed++; }
    }
    new obsidian.Notice(`L5R: Converted vault notes: ${changed} changed.`);
  }

  // --- Revert entire vault (path-aware) ---
  async revertVault() {
    const files = this.app.vault.getMarkdownFiles();
    const re = this.buildRevertRegex();
    let changed = 0;
    for (const f of files) {
      const before = await this.app.vault.read(f);
      let after = before;
      if (re) {
        after = after.replace(re, (_m, token) => TOKEN_SET.has(token) ? "(" + token + ")" : _m);
      }
      if (after === before) {
        // Fallback
        const generic = new RegExp(String.raw`!\[\[[^\]|]*\/(op|su|ex|st|skill|ring|earth|water|fire|air|void|kiho|maho|ninjutsu|ritual|shuji|invocation|kata|prereq|inversion|mantra|imperial|crab|crabx|crane|cranex|dragon|dragonx|lion|lionx|mantis|mantisx|phoenix|phoenixx|scorpion|scorpionx|tortoise|tortoisex|unicorn|unicornx|ronin|courtier|bushi|shugenja)\.svg(?:\\?\|\d+)?\]\]`, "g");
        after = after.replace(generic, (_m, token) => "(" + token + ")");
      }
      if (after !== before) { await this.app.vault.modify(f, after); changed++; }
    }
    new obsidian.Notice(`L5R: Reverted vault notes: ${changed} changed.`);
  }

  // --- Copy plugin-bundled assets to a public folder for Publish ---
  async copyBundledAssets() {
    const defaultDest = "L5R_Icons";
    const userPath = this.getBasePath() || defaultDest;
    const targetFolder = userPath;
    
    const fs = this.app.vault.adapter;
    if (!this.app.vault.getAbstractFileByPath(targetFolder)) {
      try {
        await this.app.vault.createFolder(targetFolder);
      } catch (e) {
        // Folder might be deeply nested and parent doesn't exist, generic fallback
        console.error("[L5R Symbols] Folder creation failed:", e);
      }
    }
    
    // Dynamically retrieve the correct manifest directory location instead of hardcoding
    const assetsFolder = `${this.manifest.dir}/assets`;
    let files = [];
    try {
      const listing = await fs.list(assetsFolder);
      files = (listing.files || []).filter(f => /\.svg$/i.test(f));
    } catch (e) {
      console.error("[L5R Symbols] Could not list assets:", e);
      new obsidian.Notice("L5R: No bundled assets found.");
      return;
    }
    let copied = 0;
    for (const f of files) {
      const baseName = f.split('/').pop();
      const dest = `${targetFolder}/${baseName}`;
      try {
        const content = await fs.readBinary(f);
        await fs.writeBinary(dest, content);
        copied++;
      } catch (e) {
        console.error("Copy failed for", f, e);
      }
    }
    new obsidian.Notice(`L5R: Copied ${copied} icons to ${targetFolder}`);
  }

  async saveSettings() { await this.saveData(this.settings); }
}

class L5RSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "L5R Symbols Replacer" });

    new obsidian.Setting(containerEl)
      .setName("Base URL for icons")
      .setDesc("Folder you will publish, e.g., vault:/L5R_Icons")
      .addText(t => t
        .setPlaceholder("vault:/L5R_Icons")
        .setValue(this.plugin.settings.baseUrl || "")
        .onChange(async v => { this.plugin.settings.baseUrl = (v||'').trim(); await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl)
      .setName("Icon size in app (px)")
      .addSlider(s => s.setLimits(12,64,1).setValue(this.plugin.settings.iconSize||18)
        .onChange(async v => { this.plugin.settings.iconSize = v; await this.plugin.saveSettings(); }))
      .addExtraButton(b => b.setIcon("reset").setTooltip("Reset").onClick(async ()=>{
        this.plugin.settings.iconSize = 18; await this.plugin.saveSettings(); this.display();
      }));

    new obsidian.Setting(containerEl)
      .setName("Text fallback in app")
      .setDesc("Show [token] when an icon URL is not available.")
      .addToggle(tg => tg.setValue(!!this.plugin.settings.textFallback).onChange(async v => {
        this.plugin.settings.textFallback = v; await this.plugin.saveSettings();
      }));

    new obsidian.Setting(containerEl)
      .setName("Embed size for Publish (px)")
      .setDesc("Used when converting symbols to wiki-embeds in place.")
      .addText(t => t
        .setPlaceholder("18")
        .setValue(String(this.plugin.settings.embedSize || 18))
        .onChange(async v => {
          const n = parseInt(v, 10);
          this.plugin.settings.embedSize = Number.isFinite(n) ? n : 18;
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = L5RSymbolsPlugin;
