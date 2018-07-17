import * as THREE from 'three';
import PointerLockControls from 'threejs-controls/PointerLockControls';
import baseVertex from '../shaders/base.vertex.glsl';
import baseFragment from '../shaders/base.fragment.glsl';



var camera, scene, renderer, controls, count, colors, composer;
var objects = [];
var raycaster;
var blocker = document.getElementById( 'container' );

var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();

var clicked = false;
var movementSpeed = 80;
var totalObjects = 1000;
var objectSize = 10;
var sizeRandomness = 4000;
var dirs = [];
var parts = [];
// color explosion
var colors2 = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];


var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		if ( havePointerLock ) {
			var element = document.body;
			var pointerlockchange = function (event) {
				if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
					controlsEnabled = true;
					controls.enabled = true;
					blocker.style.display = 'none';
				} else {
					controls.enabled = false;
					blocker.style.display = 'block';
					instructions.style.display = '';
				}
			};
			var pointerlockerror = function ( event ) {
				instructions.style.display = '';
			};
			// Hook pointer lock state change events
			document.addEventListener( 'pointerlockchange', pointerlockchange, false );
			document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
			document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
			document.addEventListener( 'pointerlockerror', pointerlockerror, false );
			document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
			document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
			instructions.addEventListener( 'click', function ( event ) {
				instructions.style.display = 'none';
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();
			}, false );
		} else {
			instructions.innerHTML = 'Votre navigateur n\'est pas apdaté avec la librairie PointerLock';
		}
				
init();
animate();

function init() {
	renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				document.body.appendChild( renderer.domElement );
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
	scene = new THREE.Scene();

	scene.fog = new THREE.Fog( 0xffff, 0, 750 );
	scene.background = new THREE.Color( 0xbfd1e5 );
	var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.95 );
	light.position.set( 0.5, 1, 0.75 );
	scene.add( light );
	// add deplacement
	controls = new PointerLockControls( camera );
	controlsEnabled = true;
	controls.enabled = true;
	scene.add(controls.getObject());
	var onKeyDown = function (event) {
		switch ( event.keyCode ) {
			case 38: // up
			case 90: // z
				moveForward = true;
				break;
			case 37: // left
			case 81: // q
				moveLeft = true; break;
			case 40: // down
			case 83: // s
				moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				moveRight = true;
				break;
			case 32: // space
				if (canJump === true){
					velocity.y += 250;	
				}
				canJump = false;
				break;
			case 17: // add cube
				break;
		}
	};
	
	var onKeyUp = function (event) {
		switch(event.keyCode) {
			case 38: // up
			case 90: // w
				moveForward = false;
				break;
			case 37: // left
			case 81: // Q
				moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				moveBackward = false;
				break;
			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}
	}
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
	raycaster = new THREE.Raycaster();
	
	// floor
	var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 200, 50 );
	floorGeometry.rotateX( - Math.PI / 2 );
	// vertex displacement
	var position = floorGeometry.attributes.position;
	for ( var i = 0; i < position.count; i ++ ) {
		vertex.fromBufferAttribute( position, i );
		vertex.x += Math.random() * 20 - 10;
		vertex.y += Math.random() * 2;
		vertex.z += Math.random() * 20 - 10;
		position.setXYZ( i, vertex.x, vertex.y, vertex.z );
	}
	floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
	count = floorGeometry.attributes.position.count;
	colors = [];7
	/*for ( var i = 0; i < count; i ++ ) {
		color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
		colors.push( color.r, color.g, color.b );
	}
	floorGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
	*/
	var floorTexture= new THREE.TextureLoader().load( 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/grass.png' );
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(900, 900 );


	var floor = new THREE.Mesh( floorGeometry, new THREE.MeshLambertMaterial( { map: floorTexture } )  );	
	scene.add( floor );

	window.addEventListener( 'resize', onWindowResize, false );

}


