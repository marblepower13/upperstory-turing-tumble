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
export const LEVER_PIVOT_OFFSET:number = 2.6 * SPACING;
export const LEVER_TIP:number = LEVER_PIVOT_OFFSET + (0.45 * SPACING);
export const LEVER_REST_ANGLE:number = -0.035;
export const LEVER_TRAVEL:number = 0.34;

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
      g.moveTo(-24, -7);
      g.lineTo(LEVER_TIP - 10, -5);
      g.quadraticCurveTo(LEVER_TIP + 2, -5, LEVER_TIP + 2, 0);
      g.quadraticCurveTo(LEVER_TIP + 2, 5, LEVER_TIP - 10, 5);
      g.lineTo(-24, 7);
      g.closePath();
      g.endFill();
      g.beginFill(0x222628);
      g.drawCircle(-24, 0, 17);
      g.endFill();
      g.lineStyle(1, 0x687075, 0.7);
      g.moveTo(18, -3); g.lineTo(LEVER_TIP - 12, -2);
    }
    if ((layer === Layer.FRONT) || (layer === Layer.SCHEMATIC) ||
        (layer === Layer.SCHEMATIC_2) || (layer === Layer.SCHEMATIC_4) ||
        (layer === Layer.TOOL)) {
      g.lineStyle(1, 0x888e91, 1);
      g.beginFill(0xe5e7e8); g.drawCircle(0, 0, 4); g.endFill();
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
      cap.beginFill(this._centerBall.color); cap.drawCircle(-24, 0, 9); cap.endFill();
      cap.lineStyle(0); cap.beginFill(0xffffff, 0.6);
      cap.drawCircle(-27, -3, 2.5); cap.endFill();
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

  public get hue():number { return(this._centerBall.hue); }
  public set hue(v:number) { this._centerBall.hue = v; this._updateSprites(); }

  // Count each marble once as it passes the receiving end. Release timing
  // follows the marble crossing, not how far a light impact rotates the arm.
  private _passed:WeakSet<Ball> = new WeakSet();
  public registerPass(ball:Ball):void {
    if (this._passed.has(ball)) return;
    this._passed.add(ball);
    if (this.drop) this.drop.releaseBall();
  }

  public resetWithoutRelease():void {
    Animator.current.stopAnimating(this, 'rotation');
    this._schematicPulse = true;
    this.rotation = 0;
    this._schematicPulse = false;
  }

  // Schematic routing has no rigid-body contact. Animate one tipping cycle
  // and release once when the marble enters, without a second return event.
  private _schematicPulse:boolean = false;
  public pulse(speed:number, release:boolean=true):void {
    if (this._schematicPulse) return;
    this._schematicPulse = true;
    if (release && this.drop) this.drop.releaseBall();
    const duration = 0.12 / Math.max(0.25, speed);
    Animator.current.animate(this, 'rotation', this.rotation, 1, duration, () => {
      Animator.current.animate(this, 'rotation', 1, 0, duration, () => {
        this._schematicPulse = false;
      });
    });
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
