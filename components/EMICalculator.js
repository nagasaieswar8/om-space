"use client";
// components/EMICalculator.js
import { useState, useMemo } from "react";
import { fmtPrice } from "@/lib/constants";

export default function EMICalculator({ price = 5000000 }) {
  const [down, setDown]   = useState(Math.round(price * 0.2));
  const [rate, setRate]   = useState(8.5);
  const [years, setYears] = useState(20);

  const { emi, totalInterest, totalPayment, principal } = useMemo(() => {
    const principal = Math.max(0, price - down);
    const r = rate / 100 / 12;
    const n = years * 12;
    const emi = r > 0 && n > 0 && principal > 0
      ? principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
      : 0;
    return { emi, totalInterest: emi * n - principal, totalPayment: emi * n, principal };
  }, [price, down, rate, years]);

  return (
    <div>
      <h3 className="os-emi__title">EMI calculator</h3>
      <p className="os-emi__sub">Estimate your monthly loan repayment</p>

      <div className="os-emi__grid">
        <div>
          <label className="os-emi__label">Property price</label>
          <div className="os-emi__static">{fmtPrice(price)}</div>
        </div>
        <div>
          <label className="os-emi__label" htmlFor="emi-down">Down payment (₹)</label>
          <input
            id="emi-down"
            className="os-input"
            type="number"
            value={down}
            onChange={(event) => setDown(+event.target.value)}
          />
        </div>
        <div>
          <label className="os-emi__label">
            Interest rate <b>{rate.toFixed(1)}%</b>
          </label>
          <input
            className="os-emi__range"
            type="range"
            min="5"
            max="20"
            step="0.1"
            value={rate}
            onChange={(event) => setRate(+event.target.value)}
            aria-label="Interest rate"
          />
          <div className="os-emi__scale"><span>5%</span><span>20%</span></div>
        </div>
        <div>
          <label className="os-emi__label">
            Loan tenure <b>{years} years</b>
          </label>
          <input
            className="os-emi__range"
            type="range"
            min="1"
            max="30"
            step="1"
            value={years}
            onChange={(event) => setYears(+event.target.value)}
            aria-label="Loan tenure in years"
          />
          <div className="os-emi__scale"><span>1 yr</span><span>30 yr</span></div>
        </div>
      </div>

      <div className="os-emi__result">
        <div>
          <small>Monthly EMI</small>
          <b>{fmtPrice(Math.round(emi))}</b>
        </div>
        <span>approx. per month</span>
      </div>

      <div className="os-emi__stats">
        {[
          ["Loan amount", fmtPrice(Math.round(principal))],
          ["Total interest", fmtPrice(Math.round(totalInterest))],
          ["Total payment", fmtPrice(Math.round(totalPayment))],
        ].map(([label, value]) => (
          <div className="os-emi__stat" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <p className="os-emi__note">* Approximate values. Actual EMI may vary by bank.</p>
    </div>
  );
}
