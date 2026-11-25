"use client";
import { useState } from "react";

const TYPE_OPTIONS = [
  "Residential Apartment",
  "Independent House/Villa",
  "Builder Floor",
  "Residential Land",
  "Commercial Office Space",
  "Shop/Showroom",
  "Farm House",
  "Other",
];

const AMENITIES = [
  "Parking",
  "Gym",
  "Pool",
  "Garden",
  "Security",
  "Lift",
  "Balcony",
  "Kitchen",
  "Power backup",
  "Clubhouse",
];

const EMPTY = {
  title: "",
  type: "Residential Apartment",
  city: "Vijayawada",
  location: "",
  price: "",
  listing: "Buy",
  status: "available",
  beds: "",
  baths: "",
  area: "",
  imageUrl: "",
  description: "",
  amenities: [],
};

export default function PropertyForm({ initial, onSubmit, saving, error, submitLabel = "Publish property", onCancel, priceIsText = false }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, amenities: initial?.amenities || [] });

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    const price = String(form.price).trim();
    const payload = {
      title: form.title,
      type: form.type,
      city: form.city,
      location: form.location,
      listing: form.listing,
      listing_type: form.listing === "Rent" ? "R" : "P",
      status: form.status,
      beds: Number(form.beds) || 0,
      baths: Number(form.baths) || 0,
      area: String(form.area),
      area_num: Number(form.area) || undefined,
      imageUrl: form.imageUrl,
      description: form.description,
      amenities: form.amenities,
      price,
    };
    if (/^\d+(\.\d+)?$/.test(price)) {
      payload.min_price = price;
      payload.max_price = price;
    }
    onSubmit(payload, form);
  };

  const types = TYPE_OPTIONS.includes(form.type) ? TYPE_OPTIONS : [form.type, ...TYPE_OPTIONS];

  return (
    <form className="os-form-grid" onSubmit={submit}>
      {error && <div className="os-error">{error}</div>}

      <label className="os-field">
        <span>Listing title</span>
        <input
          className="os-input"
          name="title"
          value={form.title}
          onChange={update}
          placeholder="e.g. Sunlit 3 BHK apartment near Benz Circle"
          required
        />
      </label>

      <div className="os-form-row">
        <label className="os-field">
          <span>Property type</span>
          <select className="os-select" name="type" value={form.type} onChange={update}>
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="os-field">
          <span>Listing type</span>
          <select className="os-select" name="listing" value={form.listing} onChange={update}>
            <option value="Buy">For sale</option>
            <option value="Rent">For rent</option>
          </select>
        </label>
      </div>

      <div className="os-form-row">
        <label className="os-field">
          <span>City</span>
          <input className="os-input" name="city" value={form.city} onChange={update} required />
        </label>
        <label className="os-field">
          <span>Locality / address</span>
          <input
            className="os-input"
            name="location"
            value={form.location}
            onChange={update}
            placeholder="e.g. Benz Circle"
            required
          />
        </label>
      </div>

      <div className="os-form-row">
        <label className="os-field">
          <span>Price (₹)</span>
          <input
            className="os-input"
            type={priceIsText ? "text" : "number"}
            inputMode="decimal"
            min={priceIsText ? undefined : "0"}
            name="price"
            value={form.price}
            onChange={update}
            placeholder="e.g. 8500000"
            required
          />
        </label>
        <label className="os-field">
          <span>Status</span>
          <select className="os-select" name="status" value={form.status} onChange={update}>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
        </label>
      </div>

      <div className="os-form-row">
        <label className="os-field">
          <span>Bedrooms</span>
          <input className="os-input" type="number" min="0" name="beds" value={form.beds} onChange={update} placeholder="3" />
        </label>
        <label className="os-field">
          <span>Bathrooms</span>
          <input className="os-input" type="number" min="0" name="baths" value={form.baths} onChange={update} placeholder="2" />
        </label>
      </div>

      <div className="os-form-row">
        <label className="os-field">
          <span>Area (sq ft)</span>
          <input className="os-input" type="number" min="0" name="area" value={form.area} onChange={update} placeholder="1450" required />
        </label>
        <label className="os-field">
          <span>Cover image URL</span>
          <input className="os-input" type="url" name="imageUrl" value={form.imageUrl} onChange={update} placeholder="https://…" />
        </label>
      </div>

      {form.imageUrl && (
        <img
          src={form.imageUrl}
          alt="Cover preview"
          style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 14 }}
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      )}

      <label className="os-field">
        <span>Description</span>
        <textarea
          className="os-textarea"
          name="description"
          value={form.description}
          onChange={update}
          placeholder="Describe the light, the layout, the neighbourhood — what makes this property worth a visit."
        />
      </label>

      <div className="os-field">
        <span>Amenities</span>
        <div className="os-amenities" style={{ marginTop: 4 }}>
          {AMENITIES.map((amenity) => {
            const checked = form.amenities.includes(amenity);
            return (
              <button
                type="button"
                key={amenity}
                className="os-amenity"
                onClick={() => toggleAmenity(amenity)}
                style={
                  checked
                    ? { background: "var(--os-forest)", borderColor: "var(--os-forest)", color: "var(--os-cream)" }
                    : undefined
                }
                aria-pressed={checked}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {amenity}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
        <button type="submit" className="os-btn os-btn--gold" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="os-btn os-btn--ghost" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
