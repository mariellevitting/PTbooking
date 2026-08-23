export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#3A3A3A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="18" height="28" rx="3" fill="#E2A9F1"/>
        <rect x="22" y="12" width="18" height="16" rx="3" fill="#E2A9F1"/>
        <rect x="22" y="0" width="18" height="10" rx="3" fill="#E2A9F1"/>
      </svg>
      <p style={{ color: "#E2A9F1", fontWeight: 700, letterSpacing: "0.12em", fontSize: "13px", textTransform: "uppercase", margin: 0 }}>Danceitude</p>
    </div>
  );
}
