import { Vector } from 'matter-js';

import { IBallRouter } from './router';
import { Board } from './board';
import { Part } from 'parts/part';
import { PartType } from 'parts/factory';
import { Ball } from 'parts/ball';
import { PART_SIZE, BALL_RADIUS, SPACING } from './constants';
import { Slope, Side } from 'parts/fence';
import { GearBase } from 'parts/gearbit';
import { Turnstile, LEVER_REST_ANGLE, LEVER_PIVOT_OFFSET, LEVER_TIP } from 'parts/turnstile';
import { centerBlocks, centerBlockHalfWidth, CENTER_BLOCK_TOP, CENTER_BLOCK_SHOULDER, LeverInlet, leverInlets } from './centerblock';

import { RAIL_ROLL_SPEED, railFrame, railPoint } from './rail';

type RouteMethod = (part:Part, ball:Ball) => boolean;

// compute the ball radius and diameter in grid units
const RAD = BALL_RADIUS / SPACING;
const DIAM = 2 * RAD;
// square the diameter for fast distance tests
const DIAM_2 = DIAM * DIAM;
// the thickness of fences in grid units
const FENCE = 0.125;

// the speed at which a ball should move through schematic parts
const STEP:number = 1 / PART_SIZE;
// the offset the schematic router should move toward when routing a ball,
//  which must be over 0.5 to allow the next part to capture the ball
const EXIT:number = 0.51 + RAD;

export class SchematicBallRouter implements IBallRouter {

  constructor(public readonly board:Board) {
    this.balls = this.board.balls;
  }
  public balls:Set<Ball>;
  private _inlets:LeverInlet[] = [];

  public onBoardSizeChanged() { }

  public update(speed:number, correction:number):void {
    this.board.supplyGuide.sync();
    this._inlets=leverInlets(this.board);
    const iterations:number = Math.ceil(speed * 8);
    for (let i:number = 0; i < iterations; i++) {
      for(const drop of this.board.drops)for(const lever of drop.turnstiles)lever.advancePulse(0.25);
      for (const ball of this.balls) {
        if (this.board.outputRegister.has(ball)||this.board.supplyGuide.has(ball)) continue;
        ball.vx = ball.vy = 0;
        ball.minX = ball.maxX = ball.maxY = NaN;
        if (this.routeBall(ball)) {
          this.board.layoutPart(ball, ball.column, ball.row);
        }
        else {
          this.board.removeBall(ball);
        }
      }
      this.stackBalls();
      this.moveBalls();
      this.confineBalls();
      this.board.outputRegister.capture();
      this.board.outputRegister.advance(0.25);
      this.board.supplyGuide.advance(0.25);
      GearBase.update();
    }
  }

  protected moveBalls():void {
    for (const ball of this.balls) {
      if(this.board.outputRegister.has(ball)||this.board.supplyGuide.has(ball))continue;
      const m = Math.sqrt((ball.vx * ball.vx) + (ball.vy * ball.vy));
      if (m == 0.0) continue;
      const d = Math.min(m, STEP);
      ball.column += (ball.vx * d) / m;
      ball.row += (ball.vy * d) / m;
    }
  }

  protected confineBalls():void {
    for (const ball of this.balls) {
      if(this.board.outputRegister.has(ball)||this.board.supplyGuide.has(ball))continue;
      if ((! isNaN(ball.maxX)) && (ball.column > ball.maxX)) {
        ball.column = ball.maxX;
      }
      if ((! isNaN(ball.minX)) && (ball.column < ball.minX)) {
        ball.column = ball.minX;
      }
      if ((! isNaN(ball.maxY)) && (ball.row > ball.maxY)) {
        ball.row = ball.maxY;
      }
    }
  }

  private routeLeverInlet(ball:Ball):boolean {
    for(const inlet of this._inlets){
      const frame=railFrame(inlet.start,inlet.end),dx=ball.column*SPACING-frame.start.x,dy=ball.row*SPACING-frame.start.y;
      const along=dx*frame.tangent.x+dy*frame.tangent.y,above=dx*frame.normal.x+dy*frame.normal.y;
      const clearance=BALL_RADIUS+0.075*SPACING/2+0.5;
      if(along<0||along>frame.length-5||above>clearance+STEP*SPACING||above< -BALL_RADIUS)continue;
      const p=railPoint(frame,along,clearance);
      ball.column=p.x/SPACING;ball.row=p.y/SPACING;
      // A schematic iteration is one quarter of a physical simulation step.
      ball.vx=frame.tangent.x*RAIL_ROLL_SPEED*0.25/SPACING;
      ball.vy=frame.tangent.y*RAIL_ROLL_SPEED*0.25/SPACING;
      return true;
    }
    return false;
  }

