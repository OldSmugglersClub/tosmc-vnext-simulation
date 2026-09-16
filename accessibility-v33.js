(() => {
  "use strict";
  if (window.__smugglersAccessibilityV33) return;
  window.__smugglersAccessibilityV33 = true;

  const ready = (callback) => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", callback, { once: true })
    : callback();

  ready(() => {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    if (main && !document.querySelector('.a11y-skip-link, .hs-skip-link')) {
      const skip = document.createElement("a");
      skip.className = "a11y-skip-link";
      skip.href = `#${main.id}`;
      skip.textContent = "Direkt zum Hauptinhalt";
      document.body.prepend(skip);
    }

    document.querySelectorAll("table").forEach((table, index) => {
      const wrapper = table.parentElement;
      if (!wrapper || wrapper.classList.contains("a11y-scroll-region") || wrapper.scrollWidth <= wrapper.clientWidth) return;
      wrapper.classList.add("a11y-scroll-region");
      wrapper.tabIndex = 0;
      if (!wrapper.getAttribute("aria-label")) {
        const caption = table.querySelector("caption")?.textContent?.trim();
        wrapper.setAttribute("aria-label", caption ? `${caption} – horizontal scrollbar` : `Tabelle ${index + 1} – horizontal scrollbar`);
      }
    });

    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.setAttribute("rel", [...rel].join(" "));
    });
  });
})();
