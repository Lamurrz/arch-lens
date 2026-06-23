import { ArchitectureInput } from "../models/types";

export const SYSTEM_PROMPT = `You are a security architect applying the DoDAF (Department of Defense Architecture Framework) methodology to decompose operational use cases into structured architectural views.

Your role is to analyze personas and use cases, then produce structured JSON outputs that populate the following DoDAF views:
- OV-2: Operational Resource Flow (Persona Relationships)
- OV-5b: Operational Activity Model (Capability → Function decomposition)
- OV-6c: Operational Event Trace (Sequenced Actor/Input/Process/Output)
- SV-6: Systems Data Exchange Matrix (Software × Persona × Data × Use Case)
- SV-1: Systems Interface Description (Systems and interfaces between them)
- SV-4: Systems Functionality Description (Functions performed by each system)
- DIV-2: Logical Data Model (Data entities, attributes, and relationships)

Instructions you must follow precisely:
1. Review and understand every persona role and their primary goals.
2. Review every use case and understand which personas participate.
3. Decompose every use case into Capabilities required to complete it. Define Functions required to complete every Capability.
4. For every function define: Actor (persona or system that initiates), Input (data objects consumed), Process (the function action), Output (data objects produced), Destination (target system or actor).
5. Sequence functions in execution order within their parent capability.
6. Classify every function as: "human" (initiated by a persona), "auto" (automated system action), or "handoff" (transition between human and automated system or vice versa).
7. Identify hardware/infrastructure components only where they represent a data boundary, latency constraint, compliance anchor, or reachability dependency.
8. Identify software components, data objects, and which personas access them for each use case.
9. Analyze use cases for similarity and redundancy.
10. Build persona relationship data showing which personas share use cases.

Always respond with valid JSON only. No markdown, no explanation text outside the JSON structure.`;

export function buildDecomposePrompt(input: ArchitectureInput): string {
  return `Analyze the following architecture input and produce a complete decomposition.

PROJECT: ${input.projectName}
DOMAIN: ${input.domain}

PERSONAS:
${input.personas.map(p => `- ID: ${p.id}
  Name: ${p.name}
  Description: ${p.description}
  Goals: ${p.goals.join("; ")}`).join("\n\n")}

USE CASES:
${input.useCases.map(uc => `- ID: ${uc.id}
  Title: ${uc.title}
  Description: ${uc.description}
  Participating Personas: ${uc.personaIds.join(", ")}`).join("\n\n")}

Produce a JSON response with this exact structure:
{
  "decomposed": [
    {
      "useCaseId": "string",
      "title": "string",
      "capabilities": [
        {
          "name": "string",
          "functions": [
            {
              "seq": 1,
              "capability": "string",
              "actor": "string",
              "input": "string",
              "process": "string",
              "output": "string",
              "destination": "string",
              "type": "human|auto|handoff"
            }
          ]
        }
      ],
      "software": ["string"],
      "hardware": "string or null",
      "dataObjects": ["string"],
      "personaIds": ["string"],
      "similarTo": [
        { "useCaseId": "string", "rationale": "string" }
      ]
    }
  ],
  "sv6": {
    "rows": [
      {
        "software": "string",
        "personas": ["string"],
        "dataObjects": ["string"],
        "useCaseIds": ["string"],
        "useCaseTitles": ["string"]
      }
    ]
  }
}`;
}

export function buildOV2Prompt(input: ArchitectureInput): string {
  return `Given these personas and use cases, produce the OV-2 persona relationship data.

PERSONAS:
${input.personas.map(p => `- ID: ${p.id}, Name: ${p.name}`).join("\n")}

USE CASES:
${input.useCases.map(uc => `- ID: ${uc.id}, Title: ${uc.title}, Personas: ${uc.personaIds.join(", ")}`).join("\n")}

Produce JSON with this exact structure:
{
  "ov2": {
    "nodes": [
      {
        "id": "string",
        "name": "string", 
        "description": "string",
        "useCaseCount": 0,
        "useCaseIds": ["string"]
      }
    ],
    "edges": [
      {
        "source": "personaId",
        "target": "personaId",
        "sharedUseCaseIds": ["string"],
        "weight": 1
      }
    ]
  }
}

An edge exists between two personas when they share at least one use case. Weight equals number of shared use cases.`;
}

// ─────────────────────────────────────────────────
// SV-1: Systems Interface Description prompt
// ─────────────────────────────────────────────────

