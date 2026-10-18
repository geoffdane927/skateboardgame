import {FLOORS} from "./economy.js";
export function buildWorld(THREE, scene) {
 const mats={
  floor:[0x27343b,0x34454d,0x4a3e57,0x5b4b34].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.82})),
  edge:new THREE.MeshStandardMaterial({color:0x101820,metalness:.25,roughness:.65}),
  white:new THREE.MeshStandardMaterial({color:0xe5edf0,roughness:.6}),
  gold:new THREE.MeshStandardMaterial({color:0xffc857,emissive:0x553000,emissiveIntensity:.35}),
  green:new THREE.MeshStandardMaterial({color:0x37d98a,emissive:0x06391c,emissiveIntensity:.5}),
  glass:new THREE.MeshStandardMaterial({color:0x63c9ee,metalness:.3,roughness:.2,transparent:true,opacity:.32}),
  dark:new THREE.MeshStandardMaterial({color:0x141e25,roughness:.8})
 };
 const box=(w,h,d,mat,x,y,z,parent=scene)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 const floors=[],pads=[],machines=[],labels=[];
 for(let i=0;i<FLOORS.length;i++){
  const y=FLOORS[i].height;
  const platform=box(24,.5,24,mats.floor[i],0,y-.3,0);
  box(24.4,.22,24.4,mats.edge,0,y-.64,0);
  // Glowing edge stripes make the different storeys readable.
  for(const [x,z,w,d] of [[0,-12,24,.12],[0,12,24,.12],[-12,0,.12,24],[12,0,.12,24]])box(w,.06,d,new THREE.MeshStandardMaterial({color:FLOORS[i].theme,emissive:FLOORS[i].theme,emissiveIntensity:.45}),x,y-.13,z);
  // Rear wall and corner columns give the tycoon a compact factory feel.
  box(24,3,.3,mats.dark,0,y+1.2,-11.85);
  for(const x of [-11.5,11.5])for(const z of [-11.5,11.5])box(.45,3,.45,mats.edge,x,y+1.2,z);
  floors.push({index:i,y,platform});
  // Elevator shaft, open at the front so the player can see the floors.
  for(const x of [-1.1,1.1])box(.12,6,.12,mats.gold,x,y+3,9);
  box(2.4,.12,2.4,mats.edge,0,y+.12,9);
  const pad=box(2.2,.22,2.2,mats.green,0,y+.3,8.6);
  pad.userData={kind:"elevator",floor:i};
  pads.push(pad);
  // Four upgrade pads, each paired with a little production machine.
  for(let j=0;j<4;j++){
   const x=-7.5+j*5,z=-4.5;
   const p=box(2.35,.18,2.35,mats.gold,x,y+.12,z);
   p.userData={kind:"upgrade",floor:i,slot:j};
   pads.push(p);
   box(1.4,.65,1.15,mats.edge,x,y+.55,z-1.45);
   box(.9,.9,.9,new THREE.MeshStandardMaterial({color:FLOORS[i].theme,metalness:.45,roughness:.35}),x,y+1.15,z-1.45);
   const core=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),mats.gold);core.position.set(x,y+1.8,z-1.45);scene.add(core);machines.push({mesh:core,baseY:y+1.8,phase:j*.9+i});
   // Status lamp on each pad.
   const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),mats.green);lamp.position.set(x,y+.36,z);scene.add(lamp);
  }
  // Safety rails at the exposed sides of each elevated floor.
  if(i>0){for(const z of [-11.5,11.5])box(24,.12,.12,mats.white,0,y+.45,z);for(const x of [-11.5,11.5])box(.12,.12,24,mats.white,x,y+.45,0)}
 }
 // Ground approach, trees, and distant blocky skyline.
 box(200,.5,200,new THREE.MeshStandardMaterial({color:0x17252b,roughness:1}),0,-1.05,0);
 for(let i=0;i<20;i++){
  const x=(i%5)*18-36,z=Math.floor(i/5)*18-27;
  box(5,3+(i*7%5),5,new THREE.MeshStandardMaterial({color:[0x25343d,0x2d4148,0x3c3b50][i%3]}),x,.5+(3+(i*7%5))/2,z);
 }
 // Big vertical floor labels as color-coded sign panels; UI provides readable names.
 FLOORS.forEach((f,i)=>{const sign=box(5,1.25,.18,new THREE.MeshStandardMaterial({color:f.theme,emissive:f.theme,emissiveIntensity:.2}),-8.5,f.height+2.3,10.8);sign.userData.floorSign=i;});
 const lights=[];
 for(let i=0;i<FLOORS.length;i++){
  const l=new THREE.PointLight(FLOORS[i].theme,20,20);l.position.set(0,FLOORS[i].height+4,0);scene.add(l);lights.push(l);
 }
 return {floors,pads,machines,lights,materials:mats};
}
