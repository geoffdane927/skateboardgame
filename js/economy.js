// All upgrade costs are calibrated with payback = cost / added income per second.
// Ordinary upgrades target roughly 18-22 seconds; floor unlocks target a short progression gate.
export const STARTING_CASH = 250;
export const STARTING_INCOME = 5;
export const FLOORS = [
 {name:"Ground Floor",height:0,unlockCost:0,theme:0x2f766b,upgrades:[
  {id:"starter",name:"Starter Conveyor",cost:80,rate:4,desc:"A little money machine."},
  {id:"steel",name:"Steel Dropper",cost:150,rate:8,desc:"Faster parts, more profit."},
  {id:"double",name:"Dual Conveyor",cost:300,rate:16,desc:"Two production lines."},
  {id:"gold",name:"Gold Collector",cost:600,rate:32,desc:"Premium-value products."}
 ]},
 {name:"Factory Floor",height:6,unlockCost:1200,theme:0x3e6ca1,upgrades:[
  {id:"press",name:"Hydraulic Press",cost:500,rate:28,desc:"Heavy-duty production."},
  {id:"robot",name:"Robot Arm",cost:1000,rate:55,desc:"Automated assembly."},
  {id:"laser",name:"Laser Cutter",cost:2200,rate:115,desc:"Precision manufacturing."},
  {id:"fusion",name:"Fusion Furnace",cost:4800,rate:240,desc:"High-output production."}
 ]},
 {name:"Research Floor",height:12,unlockCost:12000,theme:0x8053a6,upgrades:[
  {id:"lab",name:"Prototype Lab",cost:4000,rate:210,desc:"Turn ideas into income."},
  {id:"drone",name:"Drone Swarm",cost:8500,rate:430,desc:"A fleet of tiny workers."},
  {id:"quantum",name:"Quantum Printer",cost:18000,rate:900,desc:"Print valuable components."},
  {id:"reactor",name:"Quantum Reactor",cost:40000,rate:2000,desc:"A huge production boost."}
 ]},
 {name:"Sky Floor",height:18,unlockCost:120000,theme:0xc18a35,upgrades:[
  {id:"orbital",name:"Orbital Fabricator",cost:35000,rate:1750,desc:"Manufacture beyond Earth."},
  {id:"antimatter",name:"Antimatter Engine",cost:72000,rate:3600,desc:"Dense energy, huge output."},
  {id:"dyson",name:"Mini Dyson Array",cost:150000,rate:7500,desc:"Bottle a star's power."},
  {id:"singularity",name:"Singularity Mint",cost:320000,rate:16000,desc:"The ultimate money maker."}
 ]}
];
export function paybackSeconds(upgrade){ return upgrade.cost / upgrade.rate; }
export function formatCash(n){
 if(n>=1e9)return "$"+(n/1e9).toFixed(2)+"B";
 if(n>=1e6)return "$"+(n/1e6).toFixed(2)+"M";
 if(n>=1e4)return "$"+(n/1e3).toFixed(1)+"K";
 return "$"+Math.floor(n).toLocaleString("en-US");
}
