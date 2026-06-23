import { useState } from "react";
import { useArchStore } from "../store/architectureStore";
import { DecomposedUseCase, FunctionType } from "../models/types";

const TYPE_STYLE: Record<FunctionType, { bg: string; border: string; label: string; tag: string }> = {
  human:   { bg: "#1e3a5f", border: "#3b82f6", label: "#bfdbfe", tag: "Human" },
  auto:    { bg: "#064e3b", border: "#10b981", label: "#a7f3d0", tag: "Auto" },
  handoff: { bg: "#451a03", border: "#f59e0b", label: "#fde68a", tag: "⚡ Handoff" },
};

const CAP_COLORS = ["#1e293b", "#162032", "#1a2535", "#0f172a", "#1c2538", "#182030", "#1e2a3a"];

function UCActivityModel({ uc }: { uc: DecomposedUseCase }) {
  const [expanded, setExpanded] = useState(true);
  const totalFns = uc.capabilities.reduce((s, c) => s + c.functions.length, 0);
  const handoffs = uc.capabilities.flatMap(c => c.functions).filter(f => f.type === "handoff").length;

  return (
    <div style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: expanded ? "1px solid #0f172a" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{uc.useCaseId.toUpperCase()}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{uc.title}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#64748b" }}>{uc.capabilities.length} caps · {totalFns} fns</span>
          {handoffs > 0 && <span style={{ fontSize: 10, color: "#f59e0b" }}>⚡ {handoffs}</span>}
          {uc.hardware && <span style={{ fontSize: 9, color: "#f59e0b", background: "#1c1007", border: "1px solid #78350f", borderRadius: 3, padding: "1px 5px" }}>HW</span>}
          <span style={{ color: "#334155", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "12px 16px", overflowX: "auto" }}>
          {uc.hardware && (
            <div style={{ fontSize: 10, color: "#f59e0b", background: "#1c1007", border: "1px solid #78350f", borderRadius: 4, padding: "4px 10px", marginBottom: 10, display: "inline-block" }}>
              ⚙ Hardware boundary: {uc.hardware}
            </div>
          )}
          <div style={{ display: "flex", gap: 0, minWidth: uc.capabilities.length * 200 }}>
            {uc.capabilities.map((cap, ci) => (
              <div key={cap.name} style={{
                flex: 1, minWidth: 190,
                background: CAP_COLORS[ci % CAP_COLORS.length],
                border: "1px solid #1e293b",
                borderRadius: ci === 0 ? "6px 0 0 6px" : ci === uc.capabilities.length - 1 ? "0 6px 6px 0" : 0,
                padding: 10,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #1e293b", paddingBottom: 6, marginBottom: 8, textAlign: "center" }}>{cap.name}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {cap.functions.map((fn, fi) => {
                    const s = TYPE_STYLE[fn.type] || TYPE_STYLE.human;
                    return (
                      <div key={fn.seq}>
                        {fi > 0 && <div style={{ textAlign: "center", color: "#334155", fontSize: 12, margin: "2px 0" }}>↓</div>}
                        <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 5, padding: "6px 8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 9, color: "#475569" }}>#{fn.seq}</span>
                            <span style={{ fontSize: 8, background: s.bg, border: `1px solid ${s.border}`, color: s.label, borderRadius: 3, padding: "0 4px" }}>{s.tag}</span>
                          </div>
                          <div style={{ fontSize: 10, color: "#e2e8f0", fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{fn.process}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>
                            <span style={{ color: "#475569" }}>Actor: </span>{fn.actor}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
                            <span style={{ color: "#475569" }}>In: </span><span style={{ color: "#94a3b8" }}>{fn.input}</span>
                          </div>
                          <div style={{ fontSize: 9, marginTop: 2 }}>
                            <span style={{ color: "#475569" }}>Out: </span>
                            <span style={{ color: s.label }}>{fn.output}</span>
                          </div>
                          <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>→ {fn.destination}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Software & Data Objects */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {uc.software.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Software</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {uc.software.map(s => <span key={s} style={{ fontSize: 9, color: "#94a3b8", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 6px" }}>{s}</span>)}
                </div>
              </div>
            )}
            {uc.dataObjects.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Objects</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {uc.dataObjects.map(d => <span key={d} style={{ fontSize: 9, color: "#7dd3fc", background: "#0c1929", border: "1px solid #1e3a5f", borderRadius: 3, padding: "1px 6px" }}>{d}</span>)}
                </div>
              </div>
            )}
            {uc.similarTo && uc.similarTo.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Overlap / Redundancy</div>
                {uc.similarTo.map(s => (
                  <div key={s.useCaseId} style={{ fontSize: 9, color: "#f59e0b" }}>⚠ Similar to {s.useCaseId}: {s.rationale}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OV5bView() {
  const { ov5b } = useArchStore();
  if (!ov5b) return null;

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#1e3a5f", "#3b82f6")}>OV-5b</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>Operational Activity Model</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 20 }}>
        Capabilities decomposed into sequenced functions. Each function shows Actor → Input → Process → Output → Destination.
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 10 }}>
        {Object.entries(TYPE_STYLE).map(([type, s]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.bg, border: `1px solid ${s.border}`, display: "inline-block" }} />
            <span style={{ color: "#64748b" }}>{s.tag}</span>
          </span>
        ))}
      </div>
      {ov5b.useCases.map(uc => <UCActivityModel key={uc.useCaseId} uc={uc} />)}
    </div>
  );
}

function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#7dd3fc", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
