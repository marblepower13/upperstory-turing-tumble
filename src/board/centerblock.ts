import { Board } from './board';
import { Turnstile } from 'parts/turnstile';
import { SPACING } from './constants';

export type CenterBlock = { column:number, row:number };
// Shared by the drawing, rigid-body collider and schematic routing. No feet
// extend into either lever's sweep or the falling-marble exit path.
export const CENTER_BLOCK_VERTICES = [
  {x: 0, y: -0.70 * SPACING},
  {x: 0.23 * SPACING, y: -0.50 * SPACING},
  {x: 0.23 * SPACING, y: 0.38 * SPACING},
  {x: 0.18 * SPACING, y: 0.45 * SPACING},
  {x: -0.18 * SPACING, y: 0.45 * SPACING},
  {x: -0.23 * SPACING, y: 0.38 * SPACING},
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

// Short, flush continuations of the lower board ramps meet the widened lever
// heels at rest; they leave the receiving cups and downward sweep clear.
export function leverInletVertices(block:CenterBlock):{x:number,y:number}[][] {
  return [-1,1].map(sign => [
    {x:1.54,y:-0.565},{x:0.84,y:-0.215},
    {x:0.86,y:0.02},{x:1.54,y:-0.25}
  ].map(p => ({x:(block.column+sign*p.x)*SPACING,y:(block.row+p.y)*SPACING})));
}
