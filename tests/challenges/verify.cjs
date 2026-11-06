const assert=require('assert');
const {load}=require('./load-simulation.cjs');
const {Board}=load('board/board'),{PartFactory}=load('parts/factory'),{Challenges}=load('board/challenges'),{BoardBuilder}=load('board/builder'),{Animator}=load('ui/animator'),{GearBase}=load('parts/gearbit'),{URLBoardSerializer}=load('board/serializer');
const board=()=>new Board(new PartFactory({}));
function tick(b,n=1,schematic=false,speed=1){for(let i=0;i<n;i++){(schematic?b.schematicRouter:b.physicalRouter).update(speed,1);Animator.current.update(1);GearBase.update();}}
let cases=0;
for(const def of Challenges.definitions){
 const b=board();assert(Challenges.load(b,def.id));assert.equal(b.challengeId,def.id);assert.equal(b.columnCount,13);assert.equal(b.rowCount,17);
 const drops=[...b.drops];assert.equal(drops.length,2);assert.deepEqual(drops.map(d=>d.balls.size),def.supplies);
 assert.equal(b.challengeFixedParts.size,def.layout.length);
 for(const item of def.layout){const p=b.getPart(item[0],item[1]);assert.equal(p.type,item[2]);assert(p.isLocked);assert(!b.canDragPart(...item));assert(!b.canPlacePart(3,item[0],item[1]));const before=p;b.clearPart(item[0],item[1]);assert.equal(b.getPart(item[0],item[1]),before);assert.equal(!!b.canFlipPart(item[0],item[1]),p.type===6||p.type===7);}
 for(const type of [3,4,5,6,7,8]){
  const expected=def.limits[type]<0?Infinity:def.limits[type];assert.equal(b.remainingParts(type),expected);
  let placed=0;
  outer:for(let r=2;r<=11;r++)for(let c=1;c<=11;c++){
   if(!b.isBackgroundPart(c,r)||!b.canPlacePart(type,c,r))continue;
   b.setPart(b.partFactory.make(type),c,r);assert.equal(b.getPart(c,r).type,type);placed++;
   if(placed===expected||placed===3)break outer;
  }
  assert.equal(b.remainingParts(type),expected===Infinity?Infinity:expected-placed);
  // Reset restores allowances and starting states, regardless of placed parts.
  Challenges.load(b,def.id);
 }
 const before=b.balls.size;b.addBallToDrop([...b.drops][0]);assert.equal(b.balls.size,before,'Challenge Add marbles bypass');
 for(const t of [9,10,11,12,13])assert(!b.canPlacePart(t,2,2));
 tick(b,50);assert([...b.balls].every(ball=>!ball.released),'Loading must never start a run');
 // Challenge metadata survives round trips and excludes preplaced components from inventory.
 const serializer=new URLBoardSerializer(b);const metadata=serializer._writeMetadata();assert(metadata.includes('c '+def.id));b.clearChallenge();serializer._readMetadata(metadata);assert.equal(b.challengeId,def.id);assert.equal(b.challengeFixedParts.size,def.layout.length);
 BoardBuilder.initStandardBoard(b);assert.equal(b.challengeId,0);assert.equal(b.remainingParts(3),Infinity);assert.equal(b.balls.size,16);assert.equal(b.drops.size,2);assert.equal(b.challengeLabels.length,0);
 cases++;
}
assert.equal(cases,30);
// Exhausted supplies cannot be bypassed by repeat clicks, replacements, dragging, or tool prototypes.
{
 const b=board();Challenges.load(b,1);const positions=[[5,5],[5,7],[5,9],[5,11]];
 for(const [c,r] of positions)b.setPart(b.partFactory.make(3),c,r);
 assert.equal(b.remainingParts(3),0);assert(!b.canPlacePart(3,8,4));b.setPart(b.partFactory.make(3),8,4);assert.equal(b.getPart(8,4).type,1);
 const dragged=b.getPart(5,5);b.partPrototype=dragged;assert.equal(b.remainingParts(3),1);assert(b.canPlacePart(3,8,4));b.partPrototype=null;b.setPart(dragged,8,4);assert.equal(b.remainingParts(3),0);
 b.clearPart(8,4);assert.equal(b.remainingParts(3),1);
}
// Bits placed in the puzzle remain flippable; ramps remain fixed. Wrong manual starts do nothing.
{
 const b=board();Challenges.load(b,11);const bit=b.getPart(6,4),value=bit.bitValue;b.flipPart(6,4);Animator.current.update(100);assert.notEqual(bit.bitValue,value);assert(!b.canDragPart(6,4));
 Challenges.load(b,4);for(const d of b.drops)assert.equal(b.canStartDrop(d),d.isFlipped);
 Challenges.load(b,27);for(const d of b.drops)assert(b.canStartDrop(d));
}
for(const id of [21,22,30])for(const count of [0,1,7,15,20]){
 const b=board();Challenges.load(b,id,count);const def=Challenges.find(id);assert.equal([...b.drops][0].balls.size,Math.min(count,def.variableMax));assert.equal([...b.drops][1].balls.size,0);
}
console.log('PASS: all 30 definitions load; layouts, locks, flip exceptions, inventories, exhausted supply, move/refund, starts, variable supplies, metadata, and free-build reset.');
// Genuine Matter.js and schematic routing on solved Gravity and the prebuilt Tetrad counter.
for(const id of [1,23])for(const schematic of [false,true])for(const speed of [.25,1,8]){
 const b=board();Challenges.load(b,id);if(id===1)for(const r of [5,7,9,11]){const p=b.partFactory.make(3);p.isFlipped=true;b.setPart(p,5,r);}
 if(id===23)[...b.challengeFixedParts].filter(p=>p.type===6).forEach((p,i)=>p.rotation=(4>>i)&1);
 const blue=[...b.drops].find(d=>!d.isFlipped),red=[...b.drops].find(d=>d.isFlipped);let releases=[0,0];blue.onRelease=()=>releases[0]++;red.onRelease=()=>releases[1]++;
 blue.releaseBall();tick(b,Math.ceil(9000/speed),schematic,speed);
 const colors=b.outputRegister.sequence.map(ball=>ball.hue===220?'b':'r').join('');
 assert.equal(colors,id===1?'bbbbbbbb':'bbbb',JSON.stringify({id,schematic,speed,releases,colors,positions:[...b.balls].filter(x=>x.released).map(x=>[x.column,x.row])}));assert.equal(releases[1],0);assert.equal(releases[0],id===1?8:5);
 console.log('PASS physics',JSON.stringify({id,schematic,speed,colors,releases,settled:b.outputRegister.settled}));
}
// Pixel and metadata round trips exercise the actual PNG serializer conversion methods.
for(const def of Challenges.definitions){
 const source=board();Challenges.load(source,def.id);const ss=new URLBoardSerializer(source),metadata=ss._writeMetadata();const dest=board();dest.bulkUpdate=true;dest.setSize(source.columnCount,source.rowCount,false);
 for(let r=0;r<source.rowCount;r++)for(let c=0;c<source.columnCount;c++){const data=new Uint8ClampedArray(4);ss.partToColor(source.getPart(c,r),data,0);dest.setPart(ss.colorToPart(data,0),c,r);}
 const ds=new URLBoardSerializer(dest);ds._readMetadata(metadata);dest.bulkUpdate=false;assert.equal(dest.challengeId,def.id);assert.equal(dest.challengeFixedParts.size,def.layout.length);assert.equal(dest.balls.size,source.balls.size);
 for(const type of [3,4,5,6,7,8])assert.equal(dest.remainingParts(type),source.remainingParts(type));
 for(const item of def.layout){const a=source.getPart(item[0],item[1]),b=dest.getPart(item[0],item[1]);assert.equal(a.isFlipped,b.isFlipped);if(a.type===6||a.type===7)assert.equal(a.bitValue,b.bitValue);}
}
console.log('PASS: all 30 PNG pixel/metadata round trips retain challenge identity, fixed pieces, orientations, supplies, and allowances.');
