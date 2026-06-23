import { useState } from "react";
import { useArchStore } from "../store/architectureStore";
import { OV6cData, FunctionType } from "../models/types";

const TYPE_COLORS: Record<FunctionType, { stroke: string; fill: string; text: string }> = {
  human:   { stroke: "#3b82f6", fill: "#1e3a5f", text: "#bfdbfe" },
  auto:    { stroke: "#10b981", fill: "#064e3b", text: "#a7f3d0" },
  handoff: { stroke: "#f59e0b", fill: "#451a03", text: "#fde68a" },
};

const SWIMLANE_COLORS = [
  "#0d1929", "#0a1a14", "#1a1000", "#140d29",
  "#1a0a0a", "#0a1a1a", "#1a1a0a", "#0a0a1a",
];

function EventTraceDiagram({ trace }: { trace: OV6cData }) {
  // Collect unique participants (actors + destinations)
  const allParticipants = new Set<string>();
  trace.steps.forEach(s => {
    allParticipants.add(s.from);
    allParticipants.add(s.to);
  });
  const participants = Array.from(allParticipants).filter(p => p && p !== "string");

  const LANE_H = 70;
  const STEP_W = 200;
  const LABEL_W = 160;
  const PAD = 20;
  const SVG_H = participants.length * LANE_H + PAD * 2;
  const SVG_W = LABEL_W + trace.steps.length * STEP_W + PAD;

  const laneY = (actor: string) => {
    const idx = participants.indexOf(actor);
    return idx >= 0 ? PAD + idx * LANE_H + LANE_H / 2 : PAD + LANE_H / 2;
  };

  return (
    <div style={{ overflowX: "auto", background: "#080c18", border: "1px solid #1e293b", borderRadius: 8 }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ minWidth: SVG_W, display: "block" }}>
        {/* Lane backgrounds */}
        {participants.map((p, i) => (
          <rect key={p} x={0} y={PAD + i * LANE_H} width={SVG_W} height={LANE_H}
            fill={SWIMLANE_COLORS[i % SWIMLANE_COLORS.length]} opacity={0.6} />
        ))}
        {/* Lane dividers */}
        {participants.map((_, i) => (
          <line key={i} x1={0} y1={PAD + i * LANE_H} x2={SVG_W} y2={PAD + i * LANE_H} stroke="#1e293b" strokeWidth={1} />
        ))}
        <line x1={0} y1={PAD + participants.length * LANE_H} x2={SVG_W} y2={PAD + participants.length * LANE_H} stroke="#334155" strokeWidth={1} />

        {/* Label separator */}
        <line x1={LABEL_W} y1={0} x2={LABEL_W} y2={SVG_H} stroke="#334155" strokeWidth={1.5} />

        {/* Lane labels */}
        {participants.map((p, i) => (
          <text key={p} x={LABEL_W - 10} y={PAD + i * LANE_H + LANE_H / 2}
            textAnchor="end" dominantBaseline="middle"
            fill="#64748b" fontSize={9} fontWeight={700}>
            {p.length > 22 ? p.slice(0, 20) + "…" : p}
          </text>
        ))}

        {/* Steps */}
        {trace.steps.map((step, i) => {
          const x = LABEL_W + i * STEP_W + STEP_W / 2;
          const fromY = laneY(step.from);
          const toY = laneY(step.to);
          const c = TYPE_COLORS[step.type] || TYPE_COLORS.human;
          const isHandoff = trace.handoffPoints.includes(step.seq);
          const isTrust = trace.trustBoundaries.includes(step.seq);
          const isSameLane = fromY === toY;

          return (
            <g key={step.seq}>
              {/* Step column line */}
              <line x1={x} y1={PAD} x2={x} y2={SVG_H - PAD} stroke="#1e293b" strokeWidth={1} strokeDasharray="3,4" />

              {/* Arrow */}
              {isSameLane ? (
                // Self-referencing arc
                <path d={`M ${x - 20} ${fromY} C ${x - 20} ${fromY - 30} ${x + 20} ${fromY - 30} ${x + 20} ${fromY}`}
                  fill="none" stroke={c.stroke} strokeWidth={1.5} markerEnd={`url(#arr-${step.type})`} />
              ) : (
                <line x1={x} y1={fromY} x2={x} y2={toY + (toY > fromY ? -12 : 12)}
                  stroke={isHandoff ? "#f59e0b" : isTrust ? "#ef4444" : c.stroke}
                  strokeWidth={isHandoff ? 2 : 1.5}
                  strokeDasharray={isTrust ? "4,2" : "none"}
                  markerEnd={`url(#arr-${step.type})`} />
              )}

              {/* Node box at source */}
              <rect x={x - 60} y={fromY - 16} width={120} height={32} rx={4}
                fill={c.fill} stroke={c.stroke} strokeWidth={1.5} />
              <text x={x} y={fromY - 6} textAnchor="middle" fill="#e2e8f0" fontSize={8} fontWeight={600}>
                {step.process.length > 24 ? step.process.slice(0, 22) + "…" : step.process}
              </text>
              <text x={x} y={fromY + 5} textAnchor="middle" fill={c.text} fontSize={7}>
                #{step.seq} · {step.capability.length > 18 ? step.capability.slice(0, 16) + "…" : step.capability}
              </text>

              {/* Data label on arrow */}
              <text x={x + 6} y={(fromY + toY) / 2 + (isSameLane ? -35 : 0)}
                fill="#475569" fontSize={7.5} dominantBaseline="middle">
                {step.data.length > 20 ? step.data.slice(0, 18) + "…" : step.data}
              </text>
            </g>
          );
        })}

        {/* Arrow markers */}
        <defs>
          {(["human", "auto", "handoff"] as FunctionType[]).map(t => (
            <marker key={t} id={`arr-${t}`} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill={TYPE_COLORS[t].stroke} />
            </marker>
          ))}
        </defs>
      </svg>
    </div>
  );
}

