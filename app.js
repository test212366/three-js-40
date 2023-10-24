import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertexParticles.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'


import im from './download.jpg'
export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x111111, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 100,
			 10000
		)
 
		this.camera.position.set(0, 0, 600) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true


		this.getData()
		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()

 
	}

	getData() {
		this.svg = [...document.querySelectorAll('.cls-1')]

		this.lines = []

		this.svg.forEach((path, j) => {
			let len = path.getTotalLength()
			let numberOfPoints = Math.floor(len / 5)
			let points = []

	 
			for (let i = 0; i < numberOfPoints; i++) {
				let pointAt = len * i / numberOfPoints
				let p = path.getPointAtLength(pointAt)
				let randX = (Math.random()  -0.5)* 5
				let randY = (Math.random()  -0.5)* 5

				points.push(new THREE.Vector3(p.x - 1024 + randX,   p.y - 512 + randY, 0))

			}
			this.lines.push({
				id: j ,
				path,
				length: len,
				number: numberOfPoints,
				points,
				currentPos: 0,
				speed: 1
			})



		})
	 
	}


	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				resolution: {value: new THREE.Vector4()}
			},
			transparent: true,
			depthTest: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			vertexShader,
			fragmentShader
		})
		
		this.geometry = new THREE.PlaneGeometry(1,1,10,10)
		this.geometry = new THREE.BufferGeometry()
		this.max = this.lines.length * 100
		this.positions = new Float32Array(this.max * 3)
		this.opacity = new Float32Array(this.max)
 

 

		for (let i = 0; i < this.max; i++) {
			
			this.opacity.set([Math.random() / 5], i)
			this.positions.set([Math.random() * 100,Math.random() * 1000,0], i * 3)
 
		}


		this.geometry.setAttribute('position', new THREE.BufferAttribute(
			this.positions, 3
		))

		this.geometry.setAttribute('opacity', new THREE.BufferAttribute(
			this.opacity, 1
		))


		this.plane = new THREE.Points(this.geometry, this.material)
 
		this.scene.add(this.plane)
 
		let texture = new THREE.TextureLoader().load(im)
		texture.flipY = false

		let map = new THREE.Mesh(
			new THREE.PlaneGeometry(2048, 1024, 1, 1),
			new THREE.MeshBasicMaterial({
				color: 0x000066,
				map:  texture
			})

		)
		console.log(map)
		this.scene.add(map)
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	updateThings() {

		let j  = 0
		this.lines.forEach(line => {

			line.currentPos += line.speed
			line.currentPos = line.currentPos % line.number

			for (let i = 0; i < 100; i++) {
				let index = (line.currentPos + i) % line.number
				let p = line.points[index]
				this.positions.set([p.x, p.y, p.z], j * 3)
				this.opacity.set([Math.pow(i/1000, 1.3) ], j )

				j++
				
			}
		})


		this.geometry.attributes.position.array = this.positions
		this.geometry.attributes.position.needsUpdate = true
	}
	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.material.uniforms.time.value = this.time
		this.updateThings()
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 