function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
	requestAnimationFrame( animate );
	if ( controlsEnabled === true ) {
		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.y -= 10;
		var intersections = raycaster.intersectObjects( objects );
		var onObject = intersections.length > 0;
		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;
		velocity.x -= velocity.x * 10.0 * delta;
		// Vitesse de deplacement
		velocity.z -= velocity.z * 10.0 * delta;
		// hauteur du saut
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveLeft ) - Number( moveRight );
		direction.normalize(); // this ensures consistent movements in all directions
		//autorisation des deplacement en avant et en arriere
		if ( moveForward || moveBackward ){
			velocity.z -= direction.z * 400.0 * delta;
		}
		//autorisation des deplacement a gauche et a droite
		if ( moveLeft || moveRight ){
			velocity.x -= direction.x * 400.0 * delta;
		}
		// Verrifie s'il y a des objets, si oui on peut sauter sur cette objet
		if ( onObject === true ) {
			velocity.y = Math.max( 0, velocity.y );
			canJump = true;
		}

		controls.getObject().translateX( velocity.x * delta );
		controls.getObject().translateY( velocity.y * delta );
		controls.getObject().translateZ( velocity.z * delta );
		if ( controls.getObject().position.y < 10 ) {
			velocity.y = 0;
			controls.getObject().position.y = 10;
			canJump = true;
		}
		prevTime = time;
		raycaster.setFromCamera( new THREE.Vector2(), camera );
		var intersects = raycaster.intersectObjects( objects );
		//verifie l'obstracle si y en pas et créer un cube
		if(clicked && intersects.length===0){
			
			addCube();
			clicked = false;
		}// sinon
		else if(intersects.length > 0 ){
			for ( var i = 0; i < intersects.length; i++ ) {
				if(intersects[ i ].distance <= 30){
					if(clicked) {
						scene.remove(intersects[ i ].object);
						var int2 = objects.indexOf(intersects[ i ].object);
						objects.splice(int2, 1);
						parts.push(new ExplodeAnimation(0,0));
						render();
						clicked = false;
					}
				}
			}	
		}
		renderer.render(scene,camera)
	}

	window.addEventListener( 'mousedown', onMouseDown, false );
	
}

/* Création du cube  */
function addCube () { 
	// pour eviter de créer des cubes quand on a les instruction affichés
	if(instructions.style.display=="none"){
		// Création de l'objet cube
		var boxGeometry =new THREE.BoxBufferGeometry( 10, 10, 10 );
		colors = [];
		
	/*	for ( var i = 0; i < count; i ++ ) {
			color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
			colors.push( color.r, color.g, color.b );
		}*/
		
	///	boxGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
		boxGeometry = boxGeometry.toNonIndexed();
		count = boxGeometry.attributes.position.count;
		
		// ajout du shader
		var shader = new THREE.ShaderMaterial({
		vertexShader: baseVertex,
		fragmentShader: baseFragment
		})

		// ajout des textures
		// cube en couleur
		/*var boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors } );
		boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );*/
		var box = new THREE.Mesh( boxGeometry, shader );
		var directionControl = controls.getDirection(new THREE.Vector3());
		box.position.x = controls.getObject().position.x + directionControl.x * 50;
		box.position.y = controls.getObject().position.y - 4;
		box.position.z = controls.getObject().position.z + directionControl.z * 50;
		scene.add(box);

		objects.push(box);
	}
}


/*  Animation des explosion */
function ExplodeAnimation(x,y)
{
	var geometry = new THREE.Geometry();

	for (var i = 0; i < totalObjects ; i ++) 
	{ 
		var vertex = new THREE.Vector3();
		vertex.x = x
		vertex.y = y
		vertex.z = THREE.Math.randFloatSpread( 500 );

		geometry.vertices.push( vertex );
		dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),y:(Math.random() * movementSpeed)-(movementSpeed/2),z:(Math.random() * movementSpeed)-(movementSpeed/2)});
	}
	
	var material = new THREE.PointsMaterial( { size: objectSize,  color: colors2[Math.round(Math.random() * colors2.length)],depthWrite: false,blending: THREE.AdditiveBlending});
	var particles = new THREE.Points( geometry, material );

	this.object = particles;
	this.status = true;

	this.xDir = (Math.random() * movementSpeed)-(movementSpeed);
	this.yDir = (Math.random() * movementSpeed)-(movementSpeed);
	this.zDir = (Math.random() * movementSpeed)-(movementSpeed);

	// ajout tous les particules
	scene.add(this.object); 

	// dispersion des particule
	this.update = function(){
		if (this.status == true){
			var pCount = totalObjects;
			while(pCount--) {
				var particle =  this.object.geometry.vertices[pCount]
				particle.y += dirs[pCount].y;
				particle.x += dirs[pCount].x;
				particle.z += dirs[pCount].z;
			}
			this.object.geometry.verticesNeedUpdate = true;
		}
	}
}

/* action de disparition des particule */
function render() {

	requestAnimationFrame( render );
	var pCount = parts.length;

	while(pCount--) {
		parts[pCount].update();
	}

	//renderer.render( scene, camera );

}

/******** Events ******/


			
var onMouseDown = function ( event ) {
	if(event.button == 0){
		clicked = true ;
	}
	
}



