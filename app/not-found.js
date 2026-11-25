import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="os-404">
      <Navbar />
      <main className="os-container os-404__body">
        <div>
          <div className="os-404__num">4<span>0</span>4</div>
          <h1>This address does not exist.</h1>
          <p>
            The page may have moved, or the listing you are looking for is no longer available.
            Let us point you back to something worth seeing.
          </p>
          <div className="os-404__actions">
            <Link href="/" className="os-btn os-btn--gold">Back to home</Link>
            <Link href="/listings" className="os-btn os-btn--ghost">Browse properties</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
