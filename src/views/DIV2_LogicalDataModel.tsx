import { useState } from "react";
import { useArchStore } from "../store/architectureStore";
import { DataEntity, DataRelationship } from "../models/types";

const ATTR_TYPE_COLORS: Record<string, string> = {
  uuid:     "#a78bfa",
  string:   "#7dd3fc",
  integer:  "#6ee7b7",
  boolean:  "#fcd34d",
  datetime: "#fb923c",
  enum:     "#f472b6",
  object:   "#94a3b8",
  array:    "#38bdf8",
};

const REL_TYPE_LABELS: Record<string, string> = {
  "one-to-one":   "1 : 1",
  "one-to-many":  "1 : N",
  "many-to-many": "N : N",
};

export function DIV2View() {
  const { div2, input } = useArchStore();
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showAttrs, setShowAttrs] = useState(true);

  if (!div2) return null;

  const filteredEntities = div2.entities.filter(e =>
    filter === "" ||
    e.name.toLowerCase().includes(filter.toLowerCase()) ||
    e.attributes.some(a => a.name.toLowerCase().includes(filter.toLowerCase()))
  );

  const relationsForEntity = (entityId: string): DataRelationship[] =>
    div2.relationships.filter(
      r => r.sourceEntityId === entityId || r.targetEntityId === entityId
    );

  const entityName = (id: string) =>
    div2.entities.find(e => e.id === id)?.name || id;

  const displayEntities = selectedEntity
    ? div2.entities.filter(e => e.id === selectedEntity)
    : filteredEntities;

  // Entities connected to selected
  const connectedIds = selectedEntity
    ? new Set(
        div2.relationships
          .filter(r => r.sourceEntityId === selectedEntity || r.targetEntityId === selectedEntity)
          .flatMap(r => [r.sourceEntityId, r.targetEntityId])
      )
    : null;

  const displayRelationships = selectedEntity
    ? div2.relationships.filter(r => r.sourceEntityId === selectedEntity || r.targetEntityId === selectedEntity)
    : div2.relationships;

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <span style={viewBadge("#1a0c29", "#9333ea")}>DIV-2</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginLeft: 10 }}>
          Logical Data Model
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
        Identifies data entities, their attributes, and the relationships between them.
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Entities", val: div2.entities.length, color: "#c4b5fd" },
          { label: "Relationships", val: div2.relationships.length, color: "#a78bfa" },
          { label: "Attributes", val: div2.entities.reduce((sum, e) => sum + e.attributes.length, 0), color: "#7dd3fc" },
          { label: "Rel Types", val: new Set(div2.relationships.map(r => r.type)).size, color: "#6ee7b7" },
        ].map(s => (
          <div key={s.label} style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Filter by entity or attribute name..."
          value={filter} onChange={e => { setFilter(e.target.value); setSelectedEntity(null); }}
          style={inputStyle}
        />
        <button
          onClick={() => setShowAttrs(a => !a)}
          style={{ fontSize: 10, color: showAttrs ? "#c4b5fd" : "#475569", background: showAttrs ? "#1a0c29" : "#0f172a", border: `1px solid ${showAttrs ? "#6d28d9" : "#1e293b"}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>
          {showAttrs ? "Hide attributes" : "Show attributes"}
        </button>
        {selectedEntity && (
          <button onClick={() => setSelectedEntity(null)}
            style={{ fontSize: 10, color: "#94a3b8", background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>
            Clear selection
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Entities */}
        <div>
          <div style={sectionHeader}>Data Entities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayEntities.map(entity => {
              const isSelected = selectedEntity === entity.id;
              const isConnected = connectedIds ? connectedIds.has(entity.id) : false;
              const relCount = relationsForEntity(entity.id).length;

              return (
                <div key={entity.id}
                  onClick={() => setSelectedEntity(isSelected ? null : entity.id)}
                  style={{
                    background: isSelected ? "#1a0c29" : isConnected ? "#100c20" : "#080c18",
                    border: `1px solid ${isSelected ? "#6d28d9" : isConnected ? "#3b1e5f" : "#1e293b"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "all 0.15s",
                  }}>
                  {/* Entity header */}
                  <div style={{ padding: "10px 14px", borderBottom: showAttrs ? "1px solid #1e293b" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>{entity.name}</span>
                      {entity.classification && (
                        <span style={{ fontSize: 8, color: "#64748b", marginLeft: 8, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px" }}>
                          {entity.classification}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: "#475569" }}>{entity.attributes.length} attrs</span>
                      <span style={{ fontSize: 9, color: "#6d28d9" }}>{relCount} rel{relCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {entity.description && (
                    <div style={{ padding: "6px 14px", fontSize: 10, color: "#64748b", borderBottom: showAttrs && entity.attributes.length > 0 ? "1px solid #0f172a" : "none" }}>
                      {entity.description}
                    </div>
                  )}

                  {/* Attributes */}
                  {showAttrs && entity.attributes.length > 0 && (
                    <div style={{ padding: "6px 0" }}>
                      {entity.attributes.map((attr, i) => {
                        const typeColor = ATTR_TYPE_COLORS[attr.type] || "#94a3b8";
                        return (
                          <div key={attr.name} style={{
                            padding: "4px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            borderBottom: i < entity.attributes.length - 1 ? "1px solid #060a12" : "none",
                          }}>
                            <span style={{ fontSize: 10, color: attr.required ? "#e2e8f0" : "#64748b", fontFamily: "monospace", minWidth: 120 }}>
                              {attr.required ? "" : "?"}{attr.name}
                            </span>
                            <span style={{ fontSize: 8, color: typeColor, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px", fontFamily: "monospace" }}>
                              {attr.type}
                            </span>
                            {attr.description && (
                              <span style={{ fontSize: 9, color: "#334155", flex: 1 }}>{attr.description}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Use cases */}
                  {entity.useCaseIds.length > 0 && (
                    <div style={{ padding: "4px 14px 8px", display: "flex", gap: 3 }}>
                      {entity.useCaseIds.map(id => (
                        <span key={id} style={{ fontSize: 7, color: "#334155", background: "#0f172a", borderRadius: 3, padding: "1px 4px" }}>{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Relationships panel */}
        <div>
          <div style={sectionHeader}>
            {selectedEntity ? `Relationships for: ${entityName(selectedEntity)}` : "All Relationships"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayRelationships.map(rel => {
              const srcEntity = div2.entities.find(e => e.id === rel.sourceEntityId);
              const tgtEntity = div2.entities.find(e => e.id === rel.targetEntityId);
              const relLabel = REL_TYPE_LABELS[rel.type] || rel.type;

              return (
                <div key={rel.id} style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#c4b5fd" }}>
                      {srcEntity?.name || rel.sourceEntityId}
                    </span>
                    <span style={{ fontSize: 9, color: "#475569", background: "#1a0c29", border: "1px solid #3b1e5f", borderRadius: 3, padding: "1px 6px", whiteSpace: "nowrap" }}>
                      {relLabel}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#c4b5fd" }}>
                      {tgtEntity?.name || rel.targetEntityId}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic", marginBottom: 4 }}>
                    "{rel.label}"
                  </div>
                  {rel.useCaseIds.length > 0 && (
                    <div style={{ display: "flex", gap: 3 }}>
                      {rel.useCaseIds.map(id => (
                        <span key={id} style={{ fontSize: 7, color: "#334155", background: "#0f172a", borderRadius: 3, padding: "1px 4px" }}>{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {displayRelationships.length === 0 && (
              <div style={{ fontSize: 11, color: "#334155", padding: "20px 0", textAlign: "center" }}>
                No relationships found.
              </div>
            )}
          </div>

          {/* Attribute type legend */}
          <div style={{ marginTop: 20 }}>
            <div style={sectionHeader}>Attribute Types</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(ATTR_TYPE_COLORS).map(([type, color]) => (
                <span key={type} style={{ fontSize: 8, color, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "2px 6px", fontFamily: "monospace" }}>
                  {type}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: "#334155" }}>
              ? prefix = optional attribute
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#080c18", border: "1px solid #1e293b", borderRadius: 6,
  padding: "6px 12px", color: "#94a3b8", fontSize: 11, outline: "none",
  width: 280, fontFamily: "inherit",
};
const sectionHeader: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase",
  letterSpacing: "0.06em", marginBottom: 10,
};
function viewBadge(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color: "#c4b5fd", fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 8px" };
}
