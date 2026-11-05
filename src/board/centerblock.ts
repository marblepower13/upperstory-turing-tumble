import { Board } from './board';
import { Slope } from 'parts/fence';
import { Part } from 'parts/part';
import { Turnstile, LEVER_TIP, LEVER_PIVOT_OFFSET, LEVER_REST_ANGLE } from 'parts/turnstile';
import { SPACING } from './constants';

export type CenterBlock = { column:number, row:number };
// Shared by the drawing, rigid-body collider and schematic routing. No feet
// extend into either lever's sweep or the falling-marble exit path.
export const CENTER_BLOCK_VERTICES = [
  {x: 0, y: -0.70 * SPACING},
  {x: 0.23 * SPACING, y: -0.50 * SPACING},
  {x: 0.12 * SPACING, y: 0.38 * SPACING},
  {x: 0.08 * SPACING, y: 0.45 * SPACING},
  {x: -0.08 * SPACING, y: 0.45 * SPACING},
  {x: -0.12 * SPACING, y: 0.38 * SPACING},
  {x: -0.23 * SPACING, y: -0.50 * SPACING}
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
  const a=inlet.start,b=inlet.end,t=0.22*SPACING;
  return [{x:a.x,y:a.y-0.035*SPACING},{x:b.x,y:b.y-0.035*SPACING},
    {x:b.x,y:b.y+t},{x:a.x,y:a.y+t}];
}
