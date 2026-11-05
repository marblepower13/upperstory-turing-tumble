import * as PIXI from 'pixi.js';

import { Engine, Composite, World, Constraint, Body, Bodies, Vector, 
         Grid, Vertices } from 'matter-js';
import { IBallRouter } from './router';
import { Board } from './board';
import { Renderer } from 'renderer';
import { Part } from 'parts/part';
import { Ball } from 'parts/ball';
import { Colors, Alphas } from 'ui/config';
import { Gearbit, GearBase } from 'parts/gearbit';
import { PartBody, PartBodyFactory } from 'parts/partbody';

import { SPACING } from './constants';
import { Animator } from 'ui/animator';
import { PartType } from 'parts/factory';
import { Turnstile } from 'parts/turnstile';
import { centerBlocks, CENTER_BLOCK_VERTICES } from './centerblock';

export type PartBallContact = {
  ballPartBody: PartBody,
  tangent: Vector
};

export type ContactMap = Map<PartBody,Set<PartBallContact>>;

export class PhysicalBallRouter implements IBallRouter {

  constructor(public readonly board:Board) {
    this.engine = Engine.create();
    this.balls = this.board.balls;
    // make walls to catch stray balls
    this._createWalls();
    // capture initial board state
    this.beforeUpdate();
  }
  public readonly engine:Engine;
  public balls:Set<Ball>;

  public onBoardSizeChanged():void {
    // update the walls around the board
    this._updateWalls();
    // re-render the wireframe
    this.renderWireframe();
    // capture changes to board state
    this.beforeUpdate();
  }

  public partBodyFactory:PartBodyFactory = new PartBodyFactory();

  // UPDATING *****************************************************************

  public update(speed:number, correction:number):void {
    if (! (speed > 0)) return;
    // Keep every physics step identical. Fractional playback speeds spread
    // whole steps across frames instead of changing gravity/contact dynamics.
    this._stepBudget += speed * 2;
    const iterations = Math.floor(this._stepBudget + 1e-9);
    this._stepBudget = Math.max(0, this._stepBudget - iterations);
    this.engine.timing.timeScale = 1;
    for (let i:number = 0; i < iterations; i++) {
      this.beforeUpdate();
      Engine.update(this.engine);
      this.afterUpdate();
      this.board.outputRegister.capture();
      for (const ball of this.board.outputRegister.sequence) {
        this.removePart(ball); this._ballNeighbors.delete(ball);
      }
      this.board.outputRegister.advance(1);
      this.board.supplyGuide.advance(1);
      GearBase.update();
    }
  }

  private _stepBudget:number = 0;

  public beforeUpdate():void {
    this.board.outputRegister.sync();
    this.board.supplyGuide.sync();
    const blocksChanged = this._syncCenterBlocks();
    const partsChanged:boolean = 
      this.addNeighborParts(this._boardChangeCounter !== this.board.changeCounter);
    this._boardChangeCounter = this.board.changeCounter;
    for (const partBody of this._parts.values()) {
      partBody.updateBodyFromPart();
    }
    // if parts have been added or removed, update the broadphase grid
    if ((partsChanged || blocksChanged) && (this.engine.broadphase)) {
      Grid.update(this.engine.broadphase, 
        Composite.allBodies(this.engine.world), this.engine, true);
    }
  }
  private _boardChangeCounter:number = -1;
  private _centerBlockBodies:Body[] = [];
  private _centerBlockSignature:string = '';
  private _syncCenterBlocks():boolean {
    const blocks = centerBlocks(this.board);
    const signature = blocks.map(b => b.column + ',' + b.row).join(';');
    if (signature === this._centerBlockSignature) return false;
    this._centerBlockSignature = signature;
    for (const body of this._centerBlockBodies) World.remove(this.engine.world, body);
    this._centerBlockBodies = [];
    for (const block of blocks) {
      const vertices = CENTER_BLOCK_VERTICES.map(v => ({
        x: block.column * SPACING + v.x, y: block.row * SPACING + v.y
      }));
      const center = Vertices.centre(vertices);
      const body = Body.create({vertices: vertices, position: center, isStatic: true,
        label: 'Fixed center block', friction: 0.02, restitution: 0.02});
      this._centerBlockBodies.push(body);
      World.add(this.engine.world, body);
    }
    return true;
  }