export function buildSV1Prompt(input: ArchitectureInput, decomposed: any[]): string {
  const softwareList = Array.from(new Set(decomposed.flatMap((uc: any) => uc.software))).join(", ");
  const dataObjectList = Array.from(new Set(decomposed.flatMap((uc: any) => uc.dataObjects))).join(", ");

  return `Given the following architecture, produce an SV-1 Systems Interface Description.

PROJECT: ${input.projectName}
DOMAIN: ${input.domain}

PERSONAS:
${input.personas.map(p => `- ID: ${p.id}, Name: ${p.name}`).join("\n")}

USE CASES:
${input.useCases.map(uc => `- ID: ${uc.id}, Title: ${uc.title}, Personas: ${uc.personaIds.join(", ")}`).join("\n")}

KNOWN SOFTWARE COMPONENTS (from decomposition): ${softwareList}
KNOWN DATA OBJECTS (from decomposition): ${dataObjectList}

Produce JSON with this exact structure:
{
  "sv1": {
    "systems": [
      {
        "id": "sys-1",
        "name": "string",
        "type": "system|external|human|datastore",
        "classification": "UNCLASSIFIED",
        "personas": ["personaId"],
        "useCaseIds": ["ucId"]
      }
    ],
    "interfaces": [
      {
        "id": "iface-1",
        "sourceId": "sys-1",
        "targetId": "sys-2",
        "protocol": "HTTPS",
        "dataObjects": ["string"],
        "classification": "UNCLASSIFIED",
        "direction": "uni|bi",
        "useCaseIds": ["ucId"]
      }
    ]
  }
}

Rules:
- Every software component becomes a system node with type "system"
- External services (APIs, cloud services) get type "external"
- Personas that directly interact with systems get type "human"
- Data stores, databases, logs get type "datastore"
- Interfaces represent actual data flows between systems identified in the use cases
- Protocol must be a real protocol: REST, HTTPS, gRPC, SMTP, SFTP, SQL, LDAP, KAFKA, etc.
- direction is "bi" when data flows both ways, "uni" when one-directional`;
}

// ─────────────────────────────────────────────────
// SV-4: Systems Functionality Description prompt
// ─────────────────────────────────────────────────

export function buildSV4Prompt(input: ArchitectureInput, decomposed: any[]): string {
  return `Given the following architecture decomposition, produce an SV-4 Systems Functionality Description.

PROJECT: ${input.projectName}
DOMAIN: ${input.domain}

USE CASES AND DECOMPOSED FUNCTIONS:
${decomposed.map((uc: any) => `Use Case: ${uc.title} (${uc.useCaseId})
  Software: ${uc.software.join(", ")}
  Capabilities:
${uc.capabilities.map((cap: any) => `    ${cap.name}:
${cap.functions.map((fn: any) => `      - seq ${fn.seq}: [${fn.type}] ${fn.actor} → ${fn.process} → ${fn.destination} (in: ${fn.input}, out: ${fn.output})`).join("\n")}`).join("\n")}`).join("\n\n")}

Produce JSON with this exact structure:
{
  "sv4": {
    "systems": [
      {
        "id": "sys-1",
        "name": "string",
        "type": "system|external|human|datastore",
        "classification": "UNCLASSIFIED",
        "personas": ["personaId"],
        "useCaseIds": ["ucId"]
      }
    ],
    "functions": [
      {
        "id": "fn-1",
        "systemId": "sys-1",
        "name": "string",
        "description": "string",
        "inputs": ["data object string"],
        "outputs": ["data object string"],
        "type": "human|auto|handoff",
        "useCaseIds": ["ucId"],
        "seq": 1
      }
    ]
  }
}

Rules:
- Every software component from the decomposition becomes a system node
- Functions are derived from the decomposed capabilities and functions
- Group functions by the system (actor or destination) that performs them
- inputs and outputs are the data objects consumed and produced
- seq reflects the execution order within that system across all use cases`;
}

// ─────────────────────────────────────────────────
// DIV-2: Logical Data Model prompt
// ─────────────────────────────────────────────────

export function buildDIV2Prompt(input: ArchitectureInput, decomposed: any[]): string {
  const allDataObjects = Array.from(new Set(decomposed.flatMap((uc: any) => uc.dataObjects)));

  return `Given the following architecture, produce a DIV-2 Logical Data Model.

PROJECT: ${input.projectName}
DOMAIN: ${input.domain}

USE CASES:
${input.useCases.map(uc => `- ${uc.id}: ${uc.title} — ${uc.description}`).join("\n")}

ALL DATA OBJECTS IDENTIFIED IN DECOMPOSITION:
${allDataObjects.map(d => `- ${d}`).join("\n")}

Produce JSON with this exact structure:
{
  "div2": {
    "entities": [
      {
        "id": "ent-1",
        "name": "string",
        "description": "string",
        "classification": "UNCLASSIFIED",
        "useCaseIds": ["ucId"],
        "attributes": [
          {
            "name": "string",
            "type": "string|integer|boolean|datetime|uuid|enum|object|array",
            "required": true,
            "description": "string"
          }
        ]
      }
    ],
    "relationships": [
      {
        "id": "rel-1",
        "sourceEntityId": "ent-1",
        "targetEntityId": "ent-2",
        "type": "one-to-one|one-to-many|many-to-many",
        "label": "string",
        "useCaseIds": ["ucId"]
      }
    ]
  }
}

Rules:
- Each distinct data object from the decomposition becomes an entity (or group closely related ones)
- Attributes should be realistic for the domain — include id, timestamps, status fields, and domain-specific fields
- Relationships should reflect real data dependencies (e.g. an Alert references an Event, a Report contains Findings)
- label describes the relationship direction (e.g. "contains", "triggers", "references", "belongs to")
- classification reflects data sensitivity in the ${input.domain} domain`;
}
