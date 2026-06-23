import { useState } from "react";
import { useArchStore } from "../store/architectureStore";

export function SV6View() {
  const { sv6, input } = useArchStore();
  const [filter, setFilter] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);

  if (!sv6) return null;

  const filtered = sv6.rows.filter(row =>
    filter === "" ||
    row.software.toLowerCase().includes(filter.toLowerCase()) ||
    row.personas.some(p => p.toLowerCase().includes(filter.toLowerCase())) ||
    row.dataObjects.some(d => d.toLowerCase().includes(filter.toLowerCase()))
  );

  // Get all unique use case IDs for column headers
  const allUCIds = Array.from(new Set(sv6.rows.flatMap(r => r.useCaseIds)));
  const ucTitle = (id: string) => {
    const row = sv6.rows.find(r => r.useCaseIds.includes(id));
    const idx = row?.useCaseIds.indexOf(id) ?? -1;
    return idx >= 0 ? row!.useCaseTitles[idx] : id;
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#1e3a5f", "#3b82f6")}>SV-6</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>Systems Data Exchange Matrix</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
        Maps software components to accessing personas, data objects, and use cases.
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          placeholder="Filter by software, persona, or data object..."
          value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 6, padding: "6px 12px", color: "#94a3b8", fontSize: 11, outline: "none", width: 320, fontFamily: "inherit" }}
        />
        <span style={{ fontSize: 10, color: "#475569" }}>{filtered.length} / {sv6.rows.length} components</span>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Software Components", val: sv6.rows.length, color: "#3b82f6" },
          { label: "Unique Use Cases", val: allUCIds.length, color: "#10b981" },
          { label: "Data Objects", val: new Set(sv6.rows.flatMap(r => r.dataObjects)).size, color: "#7dd3fc" },
          { label: "Personas", val: new Set(sv6.rows.flatMap(r => r.personas)).size, color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Matrix table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr style={{ background: "#080c18" }}>
              <th style={th}>Software Component</th>
              <th style={th}>Personas</th>
              <th style={th}>Data Objects</th>
              {allUCIds.map(id => (
                <th key={id} style={{ ...th, maxWidth: 80, cursor: "pointer", background: highlight === id ? "#1e293b" : "#080c18" }}
                  onClick={() => setHighlight(h => h === id ? null : id)}>
                  <div style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", padding: "4px 0", color: highlight === id ? "#7dd3fc" : "#475569", fontSize: 9, whiteSpace: "nowrap", maxHeight: 100 }}>
                    {id.toUpperCase()}: {ucTitle(id).slice(0, 28)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.software} style={{ borderBottom: "1px solid #0f172a", background: i % 2 === 0 ? "transparent" : "#060a12" }}>
                <td style={{ ...td, color: "#e2e8f0", fontWeight: 600, minWidth: 180 }}>
                  {row.software}
                </td>
                <td style={{ ...td, minWidth: 160 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {row.personas.map(p => (
                      <span key={p} style={{ fontSize: 8, color: "#94a3b8", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px", whiteSpace: "nowrap" }}>{p}</span>
                    ))}
                  </div>
                </td>
                <td style={{ ...td, minWidth: 200 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {row.dataObjects.slice(0, 5).map(d => (
                      <span key={d} style={{ fontSize: 8, color: "#7dd3fc", background: "#0c1929", border: "1px solid #1e3a5f", borderRadius: 3, padding: "1px 5px", whiteSpace: "nowrap" }}>{d}</span>
                    ))}
                    {row.dataObjects.length > 5 && (
                      <span style={{ fontSize: 8, color: "#475569" }}>+{row.dataObjects.length - 5} more</span>
                    )}
                  </div>
                </td>
                {allUCIds.map(id => {
                  const hasUC = row.useCaseIds.includes(id);
                  return (
                    <td key={id} style={{ ...td, textAlign: "center", background: highlight === id ? (hasUC ? "#0f2a1a" : "#0a1020") : "transparent" }}>
                      {hasUC ? <span style={{ color: "#10b981", fontSize: 14 }}>●</span> : <span style={{ color: "#1e293b", fontSize: 10 }}>·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: "#334155" }}>
        Click a use case column header to highlight. ● = component used in that use case.
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 12px", verticalAlign: "top" };

function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#7dd3fc", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
