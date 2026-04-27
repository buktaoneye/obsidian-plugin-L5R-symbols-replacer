const L5R_TOKENS = ["op","su","ex","st","skill","ring","earth","water","fire","air","void","kiho","maho","ninjutsu","ritual","shuji","invocation","kata","prereq","inversion","mantra","imperial","crab","crabx","crane","cranex","dragon","dragonx","lion","lionx","mantis","mantisx","phoenix","phoenixx","scorpion","scorpionx","tortoise","tortoisex","unicorn","unicornx","ronin","courtier","bushi","shugenja"];
const l5rPattern = new RegExp(`\\((${L5R_TOKENS.join('|')})\\)`, "g");

// Adjust to match the published folder containing your SVGs
const L5R_BASE_URL = "/L5R_Icons";

function replaceL5RSymbols(rootNode) {
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
    const changes = [];
    let node;

    while ((node = walker.nextNode())) {
        if (node.parentElement && (node.parentElement.tagName === "CODE" || node.parentElement.tagName === "PRE")) continue;

        const text = node.nodeValue;
        if (!text || !l5rPattern.test(text)) continue;
        
        l5rPattern.lastIndex = 0;
        const parts = [];
        let idx = 0, match;

        while ((match = l5rPattern.exec(text))) {
            if (idx < match.index) parts.push(document.createTextNode(text.slice(idx, match.index)));
            
            const token = match[1]; // Extracts just the word inside the parenthesis
            const img = document.createElement("img");
            img.src = `${L5R_BASE_URL}/${token}.svg`;
            img.alt = token;
            img.title = token;
            img.className = "l5r-symbol";
            img.style.cssText = "height: 18px; width: 18px; vertical-align: middle; display: inline-block; margin: 0 2px;";

            parts.push(img);
            idx = l5rPattern.lastIndex;
        }
        if (idx < text.length) parts.push(document.createTextNode(text.slice(idx)));
        changes.push({ node, parts });
    }

    for (const c of changes) {
        if (!c.node.parentNode) continue;
        const frag = document.createDocumentFragment();
        for (const p of c.parts) frag.appendChild(p);
        c.node.parentNode.replaceChild(frag, c.node);
    }
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
                replaceL5RSymbols(addedNode);
            }
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
replaceL5RSymbols(document.body);