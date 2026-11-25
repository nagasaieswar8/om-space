"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SECTIONS = [
  {
    title: "Buying properties",
    items: [
      {
        q: "How do I search for properties?",
        a: "Use our search and filter options to find properties by location, price range, property type, and more.",
      },
      {
        q: "How do I contact an agency?",
        a: "Open a property and send an inquiry to its agency. The agency can reply from its portal.",
      },
      {
        q: "Can I save properties?",
        a: "Yes, click the heart icon on any property to save it. Your saved properties can be viewed in your account.",
      },
    ],
  },
  {
    title: "Posting properties",
    items: [
      {
        q: "Who can post properties?",
        a: "Agencies can add and manage listings from the Agency Portal.",
      },
      {
        q: "What information is required?",
        a: "Title, location, price, area, property type, and description are required. Photos and amenities are optional but recommended.",
      },
      {
        q: "How long does approval take?",
        a: "Admins manage platform listings. Agency listings are published as soon as they are added.",
      },
    ],
  },
  {
    title: "Account & login",
    items: [
      {
        q: "How do I register?",
        a: "Choose Customer or Agency during registration. Admin accounts are created by a platform administrator.",
      },
      {
        q: "Forgot your password?",
        a: "Ask your platform administrator for help resetting your password.",
      },
      {
        q: "Can I change my role later?",
        a: "Contact our support team to request a role change.",
      },
    ],
  },
  {
    title: "EMI calculator",
    items: [
      {
        q: "How does the EMI Calculator work?",
        a: "Enter your loan amount, interest rate, and tenure. The calculator will show your monthly EMI payment.",
      },
      {
        q: "Is this calculator accurate?",
        a: "This is an approximate calculator. Consult your bank for exact EMI details based on your eligibility.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <section className="os-page-hero">
        <div className="os-container os-page-hero__inner">
          <div className="os-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <b>Help</b>
          </div>
          <span className="os-eyebrow">Help centre</span>
          <h1>
            A calmer way to get <span className="os-italic">answers</span>.
          </h1>
          <p className="os-lead">
            Everything about searching, listing and managing your OM SPACE account, in plain
            language.
          </p>
        </div>
      </section>

      <main className="os-container os-container--narrow" style={{ paddingBlock: "34px 80px" }}>
        <div className="os-help-grid">
          {SECTIONS.map((section, index) => (
            <section className="os-panel" key={section.title}>
              <div className="os-help__head">
                <span className="os-help__num">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="os-help__title">{section.title}</h2>
              </div>
              <div className="os-faq">
                {section.items.map((item) => (
                  <div className="os-faq__item" key={item.q}>
                    <div className="os-faq__q">{item.q}</div>
                    <p className="os-faq__a">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="os-help__contact" style={{ marginTop: 18 }}>
          <div>
            <h2>Still need a hand?</h2>
            <p>Contact your platform administrator for account and support help.</p>
          </div>
          <Link href="/#contact" className="os-btn os-btn--gold os-btn--sm">Contact support</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
