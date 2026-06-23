import { useArchStore } from "../store/architectureStore";

const STATUS_ICONS: Record<string, string> = {
  pending: "○",
  running: "◌",
  done: "●",
  error: "✕",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#334155",
  running: "#f59e0b",
  done: "#10b981",
  error: "#ef4444",
};

export function ProcessingStatus() {
  const { processingSteps, status, error } = useArchStore();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
        {status === "processing" ? "Generating Architecture..." : status === "complete" ? "Analysis Complete" : "Error"}
      </div>

      <div style={{ background: "#080c18", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden" }}>
        {processingSteps.map((step, i) => (
          <div key={step.id} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 16px",
            borderBottom: i < processingSteps.length - 1 ? "1px solid #0f172a" : "none",
            background: step.status === "running" ? "#0f172a" : "transparent",
          }}>
            <span style={{ fontSize: 14, color: STATUS_COLORS[step.status], fontWeight: 700, marginTop: 1, minWidth: 16 }}>
              {step.status === "running" ? (
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>
              ) : STATUS_ICONS[step.status]}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: step.status === "done" ? "#e2e8f0" : step.status === "running" ? "#f1f5f9" : "#475569" }}>
                {step.label}
              </div>
              {step.detail && (
                <div style={{ fontSize: 10, color: STATUS_COLORS[step.status], marginTop: 2 }}>{step.detail}</div>
              )}
            </div>
            <span style={{ fontSize: 10, color: STATUS_COLORS[step.status], fontWeight: 700 }}>
              {step.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 12, background: "#450a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>ERROR</div>
          <div style={{ fontSize: 12, color: "#fca5a5" }}>{error}</div>
          <div style={{ fontSize: 10, color: "#7f1d1d", marginTop: 8 }}>
            Common causes: invalid API key, rate limit exceeded, malformed input. Check the browser console for details.
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
