const assert=require('assert');
function test(seq){
 const sequence=seq;
 const last = sequence.at(-1);
 let streak = 0;
 for (let i = sequence.length - 1; i >= 0 && sequence[i] === last; i -= 1) streak += 1;
 const streakType = last ? 'Treffer' : streak === 1 ? 'Fehltipp' : 'Fehltipps';
 const val=streak || '–';
 const label=streak ? streakType + ' in Folge' : 'Noch keine Auswertung';
 return [val,label];
}
const cases=[
 [[],['–','Noch keine Auswertung']],
 [[false],[1,'Fehltipp in Folge']],
 [[false,false,false],[3,'Fehltipps in Folge']],
 [[true],[1,'Treffer in Folge']],
 [[false,true,true],[2,'Treffer in Folge']],
 [[true,false,false],[2,'Fehltipps in Folge']],
 [[false,false,true,false],[1,'Fehltipp in Folge']],
 [[false,true,false,true,true],[2,'Treffer in Folge']],
 [[true,true,false,true],[1,'Treffer in Folge']]
];
for(const [s,w] of cases)assert.deepStrictEqual(test(s),w);
console.log(`${cases.length}/${cases.length} Zeitreihentests bestanden`);
