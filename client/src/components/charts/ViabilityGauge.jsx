function getGaugeColor(score) {
  if (score >= 75) {
    return "#176b3a";
  }

  if (score >= 50) {
    return "#c27a08";
  }

  return "#b42318";
}


export default function ViabilityGauge({
  score = 0,
  label = "",
}) {
  const normalizedScore =
    Math.max(
      0,
      Math.min(
        100,
        Number(score) || 0
      )
    );

  const color =
    getGaugeColor(
      normalizedScore
    );

  const degrees =
    normalizedScore * 3.6;


  return (
    <div
      className="viability-gauge"
      aria-label={`Viability score ${normalizedScore} out of 100`}
    >
      <div
        className="viability-gauge__ring"
        style={{
          background:
            `conic-gradient(${color} ${degrees}deg, #e4e9e5 0deg)`,
        }}
      >
        <div className="viability-gauge__inner">
          <span className="viability-gauge__score">
            {Math.round(
              normalizedScore
            )}
          </span>

          <span className="viability-gauge__max">
            /100
          </span>
        </div>
      </div>

      <p className="viability-gauge__label">
        {label}
      </p>
    </div>
  );
}