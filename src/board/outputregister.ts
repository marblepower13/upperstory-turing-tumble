import * as PIXI from 'pixi.js';
import { Board } from './board';
import { Ball } from 'parts/ball';
import { Part } from 'parts/part';
import { PartType } from 'parts/factory';
import { SPACING, BALL_RADIUS } from './constants';
import { centerBlocks } from './centerblock';
import { Renderer } from 'renderer';

type Point = {x:number, y:number};
type Entry = {ball:Ball, distance:number, origin:Point, approach:number};
const PITCH = BALL_RADIUS * 2 + 0.5;
const RATE = 4;

// A guided, one-dimensional output channel. Free-body physics ends only below
// the levers. Entries then move along the visible track, constrained by their
// predecessor, so solver friction/bouncing cannot reorder a puzzle's output.
export class OutputRegister {
  constructor(private board:Board) { }
  public readonly view = new PIXI.Graphics();
  private entries:Entry[] = [];
  private held:Set<Ball> = new Set();
  private path:Point[] = [];
  private lengths:number[] = [];
  private length:number = 0;
  private signature:string = '';
  private drawing:string = '';
  private column:number = 0;
  private row:number = 0;
  public get active():boolean { this.sync(); return this.path.length > 0; }
  public has(ball:Ball):boolean { return this.held.has(ball); }
  public get sequence():Ball[] { return this.entries.map(e => e.ball); }
  public get settled():boolean {
    return this.entries.every((e, i) => Math.abs(e.distance -
      (this.length - BALL_RADIUS - 2 - i * PITCH)) < 0.001);
  }
  public clear():void { this.entries = []; this.held.clear(); }
  public remove(ball:Ball):void {
    if (!this.held.delete(ball)) return;
    this.entries = this.entries.filter(e => e.ball !== ball);
  }
  public sync():void {
    const blocks = centerBlocks(this.board);
    const block = blocks.length === 1 ? blocks[0] : null;
    const signature = block ? block.column + ':' + block.row + ':' + this.board.columnCount : '';
    if (signature === this.signature) return;
    this.signature = signature;
    this.clear(); this.path = []; this.lengths = []; this.length = 0;
    if (!block) { this.view.clear(); return; }
    this.column = block.column; this.row = block.row;
    const at = (c:number, r:number):Point => ({x:c * SPACING, y:r * SPACING});
    const add = (p:Point):void => {
      if (this.path.length) {
        const prev = this.path[this.path.length - 1];
        this.length += Math.sqrt(Math.pow(p.x-prev.x,2) + Math.pow(p.y-prev.y,2));
      }
      this.path.push(p); this.lengths.push(this.length);
    };
    const curve = (a:Point, control:Point, b:Point):void => {
      for (let i=1;i<=20;i++) {
        const t=i/20, u=1-t;
        add({x:u*u*a.x+2*u*t*control.x+t*t*b.x,
             y:u*u*a.y+2*u*t*control.y+t*t*b.y});
      }
    };
    add(at(this.column, this.row+1.6-BALL_RADIUS/SPACING-0.03));
    add(at(this.column, this.row+1.85));
    add(at(0.45, this.row+2.32));
    let a = this.path[this.path.length-1], b = at(-0.22, this.row+2.75);
    curve(a, at(-0.22,this.row+2.32), b);
    a=b; b=at(0.35,this.row+3.03);
    curve(a, at(-0.22,this.row+3.03), b);
    add(at(this.board.columnCount-0.65, this.row+3.45));
    this.drawing = '';
  }
  public replaces(part:Part):boolean {
    return this.path.length > 0 && part.isLocked && part.row > this.row &&
      (part.type === PartType.SLOPE || part.type === PartType.SIDE);
  }
  public capture():void {
    this.sync();
    if (!this.path.length) return;
    for (const ball of this.board.balls) {
      const side=Math.min(4.1,Math.abs(ball.column-this.column));
      const entrance=this.row+1.6-BALL_RADIUS/SPACING-0.03-side*0.95/4.1;
      if (this.held.has(ball) || ball.row < entrance ||
          ball.column < -0.4 || ball.column > this.board.columnCount-0.4) continue;
      // Resolve any fixed-step overshoot at the visible funnel's upper face,
      // just as a rigid-body contact would, before entering the guided track.
      const origin = {x:ball.column*SPACING, y:entrance*SPACING};
      const head=this.path[0];
      const approach=Math.max(1,Math.sqrt(Math.pow(head.x-origin.x,2)+Math.pow(head.y-origin.y,2)));
      const previous=this.entries[this.entries.length-1];
      const distance=previous ? Math.min(-approach, previous.distance-PITCH) : -approach;
      this.entries.push({ball:ball, distance:distance, origin:origin, approach:approach});
      this.held.add(ball);
      ball.vx=ball.vy=0;
    }
  }
  public advance(steps:number):void {
    this.sync();
    for (const entry of this.entries.slice()) {
      if (!this.board.balls.has(entry.ball)) this.remove(entry.ball);
    }
    let limit=this.length-BALL_RADIUS-2;
    let previous:Entry = null;
    for (const entry of this.entries) {
      let next=Math.min(limit,entry.distance+RATE*steps);
      // Arc-length spacing alone is insufficient in the rounded turn.
      // Keep full circle clearance there as well as FIFO distance order.
      if (previous && next >= 0 && previous.distance >= 0) {
        const ahead=this.pointAt(previous.distance);
        const clearance=(distance:number):number=>{
          const p=this.pointAt(distance);
          return Math.sqrt(Math.pow(p.x-ahead.x,2)+Math.pow(p.y-ahead.y,2));
        };
        if(clearance(next)<PITCH-0.000001) {
          let low=Math.max(0,Math.min(entry.distance,next)),high=next;
          for(let i=0;i<16;i++) {
            const mid=(low+high)/2;
            if(clearance(mid)>=PITCH)low=mid;else high=mid;
          }
          next=low;
        }
      }
      entry.distance=next;
      limit=entry.distance-PITCH;
      previous=entry;
      const point=entry.distance < 0 ? this.approachPoint(entry) : this.pointAt(entry.distance);
      const ball=entry.ball;
      if (Math.abs(ball.column*SPACING-point.x)+Math.abs(ball.row*SPACING-point.y)>0.00001) {
        this.board.layoutPart(ball,point.x/SPACING,point.y/SPACING);
        Renderer.needsUpdate();
      }
      ball.vx=ball.vy=0;
    }
  }
  private approachPoint(entry:Entry):Point {
    const t=Math.max(0,Math.min(1,1+entry.distance/entry.approach));
    const head=this.path[0];
    return {x:entry.origin.x+(head.x-entry.origin.x)*t,
            y:entry.origin.y+(head.y-entry.origin.y)*t};
  }
  private pointAt(distance:number):Point {
    for(let i=1;i<this.path.length;i++) if(distance <= this.lengths[i]) {
      const a=this.path[i-1],b=this.path[i];
      const t=(distance-this.lengths[i-1])/(this.lengths[i]-this.lengths[i-1]);
      return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
    }
    return this.path[this.path.length-1];
  }
  public draw():void {
    this.sync();
    const signature=this.signature+':'+this.board.spacing;
    if(signature===this.drawing) return;
    this.drawing=signature;
    const g=this.view; g.clear(); if(!this.path.length)return;
    const scale=this.board.spacing/SPACING;
    const point=(p:Point):Point=>({x:this.board.xForColumn(p.x/SPACING),y:this.board.yForRow(p.y/SPACING)});
    const stroke=(points:Point[],width:number,color:number):void=>{
      g.lineStyle(width*scale,color,1);
      points.forEach((p,i)=>{const v=point(p);if(i)g.lineTo(v.x,v.y);else g.moveTo(v.x,v.y);});
    };
    // Merge below both levers; no collector rail crosses a lever's sweep.
    const head=this.path[0];
    for(const sign of [-1,1]) {
      const mouth=[{x:(this.column+sign*4.1)*SPACING,y:(this.row+0.65)*SPACING},
        {x:head.x+sign*0.20*SPACING,y:(this.row+1.6)*SPACING}];
      stroke(mouth,5,0xb5bec3);stroke(mouth,2,0xfafafa);
    }
    // Start the visible channel at the angled inlet, rather than above it.
    // The guided centerline still begins earlier inside the open funnel.
    const visiblePath=this.path.map((p,i)=>i===0?{x:p.x,y:(this.row+1.6)*SPACING}:p);
    stroke(visiblePath,32,0xb5bec3);stroke(visiblePath,26,0xffffff);
    const end=this.path[this.path.length-1];
    stroke([{x:end.x,y:end.y-16},{x:end.x,y:end.y+16}],5,0x7d8d96);
    Renderer.needsUpdate();
  }
}
