export default function Brand({ tone = "light", sub = true, className = "" }) {
  return (
    <span className={`os-brand ${tone === "ink" ? "os-brand--ink" : ""} ${className}`.trim()}>
      <span className="os-brand__mark" aria-hidden="true">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M4 11.2 12 4l8 7.2" stroke="#C7A66A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.4 10.6V20h11.2v-9.4" stroke="#F7F4EC" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 20v-4.6h4V20" stroke="#C7A66A" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        <span className="os-brand__word">OM SPACE</span>
        {sub && <span className="os-brand__sub">Real Estate</span>}
      </span>
    </span>
  );
}
