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
    renderer.setClearColor(0x000000, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = reducedMotion ? 0.55 : 0.92
    renderer.setSize(cv.clientWidth, cv.clientHeight, false)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030305, reducedMotion ? 0.012 : 0.017)

    const cam = new THREE.PerspectiveCamera(48, cv.clientWidth / cv.clientHeight, 0.08, 140)
    cam.position.set(0, 0, 23.5)

    // ── Lighting (always) ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x8a8a9a, 0.35))
    const key = new THREE.DirectionalLight(0xffffff, 1.85)
    key.position.set(10, 14, 12)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xb8c8ff, 0.55)
    rim.position.set(-12, -6, 8)
    scene.add(rim)
    const follow = new THREE.PointLight(0xf5f0ff, 0.9, 80, 2)
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
          gl_FragColor = vec4(vec3(1.0), soft * vAlpha * 0.35 * tw);
        }
      `,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── PBR instanced bodies ────────────────────────────────────────────────
    const sGeo = new THREE.SphereGeometry(0.095, 20, 16)
    const sMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 0.92,
      roughness: 0.28,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35,
      envMapIntensity: 1.15,
      emissive: new THREE.Color(0x000000),
    })
    const sMesh = new THREE.InstancedMesh(sGeo, sMat, STUDENT_N)
    sMesh.frustumCulled = false
    const _c = new THREE.Color()
    for (let i = 0; i < STUDENT_N; i++) sMesh.setColorAt(i, _c.setRGB(0.45, 0.42, 0.4))
    sMesh.instanceColor!.needsUpdate = true
    scene.add(sMesh)

    const cGeo = new THREE.IcosahedronGeometry(0.125, 1)
    const cMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 0.95,
      roughness: 0.22,
      clearcoat: 0.45,
      clearcoatRoughness: 0.28,
      envMapIntensity: 1.25,
      emissive: new THREE.Color(0x020408),
    })
    const cMesh = new THREE.InstancedMesh(cGeo, cMat, COMPANY_N)
    cMesh.frustumCulled = false
    for (let i = 0; i < COMPANY_N; i++) cMesh.setColorAt(i, _c.setRGB(0.38, 0.4, 0.48))
    cMesh.instanceColor!.needsUpdate = true
    scene.add(cMesh)

    const nodes: NodeState[] = []
    for (let i = 0; i < STUDENT_N; i++) {
      nodes.push({
        pos: new THREE.Vector3(rnd(-FIELD, FIELD), rnd(-FIELD, FIELD), rnd(-FIELD * 0.42, FIELD * 0.42)),
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
      color: 0xffffff,
      transparent: true,
      opacity: reducedMotion ? 0.07 : 0.045,
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
          const em = matchT * 0.55
          sMesh.setColorAt(
            ni,
            sColor.setRGB(0.38 + matchT * 0.62 + em * 0.15, 0.35 + matchT * 0.62 + em * 0.08, 0.32 + matchT * 0.6),
          )
          sMesh.setMatrixAt(ni, dummy.matrix)
        } else {
          const ci = ni - STUDENT_N
          const em = matchT * 0.45
          cMesh.setColorAt(
            ci,
            cColor.setRGB(0.32 + matchT * 0.55, 0.34 + matchT * 0.58 + em * 0.1, 0.42 + matchT * 0.52 + em * 0.2),
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
          slot.colBuf[p * 3] = v
          slot.colBuf[p * 3 + 1] = v * 0.98
          slot.colBuf[p * 3 + 2] = v
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
      sMat.dispose()
      cGeo.dispose()
      cMat.dispose()
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
