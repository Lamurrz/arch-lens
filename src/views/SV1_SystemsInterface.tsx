import { useState } from "react";
import { useArchStore } from "../store/architectureStore";

const SYSTEM_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  system:    { bg: "#0c1929", border: "#1e3a5f", text: "#7dd3fc" },
  external:  { bg: "#120c29", border: "#3b1e5f", text: "#c4b5fd" },
  human:     { bg: "#0c2918", border: "#1e5f3a", text: "#6ee7b7" },
  datastore: { bg: "#29200c", border: "#5f4a1e", text: "#fcd34d" },
};

const DIRECTION_ICON: Record<string, string> = {
  uni: "→",
  bi:  "⇄",
};

export function SV1View() {
  const { sv1, input } = useArchStore();
  const [filter, setFilter] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  if (!sv1) return null;

  const personaName = (id: string) =>
    input?.personas.find(p => p.id === id)?.name || id;

  const filteredSystems = sv1.systems.filter(s =>
    filter === "" ||
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.type.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredInterfaces = sv1.interfaces.filter(i =>
    selectedSystem
      ? i.sourceId === selectedSystem || i.targetId === selectedSystem
      : filter === "" ||
        i.protocol.toLowerCase().includes(filter.toLowerCase()) ||
        i.dataObjects.some(d => d.toLowerCase().includes(filter.toLowerCase()))
  );

  const systemName = (id: string) =>
    sv1.systems.find(s => s.id === id)?.name || id;

  const typeCounts = sv1.systems.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#1e1a3f", "#6d28d9")}>SV-1</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>
          Systems Interface Description
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
        Identifies systems and sub-systems, and the interfaces (data flows) between them.
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Systems", val: sv1.systems.length, color: "#7dd3fc" },
          { label: "Interfaces", val: sv1.interfaces.length, color: "#a78bfa" },
          { label: "Protocols", val: new Set(sv1.interfaces.map(i => i.protocol)).size, color: "#6ee7b7" },
          { label: "Data Flows", val: new Set(sv1.interfaces.flatMap(i => i.dataObjects)).size, color: "#fcd34d" },
        ].map(s => (
          <div key={s.label} style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
        {Object.entries(typeCounts).map(([type, count]) => {
          const colors = SYSTEM_TYPE_COLORS[type] || SYSTEM_TYPE_COLORS.system;
          return (
            <div key={type} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: "8px 14px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{count}</div>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{type}</div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          placeholder="Filter by name, type, protocol, or data object..."
          value={filter} onChange={e => { setFilter(e.target.value); setSelectedSystem(null); }}
          style={inputStyle}
        />
        {selectedSystem && (
          <button onClick={() => setSelectedSystem(null)}
            style={{ fontSize: 10, color: "#94a3b8", background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>
            Clear selection
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Systems panel */}
        <div>
          <div style={sectionHeader}>Systems & Components</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredSystems.map(sys => {
              const colors = SYSTEM_TYPE_COLORS[sys.type] || SYSTEM_TYPE_COLORS.system;
              const isSelected = selectedSystem === sys.id;
              const ifaceCount = sv1.interfaces.filter(
                i => i.sourceId === sys.id || i.targetId === sys.id
              ).length;

              return (
                <div key={sys.id}
                  onClick={() => setSelectedSystem(isSelected ? null : sys.id)}
                  style={{
                    background: isSelected ? colors.bg : "#080c18",
                    border: `1px solid ${isSelected ? colors.border : "#1e293b"}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{sys.name}</div>
                    <span style={{ fontSize: 8, color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: "1px 6px", textTransform: "uppercase" }}>
                      {sys.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {sys.classification && (
                      <span style={{ fontSize: 8, color: "#64748b", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px" }}>
                        {sys.classification}
                      </span>
                    )}
                    <span style={{ fontSize: 8, color: "#475569" }}>{ifaceCount} interface{ifaceCount !== 1 ? "s" : ""}</span>
                    {sys.personas.length > 0 && (
                      <span style={{ fontSize: 8, color: "#6ee7b7" }}>
                        {sys.personas.map(pid => personaName(pid)).join(", ")}
                      </span>
                    )}
                  </div>
                  {sys.useCaseIds.length > 0 && (
                    <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                      {sys.useCaseIds.map(id => (
                        <span key={id} style={{ fontSize: 7, color: "#475569", background: "#0f172a", borderRadius: 3, padding: "1px 4px" }}>{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interfaces panel */}
        <div>
          <div style={sectionHeader}>
            {selectedSystem
              ? `Interfaces for: ${systemName(selectedSystem)}`
              : "All Interfaces"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredInterfaces.map(iface => {
              const srcSys = sv1.systems.find(s => s.id === iface.sourceId);
              const tgtSys = sv1.systems.find(s => s.id === iface.targetId);
              const srcColors = SYSTEM_TYPE_COLORS[srcSys?.type || "system"];
              const tgtColors = SYSTEM_TYPE_COLORS[tgtSys?.type || "system"];

              return (
                <div key={iface.id} style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
                  {/* Source → Target */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: srcColors.text }}>{srcSys?.name || iface.sourceId}</span>
                    <span style={{ color: "#475569", fontSize: 14 }}>{DIRECTION_ICON[iface.direction]}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: tgtColors.text }}>{tgtSys?.name || iface.targetId}</span>
                    <span style={{ fontSize: 9, color: "#a78bfa", background: "#120c29", border: "1px solid #3b1e5f", borderRadius: 3, padding: "1px 6px", marginLeft: "auto" }}>
                      {iface.protocol}
                    </span>
                  </div>
                  {/* Data objects */}
                  {iface.dataObjects.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {iface.dataObjects.map(d => (
                        <span key={d} style={{ fontSize: 8, color: "#7dd3fc", background: "#0c1929", border: "1px solid #1e3a5f", borderRadius: 3, padding: "1px 5px" }}>{d}</span>
                      ))}
                    </div>
                  )}
                  {iface.useCaseIds.length > 0 && (
                    <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                      {iface.useCaseIds.map(id => (
                        <span key={id} style={{ fontSize: 7, color: "#475569", background: "#0f172a", borderRadius: 3, padding: "1px 4px" }}>{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredInterfaces.length === 0 && (
              <div style={{ fontSize: 11, color: "#334155", padding: "20px 0", textAlign: "center" }}>
                No interfaces match the current filter.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 10, color: "#334155" }}>
        Click a system to filter interfaces. System types: system (blue) · external (purple) · human (green) · datastore (yellow)
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#080c18", border: "1px solid #1e293b", borderRadius: 6,
  padding: "6px 12px", color: "#94a3b8", fontSize: 11, outline: "none",
  width: 320, fontFamily: "inherit",
};
const sectionHeader: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase",
  letterSpacing: "0.06em", marginBottom: 10,
};
function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#a78bfa", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