  protected routeBall(ball:Ball):boolean {
    let part:Part;
    let method:RouteMethod;
    if(this.board.outputRegister.active && ball.row >= (centerBlocks(this.board)[0].row+1)) {
      this.routeFreefall(ball);return true;
    }
    this.board.supplyGuide.takeExitVelocity(ball);
    // confine the ball on the sides
    this.checkSides(ball);
    if(this.routeLeverInlet(ball))return true;
    // The fixed post guides a center marble over its shoulder and onto
    // an adjacent blade. The post itself never advances the machine.
    for (const block of centerBlocks(this.board)) {
      const dc = ball.column - block.column, dr = ball.row - block.row;
      const width=centerBlockHalfWidth(dr);
      if (Math.abs(dc) < width + RAD && dr + RAD >= CENTER_BLOCK_TOP && dr <= 0.45 + RAD) {
        const from = isNaN(ball.lastDistinctColumn) ? ball.column : ball.lastDistinctColumn;
        let approach=this._postApproaches.get(ball);
        if(!approach||approach.column!==block.column||approach.row!==block.row){
          approach={column:block.column,row:block.row,sign:from<block.column?-1:from>block.column?1:
            (ball.drop&&ball.drop.isFlipped?1:-1)};
          this._postApproaches.set(ball,approach);
        }
        const sign=approach.sign;
        this.approachTarget(ball, block.column + sign * (0.415 + RAD + 0.025),
          dr < CENTER_BLOCK_SHOULDER ? block.row + CENTER_BLOCK_SHOULDER - RAD : ball.row);
        return(true);
      }
    }
    // The lever tips end beside the post between indexed pegs. Detect their physical span
    // rather than requiring the marble to occupy the lever's own grid cell.
    const candidates:Turnstile[] = [];
    for (const drop of this.board.drops) for (const lever of drop.turnstiles) {
      if (this.board.getPart(lever.column, lever.row) !== lever) continue;
      const dc = (ball.column - lever.column) * (lever.isFlipped ? -1 : 1);
      const along = dc + (LEVER_PIVOT_OFFSET / SPACING);
      const surface = lever.row + (Math.sin(LEVER_REST_ANGLE) * along);
      if (along >= -24 / SPACING && along <= (LEVER_TIP + 2) / SPACING + RAD &&
          ball.row + RAD >= surface && ball.row <= lever.row + 0.5) {
        candidates.push(lever);
      }
    }
    if (candidates.length) {
      const previous = this._passedLevers.get(ball);
      const from = isNaN(ball.lastDistinctColumn) ? ball.column : ball.lastDistinctColumn;
      candidates.sort((a, b) => a === previous ? -1 : b === previous ? 1 :
        Math.abs(from - a.column) - Math.abs(from - b.column));
      return this.routeTurnstile(candidates[0], ball);
    }
    // get the part containing the ball's center
    part = this.board.getPart(Math.round(ball.column), Math.round(ball.row));
    if(part && this.board.outputRegister.replaces(part))part=null;
    if ((part) && (method = this.routeMethodForPart(part)) &&
        (method.call(this, part, ball))) return(true);
    // get the leading corner of the ball's location if 
    //  we know it's moving horizontally
    if (ball.lastColumn !== ball.column) {
      const sign = ball.lastColumn < ball.column ? 1 : -1;
      const c = ball.column + (RAD * sign);
      const r = ball.row + RAD;
      // get the part on the grid square containing the leading corner
      part = this.board.getPart(Math.round(c), Math.round(r));
      if(part && this.board.outputRegister.replaces(part))part=null;
      if ((part) && (method = this.routeMethodForPart(part)) &&
          (method.call(this, part, ball))) return(true);
    }
    // if we get here, the ball was not moved, so let it fall
    this.routeFreefall(ball);
    if (ball.row > this.board.rowCount + 0.5) return(false);
    return(true);
  }

  protected checkSides(ball:Ball):void {
    const c = Math.round(ball.column);
    const r = Math.round(ball.row);
    const left = this.board.getPart(c - 1, r);
    const center = this.board.getPart(c, r);
    const right = this.board.getPart(c + 1, r);
    if (((left) && (left.type == PartType.SIDE) && (left.isFlipped)) ||
        ((center) && (center.type == PartType.SIDE) && (! center.isFlipped))) {
      ball.minX = c - 0.5 + RAD + (FENCE / 2);
    }
    if (((right) && (right.type == PartType.SIDE) && (! right.isFlipped)) || 
        ((center) && (center.type == PartType.SIDE) && (center.isFlipped))) {
      ball.maxX = c + 0.5 - RAD - (FENCE / 2);
    }
  }

