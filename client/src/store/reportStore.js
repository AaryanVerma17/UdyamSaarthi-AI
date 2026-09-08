import { create } from "zustand";

const INITIAL_FORM = {
  village: "",
  block: "",
  district: "",
  state: "",
  ownCapital: "",
  businessCategory: "Dairy",
};

export const useReportStore =
  create((set) => ({
    report: null,

    isLoading: false,

    error: null,

    intakeDraft: INITIAL_FORM,

    setReport: (report) =>
      set({
        report,
        error: null,
      }),

    setLoading: (isLoading) =>
      set({
        isLoading,
      }),

    setError: (error) =>
      set({
        error,
        isLoading: false,
      }),

    setIntakeDraft: (
      intakeDraft
    ) =>
      set({
        intakeDraft,
      }),

    clearError: () =>
      set({
        error: null,
      }),

    reset: () =>
      set({
        report: null,
        isLoading: false,
        error: null,
        intakeDraft: {
          ...INITIAL_FORM,
        },
      }),
  }));