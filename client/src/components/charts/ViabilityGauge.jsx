export default function ViabilityGauge({ score = 0, label = "" }) {
  const color = score >= 75 ? "#2e7d32" : score >= 50 ? "#f9a825" : "#c62828";

  return (
    <div className="viability-gauge">
      <div
        className="viability-gauge__ring"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, #e0e0e0 0deg)`,
        }}
      >
        <div className="viability-gauge__inner">
          <span className="viability-gauge__score">{score}</span>
          <span className="viability-gauge__max">/100</span>
        </div>
      </div>
      <p className="viability-gauge__label">{label}</p>
    </div>
  );
}
