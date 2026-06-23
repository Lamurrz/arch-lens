import { useArchStore } from "../store/architectureStore";

const PERSONA_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316", "#84cc16",
];

export function OV2View() {
  const { ov2, input } = useArchStore();
  if (!ov2) return null;

  const { nodes, edges } = ov2;
  const maxUC = Math.max(...nodes.map(n => n.useCaseCount), 1);

  // Simple force-directed-ish layout in a circle
  const W = 600, H = 400, cx = W / 2, cy = H / 2, r = 150;
  const positions = nodes.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  const nodeById = (id: string) => {
    const idx = nodes.findIndex(n => n.id === id);
    return idx >= 0 ? { node: nodes[idx], pos: positions[idx], color: PERSONA_COLORS[idx % PERSONA_COLORS.length] } : null;
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#1e3a5f", "#3b82f6")}>OV-2</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>Operational Resource Flow — Persona Relationships</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 20 }}>
        Edges connect personas that share at least one use case. Edge weight = number of shared use cases.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Graph */}
        <div style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
            {/* Edges */}
            {edges.map((edge, i) => {
              const a = nodeById(edge.source);
              const b = nodeById(edge.target);
              if (!a || !b) return null;
              const maxW = Math.max(...edges.map(e => e.weight), 1);
              const strokeW = 1 + (edge.weight / maxW) * 3;
              return (
                <g key={i}>
                  <line x1={a.pos.x} y1={a.pos.y} x2={b.pos.x} y2={b.pos.y}
                    stroke="#1e293b" strokeWidth={strokeW + 2} />
                  <line x1={a.pos.x} y1={a.pos.y} x2={b.pos.x} y2={b.pos.y}
                    stroke="#334155" strokeWidth={strokeW} />
                  {/* Weight label */}
                  <text x={(a.pos.x + b.pos.x) / 2} y={(a.pos.y + b.pos.y) / 2}
                    textAnchor="middle" fill="#475569" fontSize={9}>
                    {edge.weight}
                  </text>
                </g>
              );
            })}
            {/* Nodes */}
            {nodes.map((node, i) => {
              const pos = positions[i];
              const color = PERSONA_COLORS[i % PERSONA_COLORS.length];
              const nodeR = 12 + (node.useCaseCount / maxUC) * 14;
              return (
                <g key={node.id}>
                  <circle cx={pos.x} cy={pos.y} r={nodeR + 3} fill={color} opacity={0.15} />
                  <circle cx={pos.x} cy={pos.y} r={nodeR} fill="#080c18" stroke={color} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={9} fontWeight={700}>
                    {node.useCaseCount}
                  </text>
                  {/* Label */}
                  <text x={pos.x} y={pos.y + nodeR + 12} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight={600}>
                    {node.name.split(" ").slice(0, 2).join(" ")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {nodes.map((node, i) => {
            const color = PERSONA_COLORS[i % PERSONA_COLORS.length];
            const sharedWith = edges
              .filter(e => e.source === node.id || e.target === node.id)
              .map(e => {
                const otherId = e.source === node.id ? e.target : e.source;
                const other = nodes.find(n => n.id === otherId);
                return { name: other?.name || otherId, weight: e.weight };
              });
            return (
              <div key={node.id} style={{ background: "#080c18", border: `1px solid #1e293b`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>{node.name}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{node.useCaseCount} use case{node.useCaseCount !== 1 ? "s" : ""}</div>
                {sharedWith.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: "#475569", marginBottom: 3 }}>Collaborates with:</div>
                    {sharedWith.map(s => (
                      <div key={s.name} style={{ fontSize: 9, color: "#64748b" }}>· {s.name} ({s.weight} shared)</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#7dd3fc", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
