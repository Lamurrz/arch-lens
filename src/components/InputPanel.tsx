import { useState } from "react";
import { ArchitectureInput, Persona, UseCase } from "../models/types";
import { useArchStore } from "../store/architectureStore";

const SOC_EXAMPLE: ArchitectureInput = {
  projectName: "Security Operations Center",
  domain: "Cybersecurity / Security Operations",
  personas: [
    { id: "csirt-ops", name: "CSIRT Operations", description: "Focus on ensuring security incidents are identified quickly, assessed accurately, contained, and resolved efficiently.", goals: ["Minimize incident impact", "Accurate triage", "Efficient containment"] },
    { id: "csirt-resp", name: "CSIRT Response", description: "Coordinates all aspects of incident response including detection, assessment, containment, eradication, recovery, and post-incident analysis.", goals: ["Mitigate damage", "Understand root cause", "Implement improvements"] },
    { id: "cti", name: "Cyber Threat Intelligence", description: "Collects data from OSINT, proprietary feeds, internal data, and peer collaboration to produce actionable intelligence.", goals: ["Produce actionable intelligence", "Inform detection strategies", "Support risk management"] },
    { id: "det-eng", name: "Detection Engineering", description: "Creates and maintains detection strategies including configuration of security tools, development of detection rules, and refinement of detection methods.", goals: ["Build effective detections", "Integrate threat intelligence", "Adapt to evolving threats"] },
    { id: "auto-orch", name: "Automation & Orchestration", description: "Uses technology to perform tasks without human intervention and coordinates multiple automated workflows for security outcomes.", goals: ["Reduce response time", "Automate repetitive tasks", "Enable higher-level analysis"] },
    { id: "threat-hunt", name: "Threat Hunting", description: "Proactively detects advanced persistent threats, malware, and malicious activities that bypass conventional security tools.", goals: ["Detect APTs", "Find bypassed threats", "Generate new detections"] },
    { id: "data-sci", name: "Data Scientist", description: "Leverages data analysis, machine learning, and statistical modeling to enhance threat detection, incident response, and security posture.", goals: ["Improve detection accuracy", "Build ML models", "Enhance analytics"] },
    { id: "data-mgmt", name: "Data Management", description: "Correctly routes telemetry to the correct destination and ensures security of data both in transit and storage.", goals: ["Route telemetry correctly", "Ensure data security", "Maintain pipeline health"] },
  ],
  useCases: [
    { id: "uc1", title: "Detection Gap Analysis & Remediation", description: "Collaborating with other security teams to identify gaps in detection capabilities. When a detection gap is identified the collaborative team performs a root cause analysis and risk assessment to determine if remediation is necessary. The risk analysis and root cause analysis is documented. If remediation is necessary, develop and execute remediation plan.", personaIds: ["det-eng", "csirt-ops", "cti"] },
    { id: "uc2", title: "SIEM Rule Development and Tuning", description: "Crafting and fine-tuning rules for SIEM systems to identify specific attack patterns, such as brute-force attacks or data exfiltration attempts.", personaIds: ["det-eng"] },
    { id: "uc3", title: "TIP Integration into Detection Pipeline", description: "Integrating TIP into detection systems to improve the identification of known threats and vulnerabilities. SIEM and Data Lake custom pipelines are pulling data into Databricks, no integration with EDR.", personaIds: ["det-eng", "cti", "data-mgmt"] },
    { id: "uc14", title: "Security Alert Monitoring", description: "Utilizing monitoring tools and alerts to identify potential security incidents with current logging infrastructure with the future goal of under XX minutes of data ingestion to alerting.", personaIds: ["csirt-ops", "det-eng", "data-mgmt"] },
    { id: "uc17", title: "Proactive Threat Hunting", description: "Proactively search for malicious activities utilizing historical data to find security compromises that have bypassed traditional security measures.", personaIds: ["threat-hunt", "data-sci"] },
  ],
};

function Tag({ text, onRemove }: { text: string; onRemove?: () => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#94a3b8" }}>
      {text}
      {onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>}
    </span>
  );
}

function PersonaForm({ persona, onChange, onRemove }: { persona: Persona; onChange: (p: Persona) => void; onRemove: () => void }) {
  const [goalInput, setGoalInput] = useState("");
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Persona</span>
        <button onClick={onRemove} style={btnStyle("#450a0a", "#ef4444")}>Remove</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <input placeholder="ID (e.g. csirt-ops)" value={persona.id} onChange={e => onChange({ ...persona, id: e.target.value })} style={inputStyle} />
        <input placeholder="Name" value={persona.name} onChange={e => onChange({ ...persona, name: e.target.value })} style={inputStyle} />
      </div>
      <textarea placeholder="Description" value={persona.description} onChange={e => onChange({ ...persona, description: e.target.value })} style={{ ...inputStyle, height: 60, resize: "vertical" }} />
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Goals</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          {persona.goals.map((g, i) => <Tag key={i} text={g} onRemove={() => onChange({ ...persona, goals: persona.goals.filter((_, j) => j !== i) })} />)}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input placeholder="Add goal..." value={goalInput} onChange={e => setGoalInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && goalInput.trim()) { onChange({ ...persona, goals: [...persona.goals, goalInput.trim()] }); setGoalInput(""); }}} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={() => { if (goalInput.trim()) { onChange({ ...persona, goals: [...persona.goals, goalInput.trim()] }); setGoalInput(""); }}} style={btnStyle("#1e3a5f", "#3b82f6")}>Add</button>
        </div>
      </div>
    </div>
  );
}

