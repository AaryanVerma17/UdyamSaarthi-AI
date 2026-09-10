import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

function normalizeApiError(error) {
  if (!error) {
    return new Error(
      "Unable to connect to the server."
    );
  }

  if (error.code === "ECONNABORTED") {
    const normalized = new Error(
      "The feasibility service is taking longer than expected."
    );

    normalized.userMessage =
      "The feasibility service is taking longer than expected. Please try again.";

    return normalized;
  }

  if (!error.response) {
    const normalized = new Error(
      "Unable to connect to the server."
    );

    normalized.userMessage =
      "Unable to connect to UdyamSaarthi-AI. Please check that the backend service is running.";

    return normalized;
  }

  const status =
    error.response.status;

  const serverMessage =
    error.response.data?.message ||
    error.response.data?.error;

  const normalized = new Error(
    serverMessage ||
      `Request failed with status ${status}.`
  );

  normalized.status = status;
  normalized.response =
    error.response;

  if (status === 400) {
    normalized.userMessage =
      serverMessage ||
      "Some of the information provided is invalid. Please check the form.";
  } else if (
    status === 502 ||
    status === 503
  ) {
    normalized.userMessage =
      "The analysis service is temporarily unavailable. Please try again shortly.";
  } else if (status >= 500) {
    normalized.userMessage =
      "Something went wrong while generating the report. Please try again.";
  } else {
    normalized.userMessage =
      serverMessage ||
      "We could not generate the report. Please try again.";
  }

  return normalized;
}

export async function generateFeasibilityReport({
  location,
  ownCapital,
  businessCategory,
  language,
}) {
  const payload = {
    location: {
      village: String(
        location?.village || ""
      ).trim(),

      block: String(
        location?.block || ""
      ).trim(),

      district: String(
        location?.district || ""
      ).trim(),

      state: String(
        location?.state || ""
      ).trim(),
    },

    ownCapital: Number(
      ownCapital
    ),

    businessCategory,

    language:
      language || "en",
  };

  try {
    const { data } =
      await api.post(
        "/feasibility/generate",
        payload
      );

    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export default api;
