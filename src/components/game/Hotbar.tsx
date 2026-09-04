import { useEffect } from "react";
import { Backpack, Fish as FishIcon } from "lucide-react";
import { useGameStore } from "@/hooks/useGameStore";

/**
 * Roblox-style bottom-center hotbar.
 * Slot 1 = fishing rod (click / press 1 to equip or stow on the back).
 * Slot 2 = bag (click / press 2 to open the caught-fish list).
 */
export function Hotbar() {
  const rodStowed = useGameStore((s) => s.rodStowed);
  const bag = useGameStore((s) => s.bag);
  const bagOpen = useGameStore((s) => s.bagOpen);
  const phase = useGameStore((s) => s.phase);

  const toggleRod = () => {
    const st = useGameStore.getState();
    if (st.phase !== "idle") return;
    const next = !st.rodStowed;
    st.setRodStowed(next);
    st.setMessage(
      next
        ? "Rod stowed on your back. Click slot 1 to equip it again."
        : "Rod equipped. ENTER / left click to cast.",
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Digit1") toggleRod();
      if (e.code === "Digit2") useGameStore.getState().toggleBag();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalKg = bag.reduce((a, b) => a + b.weight, 0);

  return (
    <>
      {bagOpen && (
        <div className="pointer-events-auto absolute bottom-32 left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-white/25 bg-slate-900/80 p-3 text-slate-50 shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold tracking-tight">Bag</p>
            <p className="text-xs text-slate-300">
              {bag.length} item · {totalKg.toFixed(2)} kg
            </p>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {bag.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                Bag is empty. Catch some fish!
              </p>
            )}
            {bag.map((item) => (
              <div
                key={item.uid}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <FishIcon size={16} className="shrink-0 text-sky-300" />
                <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
                <span className="text-xs tabular-nums text-slate-300">{item.weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-auto absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2 rounded-2xl border border-white/20 bg-slate-900/55 p-2 shadow-2xl backdrop-blur-md">
        <HotSlot
          index={1}
          label="Rod"
          active={!rodStowed}
          disabled={phase !== "idle"}
          onClick={toggleRod}
        >
          <div className="h-8 w-1 rotate-[35deg] rounded-full bg-gradient-to-b from-amber-200 to-amber-700" />
        </HotSlot>
        <HotSlot
          index={2}
          label="Bag"
          active={bagOpen}
          badge={bag.length || undefined}
          onClick={() => useGameStore.getState().toggleBag()}
        >
          <Backpack size={26} className="text-amber-200" />
        </HotSlot>
      </div>
    </>
  );
}

function HotSlot({
  index,
  label,
  active,
  disabled,
  badge,
  onClick,
  children,
}: {
  index: number;
  label: string;
  active?: boolean | undefined;
  disabled?: boolean | undefined;
  badge?: number | undefined;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-[74px] w-[74px] flex-col items-center justify-center gap-1 rounded-xl border-2 transition ${
        active
          ? "border-amber-300 bg-amber-400/15 shadow-[0_0_18px_rgba(251,191,36,0.35)]"
          : "border-white/25 bg-slate-950/50 hover:border-white/50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="absolute left-1.5 top-1 text-[11px] font-bold text-white/70">{index}</span>
      {badge !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
      <span className="flex h-8 items-center justify-center">{children}</span>
      <span className="text-[11px] font-bold text-slate-100">{label}</span>
    </button>
  );
}
