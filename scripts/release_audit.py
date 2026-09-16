#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
REF_RE=re.compile(r"(?:src|href)\s*=\s*['\"]([^'\"#?]+)|fetch\(\s*['\"]([^'\"]+)['\"]",re.I)
SKIP=("http://","https://","mailto:","tel:","javascript:","data:","//")
html=sorted(ROOT.glob('*.html')); js=sorted(ROOT.glob('*.js')); jsons=sorted(ROOT.glob('*.json'))
missing=[]; refs=set(); errors=[]
for f in html+js:
 t=f.read_text(encoding='utf-8',errors='replace')
 for m in REF_RE.finditer(t):
  ref=next((g for g in m.groups() if g),'').strip().split('?')[0].split('#')[0]
  if not ref or ref.startswith(SKIP) or '${' in ref or ref.startswith('/'): continue
  target=(f.parent/ref).resolve()
  try: target.relative_to(ROOT.resolve())
  except ValueError: continue
  refs.add((f.name,ref))
  if not target.exists(): missing.append({'source':f.name,'reference':ref})
for f in jsons:
 try: json.loads(f.read_text(encoding='utf-8'))
 except Exception as e: errors.append({'file':f.name,'error':str(e)})
forbidden=['admin.html','daten-cockpit.html','spielpflege.html','wettbewerbspflege.html','team-teilnehmerpflege.html','tipppflege.html','punkteberechnung.html','bonuspflege.html','smugglerpflege.html','tippfristen.html','abgabe-erinnerungen.html','erinnerungsprotokoll.html','abgabezuverlaessigkeit.html','datenqualitaet.html']
found=[x for x in forbidden if (ROOT/x).exists()]
version=(ROOT/'VERSION.txt').read_text(encoding='utf-8').strip()
status='OK' if not missing and not errors and not found and version=='4.0.4' else 'FEHLER'
report={'auditVersion':'4.0.4','generatedAtUtc':datetime.now(timezone.utc).isoformat(),'status':status,'version':version,'counts':{'html':len(html),'javascript':len(js),'json':len(jsons),'referencesChecked':len(refs)},'missingLocalReferences':missing,'jsonErrors':errors,'forbiddenPublicAdminFiles':found}
(ROOT/'RELEASE-AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2)); sys.exit(0 if status=='OK' else 1)
