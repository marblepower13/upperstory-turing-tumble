import { Board } from './board';
import { Slope } from 'parts/fence';
import { Part } from 'parts/part';
import { Turnstile, LEVER_TIP, LEVER_PIVOT_OFFSET, LEVER_REST_ANGLE } from 'parts/turnstile';
import { SPACING } from './constants';

export type CenterBlock = { column:number, row:number };
// Shared by the drawing, rigid-body collider and schematic routing. No feet
// extend into either lever's sweep or the falling-marble exit path.
// Keep the cap below the complete moving-artwork envelope of the bottom peg.
// The wide shoulder remains beside the resting lever noses to close that gap.
export const CENTER_BLOCK_TOP:number = -0.30;
export const CENTER_BLOCK_SHOULDER:number = -0.14;
export const CENTER_BLOCK_VERTICES = [
  {x: 0, y: CENTER_BLOCK_TOP * SPACING},
  {x: 0.415 * SPACING, y: CENTER_BLOCK_SHOULDER * SPACING},
  {x: 0.415 * SPACING, y: -0.10 * SPACING},
  {x: 0.10 * SPACING, y: 0.15 * SPACING},
  {x: 0.08 * SPACING, y: 0.45 * SPACING},
  {x: -0.08 * SPACING, y: 0.45 * SPACING},
  {x: -0.10 * SPACING, y: 0.15 * SPACING},
  {x: -0.415 * SPACING, y: -0.10 * SPACING},
  {x: -0.415 * SPACING, y: CENTER_BLOCK_SHOULDER * SPACING}
];

// Match schematic deflection to the same widened cap and tapered stem.
export function centerBlockHalfWidth(rowOffset:number):number {
  const r=Math.max(CENTER_BLOCK_TOP,Math.min(0.45,rowOffset));
  if(r<CENTER_BLOCK_SHOULDER)return 0.415*(r-CENTER_BLOCK_TOP)/(CENTER_BLOCK_SHOULDER-CENTER_BLOCK_TOP);
  if(r<=-0.10)return 0.415;
  if(r<=0.15)return 0.415+(0.10-0.415)*(r+0.10)/0.25;
  return 0.10+(0.08-0.10)*(r-0.15)/0.30;
}

// Convex pieces exactly cover the widened cap and tapered stem. Passing a
// concave outline directly to Matter's SAT would incorrectly obstruct the exit.
export const CENTER_BLOCK_COLLIDERS = [
  [0,1,2,3,6,7,8].map(i=>CENTER_BLOCK_VERTICES[i]),
  [3,4,5,6].map(i=>CENTER_BLOCK_VERTICES[i])
];

// Derive fixed dividers from the actual paired bottom levers. This also makes
// older saved boards acquire the divider without changing their file format.
export function centerBlocks(board:Board):CenterBlock[] {
  const blocks:CenterBlock[] = [];
  if (!board.drops) return blocks;
  for (const drop of board.drops) for (const lever of drop.turnstiles) {
    if (!lever.isLocked || lever.isFlipped ||
        board.getPart(lever.column, lever.row) !== lever) continue;
    const right = board.getPart(lever.column + 2, lever.row);
    if (right instanceof Turnstile && right.isLocked && right.isFlipped) {
      blocks.push({column: lever.column + 1, row: lever.row});
    }
  }
  return blocks;
}

export type LeverInlet = {lever:Turnstile,parts:Part[],start:{x:number,y:number},end:{x:number,y:number}};

// Replace the last continuous slope run with one uninterrupted rail ending at
// the wide lever heel. Endpoints are derived from the rigid lever at rest.
export function leverInlets(board:Board):LeverInlet[] {
  const result:LeverInlet[]=[];
  for(const block of centerBlocks(board))for(const sign of [1,-1]){
    const lever=board.getPart(block.column-sign,block.row) as Turnstile;
    const parts:Part[]=[];let c=lever.column-sign;
    while(true){
      const p=board.getPart(c,lever.row-1);
      if(!(p instanceof Slope)||!p.isLocked||p.isFlipped!==lever.isFlipped)break;
      parts.push(p);c-=sign;
    }
    if(!parts.length)continue;
    const first=parts[parts.length-1];
    const u=LEVER_TIP-22,v=-11,a=LEVER_REST_ANGLE;
    const start={x:(first.column-sign*0.5)*SPACING,y:(first.row-0.5)*SPACING};
    const end={x:lever.column*SPACING-sign*LEVER_PIVOT_OFFSET+sign*(u*Math.cos(a)-v*Math.sin(a)),
      y:lever.row*SPACING+u*Math.sin(a)+v*Math.cos(a)-0.035*SPACING};
    result.push({lever:lever,parts:parts,start:start,end:end});
  }
  return result;
}

export function isLeverInletPart(board:Board,part:Part):boolean {
  return !!part&&part instanceof Slope&&part.isLocked&&
    leverInlets(board).some(inlet=>inlet.parts.indexOf(part)>=0);
}

export function inletCollider(inlet:LeverInlet):{x:number,y:number}[] {
  // Solid backing below the thin visible edge catches fast incoming marbles.
  // It shares the same upper face and never forms an extra visible box.
  const a=inlet.start,b=inlet.end,t=0.075*SPACING;
  return [{x:a.x,y:a.y-0.035*SPACING},{x:b.x,y:b.y-0.035*SPACING},
    {x:b.x,y:b.y+t},{x:a.x,y:a.y+t}];
}
