const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('torjaeger-fallback.js', 'utf8');
function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return { getItem:k => map.has(k) ? map.get(k) : null, setItem:(k,v)=>map.set(k,v), dump:()=>map };
}
function response(data, ok = true, status = 200) { return { ok, status, json: async()=>data }; }
function loadModule() {
  const window = { fetch: async()=>response([]), localStorage: storage() };
  vm.runInNewContext(source, { window, console, Date, JSON, Object, Array, Number, String, Boolean, Error });
  return window.TOSMCGoalGetterFallback;
}

(async()=>{
  const api=loadModule();
  let calls=[];
  const live=[{goalGetterName:'A',goalCount:4}];
  const st=storage();
  let result=await api.load({competitionId:'champions-league',liveUrl:'live',storage:st,fetchImpl:async(url)=>{calls.push(url); return response(live);}});
  assert.equal(result.source,'live'); assert.equal(result.data[0].goalCount,4);
  assert(st.getItem('tosmc:torjaeger:last-good:champions-league'));

  result=await api.load({competitionId:'champions-league',liveUrl:'live',storage:st,fetchImpl:async(url)=>{ if(url==='live') throw new Error('offline'); return response({competitions:{}}); }});
  assert.equal(result.source,'browser-snapshot'); assert.equal(result.data[0].goalCount,4);

  const staticData=[{goalGetterName:'B',goalCount:3}];
  result=await api.load({competitionId:'europa-league',liveUrl:'live',storage:storage(),fetchImpl:async(url)=> url==='live' ? Promise.reject(new Error('offline')) : response({competitions:{'europa-league':{capturedAt:'x',data:staticData}}})});
  assert.equal(result.source,'release-snapshot'); assert.equal(result.data[0].goalCount,3);

  const st2=storage({'tosmc:torjaeger:last-good:dfb-pokal':JSON.stringify({capturedAt:'x',data:[{goalGetterName:'C',goalCount:2}]})});
  result=await api.load({competitionId:'dfb-pokal',liveUrl:'live',storage:st2,fetchImpl:async(url)=>response([])});
  assert.equal(result.source,'browser-snapshot'); assert.equal(result.data[0].goalCount,2);

  result=await api.load({competitionId:'dfb-pokal',liveUrl:'live',storage:storage(),fetchImpl:async(url)=>response(url==='live'?[]:{competitions:{'dfb-pokal':{data:[]}}})});
  assert.equal(result.source,'live-empty'); assert.deepEqual(Array.from(result.data),[]);

  console.log('HF97 Torjaeger-Fallback: 5/5 BESTANDEN');
})().catch(err=>{console.error(err);process.exit(1);});
