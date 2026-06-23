import { useState } from "react";
import { useArchStore } from "../store/architectureStore";

const TYPE_BADGE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  human:   { color: "#6ee7b7", bg: "#0c2918", border: "#1e5f3a", label: "Human" },
  auto:    { color: "#7dd3fc", bg: "#0c1929", border: "#1e3a5f", label: "Auto" },
  handoff: { color: "#fcd34d", bg: "#29200c", border: "#5f4a1e", label: "Handoff" },
};

const SYSTEM_TYPE_COLORS: Record<string, string> = {
  system:    "#7dd3fc",
  external:  "#c4b5fd",
  human:     "#6ee7b7",
  datastore: "#fcd34d",
};

export function SV4View() {
  const { sv4, input } = useArchStore();
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  if (!sv4) return null;

  const filteredSystems = sv4.systems.filter(s =>
    filter === "" || s.name.toLowerCase().includes(filter.toLowerCase())
  );

  const displaySystems = selectedSystem
    ? sv4.systems.filter(s => s.id === selectedSystem)
    : filteredSystems;

  const functionsForSystem = (sysId: string) =>
    sv4.functions
      .filter(fn => fn.systemId === sysId &&
        (filter === "" ||
         fn.name.toLowerCase().includes(filter.toLowerCase()) ||
         fn.inputs.some(i => i.toLowerCase().includes(filter.toLowerCase())) ||
         fn.outputs.some(o => o.toLowerCase().includes(filter.toLowerCase())))
      )
      .sort((a, b) => a.seq - b.seq);

  const totalFunctions = sv4.functions.length;
  const typeCounts = sv4.functions.reduce((acc, fn) => {
    acc[fn.type] = (acc[fn.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#0c2918", "#059669")}>SV-4</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>
          Systems Functionality Description
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
        Describes the functions performed by each system, with inputs and outputs.
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Systems", val: sv4.systems.length, color: "#7dd3fc" },
          { label: "Total Functions", val: totalFunctions, color: "#6ee7b7" },
        ].map(s => (
          <div key={s.label} style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
        {Object.entries(typeCounts).map(([type, count]) => {
          const badge = TYPE_BADGE[type] || TYPE_BADGE.auto;
          return (
            <div key={type} style={{ background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 6, padding: "8px 14px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: badge.color }}>{count}</div>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{badge.label}</div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Filter by system, function, or data object..."
          value={filter} onChange={e => setFilter(e.target.value)}
          style={inputStyle}
        />
        {selectedSystem && (
          <button onClick={() => setSelectedSystem(null)}
            style={{ fontSize: 10, color: "#94a3b8", background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>
            Show all systems
          </button>
        )}
      </div>

      {/* System selector tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {filteredSystems.map(sys => {
          const fnCount = functionsForSystem(sys.id).length;
          const isSelected = selectedSystem === sys.id;
          const color = SYSTEM_TYPE_COLORS[sys.type] || "#7dd3fc";
          return (
            <button key={sys.id}
              onClick={() => setSelectedSystem(isSelected ? null : sys.id)}
              style={{
                fontSize: 10, fontWeight: 600,
                color: isSelected ? color : "#64748b",
                background: isSelected ? "#080c18" : "transparent",
                border: `1px solid ${isSelected ? "#1e293b" : "#0f172a"}`,
                borderRadius: 5, padding: "4px 10px", cursor: "pointer",
              }}>
              {sys.name} <span style={{ color: "#475569" }}>({fnCount})</span>
            </button>
          );
        })}
      </div>

      {/* Systems and their functions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {displaySystems.map(sys => {
          const fns = functionsForSystem(sys.id);
          if (fns.length === 0 && filter !== "") return null;
          const color = SYSTEM_TYPE_COLORS[sys.type] || "#7dd3fc";

          return (
            <div key={sys.id} style={{ background: "#060a12", border: "1px solid #1e293b", borderRadius: 10 }}>
              {/* System header */}
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{sys.name}</span>
                  <span style={{ fontSize: 8, color: "#475569", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 6px", textTransform: "uppercase" }}>
                    {sys.type}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: "#475569" }}>{fns.length} function{fns.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Functions list */}
              <div style={{ padding: "8px 0" }}>
                {fns.map((fn, i) => {
                  const badge = TYPE_BADGE[fn.type] || TYPE_BADGE.auto;
                  return (
                    <div key={fn.id} style={{
                      padding: "8px 16px",
                      borderBottom: i < fns.length - 1 ? "1px solid #0f172a" : "none",
                      display: "grid",
                      gridTemplateColumns: "28px 1fr auto",
                      gap: 12,
                      alignItems: "start",
                    }}>
                      {/* Seq number */}
                      <div style={{ fontSize: 10, color: "#334155", fontWeight: 700, paddingTop: 2 }}>
                        {String(fn.seq).padStart(2, "0")}
                      </div>

                      {/* Function detail */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>
                          {fn.name}
                        </div>
                        {fn.description && fn.description !== fn.name && (
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{fn.description}</div>
                        )}
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {fn.inputs.length > 0 && (
                            <div>
                              <span style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>IN </span>
                              {fn.inputs.map(inp => (
                                <span key={inp} style={{ fontSize: 8, color: "#fcd34d", background: "#29200c", border: "1px solid #5f4a1e", borderRadius: 3, padding: "1px 5px", marginRight: 3 }}>{inp}</span>
                              ))}
                            </div>
                          )}
                          {fn.outputs.length > 0 && (
                            <div>
                              <span style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>OUT </span>
                              {fn.outputs.map(out => (
                                <span key={out} style={{ fontSize: 8, color: "#7dd3fc", background: "#0c1929", border: "1px solid #1e3a5f", borderRadius: 3, padding: "1px 5px", marginRight: 3 }}>{out}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {fn.useCaseIds.length > 0 && (
                          <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                            {fn.useCaseIds.map(id => (
                              <span key={id} style={{ fontSize: 7, color: "#334155", background: "#0f172a", borderRadius: 3, padding: "1px 4px" }}>{id}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Type badge */}
                      <div style={{ paddingTop: 2 }}>
                        <span style={{ fontSize: 8, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 3, padding: "2px 6px", whiteSpace: "nowrap" }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {fns.length === 0 && (
                  <div style={{ padding: "12px 16px", fontSize: 10, color: "#334155" }}>No functions match the current filter.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#080c18", border: "1px solid #1e293b", borderRadius: 6,
  padding: "6px 12px", color: "#94a3b8", fontSize: 11, outline: "none",
  width: 320, fontFamily: "inherit",
};
function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#6ee7b7", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
