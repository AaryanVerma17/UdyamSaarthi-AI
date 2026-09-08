export default function SectionCard({
  title,
  eyebrow,
  children,
  className = "",
}) {
  return (
    <section
      className={`report__section ${className}`.trim()}
    >
      {eyebrow && (
        <p className="app-header__eyebrow">
          {eyebrow}
        </p>
      )}

      {title && <h3>{title}</h3>}

      {children}
    </section>
  );
}