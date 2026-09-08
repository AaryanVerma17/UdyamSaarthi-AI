function normalizeStatus(status) {
  if (!status) {
    return "unknown";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/ /g, "_");
}

export default function StatusBadge({
  status,
  label,
}) {
  const normalized =
    normalizeStatus(status);

  return (
    <span
      className={`badge badge--${normalized}`}
    >
      {label || status || "Unknown"}
    </span>
  );
}