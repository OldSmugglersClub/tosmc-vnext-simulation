from playwright.sync_api import sync_playwright
from pathlib import Path
css=(Path(__file__).resolve().parents[2]/'wettbewerb.css').read_text()
html='''<!doctype html><html lang="de"><head><meta charset="UTF-8"><style>'''+css+'''</style></head><body class="page-champions-league"><main class="page"><section class="dynamic-section"><div class="match-list"><article class="match-row"><div class="match-pairing"><span class="team-identity team-identity--home"><span class="team-identity__name">Galatasaray Istanbul</span><span class="team-identity__badge">G</span></span><span class="match-pairing__separator">–</span><span class="team-identity team-identity--away"><span class="team-identity__badge">B</span><span class="team-identity__name">Bodø/Glimt</span></span></div></article></div></section></main></body></html>'''
widths=[320,350,375,390,425,520,760,800,820,1024,1280,1440]
rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 for w in widths:
  page.set_viewport_size({'width':w,'height':900})
  page.set_content(html)
  out=page.evaluate('''() => {
   const pair=document.querySelector('.match-pairing'),sep=pair.querySelector('.match-pairing__separator');
   const home=pair.querySelector('.team-identity--home'),away=pair.querySelector('.team-identity--away');
   const names=[home.querySelector('.team-identity__name'),away.querySelector('.team-identity__name')];
   const badges=[home.querySelector('.team-identity__badge'),away.querySelector('.team-identity__badge')];
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
   const s=rect(sep),h=rect(badges[0]),a=rect(badges[1]);
   const cs=names.map(x=>getComputedStyle(x));
   return {viewport:innerWidth,bodyScrollWidth:document.documentElement.scrollWidth,pair:rect(pair),sep:s,home:h,away:a,
       hyphens:cs.map(x=>x.hyphens),wordBreak:cs.map(x=>x.wordBreak),overflowWrap:cs.map(x=>x.overflowWrap),
       sameRow:[Math.abs(h.top-s.top)<18,Math.abs(a.top-s.top)<18],axis:h.right<=s.right+4&&a.left>=s.left-4};
  }''')
  ok=(out['bodyScrollWidth']<=w+1 and all(out['sameRow']) and out['axis'] and out['pair']['width']>0 and (w>520 or out['hyphens']==['none','none']))
  rows.append({'width':w,'passed':ok,'horizontal_overflow':out['bodyScrollWidth']>w+1,'axis':out['axis'],'same_row':out['sameRow'],'hyphens':out['hyphens']})
 browser.close()
import json
# Results are printed; no file or repository modification.
print(json.dumps(rows,ensure_ascii=False))
assert all(r['passed'] for r in rows),'layout failed'