  private _deflectCenterContacts():void {
    for (const pair of this.engine.pairs.collisionActive) {
      const a = pair.bodyA.parent || pair.bodyA, b = pair.bodyB.parent || pair.bodyB;
      const block = this._centerBlockBodies.indexOf(a) >= 0 ? a :
        this._centerBlockBodies.indexOf(b) >= 0 ? b : null;
      if (!block) continue;
      const partBody = this._findPartBody(block === a ? pair.bodyB : pair.bodyA);
      if (!partBody || !(partBody.part instanceof Ball)) continue;
      const body = partBody.body, ball = partBody.part as Ball;
      if (body.position.y > block.bounds.min.y + 0.55 * SPACING ||
          Math.abs(body.velocity.x) > 0.4) continue;
      // Resolve the perfectly balanced peak using the approach side. This
      // applies only on actual divider contact and never releases a marble.
      const cx = (block.bounds.min.x + block.bounds.max.x) / 2;
      const from = isNaN(ball.lastDistinctColumn) ? ball.column : ball.lastDistinctColumn;
      let sign = from * SPACING < cx ? -1 : from * SPACING > cx ? 1 :
        (ball.drop && ball.drop.isFlipped ? 1 : -1);
      Body.setVelocity(body, {x: sign * 0.6, y: body.velocity.y});
    }
  }


  public afterUpdate():void {
    this._deflectCenterContacts();
    // determine the set of balls touching each part
    const contacts:ContactMap = this._mapContacts();
    const nearby = this._mapNearby();
    // apply physics corrections
    for (const partBody of this._parts.values()) {
      partBody.cheat(contacts.get(partBody), nearby.get(partBody));
    }
    // transfer part positions
    for (const [ part, partBody ] of this._parts.entries()) {
      partBody.updatePartFromBody();
      if (part.bodyCanMove) {
        this.board.layoutPart(part, part.column, part.row);
      }
    }
    // Only a real marble/blade contact with measurable lever depression
    // advances the machine. Proximity, freefall, and collection do not.
    const actuations:Map<Ball, Turnstile[]> = new Map();
    for (const [partBody, hits] of contacts.entries()) {
      const lever = partBody.part;
      if (!(lever instanceof Turnstile) || lever.rotation <= 0.025) continue;
      for (const hit of hits) {
        const ball = hit.ballPartBody.part as Ball;
        if (!actuations.has(ball)) actuations.set(ball, []);
        actuations.get(ball).push(lever);
      }
    }
    for (const [ball, levers] of actuations.entries()) {
      // The meeting tips may both touch a central marble. Use its approach
      // side to choose one lever; never release from both for the same marble.
      const from = isNaN(ball.lastDistinctColumn) ? ball.column : ball.lastDistinctColumn;
      levers.sort((a, b) => Math.abs(from - a.column) - Math.abs(from - b.column));
      levers[0].registerPass(ball);
    }
    // combine the velocities of connected gear trains
    this.connectGears(contacts);
    // re-render the wireframe if there is one
    this.renderWireframe();
    // re-render the whole display if we're managing parts
    if (this._parts.size > 0) Renderer.needsUpdate();
  }

  // average the angular velocities of all simulated gears with ball contacts,
  //  and transfer it to all simulated gears that are connected
  protected connectGears(contacts:ContactMap):void {
    const activeTrains:Set<Set<GearBase>> = new Set();
    for (const part of this._parts.keys()) {
      if (part instanceof GearBase) activeTrains.add(part.connected);
    }
    for (const train of activeTrains) {
      let av:number = 0;
      let contactCount:number = 0;
      for (const gear of train) {
        // select gears which are simulated and have balls in contact
        const partBody = this._parts.get(gear);
        if ((partBody) && (partBody.body) && (contacts.has(partBody))) {
          av += partBody.body.angularVelocity;
          contactCount++;
        }
      }
      // transfer the average angular velocity to all connected gears
      if (contactCount > 0) {
        av /= contactCount;
        for (const gear of train) {
          const partBody = this._parts.get(gear);
          if ((partBody) && (partBody.body)) {
            Body.setAngularVelocity(partBody.body, av);
          }
        }
      }
    }
  }

