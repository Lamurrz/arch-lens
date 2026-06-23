import { useState } from "react";
import { useArchStore } from "./store/architectureStore";
import { InputPanel } from "./components/InputPanel";
import { ProcessingStatus } from "./components/ProcessingStatus";
import { OV2View } from "./views/OV2_PersonaRelationships";
import { OV5bView } from "./views/OV5b_ActivityModel";
import { OV6cView } from "./views/OV6c_EventTrace";
import { SV6View } from "./views/SV6_DataExchangeMatrix";
import { SV1View } from "./views/SV1_SystemsInterface";
import { SV4View } from "./views/SV4_SystemsFunctionality";
import { DIV2View } from "./views/DIV2_LogicalDataModel";

type Tab = "input" | "ov2" | "ov5b" | "ov6c" | "sv6" | "sv1" | "sv4" | "div2";

const VIEWS: { id: Tab; label: string; badge: string; desc: string; requiresData: boolean }[] = [
  { id: "input", label: "Input",  badge: "",       desc: "Configure personas and use cases",  requiresData: false },
  { id: "ov2",   label: "OV-2",   badge: "OV-2",   desc: "Persona Relationships",             requiresData: true },
  { id: "ov5b",  label: "OV-5b",  badge: "OV-5b",  desc: "Activity Model",                   requiresData: true },
  { id: "ov6c",  label: "OV-6c",  badge: "OV-6c",  desc: "Event Trace",                      requiresData: true },
  { id: "sv6",   label: "SV-6",   badge: "SV-6",   desc: "Data Exchange Matrix",             requiresData: true },
  { id: "sv1",   label: "SV-1",   badge: "SV-1",   desc: "Systems Interface Description",    requiresData: true },
  { id: "sv4",   label: "SV-4",   badge: "SV-4",   desc: "Systems Functionality",            requiresData: true },
  { id: "div2",  label: "DIV-2",  badge: "DIV-2",  desc: "Logical Data Model",               requiresData: true },
];

const FUTURE_VIEWS = [
  { badge: "CV-4",   desc: "Capability Dependencies" },
  { badge: "StdV-1", desc: "Standards Profile" },
];

const BADGE_COLORS: Partial<Record<Tab, { bg: string; border: string; text: string }>> = {
  ov2:  { bg: "#1e3a5f", border: "#3b82f6", text: "#7dd3fc" },
  ov5b: { bg: "#1e3a5f", border: "#3b82f6", text: "#7dd3fc" },
  ov6c: { bg: "#1e3a5f", border: "#3b82f6", text: "#7dd3fc" },
  sv6:  { bg: "#1e3a5f", border: "#3b82f6", text: "#7dd3fc" },
  sv1:  { bg: "#1a0c29", border: "#6d28d9", text: "#a78bfa" },
  sv4:  { bg: "#0c2918", border: "#059669", text: "#6ee7b7" },
  div2: { bg: "#1a0c29", border: "#9333ea", text: "#c4b5fd" },
};

