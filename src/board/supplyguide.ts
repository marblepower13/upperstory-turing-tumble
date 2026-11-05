import * as PIXI from 'pixi.js';
import { Board } from './board';
import { Drop } from 'parts/drop';
import { Ball } from 'parts/ball';
import { Part } from 'parts/part';
import { PartType } from 'parts/factory';
import { SPACING, BALL_RADIUS } from './constants';
import { Renderer } from 'renderer';
type Point = {c:number,r:number};
type Trip = {drop:Drop,ball:Ball,path:Point[],lengths:number[],distance:number};
const PITCH = (BALL_RADIUS*2+0.5)/SPACING;
// The upper rails feed outward into the releaser, then return inward to the
// original first peg. The board's ramp/counterweight physics are unchanged.
export class SupplyGuide {
  constructor(private board:Board) { }
  public readonly view = new PIXI.Graphics();
  private supplies:Drop[] = [];
  private parked:Map<Drop,Ball[]> = new Map();
  private trips:Map<Ball,Trip> = new Map();
  private complete:WeakSet<Ball> = new WeakSet();
  private signature:string = '';
  private drawing:string = '';
  private overrides:Map<Drop,()=>boolean> = new Map();
  public has(ball:Ball):boolean {
    if(this.trips.has(ball))return true;
    for(const balls of this.parked.values())if(balls.indexOf(ball)>=0)return true;
    return false;
  }
  public includes(drop:Drop):boolean { return this.supplies.indexOf(drop)>=0; }
  public get active():boolean { return this.supplies.length>0; }
  public disc(drop:Drop):Point {
    return {c:drop.isFlipped?this.board.columnCount-0.55:-0.45,r:drop.row-0.4};
  }
  public buttonAt(c:number,r:number):Drop {
    this.sync();
    for(const drop of this.supplies){const p=this.disc(drop);
      if(Math.pow(c-p.c,2)+Math.pow(r-p.r,2)<=0.52*0.52)return drop;}
    return null;
  }
  public supplyAt(c:number,r:number):Drop {
    this.sync();const center=(this.board.columnCount-1)/2;
    for(const drop of this.supplies)if(r>=drop.row-1.5&&r<=drop.row-0.2&&
      (drop.isFlipped?c>=center&&c<=this.board.columnCount-0.15:c>=-0.85&&c<center))return drop;
    return null;
  }
  public replaces(part:Part):boolean {
    if(!this.active||!part.isLocked)return false;
    if(part instanceof Drop)return this.includes(part);
    return part.row<=this.supplies[0].row&&
      (part.type===PartType.SLOPE||part.type===PartType.SIDE);
  }
  public remove(ball:Ball):void {
    this.trips.delete(ball);this.complete.delete(ball);
    for(const [drop,balls] of this.parked)this.parked.set(drop,balls.filter(b=>b!==ball));
  }
  public clear():void { this.parked.clear();this.trips.clear();this.complete=new WeakSet(); }
  public sync():void {
    const eligible:Drop[]=[];
    if(this.board.drops)
      for(const drop of this.board.drops)if(drop.isLocked&&this.board.getPart(drop.column,drop.row)===drop)eligible.push(drop);
    // The top supplies remain usable even when a custom board has no bottom
    // levers. Only the matched standard pair uses the guided supply layout.
    if(eligible.length!==2 || eligible[0].isFlipped===eligible[1].isFlipped ||
       eligible[0].row!==eligible[1].row)eligible.length=0;
    const signature=eligible.map(d=>d.column+','+d.row+','+d.isFlipped).join(';')+':'+this.board.columnCount;
    if(signature!==this.signature){
      for(const [drop,override] of this.overrides)if(drop.releaseOverride===override)drop.releaseOverride=null;
      this.overrides.clear();this.clear();this.supplies=eligible;this.signature=signature;this.drawing='';
      for(const drop of eligible){const override=()=>this.release(drop);drop.releaseOverride=override;this.overrides.set(drop,override);}
    }
    for(const drop of this.supplies){
      let balls=(this.parked.get(drop)||[]).filter(b=>this.board.balls.has(b)&&b.drop===drop);
      for(const ball of drop.balls)if(this.board.balls.has(ball)&&!ball.released&&
          !ball.hasActuatedLever&&!this.complete.has(ball)&&!this.trips.has(ball)&&
          ball.row<=drop.row+0.5&&balls.indexOf(ball)<0)balls.push(ball);
      this.parked.set(drop,balls);
      const sign=drop.isFlipped?-1:1;
      const first=drop.isFlipped?this.board.columnCount-0.95:-0.05;
      let offset=0;
      for(const trip of this.trips.values())if(trip.drop===drop && trip.ball.row<drop.row-0.3)
        offset=Math.max(offset,sign*(trip.ball.column-first)/PITCH+1);
      balls.forEach((ball,i)=>{
        const index=i+offset;
        const c=first+sign*index*PITCH,r=drop.row-0.75-index*0.018;
        if(ball.column!==c||ball.row!==r)this.board.layoutPart(ball,c,r);
        ball.vx=ball.vy=0;
      });
    }
  }
  private release(drop:Drop):boolean {
    this.sync();const balls=this.parked.get(drop);if(!balls||!balls.length)return false;
    const ball=balls.shift(),p=this.disc(drop),sign=drop.isFlipped?-1:1;
    const path=[{c:ball.column,r:ball.row},{c:p.c+sign*0.08,r:p.r+0.12},
      {c:p.c+sign*0.22,r:drop.row+0.08},{c:drop.column+sign*0.65,r:drop.row+0.35}];
    const lengths=[0];
    for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+Math.sqrt(Math.pow(path[i].c-path[i-1].c,2)+Math.pow(path[i].r-path[i-1].r,2))*SPACING);
    this.trips.set(ball,{drop:drop,ball:ball,path:path,lengths:lengths,distance:0});
    ball.released=true;this.drawing='';this.sync();Renderer.needsUpdate();return true;
  }
  public advance(steps:number):void {
    this.sync();
    const ahead:Map<Drop,number>=new Map();
    for(const [ball,trip] of Array.from(this.trips.entries())){
      if(!this.board.balls.has(ball)){this.trips.delete(ball);continue;}
      const last=trip.lengths[trip.lengths.length-1];
      let next=trip.distance+3*steps;
      if(ahead.has(trip.drop))next=Math.min(next,last-ahead.get(trip.drop)-PITCH*SPACING);
      trip.distance=Math.max(trip.distance,Math.min(last,next));
      ahead.set(trip.drop,last-trip.distance);
      let p=trip.path[trip.path.length-1];
      if(trip.distance<last)for(let i=1;i<trip.path.length;i++)if(trip.distance<=trip.lengths[i]){
        const t=(trip.distance-trip.lengths[i-1])/(trip.lengths[i]-trip.lengths[i-1]);
        p={c:trip.path[i-1].c+(trip.path[i].c-trip.path[i-1].c)*t,r:trip.path[i-1].r+(trip.path[i].r-trip.path[i-1].r)*t};break;
      }
      this.board.layoutPart(ball,p.c,p.r);ball.vx=ball.vy=0;Renderer.needsUpdate();
      if(trip.distance>=last){this.trips.delete(ball);this.complete.add(ball);ball.released=true;}
    }
    this.sync();
  }
  public draw():void {
    this.sync();const signature=this.signature+':'+this.board.spacing;
    if(signature===this.drawing)return;this.drawing=signature;
    const g=this.view;g.clear();if(!this.active)return;
    const s=this.board.spacing;
    const stroke=(path:Point[],width:number,color:number):void=>{
      g.lineStyle(width*s,color,1);path.forEach((p,i)=>{const x=this.board.xForColumn(p.c),y=this.board.yForRow(p.r);if(i)g.lineTo(x,y);else g.moveTo(x,y);});
    };
    const center=(this.board.columnCount-1)/2;
    for(const drop of this.supplies){
      const p=this.disc(drop),sign=drop.isFlipped?-1:1,x=this.board.xForColumn(p.c),y=this.board.yForRow(p.r);
      for(const path of [[{c:center,r:drop.row-0.95},{c:p.c+sign*0.1,r:drop.row-0.57}],
        [{c:p.c,r:drop.row+0.12},{c:drop.column+sign*0.7,r:drop.row+0.5}],
        [{c:center,r:drop.row-1.38},{c:p.c,r:drop.row-0.92}]]){
        stroke(path,0.085,0xb7bec1);stroke(path,0.045,0xfafaf8);
      }
      g.lineStyle(0.035*s,0xc1c6c8,1);g.beginFill(0xfdfdfb);g.drawCircle(x,y,0.50*s);g.endFill();
      g.lineStyle(0.018*s,0x151719,1);g.beginFill(0x25292b);g.drawCircle(x,y,0.43*s);g.endFill();
      g.lineStyle(0);g.beginFill(0x080a0b);g.drawCircle(x,y,0.075*s);g.endFill();
      g.beginFill(0xf4f4f1);g.drawCircle(x-sign*0.38*s,y-0.06*s,0.13*s);g.endFill();
      g.lineStyle(0.018*s,0x6b7275,1);g.moveTo(x+sign*0.20*s,y-0.05*s);g.lineTo(x+sign*0.32*s,y-0.05*s);
    }
    Renderer.needsUpdate();
  }
}
