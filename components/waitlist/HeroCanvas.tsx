"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"

const STUDENT_N = 56
const COMPANY_N = 28
const FIELD = 15.5
const PROXIMITY = 4.0
const MATCH_DIST = 2.85
const MATCH_IN = 820
const MATCH_HOLD = 3200
const MATCH_OUT = 900
const MATCH_TOTAL = MATCH_IN + MATCH_HOLD + MATCH_OUT
const COOLDOWN_FRAMES = 220
const MAX_MATCHES = 22
const MAX_DIM_LINES = 220
const STARS = 420
const CURVE_SEGS = 36

/** Central hero globe + surface connection arcs */
const MAIN_GLOBE_R = 4.25
const NODE_INNER_CLEAR = 6.35
const GLOBE_PIN_N = 24
const GLOBE_ARC_SEGS = 22
const GLOBE_ARC_PAIRS = 26

/** Apple system blue (sRGB hex) */
const APPLE_BLUE = 0x0071e3
const APPLE_BLUE_R = ((APPLE_BLUE >> 16) & 0xff) / 255
const APPLE_BLUE_G = ((APPLE_BLUE >> 8) & 0xff) / 255
const APPLE_BLUE_B = (APPLE_BLUE & 0xff) / 255

/** One shared equirectangular-style map so student + company nodes read as matching globes. */
function createGlobeTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, "#000814")
  sky.addColorStop(0.25, "#001e40")
  sky.addColorStop(0.5, "#0071e3")
  sky.addColorStop(0.72, "#0050a8")
  sky.addColorStop(1, "#001a2e")
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  ctx.globalCompositeOperation = "screen"
  const blobs: { x: number; y: number; r: number; a: number }[] = [
    { x: 118, y: 98, r: 88, a: 0.35 },
    { x: 268, y: 132, r: 72, a: 0.28 },
    { x: 392, y: 76, r: 58, a: 0.32 },
    { x: 60, y: 168, r: 52, a: 0.22 },
    { x: 440, y: 188, r: 64, a: 0.26 },
  ]
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
    g.addColorStop(0, `rgba(120, 210, 255, ${b.a})`)
    g.addColorStop(0.55, `rgba(0, 113, 227, ${b.a * 0.35})`)
    g.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalCompositeOperation = "overlay"
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)"
  ctx.lineWidth = 1
  for (let y = 0; y < h; y += 18) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  for (let x = 0; x < w; x += 36) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

function rnd(a: number, b: number) {
  return Math.random() * (b - a) + a
}
function easeOutQuart(t: number) {
  const x = Math.min(t, 1)
  return 1 - Math.pow(1 - x, 4)
}
function easeInOutQuart(t: number) {
  const x = Math.min(t, 1)
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2
}

function fibonacciSpherePoints(n: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  if (n < 2) return pts
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const ri = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    pts.push(new THREE.Vector3(Math.cos(theta) * ri * radius, y * radius, Math.sin(theta) * ri * radius))
  }
  return pts
}

interface NodeState {
  pos: THREE.Vector3
  vel: THREE.Vector3
  phase: number
  type: "s" | "c"
  matchPartner: number | null
  matchStartMs: number
  cooldown: number
  baseSize: number
  seed: number
}

interface PoolSlot {
  line: THREE.Line
  mat: THREE.LineBasicMaterial
  posAttr: THREE.BufferAttribute
  colAttr: THREE.BufferAttribute
  posBuf: Float32Array
  colBuf: Float32Array
  inUse: boolean
}

interface ActiveMatch {
  si: number
  ci: number
  startMs: number
  poolIdx: number
}

