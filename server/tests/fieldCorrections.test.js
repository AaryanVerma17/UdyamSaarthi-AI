const fs = require("fs");
const path = require("path");
const os = require("os");

// We need to control the corrections file's content and dates precisely,
// so tests write to a temp copy and monkey-patch the module's file path
// via jest.mock rather than relying on the real seed data (which will
// itself expire over time and silently break these tests).
const TEMP_PATH = path.join(os.tmpdir(), "test_field_corrections.json");

function writeCorrections(corrections) {
  fs.writeFileSync(TEMP_PATH, JSON.stringify({ corrections }), "utf-8");
}

// Freeze time so every call to Date.now() returns the exact same value.
// This prevents millisecond-level differences between calls to daysAgo().
const FIXED_NOW = new Date("2026-09-05T16:20:20.000Z");

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

jest.mock("path", () => {
  const actual = jest.requireActual("path");

  return {
    ...actual,
    join: (...args) => {
      if (args.some((a) => a === "field_corrections.json")) {
        return require("os").tmpdir() + "/test_field_corrections.json";
      }

      return actual.join(...args);
    },
  };
});

const {
  buildCorrectionKey,
  getCorrection,
  applyCorrection,
  isExpired,
  clearCache,
} = require("../src/services/fieldCorrections");

const { wrapMetric } = require("../src/services/dataConfidence");

function daysAgo(n) {
  return new Date(
    Date.now() - n * 24 * 60 * 60 * 1000
  ).toISOString();
}

beforeEach(() => {
  clearCache();
});

describe("fieldCorrections — buildCorrectionKey", () => {
  test("produces a stable, structured key", () => {
    const key = buildCorrectionKey({
      village: "Village X",
      district: "District Z",
      businessCategory: "Dairy",
      metric: "competitorCount",
    });

    expect(key).toBe(
      "village:Village X|district:District Z|business:Dairy|metric:competitorCount"
    );
  });
});

describe("fieldCorrections — verified correction wins outright", () => {
  test("overrides the online value completely, no blending", () => {
    writeCorrections([
      {
        key: "test:verified",
        value: 9,
        verified: true,
        source: "CA officer field visit",
        verifiedAt: daysAgo(10),
      },
    ]);

    const online = wrapMetric(6, {
      source: "OSM scrape",
      lastUpdated: daysAgo(200),
    });

    const result = applyCorrection(online, "test:verified");

    expect(result.value).toBe(9);
    expect(result.verified).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.source).toBe("CA officer field visit");
  });
});

describe("fieldCorrections — unverified correction never overrides", () => {
  test("keeps the online value, surfaces the field report, lowers confidence one notch", () => {
    writeCorrections([
      {
        key: "test:unverified",
        value: 3900,
        verified: false,
        source: "Unverified WhatsApp survey",
        verifiedAt: daysAgo(5),
        note: "unconfirmed",
      },
    ]);

    const online = wrapMetric(4200, {
      source: "Census estimate",
      lastUpdated: daysAgo(5),
    });

    const result = applyCorrection(online, "test:unverified");

    expect(result.value).toBe(4200);
    expect(result.confidence).toBe("medium");

    expect(result.fieldReport).toEqual({
      value: 3900,
      source: "Unverified WhatsApp survey",
      verifiedAt: daysAgo(5),
      note: "unconfirmed",
    });
  });

  test("confidence never steps down below 'low'", () => {
    writeCorrections([
      {
        key: "test:unverified-low",
        value: 1,
        verified: false,
        source: "rumor",
        verifiedAt: daysAgo(5),
      },
    ]);

    const online = wrapMetric(5, {
      lastUpdated: daysAgo(400),
    });

    const result = applyCorrection(
      online,
      "test:unverified-low"
    );

    expect(result.confidence).toBe("low");
  });
});

describe("fieldCorrections — TTL expiry", () => {
  test("a correction older than the TTL is treated as absent", () => {
    writeCorrections([
      {
        key: "test:expired",
        value: 9,
        verified: true,
        source: "CA officer",
        verifiedAt: daysAgo(200),
      },
    ]);

    expect(getCorrection("test:expired")).toBeNull();

    const online = wrapMetric(6, {
      source: "OSM scrape",
      lastUpdated: daysAgo(30),
    });

    const result = applyCorrection(
      online,
      "test:expired"
    );

    expect(result.value).toBe(6);
    expect(result.verified).toBe(false);
  });

  test("a correction just inside the TTL still applies", () => {
    writeCorrections([
      {
        key: "test:fresh",
        value: 9,
        verified: true,
        source: "CA officer",
        verifiedAt: daysAgo(149),
      },
    ]);

    expect(getCorrection("test:fresh")).not.toBeNull();
  });

  test("isExpired handles missing verifiedAt as expired", () => {
    expect(isExpired(null)).toBe(true);
    expect(isExpired(undefined)).toBe(true);
  });

  test("custom TTL is respected", () => {
    writeCorrections([
      {
        key: "test:custom-ttl",
        value: 9,
        verified: true,
        source: "CA officer",
        verifiedAt: daysAgo(100),
      },
    ]);

    expect(getCorrection("test:custom-ttl", 90)).toBeNull();
    expect(getCorrection("test:custom-ttl", 120)).not.toBeNull();
  });
});

describe("fieldCorrections — no correction exists", () => {
  test("returns the online metric completely unchanged", () => {
    writeCorrections([]);

    const online = wrapMetric(6, {
      source: "OSM scrape",
      lastUpdated: daysAgo(30),
    });

    const result = applyCorrection(
      online,
      "test:nonexistent"
    );

    expect(result).toEqual(online);
  });
});