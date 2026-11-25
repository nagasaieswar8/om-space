"use client";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "Show 2 BHK flats in Tadepalli",
  "What is the price range in Benz Circle?",
  "How do I contact an agency?",
  "What localities are available?",
];

const GREETING = "Hi, I'm the OM SPACE assistant. I can help you explore Vijayawada, understand localities and budgets, and find the right listings. What are you looking for?";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("os-open-chat", openChat);
    return () => window.removeEventListener("os-open-chat", openChat);
  }, []);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");
    const updated = [...messages, { role: "user", content }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.message || "Sorry, I could not get a response." }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="os-chat-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close the OM SPACE assistant" : "Open the OM SPACE assistant"}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {open && (
        <section className="os-chat" aria-label="OM SPACE property assistant">
          <header className="os-chat__head">
            <div className="os-chat__mark">OS</div>
            <div>
              <b>OM SPACE Assistant</b>
              <span>Property guidance · Vijayawada</span>
            </div>
            <button className="os-chat__close" onClick={() => setOpen(false)} aria-label="Close assistant">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <div className="os-chat__body">
            {messages.map((message, index) => (
              <div key={index} className={`os-chat__msg ${message.role === "user" ? "os-chat__msg--user" : ""}`}>
                {message.content}
              </div>
            ))}
            {loading && <div className="os-chat__msg" style={{ opacity: 0.6 }}>Thinking…</div>}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="os-chat__chips">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} className="os-chat__chip" onClick={() => sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="os-chat__foot">
            <input
              className="os-chat__input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              placeholder="Ask about properties…"
              aria-label="Message the assistant"
            />
            <button className="os-chat__send" onClick={() => sendMessage()} disabled={loading || !input.trim()} aria-label="Send message">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
