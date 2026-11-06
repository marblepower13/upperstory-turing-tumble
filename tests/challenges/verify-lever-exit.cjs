// Regression for the reported marble crossing the divider after pressing a lever.
const assert=require('assert'),{load}=require('./load-simulation.cjs');
const{Board}=load('board/board'),{PartFactory}=load('parts/factory'),{Challenges}=load('board/challenges'),{BoardBuilder}=load('board/builder'),{Animator}=load('ui/animator'),{Turnstile}=load('parts/turnstile');
let total=0,maxDelay=0;
for(const schematic of [false,true])for(const right of [false,true])for(const speed of [.25,1,8]){
 const b=new Board(new PartFactory({}));
 if(!right)Challenges.load(b,1);
 else {BoardBuilder.initStandardBoard(b);for(const item of Challenges.find(1).layout){const p=b.partFactory.make(item[2]);p.isFlipped=item[3]!==0;p.isLocked=true;b.setPart(p,12-item[0],item[1]);}}
 for(const row of [5,7,9,11]){const p=b.partFactory.make(3);p.isFlipped=!right;b.setPart(p,right?7:5,row);}
 const router=schematic?b.schematicRouter:b.physicalRouter,originalPass=Turnstile.prototype.registerPass,markers=new Map();let step=0;
 Turnstile.prototype.registerPass=function(ball){const was=ball.hasActuatedLever,result=originalPass.call(this,ball);if(!was&&ball.hasActuatedLever)markers.set(ball,{lever:this,step,crossed:false,cleared:false});return result;};
 function check(){for(const[ball,m]of markers){if(m.cleared)continue;const center=m.lever.column+(m.lever.isFlipped?-1:1),side=m.lever.isFlipped?1:-1;if(ball.row>m.lever.row+.65){m.cleared=true;maxDelay=Math.max(maxDelay,step-m.step);continue;}if((ball.column-center)*side<-.015)m.crossed=true;}}
 const method=schematic?'moveBalls':'afterUpdate',original=router[method].bind(router);router[method]=function(){step+=schematic?.25:1;original();check();};
 [...b.drops].find(d=>d.isFlipped===right).releaseBall();
 for(let frame=0;frame<Math.ceil(7000/speed);frame++){router.update(speed,1);Animator.current.update(1);if(markers.size===8&&b.outputRegister.sequence.length===8&&b.outputRegister.settled)break;}
 Turnstile.prototype.registerPass=originalPass;
 assert.equal(markers.size,8);assert.equal(b.outputRegister.sequence.length,8);assert(b.outputRegister.settled);
 for(const m of markers.values()){assert(!m.crossed,JSON.stringify({schematic,right,speed}));assert(m.cleared);total++;}
 console.log('PASS: Gravity exit',{schematic,right,speed,marbles:markers.size});
}
assert(maxDelay<120,'A marble should clear the open lever promptly');
console.log('PASS:',total,'marbles remain on their actuated side and drop through; maximum exit delay',maxDelay,'physical-step equivalents.');
