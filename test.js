const r = new RegExp(String.raw`\.svg(?:\\?\|\d+)?`, "g");
console.log(r);
console.log(r.test('.svg|18'));
r.lastIndex = 0;
console.log(r.test('.svg\\|18'));
