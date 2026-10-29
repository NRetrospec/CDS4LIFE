"use client";

/**
 * Port of viewer/index.html. Every number in /products.json is measured from the product
 * photo (tools/prep_all.py) — do not re-derive or tweak by eye. The rig, camera and lathe
 * construction below are the prototype's, unchanged; what is new is lifecycle: disposal on
 * unmount, offscreen pause, dpr cap, wheel-zoom gating and a no-WebGL / reduced-motion path.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { BOTTLE_ART } from "@/lib/catalog";

type Pair = [number, number];
type MeasuredProduct = {
  id: string;
  name: string;
  capProfile: Pair[];
  bodyProfile: Pair[];
  labelTop: number;
  labelBottom: number;
  bodyKind: "amber" | "clear";
  capColor: string;
  wrapColor: string;
  front: string;
  back: string;
  backAspect: number;
  sourcePx: [number, number];
};

export type BottleViewerProps = {
  productId: string;
  name?: string;
  subtitle?: string;
  volume?: string;
};

const CAM_HOME = new THREE.Vector3(1.256, 1.047, 8.1);
const WRAP_W = 4096;
const WRAP_H = 1024;

let catalogPromise: Promise<MeasuredProduct[]> | null = null;
const loadCatalog = () =>
  (catalogPromise ??= fetch("/products.json")
    .then((r) => r.json())
    .then((d) => d.products as MeasuredProduct[])
    .catch((e) => {
      catalogPromise = null;
      throw e;
    }));

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

const byY = (pts: Pair[]) => pts.slice().sort((a, b) => a[1] - b[1]);

function lathe(pairs: Pair[], segments = 96, phiStart = 0, phiLength = Math.PI * 2) {
  const pts = pairs.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y - 0.5));
  return new THREE.LatheGeometry(pts, segments, phiStart, phiLength);
}

// profile slice between two heights, interpolated at the ends so the label follows the bottle's own curve
function sliceProfile(profile: Pair[], yFrom: number, yTo: number, offset: number): Pair[] {
  const pts = byY(profile);
  const at = (y: number) => {
    for (let i = 1; i < pts.length; i++) {
      const [r0, y0] = pts[i - 1];
      const [r1, y1] = pts[i];
      if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / Math.max(1e-6, y1 - y0);
    }
    return pts[pts.length - 1][0];
  };
  const out: Pair[] = [[at(yFrom) + offset, yFrom]];
  for (const [r, y] of pts) if (y > yFrom + 1e-4 && y < yTo - 1e-4) out.push([r + offset, y]);
  out.push([at(yTo) + offset, yTo]);
  return out;
}

function ribTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, c.width, c.height);
  const n = 84;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * c.width;
    const w = (c.width / n) * 0.5;
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#6a6a6a");
    grad.addColorStop(0.5, "#ffffff");
    grad.addColorStop(1, "#6a6a6a");
    g.fillStyle = grad;
    g.fillRect(x, 0, w, c.height);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function shadowTexture() {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, s * 0.02, s / 2, s / 2, s * 0.5);
  grad.addColorStop(0, "rgba(16,30,42,0.40)");
  grad.addColorStop(0.35, "rgba(16,30,42,0.20)");
  grad.addColorStop(0.7, "rgba(16,30,42,0.05)");
  grad.addColorStop(1, "rgba(16,30,42,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

function makeMaterials(p: MeasuredProduct) {
  const amber = p.bodyKind === "amber";
  const glass = new THREE.MeshPhysicalMaterial({
    color: amber ? 0x8a4412 : 0xffffff,
    metalness: 0.0,
    roughness: amber ? 0.028 : 0.014,
    transmission: amber ? 0.975 : 0.985,
    thickness: amber ? 0.24 : 0.34,
    ior: 1.52,
    attenuationColor: new THREE.Color(amber ? 0xa85a18 : 0xdceef2),
    attenuationDistance: amber ? 1.15 : 0.75,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    specularIntensity: 1.0,
    envMapIntensity: 1.25,
    side: THREE.DoubleSide,
  });
  const cap = new THREE.MeshStandardMaterial({
    color: new THREE.Color(p.capColor),
    roughness: 0.36,
    metalness: 0.0,
    bumpMap: ribTexture(),
    bumpScale: 0.022,
    envMapIntensity: 1.0,
  });
  const liquid = new THREE.MeshPhysicalMaterial(
    amber
      ? {
          color: 0x9a5214, roughness: 0.18, metalness: 0.0, transmission: 0.78, thickness: 0.16, ior: 1.33,
          attenuationColor: new THREE.Color(0xb0631e), attenuationDistance: 1.7, envMapIntensity: 1.0,
        }
      : {
          color: 0xf4fbfc, roughness: 0.06, metalness: 0.0, transmission: 0.94, thickness: 0.1, ior: 1.34,
          attenuationColor: new THREE.Color(0xe8f6fa), attenuationDistance: 0.55, envMapIntensity: 1.2,
        }
  );
  return { glass, cap, liquid };
}

/** 360° wrap: label colour, the unwrapped front art in the middle 180°, curvature falloff at its edges. */
function buildWrap(renderer: THREE.WebGLRenderer, frontImg: CanvasImageSource | null, wrapColor: string) {
  const c = document.createElement("canvas");
  c.width = WRAP_W;
  c.height = WRAP_H;
  const g = c.getContext("2d")!;
  g.fillStyle = wrapColor;
  g.fillRect(0, 0, WRAP_W, WRAP_H);

  const id = g.getImageData(0, 0, WRAP_W, WRAP_H);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 4;
    id.data[i] += n;
    id.data[i + 1] += n;
    id.data[i + 2] += n;
  }
  g.putImageData(id, 0, 0);

  if (frontImg) {
    const w = WRAP_W * 0.47;
    const h = WRAP_H;
    const x0 = WRAP_W * 0.5 - w / 2;
    g.drawImage(frontImg, x0, 0, w, h);
    const dark = new THREE.Color(wrapColor);
    const rgb = [Math.round(dark.r * 255), Math.round(dark.g * 255), Math.round(dark.b * 255)];
    const fade = g.createLinearGradient(x0, 0, x0 + w, 0);
    fade.addColorStop(0.0, `rgba(${rgb},0.92)`);
    fade.addColorStop(0.055, `rgba(${rgb},0.55)`);
    fade.addColorStop(0.135, `rgba(${rgb},0.14)`);
    fade.addColorStop(0.3, `rgba(${rgb},0)`);
    fade.addColorStop(0.7, `rgba(${rgb},0)`);
    fade.addColorStop(0.865, `rgba(${rgb},0.14)`);
    fade.addColorStop(0.945, `rgba(${rgb},0.55)`);
    fade.addColorStop(1.0, `rgba(${rgb},0.92)`);
    g.fillStyle = fade;
    g.fillRect(x0, 0, w, h);
  }
  const edge = g.createLinearGradient(0, 0, 0, WRAP_H);
  edge.addColorStop(0.0, "rgba(0,0,0,0.42)");
  edge.addColorStop(0.012, "rgba(0,0,0,0.10)");
  edge.addColorStop(0.03, "rgba(0,0,0,0)");
  edge.addColorStop(0.97, "rgba(0,0,0,0)");
  edge.addColorStop(0.988, "rgba(0,0,0,0.10)");
  edge.addColorStop(1.0, "rgba(0,0,0,0.42)");
  g.fillStyle = edge;
  g.fillRect(0, 0, WRAP_W, WRAP_H);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.wrapS = THREE.RepeatWrapping;
  t.offset.x = 0.5; // LatheGeometry's seam sits at +Z; push it to the back
  return t;
}

