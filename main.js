'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const obsidian = require('obsidian');
const { RangeSetBuilder } = require('@codemirror/state');
const { Decoration, ViewPlugin, WidgetType } = require('@codemirror/view');

const TOKENS = ["op", "su", "ex", "st", "skill", "ring", "earth", "water", "fire", "air", "void", "kiho", "maho", "ninjutsu", "ritual", "shuji", "invocation", "kata", "prereq", "inversion", "mantra", "imperial", "crab", "crabx", "crane", "cranex", "dragon", "dragonx", "lion", "lionx", "mantis", "mantisx", "phoenix", "phoenixx", "scorpion", "scorpionx", "tortoise", "tortoisex", "unicorn", "unicornx", "ronin", "courtier", "bushi", "shugenja"];
const FILE_FOR = Object.fromEntries(TOKENS.map(k => [k, k + ".svg"]));

const DEFAULT_SETTINGS = {
  textFallback: true,
  iconSize: 18,
  baseUrl: "vault:/L5R_Icons"
};

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

    console.log("[L5R Symbols] Loaded plugin");
  }

  onunload() { console.log("[L5R Symbols] Unloaded"); }



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
        .onChange(async v => { this.plugin.settings.baseUrl = (v || '').trim(); await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl)
      .setName("Icon size in app (px)")
      .addSlider(s => s.setLimits(12, 64, 1).setValue(this.plugin.settings.iconSize || 18)
        .onChange(async v => { this.plugin.settings.iconSize = v; await this.plugin.saveSettings(); }))
      .addExtraButton(b => b.setIcon("reset").setTooltip("Reset").onClick(async () => {
        this.plugin.settings.iconSize = 18; await this.plugin.saveSettings(); this.display();
      }));

    new obsidian.Setting(containerEl)
      .setName("Text fallback in app")
      .setDesc("Show [token] when an icon URL is not available.")
      .addToggle(tg => tg.setValue(!!this.plugin.settings.textFallback).onChange(async v => {
        this.plugin.settings.textFallback = v; await this.plugin.saveSettings();
      }));


  }
}

module.exports = L5RSymbolsPlugin;
