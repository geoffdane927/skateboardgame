import * as THREE from "three";
import {STARTING_CASH,STARTING_INCOME,FLOORS,formatCash,paybackSeconds} from "./economy.js";
import {buildWorld} from "./world.js";
import {createPlayer,animatePlayer} from "./player.js";

const mount=document.querySelector("#game");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101b24);scene.fog=new THREE.Fog(0x101b24,45,115);
const camera=new THREE.PerspectiveCamera(62,1,.1,220);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xb9e7ff,0x28303b,2.1));
const sun=new THREE.DirectionalLight(0xffe4ba,3.1);sun.position.set(-18,35,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-35;scene.add(sun);
const world=buildWorld(THREE,scene),player=createPlayer(THREE,scene);
const clock=new THREE.Clock();
const state={cash:STARTING_CASH,income:STARTING_INCOME,floor:0,owned:new Set(),unlocked:new Set([0]),totalEarned:0,selectedPad:null,toastTimer:0};
const keys=new Set();let lastIncomeTick=0,mouseDown=null,cameraYaw=Math.PI,cameraPitch=.28;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const ui={cash:document.querySelector("#cash"),income:document.querySelector("#income"),floor:document.querySelector("#floorName"),owned:document.querySelector("#owned"),upgrades:document.querySelector("#upgradeList"),floors:document.querySelector("#floorList"),toast:document.querySelector("#toast"),hint:document.querySelector("#hint"),progress:document.querySelector("#progress")};
function say(message){ui.toast.textContent=message;ui.toast.classList.add("show");state.toastTimer=2.6}
function floorOwned(i){return state.unlocked.has(i)}
function floorIncome(i){return FLOORS[i].upgrades.reduce((sum,u)=>sum+(state.owned.has(u.id)?u.rate:0),0)}
function totalOwned(){return state.owned.size}
function renderUI(){
 ui.cash.textContent=formatCash(state.cash);ui.income.textContent=formatCash(state.income)+"/s";ui.floor.textContent=FLOORS[state.floor].name;ui.owned.textContent=totalOwned()+" / 16 upgrades";
 ui.floors.innerHTML="";
 FLOORS.forEach((f,i)=>{
  const b=document.createElement("button");b.className="floor-tab"+(state.floor===i?" selected":"")+(floorOwned(i)?"":" locked");
  b.innerHTML="<strong>"+(i+1)+". "+f.name+"</strong><span>"+(floorOwned(i)?"Unlocked":("Unlock "+formatCash(f.unlockCost)))+"</span>";
  b.addEventListener("click",()=>{if(floorOwned(i)){goFloor(i)}else unlockFloor(i)});ui.floors.appendChild(b);
 });
 ui.upgrades.innerHTML="";
 FLOORS[state.floor].upgrades.forEach((u,i)=>{
  const bought=state.owned.has(u.id),payback=paybackSeconds(u);
  const b=document.createElement("button");b.dataset.cost=String(u.cost);b.className="upgrade"+(bought?" bought":"")+(state.cash<u.cost&&!bought?" unaffordable":"");
  b.disabled=bought;
  b.innerHTML='<span class="upgrade-top"><strong>'+u.name+'</strong><b>'+(bought?"✓ OWNED":formatCash(u.cost))+'</b></span><span class="desc">'+u.desc+'</span><span class="upgrade-bottom"><span>+'+formatCash(u.rate)+'/sec</span><span>Payback '+payback.toFixed(1)+'s</span></span>';
  b.addEventListener("click",()=>buyUpgrade(state.floor,u.id));ui.upgrades.appendChild(b);
 });
 const locked=FLOORS[state.floor].upgrades.filter(u=>!state.owned.has(u.id));
 const cheapest=locked.length?Math.min(...locked.map(u=>u.cost)):null;
 ui.progress.textContent=cheapest===null?"Floor complete — unlock the next floor!":"Next upgrade: "+formatCash(cheapest)+" · "+(state.cash>=cheapest?"Ready to buy":"need "+formatCash(cheapest-state.cash));
}
function buyUpgrade(fi,id){
 if(!floorOwned(fi)){say("Unlock this floor first.");return}
 const u=FLOORS[fi].upgrades.find(x=>x.id===id);if(!u||state.owned.has(id))return;
 if(state.cash+1e-6<u.cost){say("Need "+formatCash(u.cost-state.cash)+" more cash.");return}
 state.cash-=u.cost;state.owned.add(id);state.income+=u.rate;
 const pad=world.pads.find(p=>p.userData.kind==="upgrade"&&p.userData.floor===fi&&FLOORS[fi].upgrades[p.userData.slot].id===id);
 if(pad){pad.material=world.materials.green;pad.scale.set(.78,.7,.78)}
 say(u.name+" purchased! +"+formatCash(u.rate)+"/sec");
 renderUI();
}
function unlockFloor(i){
 if(i<=0||floorOwned(i))return;
 if(!floorOwned(i-1)){say("Unlock the previous floor first.");return}
 const cost=FLOORS[i].unlockCost;
 if(state.cash<cost){say("Floor unlock costs "+formatCash(cost)+". Need "+formatCash(cost-state.cash)+" more.");return}
 state.cash-=cost;state.unlocked.add(i);say(FLOORS[i].name+" unlocked!");renderUI();goFloor(i);
}
function goFloor(i){
 if(!floorOwned(i))return;
 state.floor=i;player.root.position.set(0,FLOORS[i].height,5.5);player.vy=0;player.grounded=true;renderUI();say("Welcome to "+FLOORS[i].name);
}
function interactPad(pad){
 const d=pad.userData;if(d.kind==="upgrade"){buyUpgrade(d.floor,FLOORS[d.floor].upgrades[d.slot].id)}else if(d.kind==="elevator"){if(floorOwned(d.floor))goFloor(d.floor);else unlockFloor(d.floor)}
}
function resize(){const w=mount.clientWidth||innerWidth,h=mount.clientHeight||innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
new ResizeObserver(resize).observe(mount);resize();
window.addEventListener("keydown",e=>{if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key===" "&&!e.repeat&&player.grounded){player.vy=7.5;player.grounded=false}if(e.key.toLowerCase()==="e")nearbyInteract()});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function nearbyInteract(){
 let best=null,dist=3.2;
 for(const p of world.pads){const d=p.position.distanceTo(new THREE.Vector3(player.root.position.x,p.position.y,player.root.position.z));if(d<dist){dist=d;best=p}}
 if(best)interactPad(best);else say("Move close to a glowing pad, or use the upgrade list.");
}
renderer.domElement.addEventListener("pointerdown",e=>{mouseDown={x:e.clientX,y:e.clientY,dragged:false}});
renderer.domElement.addEventListener("pointermove",e=>{if(mouseDown){const dx=e.clientX-mouseDown.x,dy=e.clientY-mouseDown.y;if(Math.abs(dx)+Math.abs(dy)>4)mouseDown.dragged=true;if(mouseDown.dragged){cameraYaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch+dy*.003,-.05,.72);mouseDown.x=e.clientX;mouseDown.y=e.clientY}}});
renderer.domElement.addEventListener("pointerup",e=>{
 if(!mouseDown)return;const click=!mouseDown.dragged;mouseDown=null;if(!click)return;
 const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(world.pads,false);if(hits.length)interactPad(hits[0].object);
});
document.querySelector("#interactBtn").addEventListener("click",nearbyInteract);
document.querySelector("#jumpBtn").addEventListener("click",()=>{if(player.grounded){player.vy=7.5;player.grounded=false}});
document.querySelector("#resetBtn").addEventListener("click",()=>{player.root.position.set(0,FLOORS[state.floor].height,5.5);player.vy=0;player.grounded=true;player.face=0;player.root.rotation.y=0;say("Back at the elevator.")});
function update(dt,time){
 // Continuous production is paid every frame, so income never depends on frame rate.
 const earned=state.income*dt;state.cash+=earned;state.totalEarned+=earned;
 if(time-lastIncomeTick>.18){ui.cash.textContent=formatCash(state.cash);ui.income.textContent=formatCash(state.income)+"/s";ui.upgrades.querySelectorAll(".upgrade:not(.bought)").forEach(b=>{const unaffordable=state.cash<Number(b.dataset.cost);b.classList.toggle("unaffordable",unaffordable)});lastIncomeTick=time}
 const speed=(keys.has("shift")?8.2:5.2),forward=(keys.has("w")?1:0)-(keys.has("s")?1:0),turn=(keys.has("d")?1:0)-(keys.has("a")?1:0);
 player.face+=turn*dt*2.5;player.root.rotation.y=player.face;
 const moving=forward!==0;
 if(moving){player.root.position.x+=Math.sin(player.face)*forward*speed*dt;player.root.position.z+=Math.cos(player.face)*forward*speed*dt}
 const floorY=FLOORS[state.floor].height;
 player.root.position.x=THREE.MathUtils.clamp(player.root.position.x,-10.7,10.7);player.root.position.z=THREE.MathUtils.clamp(player.root.position.z,-10.5,10.7);
 // Jumping is local to the current storey; platforms cannot be fallen through.
 if(!player.grounded){player.vy-=19*dt;player.root.position.y+=player.vy*dt;if(player.root.position.y<=floorY){player.root.position.y=floorY;player.vy=0;player.grounded=true}}
 else player.root.position.y=floorY;
 animatePlayer(player,dt,moving,!player.grounded);
 world.machines.forEach(m=>{m.mesh.position.y=m.baseY+Math.sin(time*2.2+m.phase)*.16;m.mesh.rotation.y=time*.65+m.phase});
 world.lights.forEach((l,i)=>{l.intensity=17+Math.sin(time*1.8+i)*2});
 const target=new THREE.Vector3(player.root.position.x,player.root.position.y+1.0,player.root.position.z);
 const offset=new THREE.Vector3(Math.sin(cameraYaw)*10,4.2+cameraPitch*6,Math.cos(cameraYaw)*10);
 camera.position.lerp(target.clone().add(offset),1-Math.exp(-5*dt));camera.lookAt(target);
 if(state.toastTimer>0){state.toastTimer-=dt;if(state.toastTimer<=0)ui.toast.classList.remove("show")}
}
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04),time=clock.elapsedTime;update(dt,time);renderer.render(scene,camera)}
renderUI();say("Welcome! Buy upgrades to grow your factory.");loop();
