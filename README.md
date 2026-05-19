# L5R Symbols Replacer

**Version:** 1.7.0
**Author:** MF False

A plugin for **Obsidian** that converts _Legend of the Five Rings_ shorthand symbols (like `(air)`, `(st)`, `(crane)`) into SVG icons both within the Obsidian.md editor and when published to **Obsidian Publish**.


---
## Installation for Obsidian App

1. **Download and extract the plugin**
    - Unzip the `l5r-symbols-replacer.zip` into your vault’s plugin folder:
        ```
        <YourVault>/.obsidian/plugins/l5r-symbols-replacer/
        ```
2. **Enable the plugin**
    - In Obsidian, go to **Settings → Community Plugins → Installed Plugins**.
    - Enable **L5R Symbols Replacer**.
3. **Copy icons and configure settings**
    - The SVG icons are included inside the downloaded `l5r-symbols-replacer.zip` file (inside the `assets` folder).
    - Extract and copy these icons to a folder anywhere in your vault.
    - Go to **Settings → L5R Symbols Replacer**.
    - Configure your **Base URL** to point to the folder where you copied the icons.
    - Example:
        ```
        vault:/L5R_Icons
        or
        vault:/Attachments/symbols
        ```

---

## Installation for Obsidian Publish

Because Obsidian Publish does not run Community Plugins, shorthand codes like `(air)` won't be replaced with icons natively on your website. Instead, you can use Obsidian Publish's custom site logic to automatically replace them with SVGs pulled directly from GitHub!

1. **Copy the publish script**
   The `publish.js` file is included inside the downloaded `l5r-symbols-replacer.zip` file. Extract and copy this file into the root folder of your vault.
2. **Publish to the web**
   When syncing to **Obsidian Publish**, make sure to check the box next to `publish.js` to publish it. Since this script fetches the SVGs directly from the GitHub repository, you **do not** need to publish your local icon folder! Your shortcodes will now automatically render as SVGs on your live site.

## Usage

Simply type any of the shortcodes below in your editor, and they will automatically be replaced with the corresponding SVG icon in Live Preview and Reading Mode.

### Dice

```
(op) (su) (ex) (st) (skill) (ring)
```

### Rings

```
(earth) (water) (fire) (air) (void)
```

### Techniques

```
(kiho) (maho) (ninjutsu) (ritual) (shuji) (invocation)
(kata) (prereq) (inversion) (mantra)
```

### Clans - Normal

```
(imperial) (crab) (crane) (dragon) (lion) (mantis) 
(phoenix) (scorpion) (tortoise) (unicorn) (ronin)
```

### Clans - Crossed Out

```
(crabx) (cranex) (dragonx) (lionx) (mantisx)
 (phoenixx) (scorpionx) (tortoisex) (unicornx)
```
### Other

```
(courtier) (bushi) (shugenja)
```

Only the **exact lowercase form** will be converted.

---

## Disclaimer

This plugin is an unofficial fan creation and is not affiliated with, endorsed, sponsored, or specifically approved by Fantasy Flight Games, Edge Studio, or Asmodee. Legend of the Five Rings and all associated icons, logos, and terms are copyright and/or trademark of their respective owners.\n