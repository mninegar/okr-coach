// pages/index.js
import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

// Design tokens
const Tk = {
  cream: "#FBF7E1", paper: "#FFFEF5", fieldBg: "#F4F9EF",
  line: "#E8DFB5", lineSoft: "#F1EBC9",
  ink: "#1A2D14", ink2: "#33422F", muted: "#6F7864", mutedSoft: "#9CA396",
  sprout: "#4CB74A", sproutSoft: "#DEEFCC", moss: "#17713B",
  terracotta: "#E77527", terraSoft: "#FBC5A1",
};

// Image paths (served from /public/images/)
const IMG = {
  kale_bunch:   "/images/kale_bunch.png",
  kale_leaf:    "/images/kale_leaf.png",
  apple_whole:  "/images/apple_whole.png",
  apple_half:   "/images/apple_half.png",
  avocado:      "/images/avocado.png",
  pumpkin:      "/images/pumpkin.png",
  banana_slice: "/images/banana_slice.png",
  beet:         "/images/beet.png",
};

// Icons
const Ic = ({ d, sz = 16, stroke = "currentColor", fill = "none", sw = 1.6 }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  Send:      (p) => <Ic d="M3 11.5L21 3l-8.5 18-2.5-7.5L3 11.5z" {...p} />,
  Paperclip: (p) => <Ic d="M21 12.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8L13.4 4.6a3.7 3.7 0 0 1 5.2 5.2L10 18.6a1.8 1.8 0 1 1-2.6-2.6l7.8-7.8" {...p} />,
  Sparkle:   (p) => <Ic d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" {...p} />,
  Check:     (p) => <Ic d="M5 12.5l4 4L19 7" {...p} />,
  Restart:   (p) => <Ic d="M4 12a8 8 0 1 1 2.5 5.8M4 18v-5h5" {...p} />,
  Mic:       (p) => <Ic d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" {...p} />,
  Sheet:     (p) => <Ic d="M3 5h18v14H3zM3 10h18M9 5v14M15 5v14" {...p} />,
};

// Style helpers
const FONT = "'NeueKabel', sans-serif";
const pillBtn  = () => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 22, border: `0.5px solid ${Tk.line}`, background: Tk.cream, color: Tk.ink2, fontSize: 12, fontFamily: FONT, cursor: "pointer" });
const chipBtn  = () => ({ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 22, border: `1px solid ${Tk.line}`, background: Tk.paper, color: Tk.ink, fontSize: 12.5, fontFamily: FONT, cursor: "pointer" });
const iconBtn  = () => ({ width: 30, height: 30, borderRadius: 9, border: `0.5px solid ${Tk.line}`, background: Tk.paper, color: Tk.ink2, display: "grid", placeItems: "center", cursor: "pointer" });
const userBubble = () => ({ background: Tk.moss, color: Tk.paper, borderRadius: "16px 16px 4px 16px", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.55 });

// System prompt
const SYS = `You are the OKR Chatbot for Once Upon a Farm (OUF), a warm and knowledgeable internal coaching tool that helps Farmers (employees) and people leaders build, refine, and check in on their OKRs.

IMPORTANT RULES:
- Always call employees "Farmers."
- Never use em dashes. Use a comma, hyphen, or period instead.
- Never assume the user's name or role unless they tell you.

COMPANY CONTEXT - The 2026 Barn has five pillars:
1. Drive Existing Core - disciplined execution, customer productivity, brand and packaging, demand building
2. Grow Existing Categories - bar category leadership, protein equity, line extensions, household penetration, DTC
3. Expand into New Categories - new high-impact launches, de-risk before launch, phased go-to-market
4. Scale Organization for Growth - SRM and pricing, Marketing Mix Model, systems upgrades, AI forecasting
5. Advance PBC and Culture - purpose, passion, and profit, social impact, nutritional access, One Company culture

OKR RULES:
- 3-5 Objectives max per person or team, 3-5 Key Results per Objective max
- Key Results need a measurable target, a specific deadline, and an action verb (Launch, Achieve, Deliver, Grow, Reduce...)
- OKRs are not job duties. They are purposeful projects representing meaningful change, improvement, and growth.
- Scoring: Green=70-100%, Yellow=40-60%, Red=0-30%

WHEN REVIEWING OKRs, structure feedback as:
**What's strong** - specific praise
**What to sharpen** - missing metrics, missing dates, missing verbs, task-vs-goal issues
**Suggested rewrites** - rewritten Key Results for any weak ones

Be warm, plain-spoken, and encouraging. Do not use corporate jargon.`;

