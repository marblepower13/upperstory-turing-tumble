// Protect the lowest usable peg's swept component envelope and lever clearances.
const assert=require('assert'),{load}=require('./load-simulation.cjs');
const{Board}=load('board/board'),{PartFactory}=load('parts/factory'),{BoardBuilder}=load('board/builder'),{PartBodyFactory}=load('parts/partbody'),C=load('board/centerblock');
const b=new Board(new PartFactory({}));BoardBuilder.initStandardBoard(b);b.clearBalls();b.physicalRouter.beforeUpdate();
const post=b.physicalRouter._centerBlockBodies[0],location=C.centerBlocks(b)[0],factory=new PartBodyFactory();let poses=0,minimum=Infinity;
for(const type of [3,4,5,6,7,8])for(const flipped of [false,true]){
 const part=b.partFactory.make(type);part.column=location.column;part.row=location.row-1;part.isFlipped=flipped;
 const pb=factory.make(part);if(!pb.body)continue;
 for(let i=0;i<=360;i++){
  part.rotation=i/360;pb.updateBodyFromPart();
  const clearance=post.bounds.min.y-pb.body.bounds.max.y;
  minimum=Math.min(minimum,clearance);assert(clearance>8,JSON.stringify({type,flipped,i,clearance}));poses++;
 }
}
// The cap still reaches the resting noses; it does not leave a marble-width gap.
for(const r of [-.14,-.12,-.10])assert.equal(C.centerBlockHalfWidth(r),.415);
assert.equal(C.centerBlockHalfWidth(C.CENTER_BLOCK_TOP),0);
console.log('PASS:',poses,'component-body poses clear the divider; minimum',minimum.toFixed(2),'model units. Wide shoulder retained beside the resting lever noses.');
