/**
 * Decorative mini-board previews for the home screen's puzzle cards, ported
 * 1:1 from the approved mockup's inline script/markup (brainrank-home.html).
 * They're illustrative, not a render of the player's actual board state -
 * same as in the mockup.
 */

const SF_REGIONS = [0, 0, 1, 1, 1, 0, 2, 2, 1, 3, 4, 2, 2, 3, 3, 4, 4, 2, 2, 3, 4, 4, 4, 3, 3];
const SF_STARS = new Set([0, 7, 14, 16, 23]);

export function StarfieldThumb() {
  return (
    <div className="mini-sf">
      {SF_REGIONS.map((region, i) => (
        <i key={i} className={`r${region}`}>
          {SF_STARS.has(i) ? "★" : ""}
        </i>
      ))}
    </div>
  );
}

const SW_ROWS: Array<{ letters: string[]; ok?: boolean }> = [
  { letters: ["O", "M", "R", "A"] },
  { letters: ["T", "I", "D", "E"], ok: true },
  { letters: ["E", "S", "N", "A"] },
  { letters: ["K", "L", "A", "E"] }
];

export function ShiftwordThumb() {
  return (
    <div className="mini-sw">
      {SW_ROWS.flatMap((row, r) =>
        row.letters.map((letter, c) => (
          <i key={`${r}-${c}`} className={row.ok ? "ok" : undefined}>
            {letter}
          </i>
        ))
      )}
    </div>
  );
}

const UB_BLOCKS = [
  { key: true, left: "2%", top: "calc(100%/6*2 + 2%)", width: "31%", height: "14%" },
  { left: "35%", top: "2%", width: "14%", height: "48%" },
  { left: "52%", top: "18%", width: "14%", height: "31%" },
  { left: "68%", top: "35%", width: "14%", height: "48%" },
  { left: "2%", top: "52%", width: "48%", height: "14%" },
  { left: "52%", top: "85%", width: "46%", height: "13%" },
  { left: "68%", top: "2%", width: "30%", height: "14%" }
];

export function UnblockThumb() {
  return (
    <div className="mini-ub">
      {UB_BLOCKS.map((b, i) => (
        <i
          key={i}
          className={b.key ? "key" : undefined}
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
      <span className="exit" />
    </div>
  );
}

export function ThumbFor({ type }: { type: "starfield" | "shiftword" | "unblock" }) {
  if (type === "starfield") return <StarfieldThumb />;
  if (type === "shiftword") return <ShiftwordThumb />;
  return <UnblockThumb />;
}