const QUICK_STARTS = [
  { label: "Draft new OKRs",           display: "Draft new OKRs",          imgKey: "apple_whole",  msg: "I want to start drafting new OKRs from scratch." },
  { label: "Refine my existing OKRs",  display: "Refine existing",         imgKey: "kale_leaf",    msg: "I have OKRs already drafted and want help refining them." },
  { label: "Prep for a check-in",      display: "Prep a check-in",         imgKey: "avocado",      msg: "I want to prepare for my monthly OKR check-in with my manager." },
  { label: "Explain OKRs to me",       display: "Explain OKRs",            imgKey: "pumpkin",      msg: "Can you explain what OKRs are and how to write good ones?" },
  { label: "Help with something else", display: "Help with something else", imgKey: "beet",         msg: "I need help with something OKR-related not listed above. Please ask me what I need." },
];

// Markdown parser
function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

// Review section parser
function parseReview(raw) {
  const re = /\*\*(What[^*]{2,60}|Suggested rewrites[^*]{0,40})\*\*/gi;
  const hits = [...raw.matchAll(re)];
  if (!hits.length) return null;
  return {
    intro: raw.substring(0, hits[0].index).trim(),
    sections: hits.map((h, i) => ({
      header: h[1].trim(),
      content: raw.substring(h.index + h[0].length, i < hits.length - 1 ? hits[i + 1].index : raw.length).trim(),
    })),
  };
}

// File parsers
async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  return new Promise((r) => { const s = document.createElement("script"); s.src = src; s.onload = r; document.head.appendChild(s); });
}
async function extractXLSX(file) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
  const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const kw = /okr|objective|key.?result|h1|h2|goal|barn|strategy|people|culture|farmer/i;
  const sorted = [...wb.SheetNames].sort((a, b) => (kw.test(a) ? 0 : 1) - (kw.test(b) ? 0 : 1));
  let out = `WORKBOOK: ${wb.SheetNames.length} sheets: ${wb.SheetNames.join(", ")}\n`;
  let total = 0;
  for (const name of sorted) {
    if (total >= 15000) { out += `\n[Sheet "${name}" skipped]`; continue; }
    const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
    const text = rows.filter((r) => r.some((c) => String(c).trim())).map((r) => r.map((c) => String(c)).filter((c) => c.trim()).join(" | ")).join("\n");
    if (!text.trim()) continue;
    const b = Math.min(text.length, 3000, 15000 - total);
    out += `\n\n--- Sheet: ${name} ---\n${text.substring(0, b)}`;
    total += b;
  }
  return out.trim();
}
async function extractPDF(file) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
    const c = await (await pdf.getPage(i)).getTextContent();
    text += c.items.map((s) => s.str).join(" ") + "\n";
  }
  return text.trim();
}
async function extractDOCX(file) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
  return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value.trim();
}
async function parseFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return extractPDF(file);
  if (ext === "docx" || ext === "doc") return extractDOCX(file);
  if (ext === "xlsx" || ext === "xls") return extractXLSX(file);
  if (ext === "txt") return new Promise((res, rej) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.onerror = () => rej(new Error("Read failed")); r.readAsText(file); });
  throw new Error("Unsupported file type. Try PDF, Word, Excel, or .txt");
}

// Components
function Img({ k, w = 18, h = 18, style = {} }) {
  return <img src={IMG[k]} alt="" style={{ width: w, height: h, objectFit: "contain", ...style }} />;
}

