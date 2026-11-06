import * as PIXI from 'pixi.js';
import { Board } from './board';
import { Drop } from 'parts/drop';
import { Ball } from 'parts/ball';
import { Part } from 'parts/part';
import { Turnstile } from 'parts/turnstile';
import { PartType } from 'parts/factory';
import { SPACING, BALL_RADIUS } from './constants';
import { Renderer } from 'renderer';
import { RAIL_ROLL_SPEED, RailPoint, railFrame, railPoint } from './rail';
type Point = {c:number,r:number};
type Trip = {drop:Drop,ball:Ball,path:Point[],lengths:number[],distance:number};
type Stroke = {lever:Turnstile,ball:Ball,progress:number,returning:boolean,discharged:boolean};
const PITCH = (BALL_RADIUS*2+0.5)/SPACING;
const CUP = 0.36;
const RELEASE = 0.55;
// Stock, rotating cups and the upper return feed are guided; playable ramp
// and bit dynamics are unchanged. One accepted press reserves one marble.
export class SupplyGuide {
  constructor(private board:Board) { }
  public readonly view = new PIXI.Graphics();
  private supplies:Drop[] = [];
  private parked:Map<Drop,Ball[]> = new Map();
  private trips:Map<Ball,Trip> = new Map();
  private strokes:Map<Drop,Stroke> = new Map();
  private feed:Map<Drop,number> = new Map();
  private complete:WeakSet<Ball> = new WeakSet();
  private exitVelocities:Map<Ball,RailPoint> = new Map();
  private signature:string = '';
  private drawing:string = '';
  private overrides:Map<Drop,(lever?:Turnstile)=>boolean> = new Map();
  public has(ball:Ball):boolean {
    if(this.trips.has(ball))return true;
    for(const stroke of this.strokes.values())if(stroke.ball===ball&&!stroke.discharged)return true;
    for(const balls of this.parked.values())if(balls.indexOf(ball)>=0)return true;
    return false;
  }
  public includes(drop:Drop):boolean { return this.supplies.indexOf(drop)>=0; }
  public get active():boolean { return this.supplies.length>0; }
  public disc(drop:Drop):Point {
    return {c:drop.isFlipped?this.board.columnCount-0.55:-0.45,r:drop.row-0.4};
  }
  public progress(drop:Drop):number {
    const stroke=this.strokes.get(drop);
    if(stroke&&!stroke.lever)return stroke.progress;
    let progress=0;
    for(const lever of drop.turnstiles)if(this.board.getPart(lever.column,lever.row)===lever)
      progress=Math.max(progress,Math.min(1,Math.max(0,lever.rotation)));
    return progress;
  }
  public angle(drop:Drop):number { return (drop.isFlipped?-1:1)*this.progress(drop)*Math.PI/2; }
  private cup(drop:Drop,progress:number):Point {
    const p=this.disc(drop),a=progress*Math.PI/2,sign=drop.isFlipped?-1:1;
    return {c:p.c+sign*CUP*Math.cos(a),r:p.r+CUP*Math.sin(a)};
  }
  // The drawing and marble-center path share these exact rail endpoints.
  public feedRail(drop:Drop):{start:RailPoint,end:RailPoint} {
    const p=this.disc(drop),sign=drop.isFlipped?-1:1;
    return {start:{x:p.c*SPACING,y:(drop.row+0.12)*SPACING},
      end:{x:(drop.column+sign*0.7)*SPACING,y:(drop.row+0.5)*SPACING}};
  }
  public takeExitVelocity(ball:Ball):RailPoint {
    const velocity=this.exitVelocities.get(ball);this.exitVelocities.delete(ball);return velocity;
  }
  public buttonAt(c:number,r:number):Drop {
    this.sync();
    for(const drop of this.supplies){const p=this.disc(drop);
      if(Math.pow(c-p.c,2)+Math.pow(r-p.r,2)<=0.52*0.52)return drop;}
    return null;
  }
  public supplyAt(c:number,r:number):Drop {
    this.sync();const center=(this.board.columnCount-1)/2;
    for(const drop of this.supplies)if(r>=drop.row-1.5&&r<=drop.row+0.12&&
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
    this.trips.delete(ball);this.complete.delete(ball);this.exitVelocities.delete(ball);
    for(const stroke of this.strokes.values())if(stroke.ball===ball)stroke.ball=null;
    for(const [drop,balls] of this.parked)this.parked.set(drop,balls.filter(b=>b!==ball));
  }
  public clear():void {
    this.parked.clear();this.trips.clear();this.strokes.clear();this.feed.clear();this.exitVelocities.clear();this.complete=new WeakSet();this.drawing='';
  }
  public sync():void {
    const eligible:Drop[]=[];
    if(this.board.drops)
      for(const drop of this.board.drops)if(drop.isLocked&&this.board.getPart(drop.column,drop.row)===drop)eligible.push(drop);
    if(eligible.length!==2 || eligible[0].isFlipped===eligible[1].isFlipped || eligible[0].row!==eligible[1].row)eligible.length=0;
    const signature=eligible.map(d=>d.column+','+d.row+','+d.isFlipped).join(';')+':'+this.board.columnCount;
    if(signature!==this.signature || eligible.length!==this.supplies.length ||
       eligible.some((drop,i)=>drop!==this.supplies[i])){
      for(const [drop,override] of this.overrides)if(drop.releaseOverride===override)drop.releaseOverride=null;
      this.overrides.clear();this.clear();this.supplies=eligible;this.signature=signature;
      for(const drop of eligible){const override=(lever?:Turnstile)=>this.release(drop,lever);drop.releaseOverride=override;this.overrides.set(drop,override);}
    }
    for(const drop of this.supplies){
      let balls=(this.parked.get(drop)||[]).filter(b=>this.board.balls.has(b)&&b.drop===drop);
      for(const ball of drop.balls)if(this.board.balls.has(ball)&&!ball.released&&
          !ball.hasActuatedLever&&!this.complete.has(ball)&&!this.trips.has(ball)&&
          ball.row<=drop.row+0.5&&balls.indexOf(ball)<0)balls.push(ball);
      this.parked.set(drop,balls);
      const p=this.disc(drop),sign=drop.isFlipped?-1:1,stroke=this.strokes.get(drop);
      const offset=stroke?1:(this.feed.get(drop)||0),progress=this.progress(drop);
      balls.forEach((ball,i)=>{
        const index=i+offset;
        const q=index===0?this.cup(drop,progress):{c:p.c+sign*(CUP+index*PITCH),r:p.r-index*PITCH*0.52/Math.abs((this.board.columnCount-1)/2-(p.c+sign*0.43))};
        if(ball.column!==q.c||ball.row!==q.r)this.board.layoutPart(ball,q.c,q.r);
        ball.vx=ball.vy=0;
      });
      if(stroke&&stroke.ball&&!stroke.discharged){
        const q=this.cup(drop,progress);this.board.layoutPart(stroke.ball,q.c,q.r);stroke.ball.vx=stroke.ball.vy=0;
      }
    }
  }
  private release(drop:Drop,lever?:Turnstile):boolean {
    this.sync();
    if(this.strokes.has(drop)||(this.feed.get(drop)||0)>0)return false;
    const balls=this.parked.get(drop);if(!balls||!balls.length)return false;
    const ball=balls.shift();ball.released=true;
    this.strokes.set(drop,{lever:lever||null,ball:ball,progress:lever?Math.min(1,Math.max(0,lever.rotation)):0,returning:false,discharged:false});
    this.sync();this.draw();Renderer.needsUpdate();return true;
  }
  private discharge(drop:Drop,stroke:Stroke):void {
    const ball=stroke.ball;if(!ball||!this.board.balls.has(ball)){stroke.discharged=true;return;}
    const rail=this.feedRail(drop),frame=railFrame(rail.start,rail.end);
    const clearance=BALL_RADIUS+0.085*SPACING/2+0.5;
    const along=Math.max(0,Math.min(frame.length,
      (ball.column*SPACING-frame.start.x)*frame.tangent.x+(ball.row*SPACING-frame.start.y)*frame.tangent.y));
    const landing=railPoint(frame,along,clearance),end=railPoint(frame,frame.length,clearance);
    // Roll over the rail's end before handing the marble back to free physics.
    const exit={x:end.x+frame.tangent.x*BALL_RADIUS,y:end.y+frame.tangent.y*BALL_RADIUS+1.5};
    const path:Point[]=[{c:ball.column,r:ball.row}];
    for(const point of [landing,end,exit])path.push({c:point.x/SPACING,r:point.y/SPACING});
    const lengths=[0];
    for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+Math.sqrt(Math.pow(path[i].c-path[i-1].c,2)+Math.pow(path[i].r-path[i-1].r,2))*SPACING);
    this.trips.set(ball,{drop:drop,ball:ball,path:path,lengths:lengths,distance:0});stroke.discharged=true;
  }
  public advance(steps:number):void {
    if(!(steps>0))return;
    this.sync();
    for(const drop of this.supplies){
      const stroke=this.strokes.get(drop);
      if(stroke){
        if(!stroke.lever){
          stroke.progress=Math.max(0,Math.min(1,stroke.progress+(stroke.returning?-1:1)*0.06*steps));
          if(stroke.progress>=1)stroke.returning=true;
        }else stroke.progress=this.progress(drop);
        if(!stroke.discharged&&stroke.progress>=RELEASE){
          const q=this.cup(drop,stroke.progress);
          if(stroke.ball)this.board.layoutPart(stroke.ball,q.c,q.r);
          this.discharge(drop,stroke);
        }
        if(stroke.discharged&&stroke.progress<=0.015&&(stroke.lever||stroke.returning)){
          this.strokes.delete(drop);this.feed.set(drop,1);
        }
      }else if((this.feed.get(drop)||0)>0)this.feed.set(drop,Math.max(0,this.feed.get(drop)-0.08*steps));
    }
    const ahead:Map<Drop,number>=new Map();
    for(const [ball,trip] of Array.from(this.trips.entries())){
      if(!this.board.balls.has(ball)){this.trips.delete(ball);continue;}
      const last=trip.lengths[trip.lengths.length-1];
      let next=trip.distance+RAIL_ROLL_SPEED*steps;
      if(ahead.has(trip.drop))next=Math.min(next,last-ahead.get(trip.drop)-PITCH*SPACING);
      trip.distance=Math.max(trip.distance,Math.min(last,next));ahead.set(trip.drop,last-trip.distance);
      let p=trip.path[trip.path.length-1];
      if(trip.distance<last)for(let i=1;i<trip.path.length;i++)if(trip.distance<=trip.lengths[i]){
        const t=(trip.distance-trip.lengths[i-1])/(trip.lengths[i]-trip.lengths[i-1]);
        p={c:trip.path[i-1].c+(trip.path[i].c-trip.path[i-1].c)*t,r:trip.path[i-1].r+(trip.path[i].r-trip.path[i-1].r)*t};break;
      }
      this.board.layoutPart(ball,p.c,p.r);ball.vx=ball.vy=0;Renderer.needsUpdate();
      if(trip.distance>=last){
        const previous=trip.path[trip.path.length-2],end=trip.path[trip.path.length-1];
        const dx=end.c-previous.c,dy=end.r-previous.r,length=Math.sqrt(dx*dx+dy*dy);
        this.exitVelocities.set(ball,{x:RAIL_ROLL_SPEED*dx/length,y:RAIL_ROLL_SPEED*dy/length});
        this.trips.delete(ball);this.complete.add(ball);ball.released=true;
      }
    }
    this.sync();this.draw();
  }
  public draw():void {
    this.sync();const signature=this.signature+':'+this.board.spacing+':'+this.supplies.map(d=>this.progress(d)).join(',');
    if(signature===this.drawing)return;this.drawing=signature;
    const g=this.view;g.clear();if(!this.active)return;
    const s=this.board.spacing;
    const stroke=(path:Point[],width:number,color:number):void=>{
      g.lineStyle(width*s,color,1);path.forEach((p,i)=>{const x=this.board.xForColumn(p.c),y=this.board.yForRow(p.r);if(i)g.lineTo(x,y);else g.moveTo(x,y);});
    };
    const center=(this.board.columnCount-1)/2;
    for(const drop of this.supplies){
      const p=this.disc(drop),sign=drop.isFlipped?-1:1,x=this.board.xForColumn(p.c),y=this.board.yForRow(p.r),a=this.progress(drop)*Math.PI/2;
      const feed=this.feedRail(drop);
      for(const path of [[{c:center,r:drop.row-0.78},{c:p.c+sign*0.43,r:p.r+0.14}],
        [{c:feed.start.x/SPACING,r:feed.start.y/SPACING},{c:feed.end.x/SPACING,r:feed.end.y/SPACING}],
        [{c:center,r:drop.row-1.21},{c:p.c,r:drop.row-0.92}]]){
        stroke(path,0.085,0xb7bec1);stroke(path,0.045,0xfafaf8);
      }
      g.lineStyle(0.035*s,0xc1c6c8,1);g.beginFill(0xfdfdfb);g.drawCircle(x,y,0.50*s);g.endFill();
      // A concave outline leaves an actual cupped opening in the disk.
      const poly:number[]=[];
      const add=(u:number,v:number):void=>{poly.push(x+sign*(u*Math.cos(a)-v*Math.sin(a))*s,y+(u*Math.sin(a)+v*Math.cos(a))*s);};
      const cut=Math.asin(0.17/0.43);
      for(let i=0;i<=56;i++){const t=cut+(Math.PI*2-2*cut)*i/56;add(0.43*Math.cos(t),0.43*Math.sin(t));}
      for(let i=0;i<=24;i++){const t=-Math.PI/2-Math.PI*i/24;add(CUP+0.17*Math.cos(t),0.17*Math.sin(t));}
      g.lineStyle(0.018*s,0x151719,1);g.beginFill(0x25292b);g.drawPolygon(poly);g.endFill();
      g.lineStyle(0.012*s,0xaeb5b8,1);g.beginFill(0xf5f5f2);g.drawCircle(x,y,0.055*s);g.endFill();
    }
    Renderer.needsUpdate();
  }
}
