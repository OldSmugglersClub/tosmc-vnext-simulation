
const fs=require("fs"),assert=require("assert");
const js=fs.readFileSync("highscore.js","utf8");

assert(!js.includes("document.querySelectorAll('[data-view]')"));
assert(!js.includes("document.querySelectorAll('[data-scope]')"));
assert(js.includes("$('view-tabs').querySelectorAll('[data-view]')"));
assert(js.includes("$('competition-tabs').querySelectorAll('[data-scope]')"));

assert(js.includes("document.body.dataset.view=view;"));
assert(js.includes("window.OSCHighscoreGoToPage=function(requested)"));
assert(js.includes("if(view==='bonus')return rankBonusRows(copy);"));

console.log("OK: body kann nicht mehr als View-Tab gebunden werden; Bonus-Paging bleibt auf gewählter Seite.");
