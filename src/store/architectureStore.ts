import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ArchitectureState,
  ArchitectureInput,
  ProcessingStep,
} from "../models/types";
import { runDecomposition } from "../engine/decompose";

const INITIAL_STEPS: ProcessingStep[] = [
  { id: "decompose", label: "Decompose use cases → capabilities → functions", status: "pending" },
  { id: "ov2",      label: "OV-2: Build persona relationship graph",          status: "pending" },
  { id: "ov5b",     label: "OV-5b: Build activity model",                     status: "pending" },
  { id: "ov6c",     label: "OV-6c: Generate event traces",                    status: "pending" },
  { id: "sv6",      label: "SV-6: Build data exchange matrix",                status: "pending" },
  { id: "sv1",      label: "SV-1: Build systems interface description",        status: "pending" },
  { id: "sv4",      label: "SV-4: Build systems functionality description",    status: "pending" },
  { id: "div2",     label: "DIV-2: Build logical data model",                  status: "pending" },
];

interface Actions {
  setApiKey: (key: string) => void;
  setInput: (input: ArchitectureInput) => void;
  runAnalysis: () => Promise<void>;
  reset: () => void;
  updateStep: (id: string, status: ProcessingStep["status"], detail?: string) => void;
}

const initialState: ArchitectureState = {
  input: null,
  decomposed: [],
  requirements: [],
  ov2: null,
  ov5b: null,
  ov6c: [],
  sv6: null,
  sv1: null,
  sv4: null,
  div2: null,
  status: "idle",
  processingSteps: INITIAL_STEPS,
  error: null,
  apiKey: "",
};

export const useArchStore = create<ArchitectureState & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setApiKey: (key) => set({ apiKey: key }),

      setInput: (input) => set({ input }),

      updateStep: (id, status, detail) =>
        set((state) => ({
          processingSteps: state.processingSteps.map((s) =>
            s.id === id ? { ...s, status, detail } : s
          ),
        })),

      runAnalysis: async () => {
        const { input, apiKey } = get();
        if (!input) throw new Error("No input provided");
        if (!apiKey) throw new Error("No API key provided");

        set({
          status: "processing",
          error: null,
          decomposed: [],
          ov2: null,
          ov5b: null,
          ov6c: [],
          sv6: null,
          sv1: null,
          sv4: null,
          div2: null,
          processingSteps: INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })),
        });

        try {
          const result = await runDecomposition({
            input,
            apiKey,
            onStepUpdate: (stepId, status, detail) => {
              get().updateStep(stepId, status, detail);
            },
          });

          set({
            decomposed: result.decomposed,
            ov2: result.ov2,
            ov5b: result.ov5b,
            ov6c: result.ov6c,
            sv6: result.sv6,
            sv1: result.sv1,
            sv4: result.sv4,
            div2: result.div2,
            status: "complete",
          });
        } catch (e: any) {
          set({ status: "error", error: e.message });
        }
      },

      reset: () =>
        set({
          ...initialState,
          apiKey: get().apiKey, // preserve API key across resets
        }),
    }),
    {
      name: "soc-architect-store",
      partialize: (state) => ({
        apiKey: state.apiKey,
        input: state.input,
        decomposed: state.decomposed,
        ov2: state.ov2,
        ov5b: state.ov5b,
        ov6c: state.ov6c,
        sv6: state.sv6,
        sv1: state.sv1,
        sv4: state.sv4,
        div2: state.div2,
        status: state.status,
      }),
    }
  )
);