function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: Tk.sprout, opacity: 0.5, animation: `dot 1.2s infinite ${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function BotMark() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: Tk.sproutSoft, display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden" }}>
      <Img k="kale_bunch" w={24} h={24} />
    </div>
  );
}

function ReviewBlock({ kind, title, rawContent }) {
  const accent = kind === "strong" ? Tk.sprout : Tk.terracotta;
  const bg     = kind === "strong" ? Tk.sproutSoft : Tk.terraSoft;
  const imgKey = kind === "strong" ? "kale_leaf" : "apple_whole";
  return (
    <div style={{ background: Tk.paper, border: `0.5px solid ${Tk.line}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -14, bottom: -16, width: 76, opacity: 0.14, transform: kind === "strong" ? "rotate(8deg)" : "rotate(-8deg)", pointerEvents: "none" }}>
        <Img k={imgKey} w={76} h={76} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, position: "relative", zIndex: 1 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: bg, color: accent, display: "grid", placeItems: "center" }}>
          {kind === "strong" ? <Icons.Check size={13} sw={2.6} /> : <Icons.Sparkle size={11} sw={2.2} />}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, color: Tk.ink, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: Tk.ink2, lineHeight: 1.6, position: "relative", zIndex: 1 }} dangerouslySetInnerHTML={{ __html: md(rawContent || "") }} />
    </div>
  );
}