  protected routeMethodForPart(part:Part):RouteMethod {
    if (! part) return(null);
    switch(part.type) {
      case PartType.RAMP: return(this.routeRamp);
      case PartType.CROSSOVER: return(this.routeCrossover);
      case PartType.INTERCEPTOR: return(this.routeInterceptor);
      case PartType.BIT:     // fall-through
      case PartType.GEARBIT: return(this.routeBit);
      case PartType.SIDE: return(this.routeSide);
      case PartType.SLOPE: return(this.routeSlope);
      case PartType.DROP: return(this.routeDrop);
      case PartType.TURNSTILE: return(this.routeTurnstile);
      default: return(null);
    }
  }

  protected routeRamp(part:Part, ball:Ball):boolean {
    // if the ball is in the top half of the part, proceed toward the center
    if (ball.row < part.row) this.approachTarget(ball, part.column, part.row);
    // otherwise proceed toward the exit point
    else {
      this.approachTarget(ball, 
        part.column + (part.isFlipped ? -EXIT : EXIT), part.row + EXIT);
    }
    return(true);
  }

  protected routeCrossover(part:Part, ball:Ball):boolean {
    // if the ball is in the top half of the part, proceed toward the center
    if (ball.row < part.row) this.approachTarget(ball, part.column, part.row);
    // in the bottom half, route based on prior direction
    else if (ball.lastDistinctColumn < ball.column) { // traveling right
      this.approachTarget(ball, part.column + EXIT, part.row + EXIT);
    }
    else { // traveling left
      this.approachTarget(ball, part.column - EXIT, part.row + EXIT);
    }
    return(true);
  }

  protected routeInterceptor(part:Part, ball:Ball):boolean {
    ball.minX = part.column - 0.5 + RAD;
    ball.maxX = part.column + 0.5 - RAD;
    ball.maxY = part.row + 0.5 - RAD;
    return(this.routeFreefall(ball));
  }

  protected routeBit(part:Part, ball:Ball):boolean {
    // if the ball is in the top half of the part, proceed toward the center,
    //  rotating the bit as we go
    if (ball.row < part.row) {
      this._initialBitValue.set(part, part.bitValue);
      this.approachTarget(ball, part.column, part.row);
    }
    else if (! this._initialBitValue.get(part)) {
      this.approachTarget(ball, part.column + EXIT, part.row + EXIT);
    }
    else {
      this.approachTarget(ball, part.column - EXIT, part.row + EXIT);
    }
    // rotate the part as the ball travels through it
    let r = (part.row + 0.5) - ball.row;
    if (! this._initialBitValue.get(part)) r = 1.0 - r;
    part.rotation = r;
    return(true);
  }
  private _initialBitValue:WeakMap<Part,boolean> = new WeakMap();

  protected routeSide(part:Part, ball:Ball):boolean {
    // if the ball is contacting the side, push it inward
    if (part.isFlipped) { // right side
      ball.maxX = part.column + 0.5 - RAD;
    }
    else { // left side
      ball.minX = part.column - 0.5 + RAD;
    }
    return(this.routeFreefall(ball));
  }

  protected routeSlope(part:Part, ball:Ball):boolean {
    if (! (part instanceof Slope)) return(false);
    // get the ball's row and column as a percentage of the part area
    const r = ball.row - (part.row - 0.5);
    let c = ball.column - (part.column - 0.5);
    if (part.isFlipped) c = 1 - c;
    // get the level the ball center should be at at that column
    const m = part.modulus;
    const s = part.sequence;
    const level = ((c + s - FENCE) / m) - RAD;
    // if the ball is above the slope, allow it to drop
    if (r + STEP <= level) return(this.routeFreefall(ball));
    // if the ball is well below the slope, allow it to drop
    if (r > level + DIAM) return(this.routeFreefall(ball));
    // the ball is near the fence, so put it on top of the fence
    ball.maxY = (part.row - 0.5) + level;
    // get the target column to aim for
    const sign = part.isFlipped ? -1 : 1;
    let target = sign * EXIT;
    // roll toward the exit
    this.approachTarget(ball, part.column + target, 
      part.row - 0.5 + ((0.5 + (target * sign) + s - FENCE) / m) - RAD);
    return(true);
  }