export default function App() {
  const { status, decomposed, input } = useArchStore();
  const [activeTab, setActiveTab] = useState<Tab>("input");

  const hasData = status === "complete" && decomposed.length > 0;
  const isProcessing = status === "processing";

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0e1a",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#e2e8f0", display: "flex", flexDirection: "column"
    }}>
      {/* Top bar */}
      <header style={{
        background: "#080c18", borderBottom: "1px solid #1e293b",
        padding: "0 24px", display: "flex", alignItems: "center", height: 52,
        gap: 20, flexShrink: 0
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7dd3fc", letterSpacing: "0.08em" }}>ARCH</span>
          <span style={{ fontSize: 12, fontWeight: 400, color: "#334155", letterSpacing: "0.08em" }}>·LENS</span>
        </div>
        <div style={{ width: 1, height: 20, background: "#1e293b" }} />
        <div style={{ fontSize: 10, color: "#475569" }}>
          DoDAF Security Architecture Generator
        </div>
        {input && (
          <>
            <div style={{ width: 1, height: 20, background: "#1e293b" }} />
            <div style={{ fontSize: 10, color: "#64748b" }}>
              <span style={{ color: "#94a3b8" }}>{input.projectName}</span>
              <span style={{ margin: "0 6px", color: "#1e293b" }}>·</span>
              {input.personas.length} personas
              <span style={{ margin: "0 6px", color: "#1e293b" }}>·</span>
              {input.useCases.length} use cases
            </div>
          </>
        )}
        {hasData && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 9, color: "#10b981" }}>ANALYSIS COMPLETE</span>
          </div>
        )}
      </header>

      {/* Tab bar */}
      <nav style={{
        background: "#080c18", borderBottom: "1px solid #1e293b",
        padding: "0 24px", display: "flex", alignItems: "flex-end", gap: 2,
        flexShrink: 0, overflowX: "auto"
      }}>
        {VIEWS.map(view => {
          const disabled = view.requiresData && !hasData;
          const active = activeTab === view.id;
          const colors = BADGE_COLORS[view.id] || { bg: "#1e3a5f", border: "#3b82f6", text: "#7dd3fc" };
          return (
            <button key={view.id}
              disabled={disabled}
              onClick={() => !disabled && setActiveTab(view.id)}
              style={{
                background: active ? "#0a0e1a" : "transparent",
                border: `1px solid ${active ? "#1e293b" : "transparent"}`,
                borderBottom: active ? "1px solid #0a0e1a" : "1px solid transparent",
                borderRadius: "6px 6px 0 0",
                padding: "8px 14px", cursor: disabled ? "not-allowed" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                opacity: disabled ? 0.35 : 1, marginBottom: -1,
                gap: 1, flexShrink: 0,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {view.badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: active ? colors.text : "#475569",
                    background: active ? colors.bg : "#0f172a",
                    border: `1px solid ${active ? colors.border : "#1e293b"}`,
                    borderRadius: 3, padding: "0 4px"
                  }}>{view.badge}</span>
                )}
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? "#f1f5f9" : "#475569" }}>
                  {view.label}
                </span>
              </div>
              <div style={{ fontSize: 9, color: "#334155" }}>{view.desc}</div>
            </button>
          );
        })}

        {/* Future views */}
        <div style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 4, paddingBottom: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: "#1e293b", marginRight: 4 }}>PLANNED:</span>
          {FUTURE_VIEWS.map(v => (
            <span key={v.badge} style={{
              fontSize: 9, color: "#1e293b", background: "#080c18",
              border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px"
            }} title={v.desc}>{v.badge}</span>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {isProcessing && activeTab === "input" ? (
          <ProcessingStatus />
        ) : activeTab === "input" ? (
          <InputPanel />
        ) : activeTab === "ov2" ? (
          <OV2View />
        ) : activeTab === "ov5b" ? (
          <OV5bView />
        ) : activeTab === "ov6c" ? (
          <OV6cView />
        ) : activeTab === "sv6" ? (
          <SV6View />
        ) : activeTab === "sv1" ? (
          <SV1View />
        ) : activeTab === "sv4" ? (
          <SV4View />
        ) : activeTab === "div2" ? (
          <DIV2View />
        ) : null}

        {/* Processing overlay on non-input tabs */}
        {isProcessing && activeTab !== "input" && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(10,14,26,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
          }}>
            <ProcessingStatus />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: "8px 24px", borderTop: "1px solid #0f172a", display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#1e293b" }}>DoDAF Architecture Generator</span>
        <span style={{ fontSize: 9, color: "#1e293b" }}>·</span>
        <a href="https://github.com/Lamurrz/arch-lens" style={{ fontSize: 9, color: "#334155", textDecoration: "none" }}>GitHub</a>
        <span style={{ fontSize: 9, color: "#1e293b", marginLeft: "auto" }}>
          FastAPI backend stub ready · v1.1.0
        </span>
      </footer>
    </div>
  );
}
