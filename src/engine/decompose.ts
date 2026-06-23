import {
  ArchitectureInput,
  DecomposedUseCase,
  OV2Data,
  OV5bData,
  OV6cData,
  SV6Data,
  SV1Data,
  SV4Data,
  DIV2Data,
  EventTraceStep,
  SystemNode,
} from "../models/types";
import { callClaude, parseJSON } from "../api/client";
import {
  SYSTEM_PROMPT,
  buildDecomposePrompt,
  buildOV2Prompt,
  buildSV1Prompt,
  buildSV4Prompt,
  buildDIV2Prompt,
} from "./prompts";

export interface DecomposeResult {
  decomposed: DecomposedUseCase[];
  ov2: OV2Data;
  ov5b: OV5bData;
  ov6c: OV6cData[];
  sv6: SV6Data;
  sv1: SV1Data;
  sv4: SV4Data;
  div2: DIV2Data;
}

export interface DecomposeOptions {
  input: ArchitectureInput;
  apiKey: string;
  onStepUpdate: (stepId: string, status: "running" | "done" | "error", detail?: string) => void;
}

export async function runDecomposition(opts: DecomposeOptions): Promise<DecomposeResult> {
  const { input, apiKey, onStepUpdate } = opts;

  // ── Step 1: Decompose use cases ──────────────────
  onStepUpdate("decompose", "running", "Decomposing use cases into capabilities and functions...");
  let decomposeRaw: string;
  try {
    decomposeRaw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildDecomposePrompt(input),
      apiKey,
    });
    onStepUpdate("decompose", "done", `Decomposed ${input.useCases.length} use cases`);
  } catch (e: any) {
    onStepUpdate("decompose", "error", e.message);
    throw e;
  }

  let decomposeData: { decomposed: DecomposedUseCase[]; sv6: SV6Data };
  try {
    decomposeData = parseJSON(decomposeRaw);
  } catch (e: any) {
    onStepUpdate("decompose", "error", "Failed to parse decomposition response");
    throw new Error("Failed to parse decomposition: " + e.message);
  }

  // ── Step 2: Build OV-2 persona relationships ─────
  onStepUpdate("ov2", "running", "Building persona relationship graph...");
  let ov2Data: OV2Data;
  try {
    const ov2Raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildOV2Prompt(input),
      apiKey,
    });
    const parsed = parseJSON<{ ov2: OV2Data }>(ov2Raw);
    ov2Data = parsed.ov2;
    onStepUpdate("ov2", "done", `${ov2Data.nodes.length} personas, ${ov2Data.edges.length} relationships`);
  } catch (e: any) {
    onStepUpdate("ov2", "error", e.message);
    ov2Data = buildOV2FromInput(input);
    onStepUpdate("ov2", "done", "Built from input data (fallback)");
  }

  // ── Step 3: Build OV-5b ──────────────────────────
  onStepUpdate("ov5b", "running", "Building activity model...");
  const ov5b: OV5bData = { useCases: decomposeData.decomposed };
  onStepUpdate("ov5b", "done", `${ov5b.useCases.length} use cases modeled`);

  // ── Step 4: Build OV-6c event traces ─────────────
  onStepUpdate("ov6c", "running", "Generating event traces...");
  const ov6c: OV6cData[] = decomposeData.decomposed.map((uc) => buildEventTrace(uc));
  onStepUpdate("ov6c", "done", `${ov6c.length} event traces generated`);

  // ── Step 5: SV-6 matrix ──────────────────────────
  onStepUpdate("sv6", "running", "Building data exchange matrix...");
  const sv6 = decomposeData.sv6 || buildSV6Fallback(decomposeData.decomposed, input);
  onStepUpdate("sv6", "done", `${sv6.rows.length} software components mapped`);

  // ── Step 6: SV-1 Systems Interface Description ───
  onStepUpdate("sv1", "running", "Building systems interface description...");
  let sv1: SV1Data;
  try {
    const sv1Raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildSV1Prompt(input, decomposeData.decomposed),
      apiKey,
    });
    const parsed = parseJSON<{ sv1: SV1Data }>(sv1Raw);
    sv1 = parsed.sv1;
    onStepUpdate("sv1", "done", `${sv1.systems.length} systems, ${sv1.interfaces.length} interfaces`);
  } catch (e: any) {
    onStepUpdate("sv1", "error", e.message);
    sv1 = buildSV1Fallback(decomposeData.decomposed, input);
    onStepUpdate("sv1", "done", "Built from decomposition (fallback)");
  }

  // ── Step 7: SV-4 Systems Functionality Description ─
  onStepUpdate("sv4", "running", "Building systems functionality description...");
  let sv4: SV4Data;
  try {
    const sv4Raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildSV4Prompt(input, decomposeData.decomposed),
      apiKey,
    });
    const parsed = parseJSON<{ sv4: SV4Data }>(sv4Raw);
    sv4 = parsed.sv4;
    onStepUpdate("sv4", "done", `${sv4.systems.length} systems, ${sv4.functions.length} functions`);
  } catch (e: any) {
    onStepUpdate("sv4", "error", e.message);
    sv4 = buildSV4Fallback(decomposeData.decomposed, input);
    onStepUpdate("sv4", "done", "Built from decomposition (fallback)");
  }

  // ── Step 8: DIV-2 Logical Data Model ─────────────
  onStepUpdate("div2", "running", "Building logical data model...");
  let div2: DIV2Data;
  try {
    const div2Raw = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildDIV2Prompt(input, decomposeData.decomposed),
      apiKey,
    });
    const parsed = parseJSON<{ div2: DIV2Data }>(div2Raw);
    div2 = parsed.div2;
    onStepUpdate("div2", "done", `${div2.entities.length} entities, ${div2.relationships.length} relationships`);
  } catch (e: any) {
    onStepUpdate("div2", "error", e.message);
    div2 = buildDIV2Fallback(decomposeData.decomposed);
    onStepUpdate("div2", "done", "Built from decomposition (fallback)");
  }

  return {
    decomposed: decomposeData.decomposed,
    ov2: ov2Data,
    ov5b,
    ov6c,
    sv6,
    sv1,
    sv4,
    div2,
  };
}