  protected _mapContacts():ContactMap {
    const contacts:ContactMap = new Map();
    // Matter separates first-touch contacts from continuing contacts. A quick
    // strike can exist only in collisionStart; omitting it lets the spring
    // reset an outer blade before that strike is handled.
    const continuing = this.engine.pairs.collisionActive;
    const starting = this.engine.pairs.collisionStart;
    for (const pair of continuing.concat(starting)) {
      const partA = this._findPartBody(pair.bodyA);
      if (! partA) continue;
      const partB = this._findPartBody(pair.bodyB);
      if (! partB) continue;
      // Preserve existing contact behavior for other components.
      if (starting.indexOf(pair) >= 0 &&
          !(partA.part instanceof Turnstile) &&
          !(partB.part instanceof Turnstile)) continue;
      if ((partA.type == PartType.BALL) && (partB.type != PartType.BALL)) {
        if (! contacts.has(partB)) contacts.set(partB, new Set());
        contacts.get(partB).add({ ballPartBody: partA, tangent: pair.collision.tangent });
      }
      else if ((partB.type == PartType.BALL) && (partA.type != PartType.BALL)) {
        if (! contacts.has(partA)) contacts.set(partA, new Set());
        contacts.get(partA).add({ ballPartBody: partB, tangent: pair.collision.tangent });
      }
    }
    return(contacts);
  }
  protected _findPartBody(body:Body):PartBody {
    if (this._bodies.has(body)) return(this._bodies.get(body));
    if ((body.parent) && (body.parent !== body)) {
      return(this._findPartBody(body.parent));
    }
    return(null);
  }

  // map parts to the balls in their grid square
  protected _mapNearby():Map<PartBody,Set<PartBody>> {
    const map:Map<PartBody,Set<PartBody>> = new Map;
    for (const ball of this.balls) {
      const ballPartBody = this._parts.get(ball);
      if (! ballPartBody) continue;
      const part = this.board.getPart(
        Math.round(ball.column), Math.round(ball.row));
      const partBody = this._parts.get(part);
      if (! partBody) continue;
      if (! map.has(partBody)) map.set(partBody, new Set());
      map.get(partBody).add(ballPartBody);
    }
    // The outer pivot is offset from the indexed receiving point. Keep the
    // lever depressed only while a marble is passing its inner tip.
    for (const [part, partBody] of this._parts.entries()) {
      if (!(part instanceof Turnstile)) continue;
      map.delete(partBody);
      for (const ball of this.balls) {
        const ballBody = this._parts.get(ball);
        if (!ballBody || !ballBody.body) continue;
        const dc = ((ballBody.body.position.x / SPACING) - part.column) *
          (part.isFlipped ? -1 : 1);
        const dr = (ballBody.body.position.y / SPACING) - part.row;
        if ((dc >= -0.75) && (dc <= 1.3) && (dr >= -0.75) && (dr < 0.8)) {
          if (!map.has(partBody)) map.set(partBody, new Set());
          map.get(partBody).add(ballBody);
        }
      }
    }
    return(map);
  }

  // STATE MANAGEMENT *********************************************************

  private _createWalls():void {
    const options = { isStatic: true };
    this._top = Bodies.rectangle(0, 0, this._wallWidth, this._wallThickness, options);
    this._bottom = Bodies.rectangle(0, 0, this._wallWidth, this._wallThickness, options);
    this._left = Bodies.rectangle(0, 0, this._wallThickness, this._wallHeight, options);
    this._right = Bodies.rectangle(0, 0, this._wallThickness, this._wallHeight, options);
    World.add(this.engine.world, [ this._top, this._right, this._bottom, this._left ]);
  }
  private _wallWidth:number = 16;
  private _wallHeight:number = 16;
  private _wallThickness:number = 16;

