import * as THREE from "three";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

/**
 * Runtime collision registry for the player-placed world objects.
 *
 * Every object rendered by <WorldObjects /> registers its three.js group here.
 * - `walkable` objects are raycast against to find the ground height.
 * - `solid` objects push the player out of their (XZ) bounding box.
 *
 * Imported GLB/FBX models can carry hundreds of thousands of triangles, so a
 * naive `intersectObject(root, true)` several times per frame stalls the loop.
 * Every walkable mesh therefore gets a BVH built once (and rebuilt only when the
 * model itself changes), and ground queries are memoised on a coarse grid that
 * is invalidated whenever a transform changes.
 */

// Opt in to BVH-accelerated raycasting for meshes we prepare below.
THREE.Mesh.prototype.raycast = acceleratedRaycast;
// three's own typings ship a slightly different BVH shape; the runtime is the
// same three-mesh-bvh implementation, so widen the assignment.
const geoProto = THREE.BufferGeometry.prototype as unknown as Record<string, unknown>;
geoProto["computeBoundsTree"] = computeBoundsTree;
geoProto["disposeBoundsTree"] = disposeBoundsTree;

export interface Collider {
  id: string;
  obj: THREE.Object3D;
  walkable: boolean;
  solid: boolean;
  box: THREE.Box3;
  /** flattened list of meshes, so we skip a traverse on every query */
  meshes: THREE.Mesh[];
  /**
   * Per-mesh world boxes used for solid collision. A single root box turns a
   * shop (roof + eaves included) into an impassable slab, so we block against
   * the individual parts and let the player walk into open fronts.
   */
  parts: THREE.Box3[];
}

/** Above this many parts we fall back to the cheap root box. */
const MAX_SOLID_PARTS = 400;

function buildParts(obj: THREE.Object3D, meshes: THREE.Mesh[], root: THREE.Box3): THREE.Box3[] {
  if (meshes.length === 0 || meshes.length > MAX_SOLID_PARTS) return [root];
  obj.updateWorldMatrix(true, true);
  const parts: THREE.Box3[] = [];
  for (const m of meshes) {
    const b = new THREE.Box3().setFromObject(m);
    if (b.isEmpty()) continue;
    parts.push(b);
  }
  return parts.length ? parts : [root];
}


const colliders = new Map<string, Collider>();

/** Bumped on any registry/transform change so cached ground samples drop. */
let version = 0;
const groundCache = new Map<string, number | null>();

function invalidate() {
  version++;
  groundCache.clear();
}

function collectMeshes(obj: THREE.Object3D, walkable: boolean): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  obj.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    meshes.push(m);
    if (!walkable) return;
    const geo = m.geometry as THREE.BufferGeometry & {
      boundsTree?: unknown;
      computeBoundsTree?: (o?: { maxLeafTris?: number }) => void;
    };
    if (geo && !geo.boundsTree) {
      try {
        geo.computeBoundsTree?.({ maxLeafTris: 8 });
      } catch {
        /* non-indexed / degenerate geometry: fall back to plain raycast */
      }
    }
  });
  return meshes;
}

export function registerCollider(
  id: string,
  obj: THREE.Object3D,
  walkable: boolean,
  solid: boolean,
) {
  obj.updateWorldMatrix(true, true);
  const meshes = collectMeshes(obj, walkable);
  const rootBox = new THREE.Box3().setFromObject(obj);
  colliders.set(id, {
    id,
    obj,
    walkable,
    solid,
    box: rootBox,
    meshes,
    parts: buildParts(obj, meshes, rootBox),
  });
  invalidate();
}

export function unregisterCollider(id: string) {
  colliders.delete(id);
  invalidate();
}

/** Recompute the cached bounding boxes after a transform change. */
export function refreshCollider(id: string) {
  const c = colliders.get(id);
  if (!c) return;
  c.obj.updateWorldMatrix(true, true);
  c.box.setFromObject(c.obj);
  c.parts = buildParts(c.obj, c.meshes, c.box);
  invalidate();
}

