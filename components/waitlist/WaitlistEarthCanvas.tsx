"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"

const ARC_COUNT = 40
const ARC_DIV = 48
const BG_STARS = 260

/** World size of the night map plane — large so framed view is mostly Earth, not empty space. */
const PANEL_W = 54
const PANEL_H = 28

/** NASA SVS equirectangular “Earth at Night” (public domain) — bundled in /public for offline loads. */
const NIGHT_MAP_PATH = "/waitlist/earth-night.png"

/** Brighter pulses along arcs (vertex colors); scaled again in the update loop. */
function shootingStarBrightness(s: number, phase: number, tailLen = 0.19): number {
  let b = 0.04
  b += Math.exp(-0.5 * Math.pow((s - phase) / 0.012, 2)) * 7.2
  if (s < phase && phase - s < tailLen) {
    const u = (phase - s) / tailLen
    b += Math.pow(1 - u, 2.4) * 2.85
  }
  if (phase < tailLen && s > 1 - (tailLen - phase)) {
    const u = (1 - s + phase) / tailLen
    b += Math.pow(1 - u, 2.4) * 2.35
  }
  return Math.min(b, 12)
}

const ARC_COLOR_GAIN = 1.55

function rng01(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Scatter “hubs” across the full panel for long-distance arcs. */
function buildPanelPins(count: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < count; i++) {
    const u = rng01(i, 1.7)
    const v = rng01(i, 2.3)
    const x = (u - 0.5) * PANEL_W * 0.94
    const y = (v - 0.5) * PANEL_H * 0.94
    pts.push(new THREE.Vector3(x, y, 0.08))
  }
  return pts
}

const nightPlaneVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nightPlaneFragment = /* glsl */ `
  uniform float uMapReady;
  uniform vec3 uCamPos;
  uniform sampler2D uNightMap;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    vec2 mapUv = vec2(fract(uv.x), uv.y);
    vec4 tex = texture2D(uNightMap, mapUv);
    float lum = max(tex.r, max(tex.g, tex.b));
    float lights = smoothstep(0.018, 0.14, lum);

    vec3 deep = vec3(0.0, 0.003, 0.012);
    vec3 shallow = vec3(0.012, 0.038, 0.09);
    vec3 ocean = mix(deep, shallow, lights * 0.35);

    vec3 warm = vec3(1.0, 0.78, 0.42);
    vec3 coolHi = vec3(1.0, 0.95, 0.72);
    vec3 cityCol = mix(warm, coolHi, smoothstep(0.35, 0.95, lum)) * pow(lum, 0.62) * 8.8 * lights;

    float starField = smoothstep(0.62, 0.94, uv.y) * (1.0 - smoothstep(0.0, 0.22, lum));
    float stars = step(0.993, hash(floor(uv * vec2(820.0, 460.0))));
    vec3 starCol = vec3(0.20, 0.48, 0.98) * stars * starField * 0.42;

    vec3 col = ocean + cityCol + starCol;

    vec3 V = normalize(uCamPos - vWorldPos);
    float ndv = max(0.0, dot(vWorldNormal, V));
    float edge = pow(1.0 - ndv, 2.35);
    col += vec3(0.12, 0.38, 0.96) * edge * 0.32;
    float limbLow = smoothstep(0.12, 0.0, uv.y);
    col += vec3(0.18, 0.44, 0.96) * limbLow * 0.4;

    // Soften plane card edges into page black (not a hard floating rectangle)
    float ex = smoothstep(0.0, 0.07, uv.x) * smoothstep(1.0, 0.93, uv.x);
    float ey = smoothstep(0.0, 0.06, uv.y) * smoothstep(1.0, 0.92, uv.y);
    float panelFade = ex * ey;
    col = mix(col * 0.35, col, panelFade);

    col *= mix(0.55, 1.0, uMapReady);

    gl_FragColor = vec4(col, 1.0);
  }
`

type WaitlistEarthCanvasProps = {
  className?: string
}

