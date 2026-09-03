
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0x201033, 1.2));
  var l1 = new THREE.PointLight(0x8b5cf6, 40, 20); l1.position.set(3, 2, 3); scene.add(l1);
  var l2 = new THREE.PointLight(0x22d3ee, 30, 20); l2.position.set(-3, -1, 2); scene.add(l2);
  var l3 = new THREE.PointLight(0xf472b6, 25, 20); l3.position.set(0, 3, -3); scene.add(l3);

  // ---- organic blob: icosahedron with noise-displaced vertices ----
  function hash(x, y, z){
    var s = Math.sin(x*12.9898 + y*78.233 + z*37.719) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise3(x, y, z){
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf), w = zf*zf*(3-2*zf);
    function lerp(a,b,t){ return a + (b-a)*t; }
    var c000=hash(xi,yi,zi), c100=hash(xi+1,yi,zi), c010=hash(xi,yi+1,zi), c110=hash(xi+1,yi+1,zi);
    var c001=hash(xi,yi,zi+1), c101=hash(xi+1,yi,zi+1), c011=hash(xi,yi+1,zi+1), c111=hash(xi+1,yi+1,zi+1);
    var x00=lerp(c000,c100,u), x10=lerp(c010,c110,u), x01=lerp(c001,c101,u), x11=lerp(c011,c111,u);
    var y0=lerp(x00,x10,v), y1=lerp(x01,x11,v);
    return lerp(y0,y1,w);
  }

  var geo = new THREE.IcosahedronGeometry(1.7, 24);
  var basePositions = geo.attributes.position.array.slice();

  var mat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1230,
    emissive: 0x4c1d95,
    emissiveIntensity: 0.35,
    metalness: 0.15,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    transmission: 0.55,
    thickness: 1.4,
    ior: 1.3,
  });
  var blob = new THREE.Mesh(geo, mat);
  scene.add(blob);

  // secondary orbiting shapes
  var small1 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 16, 64), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 }));
  var small2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 }));
  scene.add(small1, small2);

  // background particles
  var pGeo = new THREE.BufferGeometry();
  var N = 400;
  var pos = new Float32Array(N*3);
  for (var i=0;i<N;i++){
    var r = 6 + Math.random()*8;
    var theta = Math.random()*Math.PI*2, phi = Math.acos(2*Math.random()-1);
    pos[i*3] = r*Math.sin(phi)*Math.cos(theta);
    pos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    pos[i*3+2] = r*Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.03, transparent: true, opacity: 0.6 });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  var clock = new THREE.Clock();
  var mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', function(e){
    mouseX = (e.clientX/window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY/window.innerHeight - 0.5) * 2;
  });

  function animate(){
    var t = clock.getElapsedTime();

    // displace blob vertices with noise for a "breathing / living" surface
    var posAttr = geo.attributes.position;
    var arr = posAttr.array;
    for (var i=0;i<arr.length;i+=3){
      var bx = basePositions[i], by = basePositions[i+1], bz = basePositions[i+2];
      var len = Math.sqrt(bx*bx+by*by+bz*bz);
      var nx = bx/len, ny = by/len, nz = bz/len;
      var n = noise3(nx*1.8 + t*0.25, ny*1.8 + t*0.2, nz*1.8);
      var disp = 1 + n*0.28;
      arr[i] = nx*len*disp;
      arr[i+1] = ny*len*disp;
      arr[i+2] = nz*len*disp;
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    blob.rotation.y = t*0.15;
    blob.rotation.x = Math.sin(t*0.1)*0.15;

    small1.position.set(Math.cos(t*0.6)*2.6, Math.sin(t*0.6)*1.2, Math.sin(t*0.4)*1.5);
    small1.rotation.x = t; small1.rotation.y = t*0.7;
    small2.position.set(Math.sin(t*0.5)*2.3, Math.cos(t*0.7)*1.6, Math.cos(t*0.4)*1.3);
    small2.rotation.x = t*1.2;

    particles.rotation.y = t*0.02;

    camera.position.x += (mouseX*1.2 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY*0.8 - camera.position.y) * 0.03;
    camera.lookAt(0,0,0);

    l1.position.x = Math.cos(t*0.5)*4;
    l1.position.z = Math.sin(t*0.5)*4;
    l2.position.x = Math.cos(t*0.3+2)*4;
    l2.position.y = Math.sin(t*0.3+2)*3;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
