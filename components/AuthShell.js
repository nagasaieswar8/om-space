import Link from "next/link";
import Brand from "@/components/Brand";

export default function AuthShell({ image = "/images/auth.jpg", eyebrow, title, subtitle, quote, note, children, footer }) {
  return (
    <div className="os-auth">
      <aside className="os-auth__visual">
        <img src={image} alt="" aria-hidden="true" />
        <div className="os-auth__top">
          <Link href="/" aria-label="OM SPACE home">
            <Brand />
          </Link>
          <Link href="/" className="os-auth__back">Back to site</Link>
        </div>
        <div className="os-auth__quote">
          <span className="os-eyebrow">OM SPACE</span>
          <h2>{quote}</h2>
          {note && <p>{note}</p>}
        </div>
      </aside>

      <main className="os-auth__panel">
        <div className="os-auth__card">
          <div className="os-auth__head">
            <span className="os-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
          {footer && <div className="os-auth__foot">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
