// lib/constants.js
export const PLACEHOLDER_IMG = "/images/placeholder.jpg";

export const RISK_SCORES = [82, 74, 68, 55, 61, 70, 58, 65, 72, 48];
export const PROP_AGES   = [15,  1,  8,  0,  3,  0,  5,  4, 10, 12];

export const getRisk = (id) => RISK_SCORES[(id - 1) % RISK_SCORES.length] || 60;
export const getAge  = (id) => PROP_AGES[(id - 1)   % PROP_AGES.length]   || 5;

// Image proxy function for hotlink-protected CDN images
export const getImageSrc = (property) => {
  const raw = property?.images?.[0] || property?.imageUrl || null;
  if (!raw) return PLACEHOLDER_IMG;
  if (raw.startsWith('http')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(raw)}&w=600&q=80`;
  }
  return raw;
};

export const getImageSrcs = (property) => {
  const imgs = property?.images;
  if (!imgs || imgs.length === 0) return [PLACEHOLDER_IMG];
  return imgs.map(url =>
    `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=600&q=80`
  );
};

// Decode listing type from scraped data codes
export const decodeListing = (code) => {
  const map = { "P": "Buy", "R": "Rent", "PG": "PG" };
  return map[code] || code;
};

export const fmtPrice = (n) => {
  if (!n) return "Price on Request";
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return num >= 10000000 ? `₹${(num / 10000000).toFixed(1)} Cr` :
         num >= 100000   ? `₹${(num / 100000).toFixed(0)} L`    :
         `₹${num?.toLocaleString() || 0}`;
};

// Accepts scraped ("₹85 L", "1.75 - 1.85 Cr") and manual numeric prices.
export const priceLabel = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") return "Price on request";
  const text = String(value).trim();
  if (text.includes("₹")) return text;
  if (/price on request/i.test(text)) return "Price on request";
  const numeric = Number(text.replace(/,/g, ""));
  if (Number.isFinite(numeric) && numeric > 0 && !/[a-zA-Z]/.test(text)) return fmtPrice(numeric);
  return `₹${text}`;
};

// Design tokens
export const C = {
  primary:   "#123D32",
  primaryDk: "#0B2A22",
  green:     "#123D32",
  gold:      "#C7A66A",
  bg:        "#F7F4EC",
  white:     "#FFFFFF",
  text:      "#10251F",
  text2:     "#858B87",
  border:    "#E4E0D5",
  greenBg:   "#EEF2EE",
};