function disposeMaterial(m: THREE.Material) {
  for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
  m.dispose();
}
function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(disposeMaterial);
  });
}

type Handle = {
  reset: () => void;
  setSpin: (on: boolean) => void;
};

export default function BottleViewerImpl({ productId, name, subtitle, volume }: BottleViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = useRef<Handle | null>(null);
  const [product, setProduct] = useState<MeasuredProduct | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [painted, setPainted] = useState(false);
  const [spin, setSpin] = useState(true);
  const [hint, setHint] = useState(true);
  const art = BOTTLE_ART[productId];

  useEffect(() => {
    setWebgl(hasWebGL());
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm);
    if (rm) setSpin(false);
  }, []);

  useEffect(() => {
    let live = true;
    loadCatalog().then((all) => live && setProduct(all.find((p) => p.id === productId) ?? null)).catch(() => {});
    return () => { live = false; };
  }, [productId]);

  const run3d = webgl === true && (!reduced || optIn) && !!product;

  useEffect(() => {
    const host = hostRef.current;
    if (!run3d || !host || !product) return;
    const p = product;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    const mobile = matchMedia("(max-width: 767px)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Interactive 3D model of the ${p.name} bottle. Drag to rotate; focus and use a scroll gesture to zoom.`);
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    // grade to match the 2D product photos (the measured geometry and rig are untouched)
    canvas.style.filter = "saturate(1.3) contrast(1.14)";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    // long lens: a wide one bulges the near wall of a cylinder and makes a 2.5:1 bottle read squat
    const camera = new THREE.PerspectiveCamera(8, 1, 1.0, 40);
    camera.position.copy(CAM_HOME);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.02, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 5.6;
    controls.maxDistance = 10.5;
    controls.minPolarAngle = 1.35;
    controls.maxPolarAngle = 1.75;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.9;
    controls.enableZoom = false;
    controls.update();
    canvas.style.touchAction = "pan-y"; // OrbitControls sets 'none', which would trap vertical page scroll on touch

    // wheel zooms only with a modifier key or when the canvas has focus; otherwise the page scrolls
    const onWheelCapture = (e: WheelEvent) => {
      controls.enableZoom = e.ctrlKey || e.metaKey || document.activeElement === canvas;
    };
    host.addEventListener("wheel", onWheelCapture, { capture: true, passive: true });

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.045);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 1.45;
    roomEnv.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []).forEach((x) => x.dispose());
    });

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(1.8, 3.2, 2.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 9;
    key.shadow.camera.left = -1.6;
    key.shadow.camera.right = 1.6;
    key.shadow.camera.top = 2.2;
    key.shadow.camera.bottom = -0.6;
    key.shadow.radius = 4;
    key.shadow.bias = -0.0008;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfefff, 1.15);
    rim.position.set(-2.4, 1.2, -1.6);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d5df, 0.85));
    const fillLeft = new THREE.DirectionalLight(0xffffff, 1.35);
    fillLeft.position.set(-2.6, 0.9, 1.6);
    scene.add(fillLeft);
    const kicker = new THREE.DirectionalLight(0xffe9cf, 0.9);
    kicker.position.set(-1.2, 1.8, -2.4);
    scene.add(kicker);
    // point, not directional: a parallel light hits every point of a curved panel equally, which reads as a flat decal
    const rearLight = new THREE.PointLight(0xffffff, 9.0, 7.0, 2.0);
    rearLight.position.set(0.45, 0.85, -2.1);
    scene.add(rearLight);

    const shadowTex = shadowTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.46),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.035, -0.4995, -0.02);
    scene.add(shadow);
    const ao = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.26),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.set(0, -0.4985, 0);
    scene.add(ao);

    // ── build the bottle from its measured data ─────────────────────────────
    const group = new THREE.Group();
    scene.add(group);
    const { glass, cap, liquid } = makeMaterials(p);

    const bodyPts = byY(p.bodyProfile);
    bodyPts.unshift([0, bodyPts[0][1]]);
    const body = new THREE.Mesh(lathe(bodyPts, 96), glass);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const liq = byY(p.bodyProfile)
      .filter(([, y]) => y > 0.02 && y < p.labelTop + 0.03)
      .map(([r, y]) => [r * 0.955, y] as Pair);
    liq.push([0, liq[liq.length - 1][1]]);
    group.add(new THREE.Mesh(lathe(liq, 96), liquid));

    const capPts = byY(p.capProfile);
    capPts.push([0, capPts[capPts.length - 1][1]]);
    const capMesh = new THREE.Mesh(lathe(capPts, 96), cap);
    capMesh.castShadow = true;
    capMesh.position.y = -0.004;
    group.add(capMesh);

    const labelPts = sliceProfile(p.bodyProfile, p.labelBottom, p.labelTop, 0.002);
    const labelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0.0, envMapIntensity: 0.95, map: null });
    group.add(new THREE.Mesh(lathe(labelPts, 128), labelMat));

    const loader = new THREE.TextureLoader();
    loader.load(
      p.front,
      (img) => {
        if (disposed) return img.dispose();
        labelMat.map = buildWrap(renderer, img.image as CanvasImageSource, p.wrapColor);
        labelMat.needsUpdate = true;
        img.dispose();
      },
      undefined,
      () => {
        if (disposed) return;
        labelMat.map = buildWrap(renderer, null, p.wrapColor);
        labelMat.needsUpdate = true;
      }
    );

    // back sticker: the client's artwork on a curved panel; its true aspect fixes the arc, so nothing is stretched
    const labelH = p.labelTop - p.labelBottom;
    const arc = labelH / p.backAspect;
    const backR = labelPts[Math.floor(labelPts.length / 2)][0] + 0.0016;
    const theta = Math.min(arc / backR, Math.PI * 1.2);
    const backPts = sliceProfile(p.bodyProfile, p.labelBottom, p.labelTop, 0.0038);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8, roughness: 0.6, metalness: 0.0, envMapIntensity: 0.8, transparent: true, alphaTest: 0.45, map: null,
    });
    group.add(
      new THREE.Mesh(
        new THREE.LatheGeometry(backPts.map(([r, y]) => new THREE.Vector2(r, y - 0.5)), 48, Math.PI - theta / 2, theta),
        backMat
      )
    );
    loader.load(p.back, (t) => {
      if (disposed) return t.dispose();
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      backMat.map = t;
      backMat.needsUpdate = true;
    });

    const bodyW = Math.max(...p.bodyProfile.map((x) => x[0])) * 2;
    shadow.scale.setScalar(Math.max(0.55, bodyW / 0.394));
    ao.scale.setScalar(Math.max(0.55, bodyW / 0.394));

    // ── sizing + loop (paused offscreen) ──────────────────────────────────────
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let firstFrame = true;
    const frame = () => {
      controls.update();
      renderer.render(scene, camera);
      if (firstFrame) {
        firstFrame = false;
        setPainted(true);
      }
    };
    const start = () => renderer.setAnimationLoop(frame);
    const stop = () => renderer.setAnimationLoop(null);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.01 });
    io.observe(host);

    handle.current = {
      reset: () => {
        camera.position.copy(CAM_HOME);
        controls.target.set(0, 0.02, 0);
        controls.update();
      },
      setSpin: (on) => { controls.autoRotate = on; },
    };

    // test / QA hook, same as the prototype's window.CDSViewer
    (window as unknown as { CDSViewer?: unknown }).CDSViewer = { scene, camera, controls, renderer, group };

    return () => {
      disposed = true;
      handle.current = null;
      stop();
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("wheel", onWheelCapture, { capture: true });
      controls.dispose();
      disposeObject(scene);
      shadowTex.dispose();
      envRT.dispose();
      scene.environment = null;
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      const w = window as unknown as { CDSViewer?: { renderer?: unknown } };
      if (w.CDSViewer?.renderer === renderer) delete w.CDSViewer;
      setPainted(false);
    };
    // reduced is read once at start; changing it mid-session is handled by the opt-in button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run3d, product]);

  const toggleSpin = useCallback(() => {
    setSpin((s) => { handle.current?.setSpin(!s); return !s; });
  }, []);
  const showStatic = !run3d || !painted;
  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">{name ?? product?.name ?? productId}</h1>
        {subtitle && <p className="mt-1 text-lg font-semibold">{subtitle}</p>}
        {volume && <p className="tracked mt-1 text-xs text-navy/70">{volume}</p>}
      </header>

      <div
        ref={hostRef}
        className="relative mx-auto aspect-[1/1.16] max-h-[78svh] w-full cursor-grab active:cursor-grabbing"
        onPointerDown={() => setHint(false)}
      >
        {art && (
          <Image
            src={`/bottles/${productId}@2x.webp`}
            alt={art.alt}
            width={art.w}
            height={art.h}
            priority
            className="pointer-events-none absolute inset-0 m-auto h-[88%] w-auto object-contain transition-opacity duration-300"
            style={{ opacity: showStatic ? 1 : 0 }}
          />
        )}
        {run3d && hint && painted && (
          <span className="tracked pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-navy/60">
            drag to spin
          </span>
        )}
        {webgl && reduced && !optIn && (
          <button
            type="button"
            onClick={() => setOptIn(true)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white"
          >
            View in 3D
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        {run3d && (
          <>
            <button type="button" aria-pressed={spin} onClick={toggleSpin} className="viewer-btn">Auto-spin</button>
            <button type="button" onClick={() => handle.current?.reset()} className="viewer-btn">Reset view</button>
          </>
        )}
      </div>
    </div>
  );
}
