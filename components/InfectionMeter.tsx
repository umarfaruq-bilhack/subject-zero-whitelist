"use client";

export default function InfectionMeter({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = Math.round((completed / total) * 100);
  const status =
    pct === 100 ? "FULLY INFECTED" : pct === 0 ? "CLEAN" : "SPREADING";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 text-xs tracking-widest">
        <span className="text-bone/60">CONTAMINATION LEVEL</span>
        <span className={pct === 100 ? "text-toxic" : "text-bone/60"}>
          {status} — {pct}%
        </span>
      </div>
      <div className="h-3 w-full bg-rot border border-toxicDim/40 relative overflow-hidden">
        <div
          className="h-full bg-toxic transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? "0 0 12px rgba(159,239,0,0.7)" : "none",
          }}
        />
        {/* segment ticks */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="border-r border-void/60 flex-1 last:border-r-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
