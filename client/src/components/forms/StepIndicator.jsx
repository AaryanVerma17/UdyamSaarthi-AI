export default function StepIndicator({ currentStep, steps }) {
  return (
    <div
      className="step-indicator"
      aria-label="Form progress"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;

        return (
          <div
            className="step-indicator__item"
            key={step.key}
          >
            <div
              className={[
                "step-indicator__circle",
                isActive
                  ? "step-indicator__circle--active"
                  : "",
                isCompleted
                  ? "step-indicator__circle--completed"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>

            <div
              className={[
                "step-indicator__label",
                isActive
                  ? "step-indicator__label--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {step.label}
            </div>

            {index < steps.length - 1 && (
              <div
                className={[
                  "step-indicator__line",
                  isCompleted
                    ? "step-indicator__line--completed"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}