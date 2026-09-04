import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { player } from "@/hooks/usePlayer";
import { groundAround } from "@/lib/worldPhysics";
import { useNpc } from "@/hooks/useNpc";
import { NPCS, type NpcDef } from "./npcs";
import { NpcCharacter } from "./NpcCharacter";

const NPC_SCALE = 2.5;
const NPC_LIFT = 0.05;
/** how often (frames) we re-sample the terrain under an NPC */
const RESAMPLE_EVERY = 20;

function Npc({ def }: { def: NpcDef }) {
  const group = useRef<THREE.Group>(null);
  const [prompt, setPrompt] = useState(false);
  const openId = useNpc((s) => s.openId);
  const [x, z] = def.pos;
  // Island colliders stream in after mount, so keep re-sampling until the
  // terrain under the NPC actually exists (otherwise they sink to sea level).
  const y = useRef<number | null>(null);
  const tick = useRef(0);

  useFrame((state) => {
    const near = Math.hypot(player.pos.x - x, player.pos.z - z) < def.talkDist;
    useNpc.getState().setNear(def.id, near);
    if (near !== prompt) setPrompt(near);

    const g = group.current;
    if (!g) return;
    tick.current += 1;
    if (tick.current % RESAMPLE_EVERY === 0 || y.current === null) {
      const ground = groundAround(x, z, 0.6);
      if (ground !== null) y.current = ground + NPC_LIFT;
    }
    if (y.current === null) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.y = y.current + Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
    if (near) g.rotation.y = Math.atan2(player.pos.x - x, player.pos.z - z);
  });

  return (
    <group ref={group} position={[x, y.current ?? 0, z]} scale={NPC_SCALE} visible={false}>

      <NpcCharacter face={def.face} outfit={def.outfit} />

      <Html position={[0, 2.5, 0]} center distanceFactor={12} zIndexRange={[10, 0]}>
        <div
          className="pointer-events-none whitespace-nowrap text-[18px] font-extrabold text-white"
          style={{ textShadow: "0 2px 0 rgba(0,0,0,.55), 0 0 6px rgba(0,0,0,.45)" }}
        >
          {def.name}
        </div>
      </Html>

      {prompt && openId !== def.id && (
        <Html position={[0, 1.35, 0]} center distanceFactor={12} zIndexRange={[10, 0]}>
          <div className="pointer-events-none flex items-center gap-2 whitespace-nowrap rounded-xl bg-white/95 px-2 py-1.5 shadow-lg">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[13px] font-bold text-white">
              E
            </span>
            <span className="pr-1 text-[15px] font-bold text-neutral-800">Talk</span>
          </div>
        </Html>
      )}

    </group>
  );
}

export function Npcs() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat) return;
      const st = useNpc.getState();
      if (st.openId) {
        st.setOpen(null);
      } else if (st.nearId) {
        e.preventDefault();
        st.setOpen(st.nearId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {NPCS.map((def) => (
        <Npc key={def.id} def={def} />
      ))}
    </>
  );
}