// ─────────────────────────────────────────────────
// Local builders (fallbacks and derivations)
// ─────────────────────────────────────────────────

function buildOV2FromInput(input: ArchitectureInput): OV2Data {
  const nodes = input.personas.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    useCaseCount: input.useCases.filter((uc) => uc.personaIds.includes(p.id)).length,
    useCaseIds: input.useCases.filter((uc) => uc.personaIds.includes(p.id)).map((uc) => uc.id),
  }));

  const edges: OV2Data["edges"] = [];
  for (let i = 0; i < input.personas.length; i++) {
    for (let j = i + 1; j < input.personas.length; j++) {
      const a = input.personas[i];
      const b = input.personas[j];
      const shared = input.useCases.filter(
        (uc) => uc.personaIds.includes(a.id) && uc.personaIds.includes(b.id)
      );
      if (shared.length > 0) {
        edges.push({
          source: a.id,
          target: b.id,
          sharedUseCaseIds: shared.map((uc) => uc.id),
          weight: shared.length,
        });
      }
    }
  }
  return { nodes, edges };
}

function buildEventTrace(uc: DecomposedUseCase): OV6cData {
  const steps: EventTraceStep[] = [];
  const participants = new Set<string>();
  const handoffPoints: number[] = [];
  const trustBoundaries: number[] = [];

  uc.capabilities.forEach((cap) => {
    cap.functions.forEach((fn) => {
      steps.push({
        seq: fn.seq,
        from: fn.actor,
        to: fn.destination,
        data: fn.output,
        process: fn.process,
        type: fn.type,
        capability: cap.name,
      });
      participants.add(fn.actor);
      participants.add(fn.destination);
      if (fn.type === "handoff") handoffPoints.push(fn.seq);
    });
  });

  if (uc.hardware) {
    steps.forEach((s) => {
      if (
        s.from.toLowerCase().includes("agent") ||
        s.to.toLowerCase().includes("firewall") ||
        s.to.toLowerCase().includes("edr") ||
        s.to.toLowerCase().includes("endpoint")
      ) {
        trustBoundaries.push(s.seq);
      }
    });
  }

  return {
    useCaseId: uc.useCaseId,
    title: uc.title,
    steps,
    participants: Array.from(participants).filter(Boolean),
    handoffPoints,
    trustBoundaries,
    hardware: uc.hardware,
  };
}

