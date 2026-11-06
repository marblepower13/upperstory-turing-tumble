// Test-only rendering stubs; routing uses the shipped Matter.js engine.
const fs=require('fs'), vm=require('vm');
const path=require('path');
const window={addEventListener(){},removeEventListener(){}};
const document={};
class Node {
 constructor(){this.children=[];this.transform={};this.scale={x:1,y:1,set(x,y=x){this.x=x;this.y=y}};this.position={x:0,y:0,set:(x,y)=>{this.x=x;this.y=y}};this.anchor={set(){}};this.visible=true;Object.defineProperty(this,'width',{value:64,writable:true,configurable:true});Object.defineProperty(this,'height',{value:64,writable:true,configurable:true});this.alpha=1;this.rotation=0;this.parent=null;}
 addChild(...xs){for(const x of xs)if(x){this.children.push(x);x.parent=this;}return xs[0];}
 addChildAt(x,i){this.children.splice(i,0,x);return x;}
 removeChild(x){this.children=this.children.filter(c=>c!==x);}
 on(){return this;}addListener(){return this;}destroy(){}getBounds(){return{x:0,y:0,width:64,height:64}}toGlobal(p){return p}toLocal(p){return p}
}
class Graphics extends Node{}
for(const key of ['clear','lineStyle','beginFill','endFill','drawCircle','drawRect','drawRoundedRect','moveTo','lineTo','quadraticCurveTo','closePath','drawPolygon','arc'])Graphics.prototype[key]=function(){return this;};
const filter=new Proxy({}, {get:()=>class {contrast(){}brightness(){}saturate(){}reset(){}}});
const PIXI={settings:{RESOLUTION:1},particles:{ParticleContainer:Node},Sprite:Node,Container:Node,Graphics,Text:class extends Node{constructor(text='',style={}){super();this.text=text;this.style=style;}},Point:class{constructor(x=0,y=0){this.x=x;this.y=y}},Rectangle:class{},Texture:{EMPTY:{}},filters:filter,autoDetectRenderer:()=>({width:1200,height:900,plugins:{interaction:{mouse:{global:{x:0,y:0}},on(){}}},resize(){},render(){}})};
const modules={},cache={};
vm.runInNewContext(fs.readFileSync((process.env.TT_APP || path.join(__dirname,'../../docs/app.js')),'utf8'),{System:{register:(name,deps,declare)=>modules[name]={deps,declare}},PIXI,document,window,console,setTimeout,clearTimeout});
function load(name){
 if(name==='pixi.js')return PIXI;if(name==='pixi-filters')return filter;
 if(name==='matter-js')return require(path.join(__dirname,'../../docs/matter.min.js'));
 if(cache[name])return cache[name];const exp=cache[name]={};const reg=modules[name];if(!reg)throw Error(name);
 const m=reg.declare((key,value)=>{exp[key]=value},{id:name});m.setters.forEach((set,i)=>set(load(reg.deps[i])));m.execute();return exp;
}
module.exports={load,PIXI,window,document};
