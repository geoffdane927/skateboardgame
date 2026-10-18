
import * as THREE from 'three';
import {makePiece} from './pieces.js';
import {grindSurfaceAt as getGrindSurfaceAt, groundHeight as getGroundHeight, resolveObstacleCollision} from './collision.js';
const root=document.getElementById('game'), toastEl=document.getElementById('toast');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9ac9d2);scene.fog=new THREE.Fog(0x9ac9d2,48,125);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,250);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe5fbff,0x64705a,2));
const sun=new THREE.DirectionalLight(0xfff4d8,3.2);sun.position.set(-18,30,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun);
const mat=(c,r=.85,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const concrete=mat(0x929da0), dark=mat(0x303d43), yellow=mat(0xc4f45b), metal=mat(0xaab8bd,.3,.8), deckMat=mat(0x202a31,.35), wheelMat=mat(0x11151a,.7), shirtMat=mat(0xf45c45), pantsMat=mat(0x293b65);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),mat(0x6d9a76));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.userData.ground=true;scene.add(ground);
const floor=new THREE.Mesh(new THREE.BoxGeometry(44,.18,44),concrete);floor.position.y=-.12;floor.receiveShadow=true;floor.castShadow=true;scene.add(floor);
// skatepark surface markings
const marks=new THREE.Group();scene.add(marks);
for(let i=-20;i<=20;i+=5){const line=new THREE.Mesh(new THREE.BoxGeometry(.035,.012,40),mat(0xb6c1c0));line.position.set(i,.003,0);marks.add(line);const line2=new THREE.Mesh(new THREE.BoxGeometry(40,.012,.035),mat(0xb6c1c0));line2.position.set(0,.004,i);marks.add(line2)}
// distant simple city blocks
for(let i=0;i<32;i++){let h=3+Math.random()*12,w=2+Math.random()*5;let b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),mat([0x82979a,0x6f898c,0xb2b7ad][i%3]));let a=i/32*Math.PI*2,r=52+Math.random()*15;b.position.set(Math.cos(a)*r,h/2-0.1,Math.sin(a)*r);scene.add(b)}
let mode='build', selectedType='ramp', rotation=0, selected=null, ghost=null, pieces=[], score=0, keys={}, last=performance.now();
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
function toast(t){toastEl.textContent=t;toastEl.style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>toastEl.style.opacity=0,1400)}
function box(parent,w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function placePiece(type,x,z,rot=0){const g=makePiece(THREE,{concrete,dark,yellow,metal,mat,box},type);g.position.set(Math.round(x),0,Math.round(z));g.rotation.y=rot;scene.add(g);pieces.push(g);return g}
function placePiece(type,x,z,rot=0){const g=makePiece(type);g.position.set(Math.round(x),0,Math.round(z));g.rotation.y=rot;scene.add(g);pieces.push(g);return g}
function makeGhost(){if(ghost)scene.remove(ghost);ghost=makePiece(selectedType);ghost.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.45;o.material.depthWrite=false}});ghost.visible=false;scene.add(ghost)}
makeGhost();
function selectPiece(g){if(selected&&selected.userData.outline){selected.remove(selected.userData.outline)}selected=g;if(g){const outline=new THREE.BoxHelper(g,0xc4f45b);scene.add(outline);selected.userData.outline=outline}}
function deleteSelected(){if(!selected)return;scene.remove(selected);pieces=pieces.filter(p=>p!==selected);if(selected.userData.outline)scene.remove(selected.userData.outline);selected=null;toast('Piece removed')}
function setMode(m){mode=m;document.getElementById('buildBtn').classList.toggle('active',m==='build');document.getElementById('playBtn').classList.toggle('active',m==='play');document.getElementById('tools').style.display=m==='build'?'block':'none';document.getElementById('crosshair').style.display=m==='play'?'block':'none';document.getElementById('modeText').textContent=m==='build'?'BUILD MODE':'SKATE MODE';document.getElementById('bottom').innerHTML=m==='build'?'<span class="hint"><b class="key">CLICK</b> Place / select</span><span class="hint"><b class="key">R</b> Rotate piece</span><span class="hint"><b class="key">DEL</b> Delete selected</span>':'<span class="hint"><b class="key">W</b><b class="key">S</b> Push / brake</span><span class="hint"><b class="key">A</b><b class="key">D</b> Steer / air spin / grind balance</span><span class="hint"><b class="key">SPACE</b> Ollie</span><span class="hint"><b class="key">Q</b> Kickflip</span><span class="hint">Air: W/S lean</span>';if(m==='play'){selectPiece(null);skater.position.set(0,.12,9);skater.rotation.set(0,0,0);velocity=0;vy=0;airSpin=0;airLean=0;toast('Push off and hit a ramp!')}else{ghost.visible=false;toast('Build your skatepark')}}
document.getElementById('buildBtn').onclick=()=>setMode('build');document.getElementById('playBtn').onclick=()=>setMode('play');
document.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{selectedType=b.dataset.piece;rotation=0;document.querySelectorAll('[data-piece]').forEach(q=>q.classList.toggle('active',q===b));makeGhost()});
function rotatePiece(){if(mode!=='build')return;if(selected){selected.rotation.y+=Math.PI/4}else rotation+=Math.PI/4}
document.getElementById('rotateBtn').onclick=rotatePiece;document.getElementById('deleteBtn').onclick=deleteSelected;
document.getElementById('clearBtn').onclick=()=>{pieces.forEach(p=>scene.remove(p));pieces=[];selectPiece(null);toast('Park cleared')};
document.getElementById('resetBtn').onclick=()=>{skater.position.set(0,.12,9);skater.rotation.set(0,0,0);velocity=vy=0;airSpin=airLean=0;toast('Back to start')};
function pointerRay(e){pointer.x=e.clientX/innerWidth*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera)}
renderer.domElement.addEventListener('pointermove',e=>{if(mode!=='build'||!ghost)return;pointerRay(e);const hits=raycaster.intersectObject(ground);if(hits.length){ghost.visible=true;ghost.position.set(Math.round(hits[0].point.x),0,Math.round(hits[0].point.z));ghost.rotation.y=rotation}});
renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='build')return;pointerRay(e);const hits=raycaster.intersectObjects(pieces,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.isPiece)o=o.parent;if(o){selectPiece(o);toast('Piece selected');return}}const floorHit=raycaster.intersectObject(ground);if(floorHit.length){const p=floorHit[0].point;const g=placePiece(selectedType,p.x,p.z,rotation);selectPiece(g);toast('Piece placed')}});
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyR')rotatePiece();if(e.code==='Delete'||e.code==='Backspace')deleteSelected();if(e.code==='Space'&&mode==='play'&&onGround)jump();if(e.code==='KeyQ')startKickflip()});
window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>keys={});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const skater=new THREE.Group();scene.add(skater);
const board=new THREE.Group();skater.add(board);
// Board's long axis is local +Z, matching the skater's forward direction.
box(board,.3,.12,1.05,deckMat,0,.18,0);const grip=new THREE.Mesh(new THREE.BoxGeometry(.24,.012,.85),mat(0x454d50));grip.position.y=.247;board.add(grip);
for(let x of [-.19,.19])for(let z of [-.34,.34]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.07,12),wheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.1,z);board.add(wheel)}
const legs=new THREE.Group();skater.add(legs);box(legs,.22,.62,.22,pantsMat,-.16,.62,0);box(legs,.22,.62,.22,pantsMat,.16,.62,0);box(legs,.56,.18,.27,shirtMat,0,1.08,0);const head=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),mat(0xdca77e));head.position.set(0,1.52,0);skater.add(head);box(skater,.12,.38,.12,shirtMat,-.37,1.04,0);box(skater,.12,.38,.12,shirtMat,.37,1.04,0);
let velocity=0,vy=0,velocityX=0,velocityZ=0,airTravelAngle=0,bailTime=0,onGround=true,airSpin=0,airLean=0,spinVelocity=0,leanVelocity=0,airTime=0;
let grinding=null,grindTime=0,grindBalance=0,kickflipTime=0,trickPoints=0;
function finishGrind(){if(!grinding)return;const pts=Math.max(50,Math.floor(grindTime*120));score+=pts;trickPoints+=pts;document.getElementById('scoreText').textContent=score+' points';grinding=null;grindTime=0;grindBalance=0;toast('Grind! +'+pts)}
function jump(){if(!onGround)return;if(grinding)finishGrind();airTravelAngle=skater.rotation.y+(velocity<0?Math.PI:0);vy=5.6+Math.min(Math.abs(velocity)*.12,1.2);onGround=false;airTime=0;spinVelocity=0;leanVelocity=0;skater.rotation.x=0;skater.rotation.z=0}
function startKickflip(){if(mode!=='play'||onGround||kickflipTime>0)return;kickflipTime=.48;trickPoints+=300;toast('KICKFLIP! +300')}
function grindSurfaceAt(x,z){return getGrindSurfaceAt(THREE,pieces,skater,x,z)}
function groundHeight(x,z){return getGroundHeight(THREE,pieces,x,z)}
function skateUpdate(dt){
 const turn=(keys.KeyA?1:0)-(keys.KeyD?1:0),drive=(keys.KeyW?1:0)-(keys.KeyS?1:0);
 if(kickflipTime>0)kickflipTime=Math.max(0,kickflipTime-dt);
 if(onGround){
  if(grinding){
   grindBalance=THREE.MathUtils.clamp(grindBalance+turn*dt*1.35,-1,1);grindTime+=dt;
   velocity*=Math.pow(.997,dt*60);
   if(Math.abs(grindBalance)>.94){score+=Math.floor(grindTime*70);document.getElementById('scoreText').textContent=score+' points';grinding=null;grindTime=0;grindBalance=0;toast('Grind bail!')}
   else if(keys.Space)jump();
  }else{skater.rotation.y+=turn*dt*(1.45+Math.abs(velocity)*.08);velocity+=drive*dt*8.5;velocity*=Math.pow(.985,dt*60);velocity=THREE.MathUtils.clamp(velocity,-4,12)}
  airSpin=0;airLean=0;
 }else{skater.rotation.y+=turn*dt*(1.45+Math.abs(velocity)*.08);spinVelocity+=turn*dt*10.5;spinVelocity*=Math.pow(.94,dt*60);airSpin+=spinVelocity*dt;leanVelocity+=drive*dt*2.7;leanVelocity*=Math.pow(.98,dt*60);airLean=THREE.MathUtils.clamp(airLean+leanVelocity*dt,-.8,.8);airTime+=dt}
 const moveAngle=onGround?skater.rotation.y+(velocity<0?Math.PI:0):airTravelAngle;
 const forward=new THREE.Vector3(Math.sin(moveAngle),0,Math.cos(moveAngle));
 velocityX=forward.x*Math.abs(velocity);velocityZ=forward.z*Math.abs(velocity);
 const prevX=skater.position.x,prevZ=skater.position.z;
 skater.position.x+=velocityX*dt;skater.position.z+=velocityZ*dt;
 skater.position.x=THREE.MathUtils.clamp(skater.position.x,-21,21);skater.position.z=THREE.MathUtils.clamp(skater.position.z,-21,21);
 resolveObstacleCollision(THREE,pieces,skater,prevX,prevZ);
 const gh=groundHeight(skater.position.x,skater.position.z);
 if(!onGround){
  vy-=12*dt;skater.position.y+=vy*dt;
  if(skater.position.y<=gh+.12){
   const grind=grindSurfaceAt(skater.position.x,skater.position.z);
   if(grind&&Math.abs(velocity)>1.1&&airTime>.08){
    grinding=grind;grindTime=0;grindBalance=0;skater.position.y=grind.height+.12;vy=0;onGround=true;toast('GRIND! Use A/D to balance');
   }else{
    if(airTime>.25){const speed=Math.hypot(velocityX,velocityZ);const moveAngle=Math.atan2(velocityX,velocityZ);const sideAngle=Math.abs(Math.atan2(Math.sin(skater.rotation.y-moveAngle),Math.cos(skater.rotation.y-moveAngle)));const uprightAngle=Math.max(Math.abs(airLean),Math.abs(skater.rotation.z));const bailed=(speed>.5&&sideAngle>Math.PI/4)||uprightAngle>Math.PI/18;if(bailed){bailTime=.9;document.getElementById('modeText').textContent='BAILED';toast(sideAngle>Math.PI/4?'BAIL! Landed sideways':'BAIL! Not upright');velocity*=.45;trickPoints=0;score=Math.max(0,score)}else{const spin=Math.abs(airSpin)/(Math.PI*2),lean=Math.abs(airLean);const trick=Math.floor(spin*180)+Math.floor(lean*70)+Math.floor(Math.abs(velocity)*3)+trickPoints;if(trick>0){score+=trick;document.getElementById('scoreText').textContent=score+' points';toast('Landed! +'+trick+' points')}trickPoints=0}}
    skater.position.y=gh+.12;vy=0;onGround=true;grinding=null;airSpin=airLean=spinVelocity=leanVelocity=0;skater.rotation.x=0;skater.rotation.z=0;
   }
  }
 }else if(!grinding){
  const grind=grindSurfaceAt(skater.position.x,skater.position.z);
  if(grind&&Math.abs(velocity)>1.1&&Math.abs(skater.position.y-(grind.height+.12))<.22){grinding=grind;grindTime=0;grindBalance=0;skater.position.y=grind.height+.12;toast('GRIND! Use A/D to balance')}
 }
 if(grinding){skater.position.y=grinding.height+.12;const stillOn=grindSurfaceAt(skater.position.x,skater.position.z);if(!stillOn){finishGrind();document.getElementById('modeText').textContent='SKATE MODE'}else{skater.rotation.y=grinding.piece.rotation.y;document.getElementById('modeText').textContent='GRIND '+Math.floor(grindTime*70)}}
 else document.getElementById('modeText').textContent='SKATE MODE';
 board.rotation.x=0;board.rotation.y=0;
 board.rotation.z=kickflipTime>0?Math.sin((.48-kickflipTime)/.48*Math.PI)*Math.PI*2:(onGround?Math.sin(performance.now()*.008)*.018:airLean*.12);
 if(bailTime>0){bailTime=Math.max(0,bailTime-dt);skater.rotation.z=THREE.MathUtils.lerp(skater.rotation.z,1.25,Math.min(1,dt*10));skater.rotation.x=THREE.MathUtils.lerp(skater.rotation.x,-.9,Math.min(1,dt*10));legs.rotation.x=.8;if(bailTime===0){skater.rotation.set(0,skater.rotation.y,0);skater.position.y=.12;velocity=0;vy=0;onGround=true;grinding=null;toast('Back on your board')}}else{legs.rotation.x=onGround?0:-.18;skater.rotation.x=onGround?0:airLean;}
}
function updateCamera(dt){const fwd=new THREE.Vector3(Math.sin(skater.rotation.y),0,Math.cos(skater.rotation.y));const target=new THREE.Vector3(skater.position.x-fwd.x*7,skater.position.y+3.5,skater.position.z-fwd.z*7);camera.position.lerp(target,1-Math.pow(.001,dt));camera.lookAt(skater.position.x,skater.position.y+0.8,skater.position.z+fwd.z*2)}
const orbitTarget=new THREE.Vector3(0,0,0);camera.position.set(9,13,18);camera.lookAt(0,0,0);
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.035);last=now;if(mode==='play'){skateUpdate(dt);updateCamera(dt)}else{const t=now*.00012;camera.position.lerp(new THREE.Vector3(27*Math.sin(t),21,27*Math.cos(t)),.006);camera.lookAt(0,0,0);if(selected&&selected.userData.outline)selected.userData.outline.update()}renderer.render(scene,camera)}
animate(performance.now());
