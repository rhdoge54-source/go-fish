import { useEffect } from "react";
import { Backpack, Fish as FishIcon, Coins } from "lucide-react";
import { useGameStore } from "@/hooks/useGameStore";
import { priceFor } from "@/lib/fishRules";

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
  const totalValue = bag.reduce(
    (a, b) => a + priceFor(b.speciesId, b.weight, b.mutationKey),
    0,
  );

  return (
    <>
      {bagOpen && (
        <div className="pointer-events-auto absolute bottom-32 left-1/2 z-30 w-[min(92vw,440px)] -translate-x-1/2 rounded-2xl border border-white/25 bg-slate-900/85 p-4 text-slate-50 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-bold tracking-tight">Bag</p>
            <p className="flex items-center gap-2 text-xs text-slate-300">
              <span>{bag.length} item · {totalKg.toFixed(2)} kg</span>
              <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-200">
                <Coins size={12} />
                {totalValue.toLocaleString()}
              </span>
            </p>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {bag.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                Bag is empty. Catch some fish!
              </p>
            )}
            {bag.map((item) => {
              const value = priceFor(item.speciesId, item.weight, item.mutationKey);
              return (
                <div
                  key={item.uid}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/40"
                    style={{ color: item.color }}
                  >
                    <FishThumbnail color={item.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {item.mutationKey !== "none" ? (
                        <>
                          <span className="text-slate-300">{item.mutationLabel}</span>{" "}
                          {item.name}
                        </>
                      ) : (
                        item.name
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.weight.toFixed(2)} kg</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center gap-1 text-sm font-bold text-amber-200">
                      <Coins size={13} />
                      {value.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
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

/** Simple stylised fish icon tinted to the species colour. */
function FishThumbnail({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-7 w-7 animate-fish-swim"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M2 12c2.5-3 6.5-4 10-4s7.5 1 10 4c-2.5 3-6.5 4-10 4S4.5 15 2 12z"
        fill={color}
        opacity="0.92"
      />
      <path d="M22 12c-2-1.5-4.5-2.5-7-3" />
      <circle cx="6.5" cy="11" r="1" fill="#12161c" stroke="none" />
      <path d="M2 12l-1-2v4l1-2z" fill={color} />
    </svg>
  );
}
