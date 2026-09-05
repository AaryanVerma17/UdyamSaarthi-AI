/**
 * Thin HTTP client for the Python/FastAPI ml_service.
 * Every function here corresponds 1:1 to an ml_service endpoint from the
 * technical documentation (§6.7-6.13 / §14.7).
 */
const axios = require("axios");

const BASE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const client = axios.create({ baseURL: BASE_URL, timeout: 10000 });

async function getLocationIntelligence(location) {
  const { data } = await client.post("/api/v1/location-intelligence", location);
  return data;
}

async function scoreViability(geoContext, businessCategory) {
  const { data } = await client.post("/api/v1/viability", { geoContext, businessCategory });
  return data;
}

async function mapCompetitors(geoContext, businessCategory) {
  const { data } = await client.post("/api/v1/competitor-mapping", { geoContext, businessCategory });
  return data;
}

async function rankOpportunities(geoContext, ownCapital, requestedBusiness) {
  const { data } = await client.post("/api/v1/opportunities", {
    geoContext,
    ownCapital,
    requestedBusiness,
  });
  return data;
}

async function analyzeRisks(geoContext, businessCategory) {
  const { data } = await client.post("/api/v1/risks", { geoContext, businessCategory });
  return data;
}

async function recommendPricing(geoContext, businessCategory) {
  const { data } = await client.post("/api/v1/pricing", { geoContext, businessCategory });
  return data;
}

async function explain(payload) {
  const { data } = await client.post("/api/v1/explain", payload);
  return data;
}

module.exports = {
  getLocationIntelligence,
  scoreViability,
  mapCompetitors,
  rankOpportunities,
  analyzeRisks,
  recommendPricing,
  explain,
};