function buildSV6Fallback(decomposed: DecomposedUseCase[], input: ArchitectureInput): SV6Data {
  const softwareMap = new Map<string, SV6Data["rows"][0]>();

  decomposed.forEach((uc) => {
    uc.software.forEach((sw) => {
      if (!softwareMap.has(sw)) {
        softwareMap.set(sw, {
          software: sw,
          personas: [],
          dataObjects: [],
          useCaseIds: [],
          useCaseTitles: [],
        });
      }
      const row = softwareMap.get(sw)!;
      if (!row.useCaseIds.includes(uc.useCaseId)) {
        row.useCaseIds.push(uc.useCaseId);
        row.useCaseTitles.push(uc.title);
      }
      uc.personaIds.forEach((pid) => {
        const name = input.personas.find((p) => p.id === pid)?.name || pid;
        if (!row.personas.includes(name)) row.personas.push(name);
      });
      uc.dataObjects.forEach((d) => {
        if (!row.dataObjects.includes(d)) row.dataObjects.push(d);
      });
    });
  });

  return { rows: Array.from(softwareMap.values()) };
}

function buildSV1Fallback(decomposed: DecomposedUseCase[], input: ArchitectureInput): SV1Data {
  const systemMap = new Map<string, SystemNode>();
  let sysCounter = 1;

  decomposed.forEach((uc) => {
    uc.software.forEach((sw) => {
      if (!systemMap.has(sw)) {
        systemMap.set(sw, {
          id: `sys-${sysCounter++}`,
          name: sw,
          type: "system",
          classification: "UNCLASSIFIED",
          personas: [],
          useCaseIds: [],
        });
      }
      const node = systemMap.get(sw)!;
      if (!node.useCaseIds.includes(uc.useCaseId)) node.useCaseIds.push(uc.useCaseId);
      uc.personaIds.forEach((pid) => {
        if (!node.personas.includes(pid)) node.personas.push(pid);
      });
    });
  });

  input.personas.forEach((p) => {
    const key = `human-${p.id}`;
    if (!systemMap.has(key)) {
      systemMap.set(key, {
        id: `sys-p-${p.id}`,
        name: p.name,
        type: "human",
        classification: "UNCLASSIFIED",
        personas: [p.id],
        useCaseIds: decomposed
          .filter((uc) => uc.personaIds.includes(p.id))
          .map((uc) => uc.useCaseId),
      });
    }
  });

  const ifaceMap = new Map<string, any>();
  let ifaceCounter = 1;

  decomposed.forEach((uc) => {
    uc.capabilities.forEach((cap) => {
      cap.functions.forEach((fn) => {
        const srcNode = Array.from(systemMap.values()).find(
          (s) => s.name === fn.actor || s.personas.includes(fn.actor)
        );
        const tgtNode = Array.from(systemMap.values()).find(
          (s) => s.name === fn.destination || s.personas.includes(fn.destination)
        );
        if (srcNode && tgtNode && srcNode.id !== tgtNode.id) {
          const key = `${srcNode.id}→${tgtNode.id}`;
          if (!ifaceMap.has(key)) {
            ifaceMap.set(key, {
              id: `iface-${ifaceCounter++}`,
              sourceId: srcNode.id,
              targetId: tgtNode.id,
              protocol: "HTTPS",
              dataObjects: [],
              classification: "UNCLASSIFIED",
              direction: "uni" as const,
              useCaseIds: [],
            });
          }
          const iface = ifaceMap.get(key);
          if (fn.output && !iface.dataObjects.includes(fn.output))
            iface.dataObjects.push(fn.output);
          if (!iface.useCaseIds.includes(uc.useCaseId))
            iface.useCaseIds.push(uc.useCaseId);
        }
      });
    });
  });

  return {
    systems: Array.from(systemMap.values()),
    interfaces: Array.from(ifaceMap.values()),
  };
}

