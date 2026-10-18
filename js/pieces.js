export function makePiece(THREE, deps, type) {
 const {concrete,dark,yellow,metal,mat,box}=deps;

 const g=new THREE.Group();g.userData.isPiece=true;g.userData.type=type;
 if(type==='ramp'){const shape=new THREE.Shape();shape.moveTo(-2,0);shape.lineTo(2,0);shape.lineTo(2,0.12);shape.lineTo(-1.4,1.4);shape.lineTo(-2,1.4);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:3,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-1.5,0,0);const m=new THREE.Mesh(geo,concrete);m.castShadow=m.receiveShadow=true;g.add(m);box(g,3,.12,3, dark,0,.04,0);}
 if(type==='quarter'){const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-2,0,0),new THREE.Vector3(1.5,0,0),new THREE.Vector3(2,2.5,0));const pts=curve.getPoints(18);const verts=[];for(let i=0;i<pts.length;i++){verts.push(pts[i].x,pts[i].y, -1.5,pts[i].x,pts[i].y,1.5)}const indices=[];for(let i=0;i<pts.length-1;i++){let a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x9ba5a6,side:THREE.DoubleSide,roughness:.7}));m.castShadow=m.receiveShadow=true;g.add(m);box(g,4,.14,3,dark,0,.03,0);const lip=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,3,10),metal);lip.rotation.x=Math.PI/2;lip.position.set(2,2.5,0);g.add(lip);}
 if(type==='rail'){const postGeo=new THREE.CylinderGeometry(.07,.09,.55,8);for(let z of [-.95,.95]){const p=new THREE.Mesh(postGeo,dark);p.position.set(0,.28,z);p.castShadow=true;g.add(p)}const rail=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,3.2,10),metal);rail.rotation.x=Math.PI/2;rail.position.set(0,.62,0);rail.castShadow=true;g.add(rail)}
 if(type==='wall'){box(g,3,1.6,.35,concrete,0,.8,0);box(g,3.04,.08,.4,yellow,0,1.62,0)}
 if(type==='box'){box(g,3,.45,1.1,concrete,0,.225,0);box(g,3.04,.07,1.14,metal,0,.48,0)}
 if(type==='stairs'){for(let i=0;i<4;i++)box(g,2.8,.25*(i+1),1.0,dark,0,.125*(i+1),-1.5+i*.65);box(g,3,.12,3.2,concrete,0,.05,0)}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}