  private _updateWalls():void {
    const w:number = ((this.board.columnCount + 3) * SPACING);
    const h:number = ((this.board.rowCount + 5) * SPACING);
    const hw:number = (w - this._wallThickness) / 2;
    const hh:number = (h + this._wallThickness) / 2;
    const cx:number = ((this.board.columnCount - 1) / 2) * SPACING;
    const cy:number = ((this.board.rowCount - 1) / 2) * SPACING;
    Body.setPosition(this._top, { x: cx, y: cy - hh });
    Body.setPosition(this._bottom, { x: cx, y: cy + hh });
    Body.setPosition(this._left, { x: cx - hw, y: cy });
    Body.setPosition(this._right, { x: cx + hw, y: cy });
    const sx = w / this._wallWidth;
    const sy = h / this._wallHeight;
    if (sx != 1.0) {
      Body.scale(this._top, sx, 1.0);
      Body.scale(this._bottom, sx, 1.0);
    }
    if (sy != 1.0) {
      Body.scale(this._left, 1.0, sy);
      Body.scale(this._right, 1.0, sy);
    }
    this._wallWidth = w;
    this._wallHeight = h;
  }
  private _top:Body;
  private _right:Body;
  private _bottom:Body;
  private _left:Body;

  // update the working set of parts to include those that are near balls,
  //  and return whether parts have been added or removed
  protected addNeighborParts(force:boolean = false):boolean {
    // track parts to add and remove
    const addParts:Set<Part> = new Set();
    const removeParts:Set<Part> = new Set(this._parts.keys());
    // update for all balls on the board
    for (const ball of this.balls) {
      if (this.board.outputRegister.has(ball) || this.board.supplyGuide.has(ball)) continue;
      // get the ball's current location
      const column = Math.round(ball.column);
      const row = Math.round(ball.row);
      // remove balls that drop off the board
      if (Math.round(row) > this.board.rowCount) {
        this.board.removeBall(ball);
        continue;
      }
      // don't update for balls in the same locality (unless forced to)
      if ((! force) && (this._ballNeighbors.has(ball)) && 
          (ball.lastColumn === column) && 
          ((ball.lastRow === row) || (ball.lastRow === row + 1))) {
        removeParts.delete(ball);
        for (const part of this._ballNeighbors.get(ball)) {
          removeParts.delete(part);
        }
        continue;
      }
      // add the ball itself
      addParts.add(ball);
      removeParts.delete(ball);
      // reset the list of neighbors
      if (! this._ballNeighbors.has(ball)) {
        this._ballNeighbors.set(ball, new Set());
      }
      const neighbors = this._ballNeighbors.get(ball);
      neighbors.clear();
      // update the neighborhood of parts around the ball
      for (let c:number = -1; c <= 1; c++) {
        for (let r:number = -1; r <= 1; r++) {
          const part = this.board.getPart(column + c, row + r);
          if (! part || this.board.outputRegister.replaces(part) || this.board.supplyGuide.replaces(part)) continue;
          addParts.add(part);
          removeParts.delete(part);
          neighbors.add(part);
        }
      }
      // store the last place we updated the ball
      ball.lastColumn = column;
      ball.lastRow = row;
    }
    // Long lever arms extend beyond their indexed receiving peg. Keep both
    // blades active so an off-center impact cannot pass through an inactive arm.
    for (const drop of (this.board.drops || [])) {
      for (const lever of drop.turnstiles) {
        if (this.board.getPart(lever.column, lever.row) === lever) {
          if (!this._parts.has(lever)) addParts.add(lever);
          removeParts.delete(lever);
        }
      }
    }
    // add new parts and remove old ones
    for (const part of addParts) this.addPart(part);
    for (const part of removeParts) this.removePart(part);
    return((addParts.size > 0) || (removeParts.size > 0));
  }
  private _ballNeighbors:Map<Ball,Set<Part>> = new Map();

  protected addPart(part:Part):void {
    if (this._parts.has(part)) return; // make it idempotent
    const partBody = this.partBodyFactory.make(part);
    this._parts.set(part, partBody);
    partBody.updateBodyFromPart();
    partBody.addToWorld(this.engine.world);
    if (partBody.body) this._bodies.set(partBody.body, partBody);
  }
  protected removePart(part:Part):void {
    if (! this._parts.has(part)) return; // make it idempotent
    const partBody = this._parts.get(part);
    partBody.removeFromWorld(this.engine.world);
    this._bodies.delete(partBody.body);
    this.partBodyFactory.release(partBody);
    this._parts.delete(part);
    this._restoreRestingRotation(part);
  }
  private _parts:Map<Part,PartBody> = new Map();
  private _bodies:Map<Body,PartBody> = new Map();