function buildSV4Fallback(decomposed: DecomposedUseCase[], input: ArchitectureInput): SV4Data {
  const systemMap = new Map<string, SystemNode>();
  const functions: SV4Data["functions"] = [];
  let sysCounter = 1;
  let fnCounter = 1;

  decomposed.forEach((uc) => {
    uc.software.forEach((sw) => {
      if (!systemMap.has(sw)) {
        systemMap.set(sw, {
          id: `sys-${sysCounter++}`,
          name: sw,
          type: "system",
          classification: "UNCLASSIFIED",
          personas: [],
          useCaseIds: [],
        });
      }
      const node = systemMap.get(sw)!;
      if (!node.useCaseIds.includes(uc.useCaseId)) node.useCaseIds.push(uc.useCaseId);
    });

    uc.capabilities.forEach((cap) => {
      cap.functions.forEach((fn) => {
        const system = Array.from(systemMap.values()).find(
          (s) => s.name === fn.actor || s.name === fn.destination
        );
        if (system) {
          functions.push({
            id: `fn-${fnCounter++}`,
            systemId: system.id,
            name: fn.process,
            description: `${fn.process} (${cap.name})`,
            inputs: fn.input ? [fn.input] : [],
            outputs: fn.output ? [fn.output] : [],
            type: fn.type,
            useCaseIds: [uc.useCaseId],
            seq: fn.seq,
          });
        }
      });
    });
  });

  return { systems: Array.from(systemMap.values()), functions };
}

function buildDIV2Fallback(decomposed: DecomposedUseCase[]): DIV2Data {
  const allDataObjects = Array.from(
    new Set(decomposed.flatMap((uc) => uc.dataObjects))
  );
  let entCounter = 1;
  let relCounter = 1;

  const entities = allDataObjects.map((name) => ({
    id: `ent-${entCounter++}`,
    name,
    description: `Data entity representing ${name}`,
    classification: "UNCLASSIFIED",
    useCaseIds: decomposed
      .filter((uc) => uc.dataObjects.includes(name))
      .map((uc) => uc.useCaseId),
    attributes: [
      { name: "id", type: "uuid", required: true, description: "Unique identifier" },
      { name: "createdAt", type: "datetime", required: true, description: "Creation timestamp" },
      { name: "updatedAt", type: "datetime", required: false, description: "Last updated timestamp" },
    ],
  }));

  const relationships: DIV2Data["relationships"] = [];

  decomposed.forEach((uc) => {
    uc.capabilities.forEach((cap) => {
      cap.functions.forEach((fn) => {
        const srcEnt = entities.find((e) => e.name === fn.input);
        const tgtEnt = entities.find((e) => e.name === fn.output);
        if (srcEnt && tgtEnt && srcEnt.id !== tgtEnt.id) {
          const exists = relationships.some(
            (r) => r.sourceEntityId === srcEnt.id && r.targetEntityId === tgtEnt.id
          );
          if (!exists) {
            relationships.push({
              id: `rel-${relCounter++}`,
              sourceEntityId: srcEnt.id,
              targetEntityId: tgtEnt.id,
              type: "one-to-many",
              label: "produces",
              useCaseIds: [uc.useCaseId],
            });
          }
        }
      });
    });
  });

  return { entities, relationships };
}
