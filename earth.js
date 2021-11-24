//(function(){
	var AMOUNT=200, d=220, R=160, adjustment=0, adaptive=true, rAtm=1.06, roAtmDeg=-52,//deg
		obliquity=23/180*3.14, roV1=.00025, roV2=0, ro1=0, ro2=-0.40, posZ=1700,
		canvas='#earth', color='#0084ff', fogC='#722779', T_earth='map.png', T_point='circle.svg',
		T_particle='data:image/gif;base64,R0lGODlhIAAgAIAAAP///wAAACH5BAEAAAEALAAAAAAgACAAQAJKjI8By51vmpyUqoqzi7oz6GVJSC5X6YEoAD1ry60TImtnjddxvh08C6PZgq0QUSiD/YDIX3O5W0qnVNRteoVGeS6nSncsHZWScQEAOw==';
// IE fix!!
	if (!Float32Array.prototype.forEach) Float32Array.prototype.__proto__=Array.prototype//, T_point='point.png'
// -------
	Object.assign(Math,THREE.Math);
	var positions=[], particles, particle, count = 0, dpr, lastW,
		W=window.innerWidth, H=window.innerHeight, aspect=W / H,
		roAtm=-Math.degToRad(roAtmDeg);

	var mouseX = 0, mouseY = 0, x0, y0;
	var vec3=(x,y,z)=>new THREE.Vector3(x||0, y||0, z||0), lookAt=vec3(), PI=Math.PI,
		canvas=document.querySelector(canvas), halo=document.querySelector('.halo'); 

	// THREE.ShaderChunk.fog_vertex='modelViewMatrix * vec4( transformed, 1.0 )';
	// THREE.ShaderChunk.fog_fragment='modelViewMatrix * vec4( transformed, 1.0 )';

	var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, canvas: canvas});//
	renderer.setSize( W, H );
	//alert()
	//renderer.context.getExtension('OES_standard_derivatives');
	var scene = new THREE.Scene(), planet = new THREE.Group(),
		camera = new THREE.PerspectiveCamera( 18, aspect, 1, 10000 );
	camera.position.z=posZ;
	//planet.position.z=-2*R;
	camera.lookAt(.5*R,0,0);
	renderer.render(scene, camera);
	
	(onresize=function(){
		W=innerWidth; H=innerHeight;
		renderer.setSize(W, H);
		renderer.setPixelRatio(window.devicePixelRatio);//( Math.max(/2, 1) );
		camera.aspect=W/H;
		camera.updateProjectionMatrix();
		canvas.style='';
		let l=camera.position.length();
		Object.assign(halo.style, {
			opacity: 1,
			left: (1+lookAt.project(camera).x)*50+'%',
			top: (1-lookAt.project(camera).y)*50+'%',
			fontSize: vec3(0, l*Math.tan(Math.asin(R/l)), 0).project(camera).y*H*rAtm/100+'px',
			transform: `rotate(${roAtmDeg}deg)`
		})
	})();
	//scene.position
	var Emap = (new THREE.TextureLoader()).load( T_earth, function(t){
		var testCanvas=document.createElement('canvas'), tCtx=testCanvas.getContext('2d'), Ew, Eh;
		var img=t.image;
		Ew=testCanvas.width=img.width; Eh=testCanvas.height=img.height;
		tCtx.scale(1, -1);
		tCtx.drawImage(img,0,-Eh);
		Egeometry.vertices.forEach(p=>{
			var u=.5-Math.atan2(-p.z, -p.x)/2/PI,
				v=.5+Math.asin(p.y/R)/PI,
				idata=tCtx.getImageData(Math.floor(u%1*Ew), Math.floor(v*Eh), 1, 1);
			if (!idata.data[0]) points0.push(p);
		})
	} );

	//Emap.anisotropy=Math.min(8, renderer.capabilities.getMaxAnisotropy())||1;
	Ematerial=new THREE.PointsMaterial({
		//envMapIntensity:4.5,
		//emissive: color,
		//color: color,
		map: Emap,
		transparent: true,
		alphaTest: 0.01,
		size: R*.06,
		color: new THREE.Color(color).multiplyScalar(.8),
		blending: 2,
		// blendSrc: THREE.SrcColorFactor,
		//blendDst: THREE.SrcColorFactor,
		depthTest: false,
		onBeforeCompile: sh=>{
			console.log (sh)
			sh.fragmentShader=sh.fragmentShader.replace('#include <map_particle_fragment>', `
		    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
		    float r = dot(cxy, cxy), delta = fwidth(r)*.5;
		    diffuseColor.a *= 1.-smoothstep(1. - delta, 1.+delta, r);
			  diffuseColor.a *= smoothstep( ${(R*.3).toFixed(1)},  ${(-R).toFixed(1)}, fogDepth-${(posZ).toFixed(1)} );
			`);
			sh.vertexShader=`
				uniform sampler2D map;
				uniform mat3 uvTransform;
			`+sh.vertexShader.replace('}', `
				vec2 vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
				if (texture2D( map, vUv ).r >.9) fogDepth=5000.;
			}`)

		}
	});//, opacity: 0
	Ematerial.extensions = {derivatives: 1};
	var Egeometry=new THREE.IcosahedronGeometry(R, 6);
	var Earth = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Egeometry.vertices), Ematerial);
	Egeometry.uv=[];
	Egeometry.vertices.forEach(v=>{
		Egeometry.uv.push(.5-Math.atan2(-v.z, -v.x)/2/PI);
		Egeometry.uv.push(.5+Math.asin(v.y/R)/PI)
	})
	Earth.geometry.addAttribute('uv', new THREE.Float32BufferAttribute(Egeometry.uv, 2));

	var Sgeometry=new THREE.IcosahedronGeometry(R*1.05, 5),
		Smaterial=new THREE.MeshPhongMaterial({
			color: color,
			transparent: true,
			onBeforeCompile: sh=>{

			}
		}), Atmosphere=new THREE.Mesh(Sgeometry, Smaterial);
	//var wGeometry=geometry.clone();
	var Pmaterial = new THREE.PointsMaterial({
		size: d*1.2,
		transparent: true,
		alphaTest: 0.01,
		depthTest: false,
		blending: 5,
		//opacity: .85,
		color: color,//.multiplyScalar(2),
		onBeforeCompile: function(sh){
			sh.vertexShader='\
attribute float flash;\n\
varying float vSize;\n\
'			+sh.vertexShader.replace(/}\s*$/, '\
  vSize=max(flash, 0.0);\n\
  gl_PointSize*=vSize;\n\
}			');
			sh.fragmentShader='\
varying float vSize;\n\
'			+sh.fragmentShader.replace("#include <map_particle_fragment>", `
	vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  float r2 = dot(cxy, cxy), delta = fwidth(r2), size=1.-vSize;
	size=1.-size*size;
	#ifdef T_POINT
	 diffuseColor.a *=1.0 - smoothstep(1. - delta, 1. + delta, r2);
	 //diffuseColor.a *= (1.+delta -r2)/delta*.5;
	#else
	 float r=sqrt(r2);
	 diffuseColor.rgb =mix(vec3(1.1), diffuse, min(r*2.3, 1.));
	 diffuseColor.a=cos(min(r2,1.)*PI)*.5+.5;
	#endif
 diffuseColor.a *= smoothstep( ${(R*.2).toFixed(1)},  ${(-R*.4).toFixed(1)}, fogDepth-${(posZ).toFixed(1)} )*size;
      `);
			// console.log(sh, sh.vertexShader, sh.fragmentShader);
		}
	});//, opacity: 0  ///  
	Pmaterial.extensions = {derivatives: 1};

	var pCount=50, points = []
	var flashes=new Float32Array(pCount);
	points32=new Float32Array(pCount*3);
	Pgeometry=new THREE.BufferGeometry();
	Pgeometry.addAttribute( 'position', new THREE.BufferAttribute( points32, 3 ) );
	Pgeometry.addAttribute( 'flash', new THREE.BufferAttribute( flashes, 1 ) );
	var Points=new THREE.Points(Pgeometry, Pmaterial)
	
	var Cpoints=new THREE.ArcCurve(0,0,R*1.2).getSpacedPoints(300),
		Cgeometry=new THREE.BufferGeometry().setFromPoints( Cpoints ),
		circle=new THREE.LineSegments( Cgeometry, new THREE.LineBasicMaterial({
			color: '#99aaff', blending: 2,
			opacity:.4, transparent: true
		})),
		halahup=new THREE.Group().add(circle);
	halahup.rotation.set(-.43, 0, 0, 'YXZ')
	circle.translateZ(-.1*R).rotateX(PI/2+.01);
	(halahup1=halahup.clone()).rotation.set(-.43, 2*PI/3, 0, 'YXZ');
	(halahup2=halahup.clone()).rotation.set(-.43, -2*PI/3, 0, 'YXZ');
	
	planet.add(Points, Earth)//, halahup, halahup1, halahup2);//new THREE.Points(geometry, Pmaterial), , tLine
	scene.add(planet);
	planet.position.z=-R

	scene.fog=new THREE.Fog(color, posZ-R/2, posZ+R);
	hLight=new THREE.HemisphereLight('#fff', 0, 20)
	light1=new THREE.PointLight('#aaf', 13)
	light2=new THREE.PointLight('#aaf', 1.5)
	scene.add(hLight, light1, light2);
	light1.position.set(1.2*R,2.3*R,-.2*R);
	light2.position.set(1.2*R,-1.2*R,-.1*R);
	hLight.position.set(0,0,1);

	var t0=new Date()*1, dMax=1000/15, dMin=1000/45, dT=1000/61, af, Pactive=[],
		axis=vec3(0,1,0).applyAxisAngle(vec3(0,0,1), obliquity), points0=[],
		pUp=0, pDn=[], flTimer=[], vecTest=new THREE.Vector3(), transStart, pLast, transactions=[],
		Tmaterial=Pmaterial.clone();
	Tmaterial.__proto__=Pmaterial;
	Tmaterial.defines={T_POINT: 1};
	Tmaterial.blending=2;
	Tmaterial.size=.06*d; Tmaterial.opacity=.75;
	Tmaterial.color.multiplyScalar(.8);
	
	function addTransaction(a,b,i){
		//console.log (pUp, a, b); //return
		var an=a.angleTo(b), l=R*1.13+an*5.5, center=a.clone().add(b).setLength(l),
		 ab=b.clone().sub(a).multiplyScalar(.25), cn=center.clone().setLength((l-R)*.7), n;//=an*160+16;
		var curve = new THREE.CurvePath();
		curve.add(new THREE.CubicBezierCurve3(a, a.clone().add(cn), center.clone().sub(ab), center));
		curve.add(new THREE.CubicBezierCurve3(center, center.clone().add(ab), b.clone().add(cn), b));
		n=curve.getLength()/R*180;

		var tFlashes=new Float32Array(n+1);
		//tFlashes.forEach(function(f,i){if (i) tFlashes[i]=tFlashes[i-1]+1/n});
		tGeometry=new THREE.BufferGeometry().setFromPoints( curve.getSpacedPoints(n) );
		tGeometry.addAttribute( 'flash', new THREE.BufferAttribute( tFlashes, 1 ) );
		transactions[i]=new THREE.Points(tGeometry, Tmaterial);
		transactions[i].timer=0;
		planet.add(transactions[i]);
	}

	function addPoint(i0, i, c=0){
		if ((c+=1)>500) return console.log(c);
		if (i0) delete flTimer[i0];
		if (!i) {
			if (!points[0]) i=0
			else points.every(function(p, j){return points[i=j+1+'']});
			if (i==pCount) return false
		}
		var fi=Math.random()*1.8, dTest;
		var point=points0[Math.floor(Math.random()*points0.length)].clone();
		var dLast, pointW=Earth.localToWorld(point.clone()).applyAxisAngle(axis, roV1*150);
		if (pointW.angleTo(camera.position)+pointW.x/R>1.9 ) return addPoint(i0, i, c);
		if (i0 &&  points[i0].distanceTo(point)>R*1.84 ) return addPoint(i0, i, c);
		if (points.some((v, i)=>(v.up>-1 || flashes[i]>.05) && v.distanceTo(point)<R*(v.pInd==i0?.18:.4))) return addPoint(i0, i, c);
		point.pInd=i;
		points[i]=point;
		point.up=point.new=+!i0;
		points32[i*3]=point.x;
		points32[i*3+1]=point.y;
		points32[i*3+2]=point.z;
		Pgeometry.attributes.position.needsUpdate=true;
		if (i0) addTransaction(points[i0], point, i)
		if (i0 && pUp<4 && Math.random()>.5) {  //fork
			flTimer[i0]=(Math.random()*300+70);
			points[i0].up=1
		}
		return true
	}
	var iframe=(parent!=this)?parent.document.querySelector('iframe.earth'):0;
	if (iframe) {
		iframe.style.width='100vw'
	}

	var animComplite, animA=[], animT;
	requestAnimationFrame(function animate() {
		animA=requestAnimationFrame(animate, canvas);
		var t=new Date()*1, dt=t-t0;
		if (!Emap.image || dt<dMin) return;//
		dt=Math.min(dt, dMax);
		t0=t;
		if (iframe) {
			var pos=iframe.getBoundingClientRect();
			if (pos.bottom<=0 || pos.top>=parent.innerHeight) return;
		}
		planet.position.z-=planet.position.z*.08;
		var dr=roV1*dt, ro3=dr*4.81, ro4=dr*4.3;
		ro1+=dr; ro2+=roV2*dt;
		planet.rotation.set(0,0,0);
		planet.rotateY(PI/5).rotateZ(obliquity).rotateY(ro1);
		var count=0, newTr, newP, pAdded=0, maxDn=Math.random()*.6;
		pUp=0;
		if (!points.length) addPoint();
		points.forEach(function(p,i){
			if ((flTimer[i]-=dt)<0) pAdded=1, addPoint(i+''), p.up=1
			count++;
			if (p.up>0) {
				if ((flashes[i]+=(1.005-flashes[i])*.005*dt) > .95 ) {
					p.up*=-1;
				}
				if (!transactions[i] && ++pUp && flashes[i]>.15) newTr=i+'';
			}
			if (p.up<0) {
				if ((flashes[i]-=(1.11-flashes[i])*flashes[i]*.006*dt) < 0.005) {
					delete points[i];
				}
				if (flashes[i]<maxDn) newP=1;
			}
			if (transactions[i]) {
				var arr=transactions[i].geometry.attributes.flash.array, n=arr.length,
					t=transactions[i].timer+=dt/700;//, tt=t*t;
				arr.forEach(function(v,j){
					var df=j/n-t, dj=n-j;
					arr[j]=(df<0) ? 1+df : 1-df*df*8
					if (!(dj%6) && dj<31) arr[j]*=Math.pow(1.14, 6-dj/6)
				});
				if ( t>1 && arr[n-1]<-0.4 ) {
					transactions[i].geometry.dispose();
					planet.remove(transactions[i]);
					delete transactions[i];
					if (!p.up) delete points[i]
				} else {
					if (t<1 || p.up>0) pUp++;
					if (t<1.4 && t>.7) newTr=i+'';
					transactions[i].geometry.attributes.flash.needsUpdate=true
				}
				if (!p.up) flashes[i] =.3+arr[n-1]*.7;
			}
		})
		if (points.length && !points[points.length-1]) points.length--;
		if (newTr) {
			var p=points[newTr];
			if (!p.startTr && (p.new || pUp<5 && Math.random()>.4) && !pAdded++) {
				p.startTr=addPoint(newTr);
				if (p.startTr && transactions[newTr] && transactions[newTr].timer>1.2) p.up=1;
			}
		}
		if (newP && pUp<2 && Math.random()<.2 && !pAdded++) addPoint();
		Pgeometry.attributes.flash.needsUpdate=true;
		renderer.render( scene, camera );
	}, canvas);
//})()