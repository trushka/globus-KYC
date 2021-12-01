//(function(){
	var AMOUNT=200, d=220, R=160, adjustment=0, adaptive=true, rAtm=1.06, roAtmDeg=-52,//deg
		obliquity=23/180*3.14, roV1=.00025, roV2=0.0005, ro1=0, ro2=-0.40, posZ=1700,
		canvas='#earth', color='#0084ff', fogC='#722779', T_earth='map.png', T_point='circle.svg',
		T_particle='data:image/gif;base64,R0lGODlhIAAgAIAAAP///wAAACH5BAEAAAEALAAAAAAgACAAQAJKjI8By51vmpyUqoqzi7oz6GVJSC5X6YEoAD1ry60TImtnjddxvh08C6PZgq0QUSiD/YDIX3O5W0qnVNRteoVGeS6nSncsHZWScQEAOw==';
// IE fix!!
	if (!Float32Array.prototype.forEach) Float32Array.prototype.__proto__=Array.prototype//, T_point='point.png'
// -------
	Object.assign(Math,THREE.Math);
	var positions=[], particles, particle, count = 0, dpr, lastW,
		W=1, H=1, aspect=1,
		roAtm=-Math.degToRad(roAtmDeg);

	var mouseX = 0, mouseY = 0, x0, y0;
	var vec2=(x,y)=>new THREE.Vector2(x,y),
	 vec3=(x,y,z)=>new THREE.Vector3(x,y,z),
	 quat=new THREE.Quaternion(),
	 lookAt=vec3(), PI=Math.PI, wX=vec3(1,0,0), wY=vec3(0,1,0),
	 canvas=document.querySelector(canvas), container=document.querySelector('.animation'); 

	// THREE.ShaderChunk.fog_vertex='modelViewMatrix * vec4( transformed, 1.0 )';
	// THREE.ShaderChunk.fog_fragment='modelViewMatrix * vec4( transformed, 1.0 )';

	var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, canvas: canvas});//
	var rTargets=[new THREE.WebGLRenderTarget(W,H,{depthBuffer:false, stencilBuffer:false})];
	rTargets[1]=rTargets[0].clone();
	//alert()
	//renderer.context.getExtension('OES_standard_derivatives');
	var scene = new THREE.Scene(), scene2 = new THREE.Scene(), planet = new THREE.Group(),
		camera = new THREE.PerspectiveCamera( 18, aspect, 1, 10000 );
	// 	pCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	camera.position.z=posZ;
	camera.zoom=1.8;
	//planet.position.z=-2*R;
	//camera.lookAt(.5*R,0,0);
	camera.updateMatrixWorld();

	planet.rotateY(PI/5).rotateZ(obliquity)//.updateMatrixWorld();
	var pAxis=vec3(0,1,0).applyQuaternion(planet.quaternion);

	scene2.background=rTargets[0].texture;
	
	var bloom=new THREE.Mesh(0, new THREE.RawShaderMaterial({
		uniforms:{
			map: {value: rTargets[0].texture}
		},
		vertexShader: `
			precision mediump float;
			attribute vec3 position;
			attribute vec2 uv;
			varying vec2 vUv;
			void main(){
				gl_Position =vec4(position, 1.);
				vUv=uv;
			}
		`,
		fragmentShader: `
			precision mediump float;
			uniform sampler2D map;
			varying vec2 vUv;
			void main(){
				gl_FragColor = texture2D(map, vUv);
				if (gl_FragColor.a<0.0039) discard;
			}
		`
	}))
	var vVPort=window.visualViewport||{scale: 1}, rect0={};
	function resize(){
		let rect=canvas.getBoundingClientRect();
		if (W!=rect.width || H!=rect.height || dpr!=(dpr=devicePixelRatio*vVPort.scale)) {
			W=rect.width; H=rect.height;
			let w=W*dpr, h=H*dpr, j=0;
			//  geometry=bloom.geometry=new THREE.PlaneBufferGeometry(w+1, h+1, w+1, h+1)
			// geometry.addAttribute('pos', geometry.attributes.uv.clone());
			// geometry.attributes.position.array.forEach((a,i)=>{
			// 	if (i%3==2) return;
			// 	geometry.attributes.pos.array[j]=a;
			// 	geometry.attributes.uv.array[j]=a/(i?h:w)/2+.5;
			// })

			renderer.setDrawingBufferSize(W, H, dpr);
			rTargets[0].setSize(w, h);
			rTargets[1].setSize(w, h);

			//renderer.setPixelRatio(window.devicePixelRatio);//( Math.max(/2, 1) );
			camera.aspect=W/H;
			camera.updateProjectionMatrix();
		// 	camera.updateMatrixWorld();
		// 	//canvas.style='';
			let l=camera.position.length(),
				r=vec3(0, l*Math.tan(Math.asin(R/l)), 0).project(camera).y*H;
			container.style.opacity=1;
			camera.zoom*=W/1.3/r;
			camera.updateProjectionMatrix();
			// container.style.cssText+=`
			// 	opacity: 1;
			// 	--x: ${lookAt.project(camera).x*W/2}px;
			// 	--y: ${lookAt.project(camera).y*H/2}px;
			// 	font-size: ${vec3(0, l*Math.tan(Math.asin(R/l)), 0).project(camera).y*H/100}px;
			// 	--turn: ${roAtmDeg}deg
			// `
		}
		let {clientWidth:w0, clientHeight:h0}=document.documentElement
		if (rect.left<0 || rect.top <0 || rect.right>w0 || rect.top>h0) {
			//render.setScissor
		}
	};

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
	var matScale={
		set value(val) {this.val=val*camera.zoom},
		get value() {return this.val}
	}
	var Ematerial=new THREE.PointsMaterial({
		//envMapIntensity:4.5,
		//emissive: color,
		//color: color,
		map: Emap,
		transparent: true,
		alphaTest: 0.004,
		size: R*.06,
		color: new THREE.Color(color).multiplyScalar(.8),
		blending: 2,
		// blendSrc: THREE.SrcColorFactor,
		//blendDst: THREE.SrcColorFactor,
		depthTest: false,
		onBeforeCompile: sh=>{
			console.log (sh)
			sh.uniforms.scale=matScale;
			sh.fragmentShader=sh.fragmentShader.replace('#include <map_particle_fragment>', `
		    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
		    float r = length(cxy), delta = fwidth(r)*.5;
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
		alphaTest: 0.004,
		depthTest: false,
		blending: 5,
		//opacity: .85,
		color: color,//.multiplyScalar(2),
		onBeforeCompile: function(sh){
			sh.uniforms.scale=matScale;
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
  float r = length(cxy), delta = fwidth(r), size=1.-vSize;
	size=1.-size*size;
	#ifdef T_POINT
	 diffuseColor.a =1.0 - smoothstep(1. - delta, 1. + delta, r);
	 //diffuseColor.a = (1.+delta -r)/delta;
	#else
	 //float r=sqrt(r2);
	 diffuseColor.rgb =mix(vec3(1.1), diffuse, min(r*2.3, 1.));
	 diffuseColor.a=cos(min(r*r,1.)*PI)*.5+.5;
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

	var t0=performance.now(), dMax=1000/15, dMin=1000/45, dT=1000/61, af, Pactive=[],
		axis=vec3(0,1,0).applyAxisAngle(vec3(0,0,1), obliquity), points0=[],
		pUp=0, pDn=[], flTimer=[], vecTest=new THREE.Vector3(), transStart, pLast, transactions=[],
		Tmaterial=Pmaterial.clone();
	Tmaterial.__proto__=Pmaterial;
	Tmaterial.defines={T_POINT: 1};
	Tmaterial.blending=2;
	Tmaterial.size=.047*d; Tmaterial.opacity=.75;
	Tmaterial.color.multiplyScalar(.8);
	
	function addTransaction(a,b,i){
		//console.log (pUp, a, b); //return
		var an=a.angleTo(b), l=R*1.13+an*5.5, center=a.clone().add(b).setLength(l),
		 ab=b.clone().sub(a).multiplyScalar(.25), cn=center.clone().setLength((l-R)*.7), n;//=an*160+16;
		var curve = new THREE.CurvePath();
		curve.add(new THREE.CubicBezierCurve3(a, a.clone().add(cn), center.clone().sub(ab), center));
		curve.add(new THREE.CubicBezierCurve3(center, center.clone().add(ab), b.clone().add(cn), b));
		n=curve.getLength()/R*200;

		var tFlashes=new Float32Array(n+1);
		//tFlashes.forEach(function(f,i){if (i) tFlashes[i]=tFlashes[i-1]+1/n});
		tGeometry=new THREE.BufferGeometry().setFromPoints( curve.getSpacedPoints(n) );
		tGeometry.addAttribute( 'flash', new THREE.BufferAttribute( tFlashes, 1 ) );
		transactions[i]=new THREE.Points(tGeometry, Tmaterial);
		transactions[i].timer=0;
		transactions[i].n=n;
		planet.add(transactions[i]);
	}

	function addPoint(i0, i, c=0){
		if ((c+=1)>1500) return console.log(c);
		if (i0) delete flTimer[i0];
		if (!i) {
			if (!points[0]) i=0
			else points.every(function(p, j){return points[i=j+1+'']});
			if (i>=pCount && (!i0 || points[i0].isNew)) return false
		}
		var fi=Math.random()*1.8, dTest;
		var point=points0[Math.floor(Math.random()*points0.length)].clone();
		var dLast, pointW=Earth.localToWorld(point.clone()).applyAxisAngle(axis, roV1*150);
		if (pointW.angleTo(camera.position)+pointW.x/R>1.9 ) return addPoint(i0, i, c);
		if (i0 &&  points[i0].distanceTo(point)>R*1.84 ) return addPoint(i0, i, c);
		if (points.some((v, i)=>(v.up>-1 || flashes[i]>.05) && v.distanceTo(point)<R*(v.pInd==i0?.18:.4))) return addPoint(i0, i, c);
		point.pInd=i;
		points[i]=point;
		point.isNew=!i0;
		point.up=point.new=+!i0;
		points32[i*3]=point.x;
		points32[i*3+1]=point.y;
		points32[i*3+2]=point.z;
		Pgeometry.attributes.position.needsUpdate=true;
		if (i0) addTransaction(points[i0], point, i)
		if (i0 && pUp<6 && Math.random()>.65) {  //fork
			flTimer[i0]=Math.random()<.5?Math.random()*200+230:Math.random()*100;
			points[i0].up=1
		}
		return true
	}
	var iframe=(parent!=window);
	if (iframe) {
		parent.document.querySelector('iframe').forEach(fr=>{
			if (ifr.contentWindow===window) iframe=fr
		})
		iframe.style.width='100vw'
	}

	// interactions
	var dx = 0, dy = 0, ready, pointers={},
		raycaster = new THREE.Raycaster(),
		mouse = new THREE.Vector2();
	container.addEventListener('pointerdown', e=>{
		pointers[e.pointerId]={
			x0 : e.clientX,
			y0 : e.clientY
		}
		e.preventDefault();
	});
	window.addEventListener('pointermove', e=>{
		if (!ready || !pointers[e.pointerId]) return;
		e.preventDefault();
		let p=pointers[e.pointerId];
		dx = Math.lerp(dx, p.x0-(p.x0 = e.clientX), .3);
		dy = Math.lerp(dy, p.y0-(p.y0 = e.clientY), .3);
		//console.log(e.type, active.identifier, dx, x0)
		ready = 0;
	});
	window.addEventListener('pointercancel', e=>delete pointers[e.pointerId]);
	window.addEventListener('pointerup', e=>delete pointers[e.pointerId]);

	var animComplite, animA=[], animT;
	requestAnimationFrame(function animate() {
		animA=requestAnimationFrame(animate, canvas);
		resize();
		var t=performance.now(), dt=t-t0;
		if (!Emap.image) return;// || dt<dMin
		dt=Math.min(dt, dMax);
		t0=t;
		if (iframe) {
			var pos=iframe.getBoundingClientRect();
			if (pos.bottom<=0 || pos.top>=parent.innerHeight) return;
		}
		planet.position.z-=planet.position.z*.08;
		//pAxis.applyAxisAngle(wY, roV2*dt);
		planet.rotateOnWorldAxis(pAxis, roV1*dt);

		var ax=vec3(0,1,0).applyQuaternion(planet.quaternion);
		dx*=1-.0015*dt;
		dy*=1-.0015*dt;
		planet.rotateOnWorldAxis(wX, -dy*.005);
		planet.rotateOnWorldAxis(wY, -dx*.005);
		var aCorr=Math.sqrt(1-ax.angleTo(pAxis)/3.15);
		planet.applyQuaternion(quat.clone().setFromUnitVectors(ax, pAxis).slerp(quat, 1-.0008*dt*aCorr));

		var count=0, newTr, newP, pAdded=0, maxDn=Math.random()*.6;
		pUp=0;
		if (!points.length) addPoint();
		points.forEach(function(p,i){
			if ((flTimer[i]-=dt)<0) pAdded=1, addPoint(i+''), p.up=1
			count++;
			if (p.up>0) {
				if ((flashes[i]+=(1.005-flashes[i])*.005*dt) > .95 ) {
					p.up=-1;
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
					t=transactions[i].timer+=dt/Math.pow(transactions[i].n, .3)*.008;//, tt=t*t;
				arr.forEach(function(v,j){
					var df=j/n-t, dj=n-j;
					arr[j]=(df<0) ? 1+df : +(df<.2)*(1-df*df*8);

					if (!(dj%6) && dj<31) arr[j]*=Math.pow(1.14, 6-dj/6)
				});
				if ( t>1 && arr[n-1]<-0.4 ) {
					transactions[i].geometry.dispose();
					planet.remove(transactions[i]);
					delete transactions[i];
					if (!p.up) delete points[i]
				} else {
					if (t<1 || p.up>0) pUp++;
					if (t<1.4 && t>.8) newTr=i+'';
					transactions[i].geometry.attributes.flash.needsUpdate=true
				}
				if (!p.up) flashes[i] =t>1? .3+arr[n-1]*.7:Math.smoothstep(t, .6, .95);
			}
		})
		if (points.length && !points[points.length-1]) points.length--;
		if (newTr) {
			var p=points[newTr];
			if (!p.startTr && (p.new || pUp<7 && Math.random()>.4) && !pAdded++) {
				p.startTr=addPoint(newTr);
				if (p.startTr && transactions[newTr] && transactions[newTr].timer>1.2) p.up=1;
			}
		}
		if (newP && pUp<2 && Math.random()<.2 && !pAdded++) addPoint();
		Pgeometry.attributes.flash.needsUpdate=true;
		renderer.render( scene, camera)//, rTargets[0] );
		//renderer.render( bloom, pCamera );
		ready=1;
	}, canvas);
//})()