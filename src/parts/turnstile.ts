import * as PIXI from 'pixi.js';
import { Part, Layer } from './part';
import { PartType } from './factory';
import { Ball } from './ball';
import { Drop } from './drop';
import { PART_SIZE, SPACING } from 'board/constants';
import { Renderer } from 'renderer';
import { Animator } from 'ui/animator';

// Retain the serialized Turnstile type so existing board links still load.
// Geometry and motion now represent one pivoting release lever, not a rotor.
export const LEVER_PIVOT_OFFSET:number = 1.0 * SPACING;
export const LEVER_TIP:number = LEVER_PIVOT_OFFSET + (0.54 * SPACING);
export const LEVER_REST_ANGLE:number = -0.09;
export const LEVER_TRAVEL:number = 0.33;

// Raised outer rim catches outward-rolling marbles. Shared with the collider.
export const LEVER_OUTER_END:number = -40 - 1.6 * SPACING;
export const LEVER_RIM_INNER:number = -32 - 1.6 * SPACING;
export const LEVER_RIM_TOP:number = -36;

export const LEVER_COUNTERWEIGHT:number = -24 - 1.6 * SPACING;

export class Turnstile extends Part {
  public get canRotate():boolean { return(true); }
  public get canMirror():boolean { return(false); }
  public get canFlip():boolean { return(true); }
  public get type():PartType { return(PartType.TURNSTILE); }

  public get drop():Drop { return(this._drop); }
  public set drop(newDrop:Drop) {
    if (newDrop === this.drop) return;
    if (this._drop) this._drop.turnstiles.delete(this);
    this._drop = newDrop;
    if (this._drop) {
      this._drop.turnstiles.add(this);
      this.hue = this._drop.hue;
    }
  }
  private _drop:Drop;
  private _centerBall:Ball = new Ball(this.textures);
  private _caps:Map<Layer, PIXI.Graphics> = new Map();

  // Draw vectors directly so the new lever stays crisp at every zoom and
  // does not require rebuilding the original artwork atlas.
  protected _initSprite(layer:Layer):PIXI.Sprite {
    if ((layer !== Layer.MID) && (layer !== Layer.FRONT) &&
        (layer !== Layer.SCHEMATIC) && (layer !== Layer.SCHEMATIC_2) &&
        (layer !== Layer.SCHEMATIC_4) && (layer !== Layer.TOOL)) return(null);
    const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    const g = new PIXI.Graphics();
    sprite.addChild(g);
    if (layer !== Layer.FRONT) {
      g.lineStyle(1.5, 0x111619, 1);
      g.beginFill(0x282c2e);
      g.moveTo(LEVER_COUNTERWEIGHT+15, -6);
      g.lineTo(LEVER_TIP-38, -6);
      g.quadraticCurveTo(LEVER_TIP-30, -6, LEVER_TIP-25, -10);
      g.lineTo(LEVER_TIP-14, -10);
      // The widened receiving heel tapers into one short, straight nose.
      g.quadraticCurveTo(LEVER_TIP-12, -4, LEVER_TIP-7, -4);
      g.lineTo(LEVER_TIP+2, -4);g.lineTo(LEVER_TIP+2, 4);
      g.lineTo(LEVER_TIP-7, 4);
      g.quadraticCurveTo(LEVER_TIP-12, 4, LEVER_TIP-14, 10);
      g.lineTo(LEVER_TIP-25, 10);
      g.quadraticCurveTo(LEVER_TIP-30, 6, LEVER_TIP-38, 6);
      g.lineTo(LEVER_COUNTERWEIGHT+15, 6);g.closePath();g.endFill();
      // The outer collision guard remains in PartBody but has no artwork.
      g.lineStyle(1.5,0x111619,1);g.beginFill(0x222628);
      g.drawCircle(LEVER_COUNTERWEIGHT,0,24);g.endFill();
      g.lineStyle(1,0x5b6266,1);g.drawCircle(LEVER_COUNTERWEIGHT,0,19);
      g.lineStyle(0);g.beginFill(0x0b0d0f);
      g.drawCircle(LEVER_COUNTERWEIGHT+60,0,3);
      g.drawRoundedRect(-7,-8,14,16,2);g.endFill();
      g.lineStyle(1,0x565d61,0.8);
      g.moveTo(LEVER_COUNTERWEIGHT+29,-3);g.lineTo(LEVER_TIP-45,-2);
    }
    if ((layer === Layer.FRONT) || (layer === Layer.SCHEMATIC) ||
        (layer === Layer.SCHEMATIC_2) || (layer === Layer.SCHEMATIC_4) ||
        (layer === Layer.TOOL)) {
      g.lineStyle(1, 0x888e91, 1);
      g.beginFill(0xe5e7e8); g.drawCircle(0, 0, 4.5); g.endFill();
      const cap = new PIXI.Graphics();
      this._caps.set(layer, cap);
      sprite.addChild(cap);
    }
    return(sprite);
  }

