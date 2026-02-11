import React, { useEffect, useState, useRef } from "react";
import { get, post } from "../api/api";

// Policy constants
const COMMUNICATION_POLICY = {
  title: "Communication Policy",
  rules: [
    "All communication must happen through this platform",
    "Sharing phone numbers, emails, or social media handles is prohibited",
    "Requesting contact information outside the platform is not allowed",
    "Violations may result in account suspension",
  ],
  reason:
    "This protects both parties and ensures quality service through AgroMedicana.",
};

export default function MessagingModal({ consultation, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  console.log("MessagingModal rendered with:", { consultation, user });

  useEffect(() => {
    console.log("Loading messages for consultation:", consultation.id);
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [consultation.id]);

  const loadMessages = async () => {
    try {
      const res = await get(
        `/api/v1/consultations/${consultation.id}/messages`
      );
      console.log("Load messages response:", res);
      if (res.messages) {
        setMessages(res.messages);
      } else if (res.error) {
        console.error("Error loading messages:", res.error);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    console.log("handleSend called, message:", newMessage);

    if (!newMessage.trim()) {
      console.log("Message is empty, not sending");
      return;
    }

    // Check for contact information
    const contactCheck = containsContactInfo(newMessage);
    if (contactCheck.blocked) {
      alert(
        `⚠️ Message blocked: Your message appears to contain a ${contactCheck.reason}.\n\nSharing contact information is not allowed to protect both parties. All communication must happen through AgroMedicana.`
      );
      setSending(false);
      return;
    }

    setSending(true);
    console.log("Sending message to backend...");

    try {
      const payload = {
        sender_id: user.id,
        message: newMessage.trim(),
      };
      console.log("Sending payload:", payload);

      const res = await post(
        `/api/v1/consultations/${consultation.id}/messages`,
        payload
      );

      console.log("Backend response:", res);

      if (res.status === "ok" || res.message) {
        console.log("Message sent successfully");
        setNewMessage("");
        await loadMessages();
      } else if (res.error) {
        console.error("Backend error:", res.error);
        alert("Error sending message: " + res.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      console.log("Send complete");
    }
  };

  const handleFileAttach = () => {
    alert("File attachment feature coming soon!");
  };

  const handleEmojiPicker = () => {
    alert("Emoji picker coming soon!");
  };

  // Contact info patterns to block
  const containsContactInfo = (text) => {
    // Phone number patterns (various formats)
    const phonePatterns = [
      /\b\d{10,}\b/, // 10+ consecutive digits
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // xxx-xxx-xxxx
      /\b\+\d{1,3}[-\s]?\d{6,}\b/, // +xxx xxxxxx
      /\b0\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/, // 0xx xxx xxxx
      /\b\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b/, // (xxx) xxx-xxxx
      /\b\d{3}\s\d{3}\s\d{4}\b/, // xxx xxx xxxx
      /whatsapp|telegram|signal|viber/i, // Messaging app names
      /call\s*me|text\s*me|phone|mobile/i, // Contact phrases
    ];

    // Email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    // Social media patterns
    const socialPatterns = [
      /@[a-zA-Z0-9_]{3,}/, // @username
      /facebook|instagram|twitter|snapchat|tiktok/i,
    ];

    // Check all patterns
    for (const pattern of phonePatterns) {
      if (pattern.test(text))
        return { blocked: true, reason: "phone number or contact request" };
    }
    if (emailPattern.test(text))
      return { blocked: true, reason: "email address" };
    for (const pattern of socialPatterns) {
      if (pattern.test(text))
        return { blocked: true, reason: "social media handle" };
    }

    return { blocked: false };
  };

  const [showPolicyWarning, setShowPolicyWarning] = useState(false);

  // Get the other party's actual name
  const getOtherPartyName = () => {
    if (messages.length > 0) {
      const otherMessage = messages.find((m) => m.sender_id !== user.id);
      if (otherMessage) {
        return otherMessage.sender_name;
      }
    }
    return user.role === "Client" ? "Expert" : "Client";
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return time;
  };

  const otherPartyName = getOtherPartyName();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content messaging-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">💬 Consultation Chat</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="chat-info">
          <div className="chat-header-info">
            <div>
              <h3 className="chat-partner-name">{otherPartyName}</h3>
              <p className="chat-topic">Topic: {consultation.topic}</p>
            </div>
            <div className="chat-actions">
              <button
                className="chat-action-btn"
                onClick={() => setShowPolicyWarning(!showPolicyWarning)}
                title="Communication Policy"
              >
                ℹ️
              </button>
            </div>
          </div>
        </div>

        {/* Policy Warning Banner */}
        {showPolicyWarning && (
          <div
            className="policy-warning-banner"
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "1px solid #f59e0b",
              borderRadius: "8px",
              padding: "12px 16px",
              margin: "0 16px 12px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "8px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#92400e",
                }}
              >
                ⚠️ {COMMUNICATION_POLICY.title}
              </h4>
              <button
                onClick={() => setShowPolicyWarning(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#92400e",
                }}
              >
                ×
              </button>
            </div>
            <ul
              style={{
                margin: "0",
                paddingLeft: "20px",
                fontSize: "12px",
                color: "#78350f",
              }}
            >
              {COMMUNICATION_POLICY.rules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {rule}
                </li>
              ))}
            </ul>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "11px",
                color: "#92400e",
                fontStyle: "italic",
              }}
            >
              {COMMUNICATION_POLICY.reason}
            </p>
          </div>
        )}

        <div className="messages-container">
          {loading ? (
            <div className="loading-messages">
              <div className="loading-spinner-chat"></div>
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <div className="empty-chat-icon">💬</div>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending a message below</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const showDate =
                index === 0 ||
                new Date(messages[index - 1].timestamp).toDateString() !==
                  new Date(msg.timestamp).toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="message-date-divider">
                      <span>
                        {new Date(msg.timestamp).toLocaleDateString([], {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={`message-wrapper ${
                      msg.sender_id === user.id ? "sent" : "received"
                    }`}
                  >
                    <div className="message-bubble">
                      <div className="message-content">
                        <div className="message-text">{msg.message}</div>
                      </div>
                      <div className="message-footer">
                        <span className="message-timestamp">
                          {formatMessageDate(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-input-form" onSubmit={handleSend}>
          <button
            type="button"
            className="input-action-btn"
            onClick={handleFileAttach}
            title="Attach File"
          >
            📎
          </button>
          <button
            type="button"
            className="input-action-btn"
            onClick={handleEmojiPicker}
            title="Add Emoji"
          >
            😊
          </button>
          <input
            type="text"
            className="message-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? "⏳" : "📤"}
          </button>
        </form>
      </div>
    </div>
  );
}
