import Link from "next/link";
import Brand from "@/components/Brand";

export default function Footer() {
  return (
    <footer className="os-footer" id="contact">
      <div className="os-container">
        <div className="os-footer__grid">
          <div className="os-footer__brand">
            <Brand />
            <p>
              OM SPACE brings verified listings, trusted local agencies and a calmer way to find
              your next address. Built for Vijayawada, designed for the way you actually search.
            </p>
            <div className="os-footer__social" aria-label="Social links">
              <a href="#" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.5 8.5H3.8V21h2.7V8.5zM5.1 3a1.6 1.6 0 100 3.2A1.6 1.6 0 005.1 3zM21 21h-2.7v-6.5c0-1.6-.6-2.6-2-2.6-1.1 0-1.7.7-2 1.4-.1.3-.1.7-.1 1V21H11.5V8.5h2.6v1.2c.4-.7 1.4-1.6 3-1.6 2.2 0 3.9 1.5 3.9 4.6V21z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link href="/listings?listing_type=P">Buy a property</Link></li>
              <li><Link href="/listings?listing_type=R">Rent a property</Link></li>
              <li><Link href="/listings">All listings</Link></li>
              <li><Link href="/compare">Compare homes</Link></li>
              <li><Link href="/#agencies">Trusted agencies</Link></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/#why">Why OM SPACE</Link></li>
              <li><Link href="/help">Help & support</Link></li>
              <li><Link href="/advertise">Advertise with us</Link></li>
              <li><Link href="/agency-login">Agency portal</Link></li>
              <li><Link href="/admin-login">Admin portal</Link></li>
            </ul>
          </div>

          <div>
            <h4>Visit us</h4>
            <ul>
              <li><span>Vijayawada, Andhra Pradesh</span></li>
              <li><span>Monday – Saturday · 9:30 to 18:30</span></li>
              <li><Link href="/help">Talk to our support team</Link></li>
              <li><Link href="/register?role=agency">Become a partner agency</Link></li>
            </ul>
          </div>
        </div>

        <div className="os-footer__bottom">
          <span>© {new Date().getFullYear()} OM SPACE. All rights reserved.</span>
          <span>Real estate discovery &amp; management · Vijayawada</span>
        </div>
      </div>
      <div className="os-footer__word" aria-hidden="true">OM SPACE</div>
    </footer>
  );
}