export function WaitlistEarthCanvas({ className }: WaitlistEarthCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isCoarse = window.innerWidth < 640 || (navigator.hardwareConcurrency ?? 8) < 4

    const renderer = new THREE.WebGLRenderer({
      canvas: cv,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
    const dpr = Math.min(window.devicePixelRatio, isCoarse ? 1.75 : 2.25)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = reducedMotion ? 0.56 : 0.74
    const w0 = Math.max(1, cv.clientWidth)
    const h0 = Math.max(1, cv.clientHeight)
    renderer.setSize(w0, h0, false)

    const scene = new THREE.Scene()

    const cam = new THREE.PerspectiveCamera(50, w0 / h0, 0.1, 200)
    cam.position.set(0, 0.1, 8.85)

    const panelGroup = new THREE.Group()
    panelGroup.rotation.x = -0.34
    panelGroup.rotation.y = 0.07
    panelGroup.position.set(0, -0.28, 0)
    scene.add(panelGroup)

    const mapPlaceholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat)
    mapPlaceholder.needsUpdate = true

    const nightMat = new THREE.ShaderMaterial({
      uniforms: {
        uCamPos: { value: new THREE.Vector3() },
        uNightMap: { value: mapPlaceholder },
        uMapReady: { value: 0 },
      },
      vertexShader: nightPlaneVertex,
      fragmentShader: nightPlaneFragment,
    })

    let composer: EffectComposer | null = null
    const renderFrame = () => {
      nightMat.uniforms.uCamPos.value.copy(cam.position)
      if (composer) composer.render()
      else renderer.render(scene, cam)
    }

    let nightMapTex: THREE.Texture = mapPlaceholder
    let earthEffectDisposed = false
    new THREE.TextureLoader().load(
      NIGHT_MAP_PATH,
      (tex) => {
        if (earthEffectDisposed) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = true
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        mapPlaceholder.dispose()
        nightMapTex = tex
        nightMat.uniforms.uNightMap.value = tex
        nightMat.uniforms.uMapReady.value = 1
        renderFrame()
      },
      undefined,
      () => {
        if (!earthEffectDisposed) {
          nightMat.uniforms.uMapReady.value = 0.25
          renderFrame()
        }
      },
    )
    const planeGeo = new THREE.PlaneGeometry(PANEL_W, PANEL_H, 1, 1)
    const panelMesh = new THREE.Mesh(planeGeo, nightMat)
    panelGroup.add(panelMesh)

    const pins = buildPanelPins(56)
    const arcLines: THREE.Line[] = []
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3())
    const mid = new THREE.Vector3()
    const ctrl = new THREE.Vector3()

    const pinN = Math.max(pins.length, 1)
    for (let k = 0; k < ARC_COUNT; k++) {
      const i0 = k % pinN
      const span = 7 + (k % 13) + Math.floor(k / 3) * 2
      let i1 = (i0 + span) % pinN
      if (i1 === i0) i1 = (i0 + 1) % pinN
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(ARC_DIV * 3)
      const col = new Float32Array(ARC_DIV * 3)
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3))
      const useGold = k % 3 !== 0
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const line = new THREE.Line(geo, mat)
      line.frustumCulled = false
      const speed = 0.092 + (k % 11) * 0.007
      line.userData = { i0, i1, useGold, speed, phase0: k * 0.163 }
      panelGroup.add(line)
      arcLines.push(line)
    }

    const arcPointCache: THREE.Vector3[][] = arcLines.map(() => [])

    const initArcGeometry = () => {
      for (let k = 0; k < arcLines.length; k++) {
        const line = arcLines[k]
        const { i0, i1 } = line.userData as { i0: number; i1: number }
        if (!pins[i0] || !pins[i1]) continue
        const a = pins[i0]
        const b = pins[i1]
        mid.addVectors(a, b).multiplyScalar(0.5)
        const chord = a.distanceTo(b)
        const lift = 0.85 + Math.min(2.4, chord * 0.12)
        ctrl.set(mid.x, mid.y, mid.z + lift)
        curve.v0.copy(a)
        curve.v1.copy(ctrl)
        curve.v2.copy(b)
        const pts = curve.getPoints(ARC_DIV - 1)
        arcPointCache[k] = pts
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute
        const parr = posAttr.array as Float32Array
        const n = pts.length
        for (let p = 0; p < n; p++) {
          parr[p * 3] = pts[p].x
          parr[p * 3 + 1] = pts[p].y
          parr[p * 3 + 2] = pts[p].z
        }
        posAttr.needsUpdate = true
        line.geometry.setDrawRange(0, n)
      }
    }
    initArcGeometry()

    const updateArcColors = (t: number) => {
      for (let k = 0; k < arcLines.length; k++) {
        const line = arcLines[k]
        const pts = arcPointCache[k]
        if (!pts.length) continue
        const colAttr = line.geometry.attributes.color as THREE.BufferAttribute
        const carr = colAttr.array as Float32Array
        const n = pts.length
        const ud = line.userData as { useGold?: boolean; speed?: number; phase0?: number }
        const speed = ud.speed ?? 0.1
        const phase = reducedMotion
          ? ((ud.phase0 ?? 0) % 1 + 1) % 1
          : (t * speed + (ud.phase0 ?? 0)) % 1
        const warm = ud.useGold === true
        const r = warm ? 1.0 : 0.48
        const g = warm ? 0.96 : 0.86
        const bch = warm ? 0.72 : 1.0
        for (let p = 0; p < n; p++) {
          const s = n > 1 ? p / (n - 1) : 0
          const br = shootingStarBrightness(s, phase) * ARC_COLOR_GAIN
          carr[p * 3] = r * br
          carr[p * 3 + 1] = g * br
          carr[p * 3 + 2] = bch * br
        }
        colAttr.needsUpdate = true
      }
    }

    const starPos = new Float32Array(BG_STARS * 3)
    const starSize = new Float32Array(BG_STARS)
    for (let i = 0; i < BG_STARS; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 120
      starPos[i * 3 + 1] = (Math.random() - 0.15) * 80
      starPos[i * 3 + 2] = -Math.random() * 35 - 10
      starSize[i] = Math.random() * 0.035 + 0.012
    }
    const sGeo = new THREE.BufferGeometry()
    sGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3))
    sGeo.setAttribute("size", new THREE.BufferAttribute(starSize, 1))
    const sMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        varying float vA;
        void main() {
          vA = 0.2 + 0.8 * (size / 0.05);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vA;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (length(c) > 0.5) discard;
          float s = smoothstep(0.5, 0.22, length(c));
          gl_FragColor = vec4(0.62, 0.82, 1.0, s * vA * 0.16);
        }
      `,
    })
    scene.add(new THREE.Points(sGeo, sMat))

    if (!reducedMotion) {
      composer = new EffectComposer(renderer)
      composer.setPixelRatio(dpr)
      composer.addPass(new RenderPass(scene, cam))
      const bloom = new UnrealBloomPass(new THREE.Vector2(w0, h0), 0.38, 0.42, 0.52)
      bloom.threshold = isCoarse ? 0.78 : 0.66
      bloom.strength = isCoarse ? 0.14 : 0.2
      bloom.radius = 0.3
      composer.addPass(bloom)
    }

    const resize = () => {
      const w = Math.max(1, cv.clientWidth)
      const h = Math.max(1, cv.clientHeight)
      renderer.setSize(w, h, false)
      cam.aspect = w / h
      cam.updateProjectionMatrix()
      composer?.setSize(w, h)
      renderFrame()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    queueMicrotask(resize)

    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = (performance.now() - t0) * 0.001
      updateArcColors(t)
      renderFrame()
    }
    tick()

    return () => {
      earthEffectDisposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      composer?.dispose()
      renderer.dispose()
      planeGeo.dispose()
      nightMapTex.dispose()
      nightMat.dispose()
      sGeo.dispose()
      sMat.dispose()
      arcLines.forEach((ln) => {
        ln.geometry.dispose()
        ;(ln.material as THREE.Material).dispose()
      })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "block h-full w-full"}
      aria-hidden
    />
  )
}
