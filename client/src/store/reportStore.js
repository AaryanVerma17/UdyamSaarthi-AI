import { create } from "zustand";

/**
 * Minimal global store for the current feasibility report + loading/error state.
 * Kept intentionally simple for the MVP scaffold — swap for Redux Toolkit
 * slices later if the app's state needs grow (per the tech stack doc).
 */
export const useReportStore = create((set) => ({
  report: null,
  isLoading: false,
  error: null,
  setReport: (report) => set({ report, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({ report: null, isLoading: false, error: null }),
}));