export function refreshAllColliders() {
  for (const c of colliders.values()) {
    c.obj.updateWorldMatrix(true, true);
    c.box.setFromObject(c.obj);
    c.parts = buildParts(c.obj, c.meshes, c.box);
  }
  invalidate();
}

const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const DOWN = new THREE.Vector3(0, -1, 0);
const origin = new THREE.Vector3();

/** Highest walkable surface under (x, z), or null when there is nothing there. */
export function groundAt(x: number, z: number, from = 500): number | null {
  // Quantise to a 10cm grid: the player moves far less than that per frame, so
  // consecutive queries in the same frame (water test, height, monster AI) hit
  // the cache instead of re-raycasting the whole world.
  const key = `${version}|${Math.round(x * 10)}|${Math.round(z * 10)}`;
  const hit = groundCache.get(key);
  if (hit !== undefined) return hit;

  let best: number | null = null;
  origin.set(x, from, z);
  raycaster.set(origin, DOWN);
  raycaster.far = from + 500;
  for (const c of colliders.values()) {
    if (!c.walkable) continue;
    // cheap reject with the cached bounds
    if (x < c.box.min.x - 0.1 || x > c.box.max.x + 0.1) continue;
    if (z < c.box.min.z - 0.1 || z > c.box.max.z + 0.1) continue;
    for (const m of c.meshes) {
      const hits = raycaster.intersectObject(m, false);
      for (const h of hits) {
        if (best === null || h.point.y > best) best = h.point.y;
      }
    }
  }

  if (groundCache.size > 20000) groundCache.clear();
  groundCache.set(key, best);
  return best;
}

/**
 * Ground beneath the player's footprint rather than beneath one exact point.
 * Thin planks, seams between boards, and platform edges can miss a centre-only
 * ray even while most of the character is still supported.
 */
export function groundAround(x: number, z: number, radius = 0.35): number | null {
  const samples: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [radius, 0],
    [-radius, 0],
    [0, radius],
    [0, -radius],
  ];
  let best: number | null = null;
  for (const [offsetX, offsetZ] of samples) {
    const ground = groundAt(x + offsetX, z + offsetZ);
    if (ground !== null && (best === null || ground > best)) best = ground;
  }
  return best;
}

/** True when any walkable object covers (x, z) above the waterline. */
export function isOverLand(x: number, z: number, minY = -0.2): boolean {
  const g = groundAt(x, z);
  return g !== null && g > minY;
}

/**
 * Push (x, z) out of every solid object's XZ bounding box, along the axis with
 * the smallest penetration. Uses per-mesh boxes so a shop's roof/awning does
 * not block the open area in front of it.
 */
export function pushOutOfSolids(
  x: number,
  z: number,
  radius = 0.9,
  playerY = 0,
): [number, number] {
  let px = x;
  let pz = z;
  for (const c of colliders.values()) {
    if (!c.solid) continue;
    for (const box of c.parts) {
      // Skip parts above the player's head — awnings and roofs should not
      // block the entrance below them.
      if (playerY > 0 && box.min.y > playerY + 1.6) continue;
      const minX = box.min.x - radius;
      const maxX = box.max.x + radius;
      const minZ = box.min.z - radius;
      const maxZ = box.max.z + radius;
      if (px <= minX || px >= maxX || pz <= minZ || pz >= maxZ) continue;
      const left = px - minX;
      const right = maxX - px;
      const back = pz - minZ;
      const front = maxZ - pz;
      const m = Math.min(left, right, back, front);
      if (m === left) px = minX;
      else if (m === right) px = maxX;
      else if (m === back) pz = minZ;
      else pz = maxZ;
    }
  }
  return [px, pz];
}

// Dev aid: inspect the live solid boxes from the console.
if (typeof window !== "undefined") {
  (window as unknown as { __solids?: () => unknown[] }).__solids = () =>
    [...colliders.values()]
      .filter((c) => c.solid)
      .map((c) => ({
        id: c.id,
        min: [+c.box.min.x.toFixed(1), +c.box.min.y.toFixed(1), +c.box.min.z.toFixed(1)],
        max: [+c.box.max.x.toFixed(1), +c.box.max.y.toFixed(1), +c.box.max.z.toFixed(1)],
      }));
}