  protected routeDrop(part:Part, ball:Ball):boolean {
    if (ball.released) {
      const sign = part.isFlipped ? -1 : 1;
      this.approachTarget(ball, part.column + (sign * EXIT), 
                                part.row + 0.5 - RAD);
    }
    else {
      const offset = RAD + (FENCE / 2);
      ball.minX = part.column - 0.5 + offset;
      ball.maxX = part.column + 0.5 - offset;
      ball.maxY = part.row + 0.5 - offset;
      this.routeFreefall(ball);
    }
    return(true);
  }

  private _postApproaches:WeakMap<Ball,{column:number,row:number,sign:number}> = new WeakMap();
  private _passedLevers:WeakMap<Ball, Turnstile> = new WeakMap();
  protected routeTurnstile(part:Part, ball:Ball):boolean {
    const lever = part as Turnstile;
    const sign = part.isFlipped ? -1 : 1;
    if (this._passedLevers.get(ball) !== lever) {
      const along = ((ball.column - part.column) * sign) + (LEVER_PIVOT_OFFSET / SPACING);
      const surface = part.row + (Math.sin(LEVER_REST_ANGLE) * along);
      if (ball.row + RAD < surface) return(false);
      this._passedLevers.set(ball, lever);
      lever.registerPass(ball);
      lever.pulse(this.board.speed, false, ball);
    }
    // Guide the marble downward through the open inner end, rather than
    // tracing the previous four-spoke rotor's circular pocket.
    this.approachTarget(ball, ball.column, part.row + EXIT);
    return(true);
  }

  protected routeFreefall(ball:Ball):boolean {
    ball.vy += STEP;
    return(true);
  }

  // move the ball toward the given location
  protected approachTarget(ball:Ball, c:number, r:number):void {
    let v = Vector.normalise({ x: c - ball.column, y: r - ball.row });
    ball.vx += v.x * STEP;
    ball.vy += v.y * STEP;
  }

  // BALL STACKING ************************************************************

  protected stackBalls():void {
    // group balls into columns containing balls that are on either side
    const columns:Ball[][] = [ ];
    const add = (ball:Ball, c:number) => {
      if ((c < 0) || (c >= this.board.rowCount)) return;
      if (columns[c] === undefined) columns[c] = [ ];
      columns[c].push(ball);
    };
    for (const ball of this.balls) {
      if(this.board.outputRegister.has(ball)||this.board.supplyGuide.has(ball))continue;
      const center = Math.round(ball.column);
      add(ball, center);
      add(ball, center - 1);
      add(ball, center + 1);
    }
    // sort the balls in each column from bottom to top
    for (const c in columns) {
      const column = columns[c];
      if (! column) continue;
      column.sort((a, b) => a.row > b.row ? -1 : a.row < b.row ? 1 : 0);
      this.stackColumn(parseInt(c), column);
    }
  }
  protected stackColumn(column:number, balls:Ball[]):void {
    let ball:Ball;
    let r:number, c:number, i:number, j:number, dc:number, dr:number;
    const collisions:Set<Ball> = new Set();
    for (i = 0; i < balls.length; i++) {
      ball = balls[i];
      // don't move balls from other columns, they'll be taken care of there
      if (Math.round(ball.column) !== column) continue;
      // iterate over balls below this one to find collisions
      collisions.clear();
      r = ball.row;
      c = ball.column;
      for (j = i - 1; j >= 0; j--) {
        dc = balls[j].column - c;
        dr = balls[j].row - r;
        // if we find a ball more than a diameter below this one, 
        //  the rest must be lower
        if (dr > DIAM) break;
        if ((dr * dr) + (dc * dc) < DIAM_2) {
          collisions.add(balls[j]);
        }
      }
      // if there are no collisions, there's nothing to do
      if (collisions.size == 0) continue;
      // if the ball is in contact, remove any horizontal motion 
      //  applied by the router so far
      ball.vx = 0;
      // move away from each other ball
      for (const b of collisions) {
        let dx = ball.column - b.column;
        let dy = ball.row - b.row;
        const m = Math.sqrt((dx * dx) + (dy * dy));
        // if two ball are directly on top of eachother, push one of them up
        if (! (m > 0)) {
          ball.vy -= (DIAM - STEP);
        }
        else {
          const d = (DIAM - STEP) - m;
          // add some jitter so balls don't stack up vertically
          if (dx === 0.0) dx = (Math.random() - 0.5) * STEP * 0.01;
          if (d > 0) {
            ball.vx += (dx * d) / m;
            ball.vy += (dy * d) / m;
          }
        }
      }
    }
  }

}