  // restore the rotation of the part if it has one
  protected _restoreRestingRotation(part:Part):void {
    if (part.rotation === part.restingRotation) return;
    // ensure we don't "restore" a gear that's still connected
    //  to a chain that's being simulated
    if ((part instanceof Gearbit) && (part.connected)) {
      for (const gear of part.connected) {
        if ((gear instanceof Gearbit) && (this._parts.has(gear))) return;
      }
    }
    if (part instanceof Turnstile) {
      part.rotation = 0;
      return;
    }
    if (this.board.speed > 0) {
      Animator.current.animate(part, 'rotation', 
        part.rotation, part.restingRotation, 0.1 / this.board.speed);
    }
  }

  // WIREFRAME PREVIEW ********************************************************

  public get showWireframe():boolean {
    return(this._wireframe ? true : false);
  }
  public set showWireframe(v:boolean) {
    if ((v) && (! this._wireframe)) {
      this._wireframe = new PIXI.Sprite();
      this._wireframeGraphics = new PIXI.Graphics();
      this._wireframe.addChild(this._wireframeGraphics);
      this.board._layers.addChild(this._wireframe);
      this.onBoardSizeChanged();
      this.renderWireframe();
    }
    else if ((! v) && (this._wireframe)) {
      this.board._layers.removeChild(this._wireframe);
      this._wireframe = null;
      this._wireframeGraphics = null;
      Renderer.needsUpdate();
    }
  }
  private _wireframe:PIXI.Sprite;
  private _wireframeGraphics:PIXI.Graphics;

  public renderWireframe():void {
    if (! this._wireframe) return;
    // setup
    const g = this._wireframeGraphics;
    g.clear();
    const scale = this.board.spacing / SPACING;
    // draw all constraints
    var constraints = (Composite.allConstraints(this.engine.world) as any) as Constraint[];
    for (const constraint of constraints) {
      this._drawConstraint(g, constraint, scale);
    }
    // draw all bodies
    var bodies = Composite.allBodies(this.engine.world);
    for (const body of bodies) {
      this._drawBody(g, body, scale);
    }
    Renderer.needsUpdate();
  }
  protected _drawBody(g:PIXI.Graphics, body:Body, scale:number):void {
    if (body.parts.length > 1) {
      // if the body has more than one part, the first is the convex hull, which
      //  we draw in a different color to distinguish it
      this._drawVertices(g, body.vertices, Colors.WIREFRAME_HULL, scale);
      for (let i:number = 1; i < body.parts.length; i++) {
        this._drawBody(g, body.parts[i], scale);
      }
    }
    // otherwise this is a terminal part
    else {
      this._drawVertices(g, body.vertices, Colors.WIREFRAME, scale);
    }
  }
  protected _drawVertices(g:PIXI.Graphics, vertices:Vector[], color:number, scale:number):void {
    g.lineStyle(1, color);
    g.beginFill(color, Alphas.WIREFRAME);
    // draw the vertices of the body
    let first:boolean = true;
    for (const vertex of vertices) {
      if (first) {
        g.moveTo(vertex.x * scale, vertex.y * scale);
        first = false;
      }
      else {
        g.lineTo(vertex.x * scale, vertex.y * scale);
      }
    }
    g.closePath();
    g.endFill();
  }

  protected _drawConstraint(g:PIXI.Graphics, c:Constraint, scale:number) {
    if ((! c.pointA) || (! c.pointB)) return;
    g.lineStyle(2, Colors.WIREFRAME_CONSTRAINT, 0.5);
    if (c.bodyA) {
      g.moveTo((c.bodyA.position.x + c.pointA.x) * scale, 
               (c.bodyA.position.y + c.pointA.y) * scale);
    }
    else {
      g.moveTo(c.pointA.x * scale, c.pointA.y * scale);
    }
    if (c.bodyB) {
      g.lineTo((c.bodyB.position.x + c.pointB.x) * scale, 
               (c.bodyB.position.y + c.pointB.y) * scale);
    }
    else {
      g.lineTo(c.pointB.x * scale, c.pointB.y * scale);
    }
  }

}