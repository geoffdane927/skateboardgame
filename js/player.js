export function createPlayer(THREE,scene){
 const root=new THREE.Group();scene.add(root);
 const skin=new THREE.MeshStandardMaterial({color:0xe5ae83,roughness:.8});
 const shirt=new THREE.MeshStandardMaterial({color:0x28b8a7,roughness:.7});
 const pants=new THREE.MeshStandardMaterial({color:0x273c70,roughness:.8});
 const shoe=new THREE.MeshStandardMaterial({color:0x20242a,roughness:.7});
 const hair=new THREE.MeshStandardMaterial({color:0x29201b,roughness:1});
 const part=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m};
 part(new THREE.CylinderGeometry(.28,.34,.82,10),shirt,0,1.35,0);
 part(new THREE.SphereGeometry(.28,16,12),skin,0,1.98,0);
 part(new THREE.SphereGeometry(.29,12,8),hair,0,2.12,-.035);
 const eyes=new THREE.MeshStandardMaterial({color:0x202020});
 part(new THREE.BoxGeometry(.045,.045,.025),eyes,-.09,2.0,.25);part(new THREE.BoxGeometry(.045,.045,.025),eyes,.09,2.0,.25);
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.36,1.62,0);root.add(arm);
  const upper=new THREE.Mesh(new THREE.CylinderGeometry(.095,.12,.48,8),shirt);upper.position.y=-.25;upper.castShadow=true;arm.add(upper);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,8,7),skin);hand.position.y=-.53;hand.castShadow=true;arm.add(hand);limbs.push({node:arm,side,arm:true});
  const leg=new THREE.Group();leg.position.set(side*.15,.98,0);root.add(leg);
  const thigh=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.48,8),pants);thigh.position.y=-.24;thigh.castShadow=true;leg.add(thigh);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.23,.13,.38),shoe);foot.position.set(0,-.5,.08);foot.castShadow=true;leg.add(foot);limbs.push({node:leg,side,arm:false});
 }
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.42,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;root.add(shadow);
 return {root,limbs,shadow,walk:0,vy:0,grounded:true,face:0};
}
export function animatePlayer(player,dt,moving,airborne){
 player.walk+=dt*(moving?11:3);
 const amount=moving?Math.min(1,Math.abs(Math.sin(player.walk))):0;
 for(const l of player.limbs){
  const swing=Math.sin(player.walk+(l.side===1?Math.PI:0))*(l.arm?.65:.8)*amount;
  l.node.rotation.x=l.arm?(airborne?-.5:swing):swing;
 }
 player.root.rotation.z=airborne?Math.sin(player.walk)*.06:0;
 player.shadow.material.opacity=airborne?.12:.25;
}
