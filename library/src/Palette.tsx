import { useMemo, useState } from "react";
import { search, type Shape } from "./catalog";
import { BlockIcon } from "./Structure";

export interface PaletteProps {
  /** Only blocks carrying every one of these tags (e.g. ["stone", "light"]). */
  tags?: string[];
  /** Only one shape (e.g. "stairs"). */
  shape?: Shape;
  /** Initial search text. */
  query?: string;
  /** Max blocks shown. Default 240. */
  limit?: number;
}

/**
 * Searchable grid of the GTNH 2.9 building blocks the library knows, with
 * their texture, name and the reference to use in `block=`. Click a block to
 * copy its reference.
 */
export function Palette({ tags, shape, query = "", limit = 240 }: PaletteProps) {
  const [text, setText] = useState(query);
  const results = useMemo(() => search({ tags, shape, text: text || undefined, limit }), [tags?.join(), shape, text, limit]);
  const [copied, setCopied] = useState("");
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#15171c", color: "#e6e8eb", padding: 14, borderRadius: 10 }}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Search blocks (marble, brick, glass…)"
        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1px solid #2f3540", background: "#1d2026", color: "inherit", fontSize: 14 }}
      />
      <div style={{ fontSize: 12, color: "#8b93a1", margin: "8px 0" }}>
        {results.length}{results.length === limit ? "+" : ""} blocks{tags?.length ? ` tagged ${tags.join(", ")}` : ""}
        {shape ? ` · ${shape}` : ""}{copied && ` · copied ${copied}`}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 6 }}>
        {results.map(([key, b]) => (
          <button
            key={key}
            onClick={() => { navigator.clipboard?.writeText(key).catch(() => {}); setCopied(key); }}
            title={`${key}\n${b.tags.join(", ")}`}
            style={{ display: "flex", gap: 8, alignItems: "center", textAlign: "left", background: "#1d2026", border: "1px solid #262b34", borderRadius: 6, padding: 6, color: "inherit", cursor: "pointer" }}
          >
            <BlockIcon block={key} size={32} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.display}</span>
              <span style={{ display: "block", fontSize: 11, color: "#8b93a1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
