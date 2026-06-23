// ─────────────────────────────────────────────────
// Core input models (what the user provides)
// ─────────────────────────────────────────────────

export interface Persona {
  id: string;
  name: string;
  description: string;
  goals: string[];
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  personaIds: string[];
}

export interface ArchitectureInput {
  projectName: string;
  domain: string;
  personas: Persona[];
  useCases: UseCase[];
}

// ─────────────────────────────────────────────────
// Decomposed models (what the engine produces)
// ─────────────────────────────────────────────────

export type FunctionType = "human" | "auto" | "handoff";

export interface ArchFunction {
  seq: number;
  capability: string;
  actor: string;
  input: string;
  process: string;
  output: string;
  destination: string;
  type: FunctionType;
  requirementIds?: string[];
}

export interface Capability {
  name: string;
  functions: ArchFunction[];
}

export interface DecomposedUseCase {
  useCaseId: string;
  title: string;
  capabilities: Capability[];
  software: string[];
  hardware: string | null;
  dataObjects: string[];
  personaIds: string[];
  similarTo?: { useCaseId: string; rationale: string }[];
}

export interface Requirement {
  id: string;
  functionSeq: number;
  useCaseId: string;
  text: string;
}

// ─────────────────────────────────────────────────
// View-specific models
// ─────────────────────────────────────────────────

// OV-2: Persona Relationships
export interface PersonaNode {
  id: string;
  name: string;
  description: string;
  useCaseCount: number;
  useCaseIds: string[];
}

export interface PersonaEdge {
  source: string;
  target: string;
  sharedUseCaseIds: string[];
  weight: number;
}

export interface OV2Data {
  nodes: PersonaNode[];
  edges: PersonaEdge[];
}

// OV-5b: Activity Model
export interface OV5bData {
  useCases: DecomposedUseCase[];
}

// OV-6c: Event Trace
export interface EventTraceStep {
  seq: number;
  from: string;
  to: string;
  data: string;
  process: string;
  type: FunctionType;
  capability: string;
}

export interface OV6cData {
  useCaseId: string;
  title: string;
  steps: EventTraceStep[];
  participants: string[];
  handoffPoints: number[];
  trustBoundaries: number[];
  hardware: string | null;
}

// SV-6: Data Exchange Matrix
export interface SV6Row {
  software: string;
  personas: string[];
  dataObjects: string[];
  useCaseIds: string[];
  useCaseTitles: string[];
}

export interface SV6Data {
  rows: SV6Row[];
}

// ─────────────────────────────────────────────────
// SV-1: Systems Interface Description
// ─────────────────────────────────────────────────

export interface SystemNode {
  id: string;
  name: string;
  type: "system" | "external" | "human" | "datastore";
  classification?: string;
  personas: string[];
  useCaseIds: string[];
}

export interface SystemInterface {
  id: string;
  sourceId: string;
  targetId: string;
  protocol: string;
  dataObjects: string[];
  classification?: string;
  direction: "uni" | "bi";
  useCaseIds: string[];
}

export interface SV1Data {
  systems: SystemNode[];
  interfaces: SystemInterface[];
}

// ─────────────────────────────────────────────────
// SV-4: Systems Functionality Description
// ─────────────────────────────────────────────────

export interface SystemFunction {
  id: string;
  systemId: string;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  type: FunctionType;
  useCaseIds: string[];
  seq: number;
}

export interface SV4Data {
  systems: SystemNode[];
  functions: SystemFunction[];
}

// ─────────────────────────────────────────────────
// DIV-2: Logical Data Model
// ─────────────────────────────────────────────────

export interface DataEntity {
  id: string;
  name: string;
  description: string;
  attributes: DataAttribute[];
  classification?: string;
  useCaseIds: string[];
}

export interface DataAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface DataRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  label: string;
  useCaseIds: string[];
}

export interface DIV2Data {
  entities: DataEntity[];
  relationships: DataRelationship[];
}

// ─────────────────────────────────────────────────
// Application state
// ─────────────────────────────────────────────────

export type ProcessingStatus = "idle" | "processing" | "complete" | "error";

export interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export interface ArchitectureState {
  input: ArchitectureInput | null;
  decomposed: DecomposedUseCase[];
  requirements: Requirement[];
  ov2: OV2Data | null;
  ov5b: OV5bData | null;
  ov6c: OV6cData[];
  sv6: SV6Data | null;
  sv1: SV1Data | null;
  sv4: SV4Data | null;
  div2: DIV2Data | null;
  status: ProcessingStatus;
  processingSteps: ProcessingStep[];
  error: string | null;
  apiKey: string;
}
