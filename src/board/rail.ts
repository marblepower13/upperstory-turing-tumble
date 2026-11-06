// Canonical model units per physical simulation step. Both upper feeds and
// lower collection slopes use this pace, scaled by the existing playback rate.
export const RAIL_ROLL_SPEED:number = 3;
export type RailPoint = {x:number,y:number};
export type RailFrame = {start:RailPoint,end:RailPoint,length:number,tangent:RailPoint,normal:RailPoint};
export function railFrame(start:RailPoint,end:RailPoint):RailFrame {
  const dx=end.x-start.x,dy=end.y-start.y,length=Math.sqrt(dx*dx+dy*dy);
  const tangent={x:dx/length,y:dy/length},sign=dx<0?-1:1;
  return {start:start,end:end,length:length,tangent:tangent,
    normal:{x:sign*tangent.y,y:-sign*tangent.x}};
}
export function railPoint(frame:RailFrame,distance:number,clearance:number):RailPoint {
  return {x:frame.start.x+frame.tangent.x*distance+frame.normal.x*clearance,
    y:frame.start.y+frame.tangent.y*distance+frame.normal.y*clearance};
}
