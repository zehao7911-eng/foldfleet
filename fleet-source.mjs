/*! Adapted from Battleship by Harmeet Matharoo, 2022, MIT.
 * Original complete game: hmjatt/Battleship, f8cd3cfa4d728fbfa0ddb0373fb12f3bc28633b6.
 * Port of generate(), revealSquare(), checkForWins() from gameLogic.js.
 * Changes: data cells instead of DOM tokens; parameterised width; bounded placement
 * with no adjacent hulls; repeated misses guarded before counters; cooperative rescue.
 * No original image/audio assets are used. Full original modules are in upstream/.
 */
import {shipModule} from './upstream/ships.js';
export const shipTemplates=shipModule.shipsTestMethod();
export function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function directions(length,width){const t=shipTemplates.find(s=>s.directions[0].length===length);if(!t)throw Error('Unsupported ship');return[t.directions[0].slice(),t.directions[1].map(x=>x/10*width)];}
export function neighbours(id,width){const out=[],x=id%width,y=Math.floor(id/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<width&&b<width)out.push(b*width+a);}return out;}
export function generate(lengths,width,seed){
 const random=rng(seed),occupied=new Set(),ships=[];let steps=0;
 function place(i){if(i===lengths.length)return true;if(++steps>30000)return false;const length=lengths[i],candidates=[];
  for(let axis=0;axis<2;axis++)for(let start=0;start<width*width;start++){
   const current=directions(length,width)[axis];const cells=current.map(index=>start+index);
   const isTaken=cells.some(index=>index>=width*width||neighbours(index,width).some(p=>occupied.has(p)));
   const crossesEdge=axis===0&&Math.floor(start/width)!==Math.floor(cells.at(-1)/width);
   if(!isTaken&&!crossesEdge)candidates.push({cells,axis,start});
  }
  for(let n=candidates.length-1;n>0;n--){const k=Math.floor(random()*(n+1));[candidates[n],candidates[k]]=[candidates[k],candidates[n]];}
  for(const c of candidates){c.cells.forEach(index=>occupied.add(index));ships.push({id:i,name:'hull'+i,length,cells:c.cells,axis:c.axis});if(place(i+1))return true;ships.pop();c.cells.forEach(index=>occupied.delete(index));}
  return false;
 }
 if(!place(0))throw Error('Fleet does not fit');return ships;
}
export function makeBoard(width,ships){const squares=Array.from({length:width*width},()=>({classes:[]}));for(const ship of ships)for(const index of ship.cells)squares[index].classes.push('taken',ship.name);return{width,ships,squares,counts:{}};}
export function checkForWins(board){return board.ships.every(ship=>(board.counts[ship.name]||0)>=ship.length);}
export function revealSquare(board,id){
 const enemySquare=board.squares[id];if(!enemySquare)return null;
 const obj=Object.values(enemySquare.classes);
 if(obj.includes('boom')||obj.includes('miss'))return null;
 if(!obj.includes('boom'))for(const ship of board.ships)if(obj.includes(ship.name))board.counts[ship.name]=(board.counts[ship.name]||0)+1;
 const won=checkForWins(board);
 if(obj.includes('taken'))enemySquare.classes.push('boom');else enemySquare.classes.push('miss');
 const ship=board.ships.find(s=>obj.includes(s.name));
 return{hit:obj.includes('taken'),ship:ship?.id??null,rescued:!!ship&&board.counts[ship.name]===ship.length,won};
}
