/**
 * UdyamSaarthi-AI
 * ML Service HTTP Client
 *
 * Purpose:
 * - Centralise all Node -> FastAPI communication
 * - Preserve the existing ML endpoint contract
 * - Provide reliable diagnostics
 * - Normalise ML-service failures
 * - Never silently convert ML failures into fake data
 */

const axios = require("axios");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = (
  process.env.ML_SERVICE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const TIMEOUT =
  Number(process.env.ML_SERVICE_TIMEOUT) || 30000;


// ---------------------------------------------------------------------------
// Axios client
// ---------------------------------------------------------------------------

const client = axios.create({
  baseURL: BASE_URL,

  timeout: TIMEOUT,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  /*
   * Axios normally throws automatically for non-2xx responses.
   *
   * We disable that behaviour so we can inspect FastAPI's actual
   * status code and response body and create a useful ML error.
   */
  validateStatus: () => true,
});


// ---------------------------------------------------------------------------
// Response message extraction
// ---------------------------------------------------------------------------

function extractResponseMessage(data) {
  if (
    data === null ||
    data === undefined
  ) {
    return null;
  }

  // Plain-text response
  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return null;
  }

  // Standard application response
  if (typeof data.message === "string") {
    return data.message;
  }

  // Generic error response
  if (typeof data.error === "string") {
    return data.error;
  }

  // FastAPI string detail
  if (typeof data.detail === "string") {
    return data.detail;
  }

  /*
   * FastAPI / Pydantic validation response:
   *
   * {
   *   "detail": [
   *     {
   *       "loc": ["body", "location"],
   *       "msg": "Field required",
   *       "type": "missing"
   *     }
   *   ]
   * }
   */
  if (Array.isArray(data.detail)) {
    return data.detail
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

  return null;
}


// ---------------------------------------------------------------------------
// ML error factory
// ---------------------------------------------------------------------------

function createMlError({
  operation,
  path,
  status = null,
  code = null,
  responseData = null,
  originalError = null,
}) {
  const responseMessage =
    extractResponseMessage(
      responseData
    );

  let message =
    `ML service request failed during ${operation}`;

  // -------------------------------------------------------------------------
  // Connection errors
  // -------------------------------------------------------------------------

  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND"
  ) {
    message =
      `ML service is unreachable during ${operation}. ` +
      `Expected service at ${BASE_URL}.`;
  }

  // -------------------------------------------------------------------------
  // Timeout
  // -------------------------------------------------------------------------

  else if (
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT"
  ) {
    message =
      `ML service request timed out during ${operation}.`;
  }

  // -------------------------------------------------------------------------
  // Endpoint not found
  // -------------------------------------------------------------------------

  else if (status === 404) {
    message =
      `ML service endpoint not found: ${path}`;
  }

  // -------------------------------------------------------------------------
  // FastAPI validation error
  // -------------------------------------------------------------------------

  else if (status === 422) {
    message =
      responseMessage ||
      `ML service rejected the request during ${operation} with HTTP 422.`;
  }

  // -------------------------------------------------------------------------
  // FastAPI internal server error
  // -------------------------------------------------------------------------

  else if (
    typeof status === "number" &&
    status >= 500
  ) {
    message =
      responseMessage ||
      `ML service returned HTTP ${status} during ${operation}.`;
  }

  // -------------------------------------------------------------------------
  // Other HTTP errors
  // -------------------------------------------------------------------------

  else if (status) {
    message =
      responseMessage ||
      `ML service returned HTTP ${status} during ${operation}.`;
  }

  const error =
    new Error(message);

  error.name =
    "MlServiceError";

  error.operation =
    operation;

  error.status =
    status;

  error.code =
    code;

  error.path =
    path;

  error.url =
    `${BASE_URL}${path}`;

  error.responseData =
    responseData;

  error.originalError =
    originalError;

  return error;
}


// ---------------------------------------------------------------------------
// Successful-response validation
// ---------------------------------------------------------------------------

function validateResponse(
  data,
  operation
) {
  if (
    data === null ||
    data === undefined ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    const error =
      new Error(
        `ML service returned an invalid response during ${operation}`
      );

    error.name =
      "MlServiceInvalidResponseError";

    error.operation =
      operation;

    return error;
  }

  return null;
}


// ---------------------------------------------------------------------------
// POST helper
// ---------------------------------------------------------------------------

