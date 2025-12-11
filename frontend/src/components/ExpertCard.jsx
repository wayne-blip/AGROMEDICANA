import React from "react";

export default function ExpertCard({ expert, onBook }) {
  return (
    <div className="card">
      <h3 className="font-semibold">{expert.name}</h3>
      <div className="text-sm text-gray-600">
        {expert.specialty} — {expert.years_experience} yrs
      </div>
      <div className="mt-3">
        <button className="btn" onClick={() => onBook(expert)}>
          Book Consultation
        </button>
      </div>
    </div>
  );
}
