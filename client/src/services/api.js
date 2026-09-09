import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function normalizeApiError(error) {
  if (!error) {
    const normalized = new Error(
      "Unable to connect to the server."
    );

    normalized.userMessage =
      "Unable to connect to UdyamSaarthi-AI. Please check that the backend service is running.";

    return normalized;
  }

  if (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    const normalized = new Error(
      "The feasibility service is taking longer than expected."
    );

    normalized.code = error.code;
    normalized.userMessage =
      "The feasibility service is taking longer than expected. Please try again.";

    return normalized;
  }

  if (!error.response) {
    const normalized = new Error(
      "Unable to connect to the server."
    );

    normalized.code = error.code || null;
    normalized.userMessage =
      "Unable to connect to UdyamSaarthi-AI. Please check that the backend service is running.";

    return normalized;
  }

  const status = error.response.status;

  const responseData =
    error.response.data;

  const serverMessage =
    responseData?.message ||
    responseData?.error ||
    (
      typeof responseData?.detail === "string"
        ? responseData.detail
        : null
    );

  let validationMessage = null;

  if (
    Array.isArray(
      responseData?.detail
    )
  ) {
    validationMessage =
      responseData.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (
            item &&
            typeof item === "object"
          ) {
            const location =
              Array.isArray(item.loc)
                ? item.loc.join(".")
                : "";

            return [
              location,
              item.msg,
            ]
              .filter(Boolean)
              .join(": ");
          }

          return String(item);
        })
        .filter(Boolean)
        .join("; ");
  }

  const normalized = new Error(
    serverMessage ||
      validationMessage ||
      `Request failed with status ${status}.`
  );

  normalized.status = status;
  normalized.response = error.response;
  normalized.responseData = responseData;

  if (status === 400 || status === 422) {
    normalized.userMessage =
      serverMessage ||
      validationMessage ||
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
      validationMessage ||
      "We could not generate the report. Please try again.";
  }

  return normalized;
}

function normalizeLocation(location) {
  return {
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
  };
}

function normalizeLanguage(language) {
  return language === "hi"
    ? "hi"
    : "en";
}

export async function generateFeasibilityReport({
  location,
  ownCapital,
  businessCategory,
  language,
}) {
  const normalizedLocation =
    normalizeLocation(location);

  const normalizedBusinessCategory =
    String(
      businessCategory || ""
    ).trim();

  const numericOwnCapital =
    Number(ownCapital);

  if (
    !normalizedLocation.village ||
    !normalizedLocation.district
  ) {
    const error = new Error(
      "Village and district are required."
    );

    error.userMessage =
      "Please enter both village and district.";

    throw error;
  }

  if (!normalizedBusinessCategory) {
    const error = new Error(
      "Business category is required."
    );

    error.userMessage =
      "Please select or enter a business category.";

    throw error;
  }

  if (
    !Number.isFinite(
      numericOwnCapital
    ) ||
    numericOwnCapital <= 0
  ) {
    const error = new Error(
      "Own capital must be a positive number."
    );

    error.userMessage =
      "Please enter a valid positive amount for your own capital.";

    throw error;
  }

  const payload = {
    location:
      normalizedLocation,

    ownCapital:
      numericOwnCapital,

    businessCategory:
      normalizedBusinessCategory,

    language:
      normalizeLanguage(language),
  };

  try {
    const { data } =
      await api.post(
        "/feasibility/generate",
        payload
      );

    if (
      !data ||
      typeof data !== "object"
    ) {
      const error = new Error(
        "The server returned an invalid report."
      );

      error.userMessage =
        "The report service returned an invalid response. Please try again.";

      throw error;
    }

    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function checkApiHealth() {
  try {
    const { data } =
      await api.get("/health");

    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export default api;