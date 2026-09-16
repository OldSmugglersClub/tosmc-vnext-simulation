import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const required = [
  "grid-template-columns: minmax(0, 1fr) 1.2rem minmax(0, 1fr)",
  ".sm-event-row__team--home {\n        justify-content: flex-end;",
  ".sm-event-row__team--away {\n        justify-content: flex-start;",
  ".sm-event-row__separator {\n        width: 1.2rem;"
];
const missing = required.filter(fragment => !html.includes(fragment));
if (missing.length) {
  console.error("Paarungsachsen-Prüfung fehlgeschlagen:", missing);
  process.exit(1);
}
console.log("Paarungsachsen-Prüfung bestanden: feste, mittige Trennachse mit gleich breiten Teamspalten.");