  protected _updateSprite(layer:Layer):void {
    const sprite = this.getSpriteForLayer(layer);
    if (!sprite) return;
    const cap = this._caps.get(layer);
    if (cap) {
      cap.clear();
      cap.lineStyle(1.5, 0x10171c, 1);
      cap.beginFill(this._centerBall.color); cap.drawCircle(LEVER_COUNTERWEIGHT, 0, 9); cap.endFill();
      cap.lineStyle(0); cap.beginFill(0xffffff, 0.6);
      cap.drawCircle(LEVER_COUNTERWEIGHT-3, -3, 2.5); cap.endFill();
    }
    const sign = this.isFlipped ? -1 : 1;
    const scale = this.size / PART_SIZE;
    sprite.scale.set(sign * scale, scale);
    sprite.rotation = this.angleForRotation(this.rotation);
    sprite.position.set(this.x - (sign * LEVER_PIVOT_OFFSET * scale), this.y);
    sprite.visible = this.visible;
    sprite.alpha = this.alpha;
    Renderer.needsUpdate();
  }

  // Hit the visible rigid lever, including its distant counterweight end.
  public hitTest(column:number,row:number):boolean {
    const sign=this.isFlipped?-1:1,a=this.angleForRotation(this.rotation);
    const dx=(column-this.column)*SPACING+sign*LEVER_PIVOT_OFFSET;
    const dy=(row-this.row)*SPACING;
    const x=sign*(dx*Math.cos(a)+dy*Math.sin(a));
    const y=-dx*Math.sin(a)+dy*Math.cos(a),margin=5;
    if(Math.pow(x-LEVER_COUNTERWEIGHT,2)+y*y<=Math.pow(24+margin,2))return true;
    return x>=LEVER_COUNTERWEIGHT+15-margin&&x<=LEVER_TIP+2+margin&&Math.abs(y)<=11+margin;
  }

  public get hue():number { return(this._centerBall.hue); }
  public set hue(v:number) { this._centerBall.hue = v; this._updateSprites(); }

  // Advance once per marble after a verified lever actuation. Sharing the
  // marker across both arms prevents a central contact releasing two marbles.
  private _passed:WeakSet<Ball> = new WeakSet();
  public registerPass(ball:Ball):boolean {
    if (ball.hasActuatedLever || this._passed.has(ball)) return false;
    ball.hasActuatedLever = true;
    this._passed.add(ball);
    if (this.drop) this.drop.releaseBall(this);
    return true;
  }

  public resetWithoutRelease():void {
    Animator.current.stopAnimating(this, 'rotation');
    this._schematicPulse = false;this._pulseReturning=false;this._pulseHold=0;this._pulseBalls.clear();this.rotation=0;
  }

  // Pulses use simulation steps, so Pause freezes both ends of the linkage.
  private _schematicPulse:boolean = false;
  private _pulseReturning:boolean = false;
  private _pulseHold:number = 0;
  private _pulseBalls:Set<Ball> = new Set();
  public get isPulsing():boolean { return this._schematicPulse; }
  public pulse(speed:number, release:boolean=true,ball?:Ball):void {
    if(this._schematicPulse){if(ball)this._pulseBalls.add(ball);return;}
    this._pulseBalls.clear();if(ball)this._pulseBalls.add(ball);
    this._schematicPulse=true;this._pulseReturning=false;this._pulseHold=0;
    if(release&&this.drop)this.drop.releaseBall(this);
  }
  public advancePulse(steps:number):void {
    if(!this._schematicPulse||!(steps>0))return;
    if(this._pulseHold>0){
      this._pulseHold=Math.max(0,this._pulseHold-steps);
      if(this._pulseHold===0){
        const occupied=Array.from(this._pulseBalls).some(ball=>
          ball.row<=this.row+0.65&&ball.row>=this.row-1&&Math.abs(ball.column-this.column)<5);
        if(occupied)this._pulseHold=1;
        else {this._pulseReturning=true;this._pulseBalls.clear();}
      }
      return;
    }
    this.rotation=Math.max(0,Math.min(1,this.rotation+(this._pulseReturning?-1:1)*0.06*steps));
    // Keep the exit fully open while gravity carries the marble clear.
    if(this.rotation>=1&&!this._pulseReturning)this._pulseHold=18;
    if(this._pulseReturning&&this.rotation<=0)this._schematicPulse=false;
  }

  public angleForRotation(r:number, layer:Layer=Layer.MID):number {
    return((this.isFlipped ? -1 : 1) *
      (LEVER_REST_ANGLE + (Math.min(1, Math.max(0, r)) * LEVER_TRAVEL)));
  }
  public rotationForAngle(a:number):number {
    return(((this.isFlipped ? -a : a) - LEVER_REST_ANGLE) / LEVER_TRAVEL);
  }
  public get biasRotation():boolean { return(false); }
  public get restingRotation():number { return(0); }
}