export function OV6cView() {
  const { ov6c } = useArchStore();
  const [selectedId, setSelectedId] = useState<string>(ov6c[0]?.useCaseId || "");

  if (!ov6c.length) return null;
  const selected = ov6c.find(t => t.useCaseId === selectedId) || ov6c[0];

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#1e3a5f", "#3b82f6")}>OV-6c</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>Operational Event Trace</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
        Swimlane sequence diagram. Each lane is an actor or system. Arrows show data objects in transit.
      </div>

      {/* UC selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {ov6c.map(trace => (
          <button key={trace.useCaseId} onClick={() => setSelectedId(trace.useCaseId)}
            style={{
              background: selectedId === trace.useCaseId ? "#1e3a5f" : "#0f172a",
              border: `1px solid ${selectedId === trace.useCaseId ? "#3b82f6" : "#1e293b"}`,
              color: selectedId === trace.useCaseId ? "#7dd3fc" : "#64748b",
              borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 10
            }}>
            {trace.useCaseId.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{selected.title}</span>
        {selected.handoffPoints.length > 0 && (
          <span style={{ fontSize: 10, color: "#f59e0b" }}>⚡ Handoffs at steps: {selected.handoffPoints.join(", ")}</span>
        )}
        {selected.hardware && (
          <span style={{ fontSize: 9, color: "#f59e0b", background: "#1c1007", border: "1px solid #78350f", borderRadius: 3, padding: "2px 6px" }}>⚙ {selected.hardware}</span>
        )}
      </div>

      <EventTraceDiagram trace={selected} />

      {/* Step table below diagram */}
      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ background: "#080c18" }}>
              {["#", "Cap", "From", "Data", "Process", "To", "Type"].map(h => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selected.steps.map((step, i) => {
              const c = TYPE_COLORS[step.type] || TYPE_COLORS.human;
              return (
                <tr key={step.seq} style={{ borderBottom: "1px solid #0f172a", background: i % 2 === 0 ? "transparent" : "#080c18" }}>
                  <td style={{ padding: "6px 10px", color: "#64748b" }}>{step.seq}</td>
                  <td style={{ padding: "6px 10px" }}><span style={{ fontSize: 9, color: "#64748b", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px" }}>{step.capability}</span></td>
                  <td style={{ padding: "6px 10px", color: "#94a3b8" }}>{step.from}</td>
                  <td style={{ padding: "6px 10px", color: "#7dd3fc" }}>{step.data}</td>
                  <td style={{ padding: "6px 10px", color: "#e2e8f0" }}>{step.process}</td>
                  <td style={{ padding: "6px 10px", color: "#94a3b8" }}>{step.to}</td>
                  <td style={{ padding: "6px 10px" }}><span style={{ fontSize: 9, background: c.fill, border: `1px solid ${c.stroke}`, color: c.text, borderRadius: 3, padding: "1px 5px" }}>{step.type}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#7dd3fc", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
