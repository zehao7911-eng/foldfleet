import {generate,makeBoard,revealSquare,neighbours} from './fleet-source.mjs';
export const KEY='foldfleet.profile.v1';
export const coves=[
 {name:'First Light',tag:'THE LITTLE HARBOUR',n:5,lengths:[2,2],seed:121,par:3,palette:0},
 {name:'Reedwater',tag:'THE JADE INLETS',n:5,lengths:[3,2],seed:5741,par:5,palette:1},
 {name:'Rosewater',tag:'THE PETAL QUAYS',n:6,lengths:[3,2,2],seed:3881,par:7,palette:2},
 {name:'Blue Hour',tag:'THE LANTERN STRAITS',n:6,lengths:[4,3,2],seed:7162,par:9,palette:3},
 {name:'Cloud Atlas',tag:'THE FLOATING LIBRARY',n:6,lengths:[4,3,2,2],seed:9917,par:9,palette:4},
 {name:'Last Lantern',tag:'THE GOLDEN SHOALS',n:6,lengths:[4,3,3,2],seed:21077,par:10,palette:5}
];
const clone=v=>JSON.parse(JSON.stringify(v));
export function makeRound(level=0,remix=0){
 level=Math.max(0,Math.min(5,level|0));remix=Math.max(0,Math.min(999999,remix|0));const c=coves[level];
 let ships=generate(c.lengths,c.n,c.seed+remix*11771);
 if(level===0&&remix===0)ships=[{id:0,name:'hull0',length:2,cells:[6,7],axis:0},{id:1,name:'hull1',length:2,cells:[18,23],axis:1}];
 return{v:1,level,remix,ships,shots:Array(c.n*c.n).fill(0),taps:[],misses:0,pings:0,rescued:[],done:false};
}
export function boardOf(r){const b=makeBoard(coves[r.level].n,r.ships);for(const id of r.taps)revealSquare(b,id);return b;}
export function seek(r,id){
 if(r.done||!Number.isInteger(id)||id<0||id>=r.shots.length||r.shots[id]!==0)return null;
 const b=boardOf(r),out=revealSquare(b,id);if(!out)return null;r.taps.push(id);r.shots[id]=out.hit?2:1;if(!out.hit)r.misses++;
 let cleared=[];
 if(out.rescued){r.rescued.push(out.ship);const ship=r.ships[out.ship];for(const cell of ship.cells)for(const near of neighbours(cell,b.width))if(r.shots[near]===0&&!b.squares[near].classes.includes('taken')){r.shots[near]=3;cleared.push(near);}}
 r.done=out.won;return{...out,id,cleared,stars:r.done?stars(r):0};
}
export function hintCell(r){const hit=r.ships.find(s=>s.cells.some(id=>r.shots[id]===2)&&!r.rescued.includes(s.id));return(hit||r.ships.find(s=>!r.rescued.includes(s.id)))?.cells.find(id=>r.shots[id]===0)??null;}
export function ping(r){if(r.done||r.pings>=2)return null;const id=hintCell(r);if(id===null)return null;r.pings++;return id;}
export function stars(r){return 1+(r.misses<=coves[r.level].par?1:0)+(r.pings===0?1:0);}
export function restoreRound(raw){
 if(!raw||raw.v!==1||!Number.isInteger(raw.level)||raw.level<0||raw.level>5||!Number.isInteger(raw.remix)||raw.remix<0||raw.remix>999999||!Array.isArray(raw.taps))return null;
 const r=makeRound(raw.level,raw.remix);const seen=new Set();
 for(const id of raw.taps){if(!Number.isInteger(id)||seen.has(id)||id<0||id>=r.shots.length||r.shots[id]!==0||r.done)return null;seen.add(id);if(!seek(r,id))return null;}
 r.pings=Math.max(0,Math.min(2,raw.pings|0));return r.done?null:r;
}
export function profile(raw={}){if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};return{v:1,best:Array.from({length:6},(_,i)=>Math.max(0,Math.min(3,raw.best?.[i]|0))),active:restoreRound(raw.active),rewards:{like:raw.rewards?.like===true,comment:raw.rewards?.comment===true},muted:raw.muted===true,seal:['coral','gold'].includes(raw.seal)?raw.seal:'ivory',remix:Math.max(0,Math.min(999999,raw.remix|0)),selected:Math.max(0,Math.min(5,raw.selected|0)),boatTypes:[...new Set((Array.isArray(raw.boatTypes)?raw.boatTypes:[]).filter(n=>[2,3,4].includes(n)))]};}
export function mergeProfile(a,b){a=profile(a);b=profile(b);return profile({...a,best:a.best.map((v,i)=>Math.max(v,b.best[i])),active:a.active||b.active,boatTypes:[...a.boatTypes,...b.boatTypes],rewards:{like:a.rewards.like||b.rewards.like,comment:a.rewards.comment||b.rewards.comment}});}
export function canSeal(p,id){const n=p.best.reduce((a,b)=>a+b,0);return id==='ivory'||id==='coral'&&(n>=6||p.rewards.comment)||id==='gold'&&(n>=12||p.rewards.like);}
export const copy=clone;
