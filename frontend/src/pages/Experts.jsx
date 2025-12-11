import React, { useEffect, useState } from "react";
import { get, post } from "../api/api";
import ExpertCard from "../components/ExpertCard";
import Modal from "../components/Modal";

export default function Experts() {
  const [experts, setExperts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get logged-in user
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    async function load() {
      const res = await get("/api/v1/experts");
      setExperts(res.experts || []);
    }
    load();
  }, []);

  async function onBook(expert) {
    if (!user) {
      setModalMessage("Please login to book a consultation");
      setModalOpen(true);
      return;
    }

    const res = await post("/api/v1/consultations", {
      client_id: user.id,
      expert_id: expert.id,
      topic: `${expert.specialty} consultation`,
    });
    if (res.error) {
      setModalMessage("Booking failed: " + res.error);
    } else {
      setModalMessage(
        "Consultation request sent! The expert will review and accept your booking."
      );
    }
    setModalOpen(true);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Experts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {experts.map((e) => (
          <ExpertCard key={e.id} expert={e} onBook={onBook} />
        ))}
      </div>

      <Modal
        title="Booking"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div>{modalMessage}</div>
      </Modal>
    </div>
  );
}