function CoachMsg({ html: htmlContent, raw, isTyping, chips, onChip }) {
  const review = raw ? parseReview(raw) : null;
  const isRev  = review !== null;
  let headline = "", subtitle = "";
  if (isRev && review.intro) {
    const lines = review.intro.split(/\n|<br\/>/).map((l) => l.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
    headline = lines[0] || "";
    subtitle = lines.slice(1).join(" ");
  }
  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <BotMark />
        <div style={{ fontSize: 10.5, color: Tk.muted, textTransform: "uppercase", letterSpacing: 1.6, fontFamily: FONT }}>{isRev ? "Coach · Review" : "Coach"}</div>
      </div>
      {isTyping ? <Dots /> : isRev ? (
        <>
          {(headline || subtitle) && (
            <div style={{ fontFamily: FONT, fontSize: 19, lineHeight: 1.35, letterSpacing: -0.2, color: Tk.ink, marginBottom: 14 }}>
              {headline && <span>{headline}<br /></span>}
              {subtitle && <span style={{ color: Tk.muted }}>{subtitle}</span>}
            </div>
          )}
          {review.sections.map(({ header, content }) => (
            <ReviewBlock key={header} kind={header.toLowerCase().includes("strong") ? "strong" : "sharpen"} title={header} rawContent={content} />
          ))}
        </>
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.7, color: Tk.ink2, fontFamily: FONT }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
      )}
      {!isTyping && chips?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {chips.map(({ label, display, imgKey, msg }) => (
            <button key={label} style={chipBtn()} onClick={() => onChip(msg || label, display || label)}
              onMouseEnter={(e) => { e.currentTarget.style.background = Tk.sproutSoft; e.currentTarget.style.borderColor = Tk.sprout; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = Tk.paper; e.currentTarget.style.borderColor = Tk.line; }}>
              {imgKey && <Img k={imgKey} w={18} h={18} />}
              {display || label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Welcome({ onAction }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 10.5, color: Tk.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.6, fontFamily: FONT }}>Coach</div>
      <div style={{ fontFamily: FONT, fontSize: 32, lineHeight: 1.1, letterSpacing: -0.5, color: Tk.ink, marginBottom: 14 }}>
        Hi there, Farmer.<br />
        <span style={{ color: Tk.sprout, position: "relative", display: "inline-block" }}>
          How can I help you grow
          <svg viewBox="0 0 200 8" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: -6, width: "100%", height: 8, color: Tk.sprout }}>
            <path d="M2 5 Q 50 1, 100 4 T 198 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </span>{" "}
        today?
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: Tk.ink2, fontFamily: FONT }}>
        {"I'm your goal-setting coach. I can "}
        <strong style={{ color: Tk.moss }}>draft</strong>{", "}
        <strong style={{ color: Tk.moss }}>refine</strong>{", "}
        <strong style={{ color: Tk.moss }}>review</strong>{", or "}
        <strong style={{ color: Tk.moss }}>check in</strong>
        {" on your OKRs. Attach a doc and I'll read it."}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
        {QUICK_STARTS.map(({ label, display, imgKey, msg }) => (
          <button key={label} style={chipBtn()} onClick={() => onAction(msg, display || label)}
            onMouseEnter={(e) => { e.currentTarget.style.background = Tk.sproutSoft; e.currentTarget.style.borderColor = Tk.sprout; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = Tk.paper; e.currentTarget.style.borderColor = Tk.line; }}>
            <Img k={imgKey} w={18} h={18} />
            {display || label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserMsg({ text, docWords, sheets }) {
  if (text?.startsWith("Attached: ")) {
    const name = text.replace("Attached: ", "");
    const meta = [sheets ? `${sheets} sheet${sheets !== 1 ? "s" : ""}` : null, docWords ? `${docWords.toLocaleString()} words` : null].filter(Boolean).join(" · ");
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: 380 }}>
        <div style={{ background: Tk.paper, border: `0.5px solid ${Tk.line}`, borderRadius: 14, padding: "10px 14px 10px 10px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: Tk.sproutSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Img k="apple_half" w={32} h={32} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: Tk.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: FONT }}>{name}</div>
            {meta && <div style={{ fontSize: 11, color: Tk.muted, marginTop: 2, fontFamily: FONT }}>{meta}</div>}
          </div>
        </div>
      </div>
    );
  }
  return <div style={{ alignSelf: "flex-end", maxWidth: 460 }}><div style={{ ...userBubble(), fontFamily: FONT }}>{text}</div></div>;
}

// Main component
export default function OKRChatbot() {
  const [msgs,      setMsgs]      = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [docText,   setDocText]   = useState(null);
  const [docName,   setDocName]   = useState(null);
  const [docWords,  setDocWords]  = useState(0);
  const [docSheets, setDocSheets] = useState(null);
  const [docOk,     setDocOk]     = useState(false);
  const [history,   setHistory]   = useState([]);
  const [progress,  setProgress]  = useState(5);
  const [drag,      setDrag]      = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const fileRef  = useRef(null);
  const dragN    = useRef(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { setMsgs([{ role: "bot", isWelcome: true }]); }, []);

  const callAPI = useCallback(async (userText, display, hist, doc, docN) => {
    setLoading(true);
    setMsgs((p) => [...p, { role: "user", text: display }, { role: "bot", typing: true }]);
    let content = userText;
    if (doc) content = `ATTACHED DOCUMENT: "${docN}"\n\nFull content:\n${doc}\n\n---\n\nUser message: ${userText}`;
    const newH = [...hist, { role: "user", content }];
    try {
      // Call our own API route - key stays server-side
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newH, system: SYS }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
      const reply = data.content?.find((b) => b.type === "text")?.text || "";
      const h2 = [...newH, { role: "assistant", content: reply }];
      setHistory(h2.length > 30 ? h2.slice(-28) : h2);
      setProgress((p) => Math.min(p + 10, 90));
      setMsgs((p) => [...p.filter((m) => !m.typing), { role: "bot", html: md(reply), raw: reply }]);
    } catch (e) {
      setMsgs((p) => [...p.filter((m) => !m.typing), { role: "bot", html: `<strong>Error:</strong> ${e.message}`, raw: "" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, []);

  const send = useCallback(() => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    callAPI(t, t, history, docText, docName);
  }, [input, loading, history, docText, docName, callAPI]);

  const onChip = useCallback((msg, label) => callAPI(msg, label, history, docText, docName), [history, docText, docName, callAPI]);

  const processFile = useCallback(async (file) => {
    setDocOk(false); setDrag(false);
    try {
      const text = await parseFile(file);
      if (!text || text.length < 20) throw new Error("Document appears empty or image-only.");
      const words = text.split(/\s+/).filter(Boolean).length;
      const trimmed = text.substring(0, 6000);
      setDocText(trimmed); setDocName(file.name); setDocWords(words);
      const m = text.match(/WORKBOOK:\s*(\d+)\s*sheets/);
      setDocSheets(m ? parseInt(m[1], 10) : null);
      setDocOk(true);
      callAPI(
        `ATTACHED DOCUMENT: "${file.name}"\n\nContent:\n${trimmed}\n\n---\n\nI just attached "${file.name}". Please acknowledge what you can see and ask what I would like to do: review my OKR draft, connect goals to The Barn, or finish drafting.`,
        `Attached: ${file.name}`, history, null, null
      );
    } catch (e) {
      setDocText(null); setDocName(null); setDocOk(false);
      alert(e.message);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [history, callAPI]);

  const onFile   = useCallback((e) => { const f = e.target.files[0]; if (f) processFile(f); }, [processFile]);
  const onDE     = useCallback((e) => { e.preventDefault(); dragN.current++; if (e.dataTransfer.items?.length) setDrag(true); }, []);
  const onDL     = useCallback((e) => { e.preventDefault(); if (--dragN.current === 0) setDrag(false); }, []);
  const onDO     = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }, []);
  const onDrop   = useCallback((e) => { e.preventDefault(); dragN.current = 0; setDrag(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }, [processFile]);
  const clearDoc = useCallback(() => { setDocText(null); setDocName(null); setDocWords(0); setDocSheets(null); setDocOk(false); if (fileRef.current) fileRef.current.value = ""; }, []);
  const restart  = useCallback(() => { setMsgs([{ role: "bot", isWelcome: true }]); setHistory([]); setInput(""); setProgress(5); clearDoc(); }, [clearDoc]);
  const onKey    = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      <Head>
        <title>OKR Coach - Once Upon a Farm</title>
        <style>{`
          @font-face {
            font-family: 'NeueKabel';
            font-weight: 400;
            font-style: normal;
            src: url('/fonts/NeueKabel-Regular.otf') format('opentype');
            font-display: block;
          }
          @font-face {
            font-family: 'NeueKabel';
            font-weight: 700;
            font-style: normal;
            src: url('/fonts/NeueKabel-Bold.otf') format('opentype');
            font-display: block;
          }
          * { box-sizing: border-box; font-family: 'NeueKabel', sans-serif; font-weight: 400; font-style: normal; }
          html, body { margin: 0; padding: 0; background: #FBF7E1; }
          ul { margin: 6px 0 4px 18px; padding: 0; }
          li { margin-bottom: 3px; }
          @keyframes dot { 0%,60%,100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-5px); opacity: 1; } }
          @keyframes mi  { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          .mi { animation: mi 0.2s ease both; }
          strong { font-weight: 700; }
          button { font-family: 'NeueKabel', sans-serif; font-weight: 400; }
        `}</style>
      </Head>

      <div style={{ minHeight: "100vh", background: Tk.cream, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px" }}>
        <div
          onDragEnter={onDE} onDragLeave={onDL} onDragOver={onDO} onDrop={onDrop}
          style={{ width: "100%", maxWidth: 760, background: Tk.cream, display: "flex", flexDirection: "column", borderRadius: 18, overflow: "hidden", border: drag ? `1.5px solid ${Tk.sprout}` : `0.5px solid ${Tk.line}`, position: "relative", transition: "border-color 0.15s" }}>

          {drag && (
            <div style={{ position: "absolute", inset: 0, zIndex: 50, background: `${Tk.sproutSoft}cc`, border: `2px dashed ${Tk.sprout}`, borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, pointerEvents: "none" }}>
              <Img k="apple_half" w={48} h={48} />
              <div style={{ fontFamily: FONT, fontSize: 16, color: Tk.moss }}>Drop your document here</div>
              <div style={{ fontSize: 12, color: Tk.muted }}>PDF, Word, Excel, or plain text</div>
            </div>
          )}

          {/* Progress bar */}
          <div style={{ height: 3, background: Tk.lineSoft, flexShrink: 0 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: Tk.sprout, transition: "width 0.4s ease" }} />
          </div>

          {/* Header */}
          <div style={{ padding: "14px 22px", borderBottom: `0.5px solid ${Tk.line}`, background: Tk.paper, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: Tk.sproutSoft }} />
              <div style={{ position: "absolute", top: 3, left: 3 }}><Img k="kale_bunch" w={32} h={32} /></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 19, letterSpacing: -0.3, lineHeight: 1, color: Tk.ink }}>OKR Coach</div>
              <div style={{ fontSize: 11, color: Tk.muted, marginTop: 4, fontFamily: FONT }}>Goal-setting support for Farmers, people leaders, and teams</div>
            </div>
            <button style={pillBtn()} onClick={restart}
              onMouseEnter={(e) => { e.currentTarget.style.background = Tk.sproutSoft; e.currentTarget.style.borderColor = Tk.sprout; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = Tk.cream; e.currentTarget.style.borderColor = Tk.line; }}>
              <Icons.Restart size={12} sw={2.2} /> New conversation
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 420 }}>
            {/* Ambient produce - outside scroll, clipped by parent overflow:hidden */}
            <img src="/images/kale_leaf.png" alt="" style={{ position: "absolute", left: -34, bottom: 90, width: 130, opacity: 0.10, transform: "rotate(-18deg)", pointerEvents: "none", userSelect: "none", zIndex: 0 }}/>
            <img src="/images/banana_slice.png" alt="" style={{ position: "absolute", right: -28, top: 130, width: 120, opacity: 0.10, transform: "rotate(18deg)", pointerEvents: "none", userSelect: "none", zIndex: 0 }}/>
            <img src="/images/pumpkin.png" alt="" style={{ position: "absolute", right: -50, bottom: -30, width: 180, opacity: 0.09, transform: "rotate(-8deg)", pointerEvents: "none", userSelect: "none", zIndex: 0 }}/>
            <img src="/images/avocado.png" alt="" style={{ position: "absolute", left: -22, top: 180, width: 90, opacity: 0.10, transform: "rotate(14deg)", pointerEvents: "none", userSelect: "none", zIndex: 0 }}/>

            <div style={{ position: "relative", zIndex: 1, height: "100%", overflow: "auto", padding: "30px 28px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {msgs.map((m, i) => (
                <div key={i} className="mi">
                  {m.role === "user"
                    ? <UserMsg text={m.text} docWords={docWords} sheets={docSheets} />
                    : m.isWelcome
                      ? <Welcome onAction={onChip} />
                      : <CoachMsg html={m.html} raw={m.raw} isTyping={m.typing} chips={m.chips} onChip={onChip} />
                  }
                </div>
              ))}
            </div>
            <div ref={endRef} />
            </div>
          </div>

          {/* Composer */}
          <div style={{ padding: 16, borderTop: `0.5px solid ${Tk.line}`, background: Tk.paper, flexShrink: 0 }}>
            <div style={{ background: Tk.fieldBg, borderRadius: 18, padding: 14, border: `1px solid ${Tk.line}` }}>
              <textarea
                ref={inputRef} value={input} disabled={loading}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={onKey}
                placeholder="Reply to the coach..."
                rows={1}
                style={{ width: "100%", border: "none", background: "transparent", fontFamily: FONT, fontSize: 14, color: input ? Tk.ink : Tk.mutedSoft, resize: "none", outline: "none", minHeight: 22, maxHeight: 120, lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <label style={{ ...iconBtn(), position: "relative" }}>
                  <Icons.Paperclip size={14} />
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.xlsx,.xls" onChange={onFile}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                </label>
                {docOk && docName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: Tk.sproutSoft, borderRadius: 8, padding: "3px 8px 3px 6px", fontSize: 11, color: Tk.moss, fontFamily: FONT }}>
                    <Icons.Sheet size={12} stroke={Tk.moss} />
                    <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{docName}</span>
                    <button onClick={clearDoc} style={{ background: "none", border: "none", cursor: "pointer", color: Tk.moss, fontSize: 12, padding: "0 1px", lineHeight: 1, fontFamily: FONT }}>x</button>
                  </div>
                )}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 11, color: Tk.muted, fontFamily: FONT }}>{String.fromCharCode(9166)} to send</div>
                <button onClick={send} disabled={loading || !input.trim()}
                  style={{ width: 34, height: 34, borderRadius: 11, background: loading || !input.trim() ? Tk.lineSoft : Tk.moss, color: "#fff", border: "none", display: "grid", placeItems: "center", cursor: loading || !input.trim() ? "default" : "pointer", transition: "background 0.13s" }}>
                  <Icons.Send size={14} stroke="#fff" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
