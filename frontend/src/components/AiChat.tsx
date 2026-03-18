import { useState } from "react";

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hi 👋 I’m ICIS AI. Ask me anything!" }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.reply }
      ]);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "12px",
          borderRadius: "50%",
          background: "#0ea5e9",
          color: "#fff",
          border: "none"
        }}
      >
        💬
      </button>

      {/* Chat Box */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "300px",
            height: "400px",
            background: "#111",
            color: "#fff",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ padding: "10px" }}>🤖 ICIS AI</div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {messages.map((m, i) => (
              <p key={i}>
                <b>{m.role}:</b> {m.content}
              </p>
            ))}
            {loading && <p>Thinking...</p>}
          </div>

          <div style={{ display: "flex" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}