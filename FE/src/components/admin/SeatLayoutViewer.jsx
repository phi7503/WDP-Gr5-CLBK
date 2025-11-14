export default function SeatLayoutViewer({ layout }) {
  if (!layout) {
    return <p className="text-neutral-300">Chưa có sơ đồ cho rạp/phòng này.</p>;
  }
  const rows = layout.rows || (layout.grid?.length ?? 0);
  const cols =
    layout.cols || layout.seatsPerRow || (layout.grid?.[0]?.length ?? 0);
  const grid =
    layout.grid ||
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => "S"));

  const labelOf = (r, c) => String.fromCharCode(65 + r) + (c + 1);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Xem trước sơ đồ ghế</h3>
      <div className="overflow-auto">
        <div className="inline-block rounded-xl border border-white/10 p-3 bg-[#0f0f0f]">
          {grid.map((row, r) => (
            <div key={r} className="flex items-center gap-2 mb-2">
              <div className="w-8 text-right text-neutral-400">
                {String.fromCharCode(65 + r)}
              </div>
              <div className="flex gap-1">
                {row.map((cell, c) => {
                  const base =
                    "w-9 h-9 rounded-md flex items-center justify-center border";
                  const byType =
                    cell === "S"
                      ? "bg-[#123c4a] border-[#1e5a6d]"
                      : cell === "V"
                      ? "bg-[#3a0f0f] border-[#6b1f1f]"
                      : cell === "C"
                      ? "bg-[#2a0f3a] border-[#4b1f6b]"
                      : cell === "X"
                      ? "bg-[#2a2a2a] border-[#444] line-through"
                      : "bg-transparent border-dashed border-white/20";
                  return (
                    <div key={c} className={`${base} ${byType}`}>
                      {cell === "_" ? "" : labelOf(r, c)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="ml-10 mt-2 flex gap-1 text-neutral-400">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="w-9 text-center">
                {c + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