function UseCaseForm({ uc, personas, onChange, onRemove }: { uc: UseCase; personas: Persona[]; onChange: (uc: UseCase) => void; onRemove: () => void }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Use Case</span>
        <button onClick={onRemove} style={btnStyle("#450a0a", "#ef4444")}>Remove</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 8 }}>
        <input placeholder="ID (e.g. uc1)" value={uc.id} onChange={e => onChange({ ...uc, id: e.target.value })} style={inputStyle} />
        <input placeholder="Title" value={uc.title} onChange={e => onChange({ ...uc, title: e.target.value })} style={inputStyle} />
      </div>
      <textarea placeholder="Description" value={uc.description} onChange={e => onChange({ ...uc, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: "vertical" }} />
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>Participating Personas</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {personas.map(p => {
            const active = uc.personaIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => onChange({ ...uc, personaIds: active ? uc.personaIds.filter(id => id !== p.id) : [...uc.personaIds, p.id] })}
                style={{ ...btnStyle(active ? "#1e3a5f" : "#0f172a", active ? "#3b82f6" : "#334155"), fontSize: 10 }}>
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", background: "#080c18", border: "1px solid #1e293b", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btnStyle = (bg: string, border: string): React.CSSProperties => ({ background: bg, border: `1px solid ${border}`, color: "#e2e8f0", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 });

export function InputPanel() {
  const { input, setInput, apiKey, setApiKey, runAnalysis, status, reset } = useArchStore();
  const [localInput, setLocalInput] = useState<ArchitectureInput>(input || SOC_EXAMPLE);
  const [showKey, setShowKey] = useState(false);

  const handleRun = async () => {
    setInput(localInput);
    await runAnalysis();
  };

  const addPersona = () => setLocalInput(prev => ({ ...prev, personas: [...prev.personas, { id: "", name: "", description: "", goals: [] }] }));
  const addUC = () => setLocalInput(prev => ({ ...prev, useCases: [...prev.useCases, { id: "", title: "", description: "", personaIds: [] }] }));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Step 1 — Configure</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input placeholder="Project name" value={localInput.projectName} onChange={e => setLocalInput(p => ({ ...p, projectName: e.target.value }))} style={inputStyle} />
          <input placeholder="Domain (e.g. Cybersecurity)" value={localInput.domain} onChange={e => setLocalInput(p => ({ ...p, domain: e.target.value }))} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type={showKey ? "text" : "password"} placeholder="Anthropic API Key (sk-ant-...)" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={() => setShowKey(s => !s)} style={btnStyle("#0f172a", "#334155")}>{showKey ? "Hide" : "Show"}</button>
        </div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Your API key is stored locally in your browser and never sent to any server other than api.anthropic.com</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Step 2 — Personas ({localInput.personas.length})</div>
          <button onClick={addPersona} style={btnStyle("#1e3a5f", "#3b82f6")}>+ Add Persona</button>
        </div>
        {localInput.personas.map((p, i) => (
          <PersonaForm key={i} persona={p} onChange={updated => setLocalInput(prev => ({ ...prev, personas: prev.personas.map((x, j) => j === i ? updated : x) }))} onRemove={() => setLocalInput(prev => ({ ...prev, personas: prev.personas.filter((_, j) => j !== i) }))} />
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Step 3 — Use Cases ({localInput.useCases.length})</div>
          <button onClick={addUC} style={btnStyle("#064e3b", "#10b981")}>+ Add Use Case</button>
        </div>
        {localInput.useCases.map((uc, i) => (
          <UseCaseForm key={i} uc={uc} personas={localInput.personas} onChange={updated => setLocalInput(prev => ({ ...prev, useCases: prev.useCases.map((x, j) => j === i ? updated : x) }))} onRemove={() => setLocalInput(prev => ({ ...prev, useCases: prev.useCases.filter((_, j) => j !== i) }))} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleRun} disabled={status === "processing" || !apiKey}
          style={{ ...btnStyle(status === "processing" ? "#0f172a" : "#1e3a5f", "#3b82f6"), padding: "10px 24px", fontSize: 13, fontWeight: 700, opacity: (!apiKey || status === "processing") ? 0.5 : 1 }}>
          {status === "processing" ? "Generating Architecture..." : "Generate Architecture Views"}
        </button>
        {status !== "idle" && <button onClick={reset} style={btnStyle("#0f172a", "#334155")}>Reset</button>}
        <button onClick={() => setLocalInput(SOC_EXAMPLE)} style={btnStyle("#0f172a", "#334155")}>Load SOC Example</button>
      </div>
    </div>
  );
}
