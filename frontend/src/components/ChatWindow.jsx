import React, { useEffect, useState, useRef, useCallback } from "react";
import { get, post } from "../api/api";

/* ─── Communication policy ─── */
const POLICY_RULES = [
  "All communication must happen through this platform",
  "Sharing phone numbers, emails, or social media is prohibited",
  "Violations may result in account suspension",
];

/* ─── Contact-info detector (client-side pre-check) ─── */
const BLOCKED_RX = [
  { rx: /\b\d{10,}\b/, reason: "phone number" },
  { rx: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, reason: "phone number" },
  { rx: /\b\+\d{1,3}[-\s]?\d{6,}\b/, reason: "phone number" },
  { rx: /whatsapp|telegram|signal|viber/i, reason: "messaging app" },
  { rx: /call\s*me|text\s*me/i, reason: "contact request" },
  { rx: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, reason: "email" },
  { rx: /@[a-zA-Z0-9_]{3,}/, reason: "social handle" },
  { rx: /facebook|instagram|twitter|snapchat|tiktok/i, reason: "social media" },
];
function detectContact(text) {
  for (const { rx, reason } of BLOCKED_RX) {
    if (rx.test(text)) return reason;
  }
  return null;
}

/* ─── Helpers ─── */
function relativeDay(ts) {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ChatWindow — full-screen overlay chat
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function ChatWindow({ consultation, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [blocked, setBlocked] = useState(null);        // flash blocked reason
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  /* ── who is the other party? ── */
  const isExpert = user?.role === "Expert";
  const otherName = isExpert
    ? consultation.client_name || "Farmer"
    : consultation.expert_name || "Expert";
  const otherPhoto = isExpert
    ? consultation.client_photo
    : consultation.expert_photo;
  const otherSpecialty = isExpert
    ? (consultation.client_farm || "")
    : (consultation.expert_specialty || "Agricultural Expert");

  /* ── load messages ── */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await get(`/api/v1/consultations/${consultation.id}/messages`);
      if (res?.messages) setMessages(res.messages);
    } catch (e) {
      console.error("Chat fetch error:", e);
    }
    setLoading(false);
  }, [consultation.id]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 4000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* detect if user scrolled up */
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  /* ── send ── */
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const reason = detectContact(trimmed);
    if (reason) {
      setBlocked(reason);
      setTimeout(() => setBlocked(null), 4000);
      return;
    }

    setSending(true);
    try {
      const res = await post(`/api/v1/consultations/${consultation.id}/messages`, {
        sender_id: user.id,
        message: trimmed,
      });
      if (res?.status === "ok" || res?.message) {
        setText("");
        await fetchMessages();
      } else if (res?.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error("Send error:", err);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  /* ── group messages by day ── */
  const grouped = [];
  let lastDay = "";
  for (const m of messages) {
    const day = new Date(m.timestamp).toDateString();
    if (day !== lastDay) {
      grouped.push({ type: "divider", label: relativeDay(m.timestamp) });
      lastDay = day;
    }
    grouped.push({ type: "msg", data: m });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* ── card ── */}
      <div className="relative w-full max-w-2xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-200/60">

        {/* ═══════════ HEADER ═══════════ */}
        <div className="flex-shrink-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex items-center gap-4">
          {/* back */}
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition text-white cursor-pointer">
            <i className="ri-arrow-left-s-line text-xl"></i>
          </button>

          {/* avatar */}
          <div className="relative">
            {otherPhoto ? (
              <img src={otherPhoto} alt={otherName} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/40" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/30">
                {initials(otherName)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-teal-600 rounded-full"></span>
          </div>

          {/* name / specialty */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate leading-tight">{otherName}</h3>
            <p className="text-teal-100 text-xs truncate">{otherSpecialty}</p>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPolicy(!showPolicy)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition text-white cursor-pointer" title="Communication Policy">
              <i className="ri-shield-check-line text-lg"></i>
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition text-white cursor-pointer" title="Close">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* topic strip */}
        <div className="flex-shrink-0 bg-teal-50 border-b border-teal-100 px-5 py-2 flex items-center gap-2">
          <i className="ri-bookmark-line text-teal-500 text-sm"></i>
          <span className="text-xs text-teal-700 font-medium truncate">{consultation.topic || "General Consultation"}</span>
        </div>

        {/* ── policy dropdown ── */}
        {showPolicy && (
          <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-3 animate-slide-down">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                <i className="ri-shield-check-line"></i> Communication Policy
              </h4>
              <button onClick={() => setShowPolicy(false)} className="text-amber-500 hover:text-amber-700 cursor-pointer">
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
            <ul className="space-y-0.5">
              {POLICY_RULES.map((r, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <i className="ri-checkbox-circle-line text-amber-500 mt-0.5 flex-shrink-0"></i>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── blocked toast ── */}
        {blocked && (
          <div className="absolute top-[120px] left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <i className="ri-error-warning-fill"></i>
            Blocked — contains {blocked}. Sharing contact info is not allowed.
          </div>
        )}

        {/* ═══════════ MESSAGES ═══════════ */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gradient-to-b from-gray-50 to-white scroll-smooth"
          style={{ overscrollBehavior: "contain" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading conversation…</span>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-2">
                <i className="ri-chat-smile-3-line text-4xl text-teal-400"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">Start the conversation</h4>
              <p className="text-sm text-gray-500 max-w-xs">Say hello to {otherName} and describe your farming issue to get expert advice.</p>
            </div>
          ) : (
            grouped.map((item, idx) => {
              if (item.type === "divider") {
                return (
                  <div key={`d-${idx}`} className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{item.label}</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                );
              }

              const m = item.data;
              const isMine = m.sender_id === user.id;
              const isNextSameSender =
                idx + 1 < grouped.length &&
                grouped[idx + 1].type === "msg" &&
                grouped[idx + 1].data.sender_id === m.sender_id;

              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isNextSameSender ? "mb-0.5" : "mb-3"}`}>
                  {/* avatar for other */}
                  {!isMine && !isNextSameSender && (
                    <div className="flex-shrink-0 mr-2 self-end">
                      {otherPhoto ? (
                        <img src={otherPhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">
                          {initials(otherName)}
                        </div>
                      )}
                    </div>
                  )}
                  {!isMine && isNextSameSender && <div className="w-7 mr-2 flex-shrink-0" />}

                  <div className={`relative max-w-[75%] group`}>
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                        isMine
                          ? "bg-teal-600 text-white rounded-2xl rounded-br-md shadow-sm"
                          : "bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100"
                      }`}
                    >
                      {m.message}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end pr-1" : "pl-1"}`}>
                      <span className="text-[10px] text-gray-400">{fmtTime(m.timestamp)}</span>
                      {isMine && (
                        <i className={`text-[11px] ${m.read ? "ri-check-double-line text-teal-500" : "ri-check-line text-gray-400"}`}></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* scroll-to-bottom fab */}
        {showScrollBtn && (
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-24 right-6 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-500 hover:text-teal-600 border border-gray-200 transition cursor-pointer z-10"
          >
            <i className="ri-arrow-down-line text-lg"></i>
          </button>
        )}

        {/* ═══════════ INPUT BAR ═══════════ */}
        <form onSubmit={handleSend} className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 flex items-end gap-3">
          {/* attachment */}
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition cursor-pointer flex-shrink-0"
            title="Attach file (coming soon)"
            onClick={() => alert("File attachments coming soon!")}
          >
            <i className="ri-attachment-2 text-xl"></i>
          </button>

          {/* text area */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // auto-grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type a message…"
              disabled={sending}
              className="w-full resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition disabled:opacity-60 max-h-[120px]"
              style={{ minHeight: "42px" }}
            />
          </div>

          {/* send button */}
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition flex-shrink-0 cursor-pointer ${
              text.trim()
                ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                : "bg-gray-100 text-gray-400"
            } disabled:opacity-50`}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <i className="ri-send-plane-2-fill text-lg"></i>
            )}
          </button>
        </form>
      </div>

      {/* ── CSS keyframes (injected once) ── */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes slide-down { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 120px; } }
        .animate-slide-down { animation: slide-down 0.25s ease-out; }
      `}</style>
    </div>
  );
}
