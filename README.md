# L5R Symbols Replacer

**Version:** 1.6.3
**Author:** MF False

A plugin for **Obsidian** that converts _Legend of the Five Rings_ shorthand symbols (like `(air)`, `(st)`, `(crane)`) into SVG icons both within the Obsidian.md editor and when published to **Obsidian Publish**.

It also provides commands to convert or revert these symbols across single notes or the entire vault.

---
## Installation

1. **Download and extract the plugin**
    
    - Unzip the `l5r-symbols-replacer.zip` into your vault’s plugin folder:
        
        ```
        <YourVault>/.obsidian/plugins/l5r-symbols-replacer/
        ```
        
2. **Enable the plugin**
    
    - In Obsidian, go to **Settings → Community Plugins → Installed Plugins**.
        
    - Enable **L5R Symbols Replacer**.
        
3. **Open plugin settings**
    
    - Go to **Settings → L5R Symbols Replacer**.
        
    - Configure your **Base URL** (the folder that will store or serve your icons).
        
    - Example:
        
        ```
        vault:/L5R_Icons
        or
        vault:/Attachments/symbols
        ```   

---

## Available Syntax

These are the shortcodes that the plugin recognizes (case-sensitive).

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

## Configuring the Icon Folder

By default, icons are expected in:

```
vault:/L5R_Icons
```

You can change this in plugin settings:

- Example:  
    If your SVGs are stored in `Attachments/symbols/`, set:
    
    ```
    vault:/Attachments/symbols
    ```
    
- For **Obsidian Publish**, make sure the folder you specify is **included in your published files**.
    

---

## Copying the Icons into Your Vault

Before converting, populate your vault’s folder with SVGs.

1. Run the command:
    
    ```
    L5R: Copy bundled icons to folder (for Publish)
    ```
    
1. The plugin will copy all built-in SVG icons into your Icon Folder:
    
    ```
    by default:
    /L5R_Icons/
    ```
    
2. These can be used locally or published.
    
---

## Conversion Commands

### Convert Symbols → SVG (Single Page)

To convert only the currently open note:

1. Open the note.
    
2. Run:
    
    ```
    L5R: Convert symbols to SVG (current note)
    ```
    
3. Each `(token)` becomes:
    
    ```
    ![[L5R_Icons/token.svg\|18]]
    ```
---

### Convert Symbols → SVG (Entire Vault)

To process every note in your vault:

1. Run:
    
    ```
    L5R: Convert symbols to SVG (entire vault)
    ```
    
2. The plugin scans all Markdown files and converts each valid `(token)`.
    
---

## Reverting Commands

### Revert SVG → Symbol (Single Page)

If you need to edit your notes or revert for publishing:

1. Open the note.
    
2. Run:
    
    ```
    L5R: Reset SVG embeds back to symbols (current note)
    ```
    
3. Example:
    
    ```
    ![[Attachments/symbols/air.svg\|18]] → (air)
    ```
    

---

### Revert SVG → Symbol (Entire Vault)

To revert all embeds across every note:

1. Run:
    
    ```
    L5R: Reset SVG embeds back to symbols (entire vault)
    ```
    
2. All matching embeds (based on your **Base URL**) will be reverted.

---

## Notes & Tips

- **Pipe escaping:**  
    The plugin automatically escapes the `|` in embeds as `\|` to avoid breaking Markdown tables.
    
- **Reversion detection:**  
    Works with both `|` and `\|` forms.
    
- **Base URL sensitivity:**  
    Reversion is path-aware — it uses the configured Base URL to locate icons correctly.
    
- **Safe to repeat conversions:**  
    Running conversion commands multiple times won’t cause duplication or corruption.
    

---

## Troubleshooting

| Problem                   | Possible Cause           | Solution                             |
| ------------------------- | ------------------------ | ------------------------------------ |
| Nothing converts          | Tokens must be lowercase | Do not use `(Air)`                   |
| SVGs don’t show           | Folder not published     | Include your icon folder in Publish  |
| Reset didn’t revert icons | Base URL mismatch        | Confirm it matches your embed paths  |
| Table layout breaks       | Missing `\|` escape      | The plugin now escapes automatically |

---

## Summary of Commands

|Command|Description|
|---|---|
|**L5R: Copy bundled icons to folder (for Publish)**|Copies default SVGs to `/L5R_Icons/`|
|**L5R: Convert symbols to SVG (current note)**|Converts only the open note|
|**L5R: Convert symbols to SVG (entire vault)**|Converts every note|
|**L5R: Reset SVG embeds back to symbols (current note)**|Reverts one note|
|**L5R: Reset SVG embeds back to symbols (entire vault)**|Reverts all notes|

---

## Example Conversion

**Before:**

```markdown
The flames rise high (fire), the waves crash low (water).
The warrior (bushi) takes the stance (kata).
```

**After conversion:**

```markdown
The flames rise high ![[L5R_Icons/fire.svg\|18]], the waves crash low ![[L5R_Icons/water.svg\|18]].
The warrior ![[L5R_Icons/bushi.svg\|18]] takes the stance ![[L5R_Icons/kata.svg\|18]].
```

**After revert:**

```markdown
The flames rise high (fire), the waves crash low (water).
The warrior (bushi) takes the stance (kata).
```

---

## Obsidian Publish Integration (Without Conversion)

Because Obsidian Publish does not run Community Plugins, shorthand codes like `(air)` won't be replaced with icons natively on your website. Previously, the only way to fix this was using the **Convert commands** to generate `![[L5R_Icons/air.svg]]` embeds.

If you want to skip the convert/revert workflow entirely and keep clean `(air)` shortcodes, you can use Obsidian Publish's custom site logic!

1. Create a file named `publish.js` in the root folder of your vault.
2. Copy and paste the following snippet into `publish.js`:
3. When syncing to **Obsidian Publish**, make sure to check the box next to `publish.js` and your icon folder to publish them. Your shortcodes will automatically be replaced with SVGs on the site!

---