/** Cheap curl-ish flow — organic drift without heavy noise libs */
function flowAccel(x: number, y: number, z: number, t: number, out: THREE.Vector3) {
  const s = 0.11
  const ax = Math.sin(y * s + t * 0.31) + Math.cos(z * s * 0.7 - t * 0.22)
  const ay = Math.sin(z * s + t * 0.27) - Math.cos(x * s * 0.8 + t * 0.19)
  const az = Math.sin(x * s * 0.6 - t * 0.24) * 0.45
  out.set(ax, ay, az).multiplyScalar(0.00009)
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ nx: 0, ny: 0 })

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isCoarse = window.innerWidth < 640 || (navigator.hardwareConcurrency ?? 8) < 4

    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        nx: (e.clientX / window.innerWidth) * 2 - 1,
        ny: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true })

    const renderer = new THREE.WebGLRenderer({
      canvas: cv,
      antialias: !isCoarse,
      powerPreference: "high-performance",
    })
    const dpr = Math.min(window.devicePixelRatio, isCoarse ? 1.5 : 2)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x02060f, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = reducedMotion ? 0.55 : 0.92
    renderer.setSize(cv.clientWidth, cv.clientHeight, false)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030b18, reducedMotion ? 0.012 : 0.017)

    const cam = new THREE.PerspectiveCamera(48, cv.clientWidth / cv.clientHeight, 0.08, 140)
    cam.position.set(0, 0, 23.5)

    // ── Lighting (always) ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x446688, 0.32))
    const key = new THREE.DirectionalLight(0xe8f2ff, 1.75)
    key.position.set(10, 14, 12)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x5ac8fa, 0.62)
    rim.position.set(-12, -6, 8)
    scene.add(rim)
    const follow = new THREE.PointLight(0x0071e3, 0.85, 80, 2)
    follow.position.set(0, 0, 18)
    scene.add(follow)

    // ── HDR-ish environment (desktop only) ─────────────────────────────────
    let pmrem: THREE.PMREMGenerator | null = null
    let envRt: THREE.WebGLRenderTarget | null = null
    if (!reducedMotion && !isCoarse) {
      pmrem = new THREE.PMREMGenerator(renderer)
      pmrem.compileEquirectangularShader()
      const room = new RoomEnvironment()
      envRt = pmrem.fromScene(room, 0.035)
      scene.environment = envRt.texture
      room.dispose()
    }

    // ── Star field (soft, layered depth) ────────────────────────────────────
    const starPos = new Float32Array(STARS * 3)
    const starSizes = new Float32Array(STARS)
    for (let i = 0; i < STARS; i++) {
      starPos[i * 3] = rnd(-42, 42)
      starPos[i * 3 + 1] = rnd(-42, 42)
      starPos[i * 3 + 2] = rnd(-32, -8)
      starSizes[i] = rnd(0.02, 0.09)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute("size", new THREE.BufferAttribute(starSizes, 1))
    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vAlpha = 0.15 + 0.85 * (size / 0.09);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (220.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float soft = smoothstep(0.5, 0.15, d);
          float tw = 0.85 + 0.15 * sin(uTime * 1.3 + vAlpha * 8.0);
          vec3 starCol = vec3(0.62, 0.82, 1.0);
          gl_FragColor = vec4(starCol, soft * vAlpha * 0.38 * tw);
        }
      `,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── Matching globe instances (shared map + material family) ───────────
    const globeTex = createGlobeTexture()
    globeTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    const globeMat = new THREE.MeshPhysicalMaterial({
      map: globeTex,
      color: new THREE.Color(0xffffff),
      metalness: 0.18,
      roughness: 0.38,
      clearcoat: 0.28,
      clearcoatRoughness: 0.32,
      envMapIntensity: 1.05,
      emissive: new THREE.Color(APPLE_BLUE),
      emissiveIntensity: 0.22,
    })

    const sGeo = new THREE.SphereGeometry(0.09, 28, 20)
    const sMesh = new THREE.InstancedMesh(sGeo, globeMat, STUDENT_N)
    sMesh.frustumCulled = false
    const _c = new THREE.Color()
    for (let i = 0; i < STUDENT_N; i++) sMesh.setColorAt(i, _c.setRGB(0.78, 0.88, 1.0))
    sMesh.instanceColor!.needsUpdate = true
    scene.add(sMesh)

    const cGeo = new THREE.SphereGeometry(0.105, 28, 20)
    const cMesh = new THREE.InstancedMesh(cGeo, globeMat, COMPANY_N)
    cMesh.frustumCulled = false
    for (let i = 0; i < COMPANY_N; i++) cMesh.setColorAt(i, _c.setRGB(0.8, 0.9, 1.0))
    cMesh.instanceColor!.needsUpdate = true
    scene.add(cMesh)

    const randomOuterPoint = () => {
      const zh = FIELD * 0.42
      for (let t = 0; t < 50; t++) {
        const p = new THREE.Vector3(rnd(-FIELD, FIELD), rnd(-FIELD, FIELD), rnd(-zh, zh))
        if (p.length() >= NODE_INNER_CLEAR) return p
      }
      return new THREE.Vector3(NODE_INNER_CLEAR * 1.1, 0, 0)
    }

    // ── Central globe + arcs (pins rotate with the group) ───────────────────
    const globeGroup = new THREE.Group()
    const mainGlobeGeo = new THREE.SphereGeometry(MAIN_GLOBE_R, 48, 32)
    const mainGlobeMesh = new THREE.Mesh(mainGlobeGeo, globeMat)
    globeGroup.add(mainGlobeMesh)

    const wireGlobeGeo = new THREE.SphereGeometry(MAIN_GLOBE_R * 1.006, 36, 28)
    const wireGlobeMat = new THREE.MeshBasicMaterial({
      color: 0x5ac8fa,
      wireframe: true,
      transparent: true,
      opacity: reducedMotion ? 0.06 : 0.1,
      depthWrite: false,
    })
    globeGroup.add(new THREE.Mesh(wireGlobeGeo, wireGlobeMat))

    const globePins = fibonacciSpherePoints(GLOBE_PIN_N, MAIN_GLOBE_R)
    const globeArcLines: THREE.Line[] = []
    const globeArcMats: THREE.LineBasicMaterial[] = []
    const gArcCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    )
    const _gCtrl = new THREE.Vector3()
    const _gMid = new THREE.Vector3()

    for (let k = 0; k < GLOBE_ARC_PAIRS; k++) {
      const i0 = k % GLOBE_PIN_N
      const i1 = (i0 + 7 + (k % 5)) % GLOBE_PIN_N
      const arcGeo = new THREE.BufferGeometry()
      const arcPos = new Float32Array(GLOBE_ARC_SEGS * 3)
      arcGeo.setAttribute("position", new THREE.BufferAttribute(arcPos, 3))
      const arcMat = new THREE.LineBasicMaterial({
        color: APPLE_BLUE,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const arcLine = new THREE.Line(arcGeo, arcMat)
      arcLine.frustumCulled = false
      arcLine.userData = { i0, i1 }
      globeGroup.add(arcLine)
      globeArcLines.push(arcLine)
      globeArcMats.push(arcMat)
    }

    scene.add(globeGroup)

    const nodes: NodeState[] = []
    for (let i = 0; i < STUDENT_N; i++) {
      nodes.push({
        pos: randomOuterPoint(),
        vel: new THREE.Vector3(rnd(-0.007, 0.007), rnd(-0.006, 0.006), rnd(-0.0025, 0.0025)),
        phase: rnd(0, Math.PI * 2),
        type: "s",
        matchPartner: null,
        matchStartMs: 0,
        cooldown: 0,
        baseSize: rnd(0.88, 1.28),
        seed: rnd(0, 1000),
      })
    }
    for (let i = 0; i < COMPANY_N; i++) {
      nodes.push({
        pos: new THREE.Vector3(rnd(-FIELD, FIELD), rnd(-FIELD, FIELD), rnd(-FIELD * 0.42, FIELD * 0.42)),
        vel: new THREE.Vector3(rnd(-0.0055, 0.0055), rnd(-0.0055, 0.0055), rnd(-0.002, 0.002)),
        phase: rnd(0, Math.PI * 2),
        type: "c",
        matchPartner: null,
        matchStartMs: 0,
        cooldown: 0,
        baseSize: rnd(0.9, 1.22),
        seed: rnd(0, 1000),
      })
    }

    // Dim graph
    const dimBuf = new Float32Array(MAX_DIM_LINES * 6)
    const dimGeo = new THREE.BufferGeometry()
    const dimAttr = new THREE.BufferAttribute(dimBuf, 3)
    dimAttr.setUsage(THREE.DynamicDrawUsage)
    dimGeo.setAttribute("position", dimAttr)
    dimGeo.setDrawRange(0, 0)
    const dimMat = new THREE.LineBasicMaterial({
      color: 0x1e4a7a,
      transparent: true,
      opacity: reducedMotion ? 0.09 : 0.065,
    })
    scene.add(new THREE.LineSegments(dimGeo, dimMat))

    const vertCount = CURVE_SEGS + 1
    const matchPool: PoolSlot[] = Array.from({ length: MAX_MATCHES }, () => {
      const posBuf = new Float32Array(vertCount * 3)
      const colBuf = new Float32Array(vertCount * 3)
      const geo = new THREE.BufferGeometry()
      const posAttr = new THREE.BufferAttribute(posBuf, 3)
      posAttr.setUsage(THREE.DynamicDrawUsage)
      const colAttr = new THREE.BufferAttribute(colBuf, 3)
      colAttr.setUsage(THREE.DynamicDrawUsage)
      geo.setAttribute("position", posAttr)
      geo.setAttribute("color", colAttr)
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const line = new THREE.Line(geo, mat)
      line.visible = false
      line.frustumCulled = false
      scene.add(line)
      return { line, mat, posAttr, colAttr, posBuf, colBuf, inUse: false }
    })
    const activeMatches: ActiveMatch[] = []

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    )
    const _mid = new THREE.Vector3()
    const _ab = new THREE.Vector3()
    const _view = new THREE.Vector3()
    const _perp = new THREE.Vector3()
    const _ctrl = new THREE.Vector3()
    const _flow = new THREE.Vector3()
    const dummy = new THREE.Object3D()
    const sColor = new THREE.Color()
    const cColor = new THREE.Color()

    let camLerpX = 0
    let camLerpY = 0

    // ── Post-processing ───────────────────────────────────────────────────────
    let composer: EffectComposer | null = null
    let bloomPass: UnrealBloomPass | null = null
    if (!reducedMotion) {
      composer = new EffectComposer(renderer)
      composer.setPixelRatio(dpr)
      const rp = new RenderPass(scene, cam)
      composer.addPass(rp)
      const w = cv.clientWidth
      const h = cv.clientHeight
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.52, 0.42, 0.72)
      bloomPass.threshold = isCoarse ? 0.55 : 0.38
      bloomPass.strength = isCoarse ? 0.32 : 0.48
      bloomPass.radius = isCoarse ? 0.28 : 0.4
      composer.addPass(bloomPass)
    }

    const resize = () => {
      const w = cv.clientWidth
      const h = cv.clientHeight
      renderer.setSize(w, h, false)
      cam.aspect = w / h
      cam.updateProjectionMatrix()
      composer?.setSize(w, h)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)

    let raf = 0
    let frame = 0
    const t0 = performance.now()

    function animate() {
      raf = requestAnimationFrame(animate)
      frame++
      const now = performance.now()
      const tSec = (now - t0) * 0.001
      ;(starMat as THREE.ShaderMaterial).uniforms.uTime.value = tSec

      camLerpX += (mouseRef.current.nx * 3.4 - camLerpX) * 0.018
      camLerpY += (mouseRef.current.ny * 2.0 - camLerpY) * 0.018
      cam.position.x = camLerpX
      cam.position.y = camLerpY
      cam.position.z = 23.5 + Math.sin(tSec * 0.12) * 0.35
      cam.lookAt(0, 0, 0)

      follow.position.x = camLerpX * 4.5
      follow.position.y = camLerpY * 3.2
      follow.position.z = 16 + Math.sin(tSec * 0.4) * 1.2
      follow.intensity = 0.75 + Math.sin(tSec * 0.55) * 0.2

      globeGroup.rotation.y = reducedMotion ? 0 : tSec * 0.065
      globeGroup.rotation.x = reducedMotion ? 0 : Math.sin(tSec * 0.07) * 0.045

      for (let k = 0; k < globeArcLines.length; k++) {
        const arcLine = globeArcLines[k]
        const { i0, i1 } = arcLine.userData as { i0: number; i1: number }
        const a = globePins[i0]
        const b = globePins[i1]
        _gMid.addVectors(a, b).multiplyScalar(0.5)
        _gCtrl.copy(_gMid).normalize().multiplyScalar(MAIN_GLOBE_R * 1.52)
        gArcCurve.v0.copy(a)
        gArcCurve.v1.copy(_gCtrl)
        gArcCurve.v2.copy(b)
        const pts = gArcCurve.getPoints(GLOBE_ARC_SEGS - 1)
        const attr = arcLine.geometry.attributes.position as THREE.BufferAttribute
        const arr = attr.array as Float32Array
        for (let p = 0; p < pts.length; p++) {
          arr[p * 3] = pts[p].x
          arr[p * 3 + 1] = pts[p].y
          arr[p * 3 + 2] = pts[p].z
        }
        attr.needsUpdate = true
        arcLine.geometry.setDrawRange(0, pts.length)
        globeArcMats[k].opacity = (reducedMotion ? 0.1 : 0.08) + 0.22 * (0.5 + 0.5 * Math.sin(tSec * 1.05 + k * 0.38))
      }

      const H = FIELD
      nodes.forEach((n, ni) => {
        if (n.cooldown > 0) n.cooldown--

        if (n.matchPartner !== null) {
          const partner = nodes[n.matchPartner]
          const age = now - n.matchStartMs
          if (age > MATCH_TOTAL) {
            n.matchPartner = null
            n.cooldown = COOLDOWN_FRAMES
          } else {
            const toward = _ab.subVectors(partner.pos, n.pos)
            const dist = toward.length()
            if (dist > 0.35) {
              toward.normalize().multiplyScalar(0.0021)
              n.vel.add(toward)
            }
            n.vel.multiplyScalar(0.965)
          }
        }

        if (!reducedMotion) {
          flowAccel(n.pos.x, n.pos.y, n.pos.z, tSec + n.seed * 0.01, _flow)
          n.vel.add(_flow)
        }

        n.pos.addScaledVector(n.vel, 1)
        n.vel.multiplyScalar(0.9992)

        if (n.pos.x > H) n.pos.x = -H
        if (n.pos.x < -H) n.pos.x = H
        if (n.pos.y > H) n.pos.y = -H
        if (n.pos.y < -H) n.pos.y = H
        const ZH = H * 0.42
        if (n.pos.z > ZH) n.pos.z = -ZH
        if (n.pos.z < -ZH) n.pos.z = ZH

        const depthScale = 1 - Math.max(0, -n.pos.z / 15) * 0.26
        const breathe = 1 + Math.sin(now * 0.00072 + n.phase) * 0.055

        let matchT = 0
        if (n.matchPartner !== null) {
          const age = now - n.matchStartMs
          if (age < MATCH_IN) matchT = easeOutQuart(age / MATCH_IN)
          else if (age < MATCH_IN + MATCH_HOLD) {
            const hp = (age - MATCH_IN) / MATCH_HOLD
            matchT = 0.88 + Math.sin(hp * Math.PI * 4) * 0.12
          } else matchT = easeInOutQuart(1 - (age - MATCH_IN - MATCH_HOLD) / MATCH_OUT)
        }

        const matchScale = 1 + matchT * 0.48
        const finalScale = n.baseSize * breathe * matchScale * depthScale
        dummy.position.copy(n.pos)
        dummy.scale.setScalar(finalScale)
        dummy.updateMatrix()

        if (n.type === "s") {
          const em = matchT * 0.5
          sMesh.setColorAt(
            ni,
            sColor.setRGB(
              0.55 + matchT * 0.35 + em * 0.12,
              0.78 + matchT * 0.18 + em * 0.08,
              0.98 + matchT * 0.02 + em * 0.02,
            ),
          )
          sMesh.setMatrixAt(ni, dummy.matrix)
        } else {
          const ci = ni - STUDENT_N
          const em = matchT * 0.5
          cMesh.setColorAt(
            ci,
            cColor.setRGB(
              0.55 + matchT * 0.35 + em * 0.12,
              0.78 + matchT * 0.18 + em * 0.08,
              0.98 + matchT * 0.02 + em * 0.02,
            ),
          )
          cMesh.setMatrixAt(ci, dummy.matrix)
        }
      })

      sMesh.instanceMatrix.needsUpdate = true
      sMesh.instanceColor!.needsUpdate = true
      cMesh.instanceMatrix.needsUpdate = true
      cMesh.instanceColor!.needsUpdate = true

      if (frame % 3 === 0 && activeMatches.length < MAX_MATCHES) {
        outer: for (let si = 0; si < STUDENT_N; si++) {
          if (nodes[si].matchPartner !== null || nodes[si].cooldown > 0) continue
          for (let cj = STUDENT_N; cj < STUDENT_N + COMPANY_N; cj++) {
            if (nodes[cj].matchPartner !== null || nodes[cj].cooldown > 0) continue
            if (nodes[si].pos.distanceTo(nodes[cj].pos) < MATCH_DIST) {
              const poolIdx = matchPool.findIndex((p) => !p.inUse)
              if (poolIdx === -1) break outer
              nodes[si].matchPartner = cj
              nodes[si].matchStartMs = now
              nodes[cj].matchPartner = si
              nodes[cj].matchStartMs = now
              const slot = matchPool[poolIdx]
              slot.inUse = true
              slot.line.visible = true
              activeMatches.push({ si, ci: cj, startMs: now, poolIdx })
              break
            }
          }
        }
      }

      for (let i = activeMatches.length - 1; i >= 0; i--) {
        const m = activeMatches[i]
        const age = now - m.startMs
        const slot = matchPool[m.poolIdx]

        if (age > MATCH_TOTAL) {
          slot.inUse = false
          slot.line.visible = false
          activeMatches.splice(i, 1)
          continue
        }

        let op = 0
        if (age < MATCH_IN) op = easeOutQuart(age / MATCH_IN)
        else if (age < MATCH_IN + MATCH_HOLD) {
          const hp = (age - MATCH_IN) / MATCH_HOLD
          op = 0.78 + Math.sin(hp * Math.PI * 5) * 0.22
        } else op = easeInOutQuart(1 - (age - MATCH_IN - MATCH_HOLD) / MATCH_OUT)
        op = Math.max(0, op)

        const a = nodes[m.si].pos
        const b = nodes[m.ci].pos
        _mid.copy(a).add(b).multiplyScalar(0.5)
        _ab.copy(b).sub(a)
        _view.copy(_mid).sub(cam.position).normalize()
        _perp.copy(_ab).cross(_view).normalize()
        const sag = 1.15 + Math.sin(age * 0.003 + m.si) * 0.35
        _ctrl.copy(_mid).addScaledVector(_perp, sag)
        curve.v0.copy(a)
        curve.v1.copy(_ctrl)
        curve.v2.copy(b)

        const pts = curve.getPoints(CURVE_SEGS)
        for (let p = 0; p < vertCount; p++) {
          const pt = pts[p]
          slot.posBuf[p * 3] = pt.x
          slot.posBuf[p * 3 + 1] = pt.y
          slot.posBuf[p * 3 + 2] = pt.z
          const edge = Math.sin((p / CURVE_SEGS) * Math.PI)
          const v = edge * op
          slot.colBuf[p * 3] = v * (APPLE_BLUE_R * 1.15 + 0.08)
          slot.colBuf[p * 3 + 1] = v * (APPLE_BLUE_G * 1.05 + 0.12)
          slot.colBuf[p * 3 + 2] = v * (APPLE_BLUE_B * 1.02 + 0.18)
        }
        slot.posAttr.needsUpdate = true
        slot.colAttr.needsUpdate = true
      }

      let dimIdx = 0
      const total = STUDENT_N + COMPANY_N
      for (let a = 0; a < total && dimIdx < MAX_DIM_LINES; a++) {
        for (let b = a + 1; b < total && dimIdx < MAX_DIM_LINES; b++) {
          if (nodes[a].pos.distanceTo(nodes[b].pos) < PROXIMITY) {
            dimBuf[dimIdx * 6 + 0] = nodes[a].pos.x
            dimBuf[dimIdx * 6 + 1] = nodes[a].pos.y
            dimBuf[dimIdx * 6 + 2] = nodes[a].pos.z
            dimBuf[dimIdx * 6 + 3] = nodes[b].pos.x
            dimBuf[dimIdx * 6 + 4] = nodes[b].pos.y
            dimBuf[dimIdx * 6 + 5] = nodes[b].pos.z
            dimIdx++
          }
        }
      }
      dimAttr.needsUpdate = true
      dimGeo.setDrawRange(0, dimIdx * 2)

      if (composer) composer.render()
      else renderer.render(scene, cam)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("mousemove", onMove)
      composer?.dispose()
      renderer.dispose()
      pmrem?.dispose()
      envRt?.texture.dispose()
      sGeo.dispose()
      cGeo.dispose()
      mainGlobeGeo.dispose()
      wireGlobeGeo.dispose()
      wireGlobeMat.dispose()
      globeArcLines.forEach((ln) => {
        ln.geometry.dispose()
        ;(ln.material as THREE.Material).dispose()
      })
      globeMat.dispose()
      globeTex.dispose()
      starGeo.dispose()
      starMat.dispose()
      dimGeo.dispose()
      dimMat.dispose()
      matchPool.forEach((slot) => {
        slot.mat.dispose()
        slot.line.geometry.dispose()
      })
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
}
