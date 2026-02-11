import React, { useEffect, useState, useRef, useCallback } from "react";
import { get, post, del } from "../api/api";

/* ─── Contact-info detector ─── */
const BLOCKED_RX = [
  { rx: /\b\d{10,}\b/, r: "phone number" },
  { rx: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, r: "phone number" },
  { rx: /\b\+\d{1,3}[-\s]?\d{6,}\b/, r: "phone number" },
  { rx: /whatsapp|telegram|signal|viber/i, r: "messaging app" },
  { rx: /call\s*me|text\s*me/i, r: "contact request" },
  { rx: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, r: "email" },
  { rx: /@[a-zA-Z0-9_]{3,}/, r: "social handle" },
  { rx: /facebook|instagram|twitter|snapchat|tiktok/i, r: "social media" },
];
function detectContact(t) {
  for (const { rx, r } of BLOCKED_RX) if (rx.test(t)) return r;
  return null;
}

/* ─── Helpers ─── */
function relDay(ts) {
  const d = new Date(ts), n = new Date();
  const y = new Date(n); y.setDate(y.getDate() - 1);
  if (d.toDateString() === n.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function fmtTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function initials(n) { return n ? n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"; }

/* ━━━━━━━━━━━━━━━━━━━━  WhatsApp-style Chat Page  ━━━━━━━━━━━━━━━━━━━━ */
export default function ChatPage({ consultations, user, onClose, embedded }) {
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [chatToast, setChatToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMsgMap, setLastMsgMap] = useState({});
  const [presenceMap, setPresenceMap] = useState({}); // { oderId: { online, text } }
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const isExpert = user?.role === "Expert";

  // Active consultation
  const active = consultations.find(c => c.id === activeId) || null;

  /* party helpers — works for both expert & farmer */
  const otherName = (c) => isExpert ? (c.client_name || "Farmer") : (c.expert_name || "Expert");
  const otherPhoto = (c) => isExpert ? c.client_photo : c.expert_photo;
  const otherSpec = (c) => isExpert ? (c.client_farm || c.client_location || "") : (c.expert_specialty || "");
  const otherId = (c) => isExpert ? c.client_id : c.expert_id;

  /* ── Real presence polling ── */
  const formatLastSeen = (isoUtc) => {
    if (!isoUtc) return "last seen recently";
    const d = new Date(isoUtc);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const seenDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    if (seenDay.getTime() === today.getTime()) return `last seen today at ${time}`;
    if (seenDay.getTime() === yesterday.getTime()) return `last seen yesterday at ${time}`;
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `last seen ${dateStr} at ${time}`;
  };

  const fetchPresence = useCallback(async () => {
    const ids = [...new Set(consultations.map(c => otherId(c)).filter(Boolean))];
    if (ids.length === 0) return;
    const map = {};
    await Promise.all(ids.map(async (uid) => {
      try {
        const res = await get(`/api/v1/presence/status/${uid}`);
        if (res) map[uid] = {
          online: res.online,
          text: res.online ? "online" : formatLastSeen(res.last_seen_utc)
        };
      } catch (_) {}
    }));
    setPresenceMap(prev => ({ ...prev, ...map }));
  }, [consultations, isExpert]);

  useEffect(() => {
    fetchPresence();
    const iv = setInterval(fetchPresence, 15000); // every 15s
    return () => clearInterval(iv);
  }, [fetchPresence]);

  const onlineStatus = (c) => {
    const uid = otherId(c);
    return presenceMap[uid] || { online: false, text: "last seen recently" };
  };

  /* ── Fetch unread counts + last messages for sidebar ── */
  const fetchSidebarData = useCallback(async () => {
    try {
      const res = await get("/api/v1/unread-counts");
      if (res && res.by_consultation) setUnreadMap(res.by_consultation);
    } catch (e) { /* silent */ }

    // Fetch last message for each consultation
    const map = {};
    for (const c of consultations) {
      try {
        const res = await get(`/api/v1/consultations/${c.id}/messages`);
        if (res?.messages?.length > 0) {
          const last = res.messages[res.messages.length - 1];
          map[c.id] = last;
        }
      } catch (e) { /* silent */ }
    }
    setLastMsgMap(map);
  }, [consultations]);

  useEffect(() => {
    fetchSidebarData();
    const iv = setInterval(fetchSidebarData, 8000);
    return () => clearInterval(iv);
  }, [fetchSidebarData]);

  /* ── Load messages for active chat ── */
  const fetchMessages = useCallback(async () => {
    if (!activeId) return;
    try {
      const res = await get(`/api/v1/consultations/${activeId}/messages`);
      if (res?.messages) setMessages(res.messages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    if (activeId) { setLoading(true); fetchMessages(); }
    const iv = activeId ? setInterval(fetchMessages, 4000) : null;
    return () => iv && clearInterval(iv);
  }, [activeId, fetchMessages]);

  /* auto-scroll */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  /* ── Send message ── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !activeId) return;
    const reason = detectContact(trimmed);
    if (reason) { setBlocked(reason); setTimeout(() => setBlocked(null), 4000); return; }
    setSending(true);
    try {
      const res = await post(`/api/v1/consultations/${activeId}/messages`, { sender_id: user.id, message: trimmed });
      if (res?.status === "ok" || res?.message) { setText(""); await fetchMessages(); }
      else if (res?.error) { setChatToast({ msg: res.error, type: "error" }); setTimeout(() => setChatToast(null), 3500); }
    } catch (err) { console.error(err); }
    setSending(false);
    inputRef.current?.focus();
  };

  /* ── Send file/image ── */
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;

    // Limit size 5MB
    if (file.size > 5 * 1024 * 1024) { setChatToast({ msg: "File must be under 5 MB", type: "error" }); setTimeout(() => setChatToast(null), 3500); return; }

    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setSending(true);
      try {
        const res = await post(`/api/v1/consultations/${activeId}/messages`, {
          sender_id: user.id,
          message: isImage ? "📷 Photo" : `📎 ${file.name}`,
          message_type: isImage ? "image" : "file",
          file_name: file.name,
          file_url: dataUrl,
        });
        if (res?.status === "ok" || res?.message) await fetchMessages();
        else if (res?.error) { setChatToast({ msg: res.error, type: "error" }); setTimeout(() => setChatToast(null), 3500); }
      } catch (err) { console.error(err); }
      setSending(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* ── Delete message ── */
  const handleDelete = async (msgId) => {
    setContextMenu(null);
    setDeleteConfirm(msgId);
  };
  const confirmDelete = async () => {
    const msgId = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const res = await del(`/api/v1/messages/${msgId}`);
      if (res?.status === "ok") await fetchMessages();
      else if (res?.error) { setChatToast({ msg: res.error, type: "error" }); setTimeout(() => setChatToast(null), 3500); }
    } catch (err) { console.error(err); }
  };

  /* ── Copy message ── */
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setContextMenu(null);
    });
  };

  /* ── Context menu ── */
  const openContext = (e, msg) => {
    e.preventDefault();
    const rect = scrollRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top + scrollRef.current.scrollTop, msg });
  };

  /* close context on click away */
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ── Group messages by day ── */
  const grouped = [];
  let lastDay = "";
  for (const m of messages) {
    const day = new Date(m.timestamp).toDateString();
    if (day !== lastDay) { grouped.push({ type: "divider", label: relDay(m.timestamp) }); lastDay = day; }
    grouped.push({ type: "msg", data: m });
  }

  /* ── Filter conversations for search ── */
  const filteredConsultations = consultations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return otherName(c).toLowerCase().includes(q) || (c.topic || "").toLowerCase().includes(q);
  });

  /* ── Select first conversation on mount (only in overlay mode, not embedded) ── */
  useEffect(() => {
    if (!embedded && !activeId && consultations.length > 0) setActiveId(consultations[0].id);
  }, [consultations, activeId, embedded]);

  return (
    <div className={embedded ? "flex bg-gray-100 h-full w-full" : "fixed inset-0 z-[60] flex bg-gray-100"}>

      {/* ╔═══════════ LEFT SIDEBAR — CHAT LIST ═══════════╗ */}
      <div className="w-[380px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">

        {/* Sidebar Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {initials(user?.full_name || user?.username || "")}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{user?.full_name || user?.username}</h3>
              <p className="text-teal-100 text-xs">{isExpert ? "Expert" : "Farmer"}</p>
            </div>
          </div>
          <button onClick={onClose} className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer ${embedded ? 'hidden' : ''}`} title="Close">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConsultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center">
              <i className="ri-chat-off-line text-4xl mb-2"></i>
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConsultations.map(c => {
              const isActive = c.id === activeId;
              const unread = unreadMap[c.id] || 0;
              const lastMsg = lastMsgMap[c.id];
              const lastText = lastMsg?.deleted ? "🚫 Message deleted" : (lastMsg?.message || c.topic || "");
              const lastTime = lastMsg ? fmtTime(lastMsg.timestamp) : "";

              return (
                <div
                  key={c.id}
                  onClick={() => { setActiveId(c.id); setMessages([]); }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 ${
                    isActive ? "bg-teal-50 border-l-4 border-l-teal-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  {/* avatar */}
                  <div className="relative flex-shrink-0">
                    {otherPhoto(c) ? (
                      <img src={otherPhoto(c)} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {initials(otherName(c))}
                      </div>
                    )}
                    {onlineStatus(c).online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  {/* text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-semibold truncate ${isActive ? "text-teal-800" : "text-gray-900"}`}>
                        {otherName(c)}
                      </h4>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {lastText.length > 45 ? lastText.slice(0, 45) + "…" : lastText}
                      </p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 truncate ${onlineStatus(c).online ? "text-teal-500 font-medium" : "text-gray-400"}`}>{onlineStatus(c).text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ╔═══════════ RIGHT PANEL — ACTIVE CHAT ═══════════╗ */}
      <div className="flex-1 flex flex-col h-full bg-[#efeae2]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M30 5 L35 15 L30 25 L25 15Z' fill='%23d5cfc3' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23p)'/%3E%3C/svg%3E\")" }}>

        {!active ? (
          /* ── No chat selected ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mb-6">
              <i className="ri-chat-smile-3-line text-5xl text-teal-400"></i>
            </div>
            <h2 className="text-2xl font-light text-gray-700 mb-2">AgroMedicana Chat</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Select a conversation from the left to start messaging. All communication is secure and monitored.
            </p>
          </div>
        ) : (
          <>
            {/* ─── Chat Header ─── */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 shadow-sm">
              {otherPhoto(active) ? (
                <img src={otherPhoto(active)} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {initials(otherName(active))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{otherName(active)}</h3>
                <p className={`text-xs truncate ${onlineStatus(active).online ? "text-teal-600 font-medium" : "text-gray-500"}`}>{onlineStatus(active).text}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer transition" title="Search messages">
                  <i className="ri-search-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* ─── Inline Chat Toast ─── */}
            {chatToast && (
              <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in ${
                chatToast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"
              }`}>
                <i className={chatToast.type === "error" ? "ri-close-circle-line" : "ri-information-line"}></i>
                {chatToast.msg}
              </div>
            )}

            {/* ─── Messages Area ─── */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-16 py-4 space-y-1 scroll-smooth relative"
              style={{ overscrollBehavior: "contain" }}
              onClick={() => setContextMenu(null)}
            >
              {/* blocked toast */}
              {blocked && (
                <div className="sticky top-2 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in w-fit mx-auto">
                  <i className="ri-error-warning-fill"></i>
                  Blocked — contains {blocked}. Sharing contact info is prohibited.
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <span className="text-sm">Loading conversation…</span>
                </div>
              ) : grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                  <div className="bg-white/80 rounded-xl p-8 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                      <i className="ri-lock-line text-3xl text-teal-400"></i>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">End-to-end conversation</h4>
                    <p className="text-sm text-gray-500 max-w-xs">Messages are secured through AgroMedicana. Send a message to start the consultation.</p>
                  </div>
                </div>
              ) : (
                grouped.map((item, idx) => {
                  if (item.type === "divider") {
                    return (
                      <div key={`d-${idx}`} className="flex items-center justify-center my-4">
                        <span className="bg-white/90 text-[11px] font-medium text-gray-500 px-3 py-1 rounded-lg shadow-sm">{item.label}</span>
                      </div>
                    );
                  }

                  const m = item.data;
                  const isMine = m.sender_id === user.id;
                  const isNextSame = idx + 1 < grouped.length && grouped[idx + 1].type === "msg" && grouped[idx + 1].data.sender_id === m.sender_id;

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} ${isNextSame ? "mb-[2px]" : "mb-2"}`}
                      onContextMenu={(e) => openContext(e, m)}
                    >
                      <div className={`relative max-w-[65%] group`}>
                        {/* triangle tail */}
                        {!isNextSame && (
                          <div className={`absolute top-0 w-3 h-3 ${isMine ? "-right-1.5 overflow-hidden" : "-left-1.5 overflow-hidden"}`}>
                            <div className={`w-3 h-3 rotate-45 ${isMine ? "bg-[#d9fdd3]" : "bg-white"} ${isMine ? "translate-x-[-6px]" : "translate-x-[6px]"}`}></div>
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 text-sm leading-relaxed break-words shadow-sm ${
                            isMine
                              ? "bg-[#d9fdd3] text-gray-800 rounded-lg rounded-tr-none"
                              : "bg-white text-gray-800 rounded-lg rounded-tl-none"
                          } ${m.deleted ? "italic opacity-60" : ""}`}
                        >
                          {m.deleted ? (
                            <span className="text-gray-500 flex items-center gap-1.5"><i className="ri-forbid-line"></i> This message was deleted</span>
                          ) : (
                            <>
                              {/* Image attachment */}
                              {m.message_type === "image" && m.file_url && (
                                <div className="mb-1.5">
                                  <img
                                    src={m.file_url}
                                    alt={m.file_name || "Photo"}
                                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                                    style={{ maxHeight: "280px" }}
                                    onClick={() => window.open(m.file_url, "_blank")}
                                  />
                                </div>
                              )}
                              {/* File attachment */}
                              {m.message_type === "file" && m.file_url && (
                                <a
                                  href={m.file_url}
                                  download={m.file_name}
                                  className="flex items-center gap-2 bg-black/5 rounded-lg p-2 mb-1.5 hover:bg-black/10 transition"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                                    <i className="ri-file-line text-teal-600 text-xl"></i>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{m.file_name}</p>
                                    <p className="text-[10px] text-gray-500">Click to download</p>
                                  </div>
                                </a>
                              )}
                              {/* Text */}
                              {m.message_type === "text" || (!m.message_type && !m.file_url) ? (
                                <span>{m.message}</span>
                              ) : m.message_type !== "image" && m.message_type !== "file" ? (
                                <span>{m.message}</span>
                              ) : null}
                            </>
                          )}
                          {/* Timestamp + read receipt */}
                          <span className={`float-right ml-3 mt-1 text-[10px] flex items-center gap-0.5 ${isMine ? "text-gray-500" : "text-gray-400"}`}>
                            {fmtTime(m.timestamp)}
                            {isMine && !m.deleted && (
                              <i className={`ml-0.5 ${m.read ? "ri-check-double-line text-blue-500" : "ri-check-line text-gray-400"}`}></i>
                            )}
                          </span>
                        </div>

                        {/* hover actions */}
                        {!m.deleted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openContext(e, m); }}
                            className={`absolute top-1 ${isMine ? "left-[-28px]" : "right-[-28px]"} w-6 h-6 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-600 cursor-pointer`}
                          >
                            <i className="ri-arrow-down-s-line text-sm"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />

              {/* ── Context Menu ── */}
              {contextMenu && (
                <div
                  className="absolute z-30 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[160px] animate-fade-in"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onClick={e => e.stopPropagation()}
                >
                  {!contextMenu.msg.deleted && (
                    <button
                      onClick={() => handleCopy(contextMenu.msg.message)}
                      className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                    >
                      <i className="ri-file-copy-line text-gray-400"></i> Copy
                    </button>
                  )}
                  {contextMenu.msg.sender_id === user.id && !contextMenu.msg.deleted && (
                    <button
                      onClick={() => handleDelete(contextMenu.msg.id)}
                      className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-red-400"></i> Delete
                    </button>
                  )}
                  {contextMenu.msg.file_url && !contextMenu.msg.deleted && (
                    <a
                      href={contextMenu.msg.file_url}
                      download={contextMenu.msg.file_name}
                      className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <i className="ri-download-line text-gray-400"></i> Download
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* scroll-to-bottom FAB */}
            {showScrollBtn && (
              <button
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="absolute bottom-20 right-8 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-500 hover:text-teal-600 border border-gray-200 transition cursor-pointer z-10"
              >
                <i className="ri-arrow-down-line text-lg"></i>
              </button>
            )}

            {/* ─── Input Bar ─── */}
            <form onSubmit={handleSend} className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-2.5 flex items-end gap-2">
              {/* attachment */}
              <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.csv" onChange={handleFileSelect} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition cursor-pointer flex-shrink-0"
                title="Attach file or image"
              >
                <i className="ri-attachment-2 text-xl"></i>
              </button>

              {/* image shortcut */}
              <input ref={el => { if (el) el._imgOnly = true; }} type="file" className="hidden" id="img-input" accept="image/*" onChange={handleFileSelect} />
              <button
                type="button"
                onClick={() => document.getElementById("img-input")?.click()}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition cursor-pointer flex-shrink-0"
                title="Send photo"
              >
                <i className="ri-image-line text-xl"></i>
              </button>

              {/* text input */}
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={text}
                  onChange={e => {
                    setText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  placeholder="Type a message"
                  disabled={sending}
                  className="w-full resize-none bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition disabled:opacity-60 max-h-[120px]"
                  style={{ minHeight: "42px" }}
                />
              </div>

              {/* send */}
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition flex-shrink-0 cursor-pointer ${
                  text.trim() ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-gray-100 text-gray-400"
                } disabled:opacity-50`}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <i className="ri-send-plane-2-fill text-lg"></i>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.15s ease-out; }
      `}</style>

      {/* ── Delete Confirm Dialog ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                <i className="ri-delete-bin-6-line text-xl text-red-600"></i>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete Message</h3>
              <p className="text-sm text-gray-500">This message will be removed for everyone.</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-l border-gray-100">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
