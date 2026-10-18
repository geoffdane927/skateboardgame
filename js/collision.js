export function grindSurfaceAt(THREE, pieces, skater, x, z) {
 let best=null,bestD=Infinity;
 for(const p of pieces){
  const type=p.userData.type;
  const local=new THREE.Vector3(x-p.position.x,0,z-p.position.z).applyAxisAngle(new THREE.Vector3(0,1,0),-p.rotation.y);
  let h=0,valid=false,edge=false;
  if(type==='rail'&&Math.abs(local.x)<.32&&Math.abs(local.z)<1.7){h=.62;valid=true}
  else if(type==='box'&&Math.abs(local.x)<1.62&&Math.abs(local.z)<.68){h=.48;valid=true;edge=Math.abs(Math.abs(local.x)-1.5)<.2||Math.abs(Math.abs(local.z)-.55)<.2}
  else if(type==='wall'&&Math.abs(local.x)<1.62&&Math.abs(local.z)<.48&&skater.position.y>1.05){h=1.66;valid=true;edge=true}
  else if(type==='stairs'&&Math.abs(local.x)<1.55){const step=Math.max(0,Math.min(3,Math.floor((local.z+1.5)/.65)));h=.25*(step+1)+.06;const z0=-1.5+step*.65,z1=z0+.65;if(local.z>=z0-.08&&local.z<=z1+.08&&skater.position.y>h-.42){valid=true;edge=Math.abs(local.z-z0)<.18||Math.abs(local.z-z1)<.18||Math.abs(Math.abs(local.x)-1.4)<.2}}
  else if(type==='quarter'&&Math.abs(local.z)<1.55&&local.x>1.45&&local.x<2.25){h=2.5;valid=true;edge=true}
  else if(type==='ramp'&&Math.abs(local.z)<1.55&&local.x>1.3&&local.x<2.15){h=1.4;valid=true;edge=true}
  if(!valid)continue;
  const dist=Math.abs((skater.position.y-.12)-h);
  if(dist<bestD&&dist<(edge?.48:.62)){bestD=dist;best={piece:p,height:h,type,local,edge}}
 }
 return best;
}
export function resolveObstacleCollision(THREE,pieces,skater,prevX,prevZ) {
 const radius=.32;
 for(const p of pieces){
  const type=p.userData.type;let hx,hz,top;
  if(type==='wall'){hx=1.5+radius;hz=.175+radius;top=1.72}
  else if(type==='box'){hx=1.5+radius;hz=.55+radius;top=.58}
  else if(type==='stairs'){hx=1.4+radius;hz=1.6;top=1.12}
  else if(type==='rail'){hx=.09+radius;hz=1.6+radius;top=.72}
  else continue;
  if(skater.position.y>top)continue;
  const rot=-p.rotation.y,c=Math.cos(rot),s=Math.sin(rot);
  const local=(x,z)=>({x:(x-p.position.x)*c-(z-p.position.z)*s,z:(x-p.position.x)*s+(z-p.position.z)*c});
  const a=local(prevX,prevZ),b=local(skater.position.x,skater.position.z);
  const inside=v=>Math.abs(v.x)<hx&&Math.abs(v.z)<hz;
  if(!inside(b)){
   let t0=0,t1=1,face=null;
   for(const axis of ['x','z']){
    const start=a[axis],delta=b[axis]-start,half=axis==='x'?hx:hz;
    if(Math.abs(delta)<1e-8){if(start < -half||start > half){t0=2;break}}
    else{
     let near=(-half-start)/delta,far=(half-start)/delta,nearFace=-Math.sign(delta);
     if(near>far){const tmp=near;near=far;far=tmp}
     if(near>t0){t0=near;face={axis,sign:nearFace}}
     t1=Math.min(t1,far);if(t0>t1){t0=2;break}
    }
   }
   if(t0<=1&&t1>=0&&t0<=t1&&face){
    const hitT=Math.max(0,t0-.015),hit={x:a.x+(b.x-a.x)*hitT,z:a.z+(b.z-a.z)*hitT};
    hit[face.axis]=face.sign*((face.axis==='x'?hx:hz)+.025);
    const wx=hit.x*c+hit.z*s,wz=-hit.x*s+hit.z*c;
    skater.position.x=p.position.x+wx;skater.position.z=p.position.z+wz;
   }
   continue;
  }
  const dx=hx-Math.abs(b.x),dz=hz-Math.abs(b.z);
  if(dx<dz)b.x=Math.sign(b.x||1)*(hx+.025);else b.z=Math.sign(b.z||1)*(hz+.025);
  const wx=b.x*c+b.z*s,wz=-b.x*s+b.z*c;
  skater.position.x=p.position.x+wx;skater.position.z=p.position.z+wz;
 }
}
export function groundHeight(THREE,pieces,x,z) {
 let h=0;
 for(const p of pieces){
  const local=new THREE.Vector3(x-p.position.x,0,z-p.position.z).applyAxisAngle(new THREE.Vector3(0,1,0),-p.rotation.y);
  const ax=Math.abs(local.x),az=Math.abs(local.z),t=p.userData.type;
  if(t==='box'&&ax<1.5&&az<.55)h=Math.max(h,.48);
  if(t==='stairs'&&ax<1.4&&az<1.3)h=Math.max(h,.25*(4-Math.max(0,Math.floor((local.z+1.5)/.65))));
  if(t==='ramp'&&ax<2&&az<1.5)h=Math.max(h,Math.max(0,(local.x+2)*.35));
  if(t==='quarter'&&ax<2&&az<1.5)h=Math.max(h,Math.max(0,Math.min(2.5,(local.x+2)*.6)));
 }
 return h;
}
