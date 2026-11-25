"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function ThreadSkeleton() {
  return (
    <>
      <Navbar />
      <div className="os-container" style={{ paddingBlock: 70 }}>
        <div className="os-skeleton" style={{ width: 320, height: 38, marginBottom: 22 }} />
        <div className="os-skeleton" style={{ height: 460, borderRadius: 20 }} />
      </div>
    </>
  );
}

function ContactRequestsContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [inquiryId, setInquiryId] = useState(null);
  const [inquiry, setInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const id = searchParams.get("inquiry");
    if (id) setInquiryId(id.trim());
  }, [searchParams]);

  useEffect(() => {
    if (!inquiryId) {
      setLoading(false);
      return;
    }

    fetch(`/api/inquiries/${inquiryId}`)
      .then(r => r.json())
      .then(d => {
        setInquiry(d.inquiry);
        setMessages(d.messages || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [inquiryId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !inquiryId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage, userId: session?.user?.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        if (data.inquiry?.status) setInquiry(prev => ({ ...prev, status: data.inquiry.status }));
        setNewMessage("");
      }
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!inquiryId) return;

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });

      if (res.ok) {
        setInquiry(prev => ({ ...prev, status: "resolved" }));
        alert("Inquiry marked as resolved");
      }
    } catch {
      alert("Failed to update inquiry");
    }
  };

  if (status === "loading" || loading) return <ThreadSkeleton />;
  if (!session) return null;

  if (!inquiryId || !inquiry) {
    return (
      <>
        <Navbar />
        <section className="os-page-hero">
          <div className="os-container os-page-hero__inner">
            <div className="os-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <b>Conversations</b>
            </div>
            <span className="os-eyebrow">Enquiries</span>
            <h1>
              Every <span className="os-italic">conversation</span>, in one place.
            </h1>
            <p className="os-lead">Open an enquiry from your portal to pick up the conversation.</p>
          </div>
        </section>
        <main className="os-container" style={{ paddingBlock: "40px 80px" }}>
          <div className="os-empty">
            <h3>No conversation selected</h3>
            <p>Choose an inquiry from your dashboard to view the full thread with the agency.</p>
            <Link href="/dashboard" className="os-btn os-btn--gold">Open my dashboard</Link>
          </div>
        </main>
      </>
    );
  }

  const isAgency = session?.user?.role === "agency" || session?.user?.role === "admin";

  return (
    <>
      <Navbar />
      <main className="os-container os-container--narrow" style={{ paddingBlock: "40px 80px" }}>
        <div className="os-breadcrumb">
          <Link href={isAgency ? "/agency-dashboard" : "/dashboard"}>
            {isAgency ? "Agency portal" : "My dashboard"}
          </Link>
          <span>/</span>
          <b>Conversation</b>
        </div>

        <div className="os-thread__head">
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1>{inquiry.property?.title || "Property enquiry"}</h1>
            <div className="os-thread__meta" style={{ marginTop: 6 }}>
              {inquiry.property?.location ? `${inquiry.property.location} · ` : ""}
              {isAgency ? (
                <>From: <b>{inquiry.user?.name || "Customer"}</b></>
              ) : (
                <>Agency: <b>{inquiry.property?.seller_company || inquiry.property?.seller_name || "Property agency"}</b></>
              )}
            </div>
          </div>
          <span className={`os-badge ${inquiry.status === "resolved" ? "os-badge--green" : "os-badge--gold"}`}>
            {inquiry.status?.toUpperCase() || "PENDING"}
          </span>
        </div>

        <div className="os-thread">
          {messages.length === 0 ? (
            <div className="os-thread__empty">
              <p>No messages yet. Start the conversation below.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === session?.user?.id;
              return (
                <div className={`os-msg ${isMe ? "os-msg--me" : ""}`} key={idx}>
                  <b>{msg.sender?.name || (isMe ? "You" : "Agency")}</b>
                  <p>{msg.content}</p>
                  <time>{new Date(msg.createdAt).toLocaleString()}</time>
                </div>
              );
            })
          )}
        </div>

        {inquiry.status !== "resolved" && isAgency && (
          <div className="os-thread__composer">
            <textarea
              className="os-textarea"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
            />
            <div className="os-thread__actions">
              <button
                type="button"
                className="os-btn os-btn--gold"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? "Sending…" : "Send message"}
              </button>
              <button type="button" className="os-btn os-btn--ghost" onClick={handleMarkResolved}>
                Mark resolved
              </button>
            </div>
          </div>
        )}

        <div className="os-thread__initial">
          <b>Initial message</b>
          <p>{inquiry.message}</p>
          <time>Sent on {new Date(inquiry.createdAt).toLocaleDateString()}</time>
        </div>
      </main>
    </>
  );
}

export default function ContactRequestsPage() {
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <ContactRequestsContent />
    </Suspense>
  );
}