async function post(
  path,
  payload,
  operation
) {
  try {
    const response =
      await client.post(
        path,
        payload
      );

    // -----------------------------------------------------------------------
    // HTTP status validation
    // -----------------------------------------------------------------------

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      throw createMlError({
        operation,

        path,

        status:
          response.status,

        code:
          null,

        responseData:
          response.data,
      });
    }

    // -----------------------------------------------------------------------
    // Response-body validation
    // -----------------------------------------------------------------------

    const validationError =
      validateResponse(
        response.data,
        operation
      );

    if (validationError) {
      throw validationError;
    }

    return response.data;

  } catch (error) {

    /*
     * Do not wrap our own normalised errors again.
     */
    if (
      error?.name ===
        "MlServiceError" ||
      error?.name ===
        "MlServiceInvalidResponseError"
    ) {
      throw error;
    }

    /*
     * Axios/network error.
     */
    throw createMlError({
      operation,

      path,

      status:
        error?.response?.status ||
        null,

      code:
        error?.code ||
        null,

      responseData:
        error?.response?.data ||
        null,

      originalError:
        error,
    });
  }
}


// ---------------------------------------------------------------------------
// GET helper
// ---------------------------------------------------------------------------

async function get(
  path,
  operation
) {
  try {
    const response =
      await client.get(path);

    // -----------------------------------------------------------------------
    // HTTP status validation
    // -----------------------------------------------------------------------

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      throw createMlError({
        operation,

        path,

        status:
          response.status,

        code:
          null,

        responseData:
          response.data,
      });
    }

    // -----------------------------------------------------------------------
    // Response-body validation
    // -----------------------------------------------------------------------

    const validationError =
      validateResponse(
        response.data,
        operation
      );

    if (validationError) {
      throw validationError;
    }

    return response.data;

  } catch (error) {

    if (
      error?.name ===
        "MlServiceError" ||
      error?.name ===
        "MlServiceInvalidResponseError"
    ) {
      throw error;
    }

    throw createMlError({
      operation,

      path,

      status:
        error?.response?.status ||
        null,

      code:
        error?.code ||
        null,

      responseData:
        error?.response?.data ||
        null,

      originalError:
        error,
    });
  }
}


// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

async function health() {
  return get(
    "/health",
    "ML service health check"
  );
}


// ---------------------------------------------------------------------------
// Location Intelligence
// ---------------------------------------------------------------------------

async function getLocationIntelligence(
  location
) {
  return post(
    "/api/v1/location-intelligence",

    location,

    "location intelligence"
  );
}


// ---------------------------------------------------------------------------
// Viability
// ---------------------------------------------------------------------------

async function scoreViability(
  geoContext,
  businessCategory
) {
  return post(
    "/api/v1/viability",

    {
      geoContext,

      businessCategory,
    },

    "viability calculation"
  );
}


// ---------------------------------------------------------------------------
// Competitor Mapping
// ---------------------------------------------------------------------------

async function mapCompetitors(
  geoContext,
  businessCategory
) {
  return post(
    "/api/v1/competitor-mapping",

    {
      geoContext,

      businessCategory,
    },

    "competition mapping"
  );
}


// ---------------------------------------------------------------------------
// Opportunity Ranking
// ---------------------------------------------------------------------------

async function rankOpportunities(
  geoContext,
  ownCapital,
  requestedBusiness
) {
  return post(
    "/api/v1/opportunities",

    {
      geoContext,

      ownCapital,

      requestedBusiness,
    },

    "opportunity ranking"
  );
}


// ---------------------------------------------------------------------------
// Risk Analysis
// ---------------------------------------------------------------------------

async function analyzeRisks(
  geoContext,
  businessCategory
) {
  return post(
    "/api/v1/risks",

    {
      geoContext,

      businessCategory,
    },

    "risk analysis"
  );
}


// ---------------------------------------------------------------------------
// Pricing Recommendation
// ---------------------------------------------------------------------------

async function recommendPricing(
  geoContext,
  businessCategory
) {
  return post(
    "/api/v1/pricing",

    {
      geoContext,

      businessCategory,
    },

    "pricing recommendation"
  );
}


// ---------------------------------------------------------------------------
// AI Explanation
// ---------------------------------------------------------------------------

async function explain(
  payload
) {
  return post(
    "/api/v1/explain",

    payload,

    "AI explanation"
  );
}


// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

module.exports = {
  health,

  getLocationIntelligence,

  scoreViability,

  mapCompetitors,

  rankOpportunities,

  analyzeRisks,

  recommendPricing,

  explain,
};