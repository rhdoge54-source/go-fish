import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { player, groundHeight } from "@/hooks/usePlayer";
import { useNpc } from "@/hooks/useNpc";
import { NPCS, type NpcDef } from "./npcs";
import { NpcCharacter } from "./NpcCharacter";

const NPC_SCALE = 2.5;
const NPC_LIFT = 0.18;

function Npc({ def }: { def: NpcDef }) {
  const group = useRef<THREE.Group>(null);
  const [prompt, setPrompt] = useState(false);
  const openId = useNpc((s) => s.openId);
  const [x, z] = def.pos;
  // Island colliders stream in after mount, so keep re-sampling for a while.
  const y = useRef(groundHeight(x, z) + NPC_LIFT);
  const settle = useRef(0);

  useFrame((state) => {
    const near = Math.hypot(player.pos.x - x, player.pos.z - z) < def.talkDist;
    useNpc.getState().setNear(def.id, near);
    if (near !== prompt) setPrompt(near);

    const g = group.current;
    if (!g) return;
    if (settle.current < 300) {
      settle.current += 1;
      y.current = groundHeight(x, z) + NPC_LIFT;
    }
    g.position.y = y.current + Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
    if (near) g.rotation.y = Math.atan2(player.pos.x - x, player.pos.z - z);
  });

  return (
    <group ref={group} position={[x, y.current, z]} scale={NPC_SCALE}>
      <NpcCharacter face={def.face} outfit={def.outfit} />
      {prompt && openId !== def.id && (
        <Html position={[0, 2.2, 0]} center distanceFactor={12} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/30 bg-slate-900/70 px-3 py-1 text-center text-[13px] font-semibold text-slate-50 shadow-lg backdrop-blur-sm">
            <span className="block text-[11px] font-medium text-slate-300">
              {def.name} · {def.role}
            </span>
            Press E to talk
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
