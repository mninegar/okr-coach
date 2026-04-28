import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

const FONT = "'Nunito', 'NeueKabel', sans-serif";

// ── Design tokens ─────────────────────────────────────────────────────────────
const Tk = {
  cream:"#FBF7E1", paper:"#FFFEF5", fieldBg:"#F4F9EF",
  card:"#ffffff",
  line:"#E8DFB5", lineSoft:"#F1EBC9",
  ink:"#1A2D14", ink2:"#33422F", muted:"#6F7864", mutedSoft:"#9CA396",
  sprout:"#4CB74A", sproutSoft:"#DEEFCC", moss:"#17713B",
  terracotta:"#E77527", terraSoft:"#FBC5A1",
  white:"#FFFFFF",
};

// ── Image paths ────────────────────────────────────────────────────────────────
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

// ── Quick-start chips ─────────────────────────────────────────────────────────
const QUICK_STARTS = [
  { label:"Draft new OKRs",         display:"Draft new OKRs",         img:IMG.apple_whole,  msg:"I want to draft new OKRs. Please ask me what I need to help you get started." },
  { label:"Refine existing",         display:"Refine existing",         img:IMG.kale_leaf,    msg:"I have OKRs already drafted and want help refining them. I will share them with you." },
  { label:"Prep a check-in",         display:"Prep a check-in",         img:IMG.avocado,      msg:"I want to prepare for my monthly OKR check-in with my manager." },
  { label:"Explain OKRs",            display:"Explain OKRs",            img:IMG.pumpkin,      msg:"Can you explain what OKRs are and how to write good ones?" },
  { label:"Help with something else",display:"Help with something else",img:IMG.beet,         msg:"I need help with something related to OKRs that is not listed above. Please ask me what I need." },
];

// ── System prompt ──────────────────────────────────────────────────────────────
const SYS = `You are the OKR Coach for Once Upon a Farm (OUF), a warm and knowledgeable internal coaching tool that helps Farmers (employees) and people leaders build, refine, and check in on their OKRs.

IMPORTANT RULES:
- Always call employees "Farmers."
- Never use em dashes in your responses. Use a comma, hyphen, or period instead.
- Never assume or infer the user's name. Do not use any specific name unless the user has introduced themselves in this conversation.
- Users can be anyone at Once Upon a Farm: an individual contributor, a people leader, a new hire, or a senior leader. Do not make assumptions about their role unless they tell you.
- Always ask who you are speaking with if it matters for the coaching (for example, whether they are setting team OKRs or individual OKRs).

COMPANY CONTEXT - The 2026 Barn (company strategy) has five pillars:
1. Drive Existing Core - disciplined execution, customer productivity, brand/packaging, demand building, channel growth
2. Grow Existing Categories - bar category leadership, protein equity, line extensions, household penetration, DTC/ecommerce
3. Expand into New Categories - new high-impact launches, de-risk before launch, phased go-to-market
4. Scale Organization for Growth - SRM/pricing discipline, Marketing Mix Model, systems upgrades, AI forecasting, org structure
5. Advance PBC and Culture - purpose/passion/profit, social impact, nutritional access, One Company culture, employee engagement

OKR RULES:
- 3-5 Objectives per person or team max; 3-5 Key Results per Objective max
- Key Results must have: a measurable target (number or metric), a specific deadline date, and an action verb (Launch, Achieve, Deliver, Grow, Reduce...)
- OKRs are not job duties or daily tasks. They are purposeful projects that drive meaningful change, improvement, and growth.
- OKRs should be aspirational: 70% achievement is considered a success. Encourage stretch.
- Scoring: 0.7-1.0 = green (success), 0.4-0.6 = yellow (partial), 0.0-0.3 = red (missed)
- OKRs should ladder up to a Barn pillar OR be clearly labeled as a personal development goal. Both are valid.
- OKR cadence at OUF is H1 (January to June) and H2 (July to December). Monthly check-ins with manager.
- Cascade: roughly 50% of OKRs should cascade from team strategy, 50% can ladder up from the front line.

COACHING STYLE:
- Be warm, direct, and encouraging. Use plain language. No corporate jargon.
- When reviewing OKRs, identify what is strong first, then what needs sharpening.
- Help users connect their work to a Barn pillar. If it does not connect, help them name it as a personal development goal.
- Push back gently when someone submits tasks as OKRs. Say something like: "This looks more like a daily task than an OKR. Let us turn it into a real goal."
- Offer to generate an Excel template when the user seems ready to finalize their OKRs.
- When doing a review, structure your reply with: "Here is my read on your draft." followed by "What is strong:" and "What to sharpen:" sections.`;

// ── Markdown parser ───────────────────────────────────────────────────────────
function md(text) {
  if (!text) return "";
  return text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/`(.+?)`/g,"<code>$1</code>")
    .replace(/^#{1,3}\s+(.+)$/gm,"<strong>$1</strong>")
    .replace(/\n\n/g,"<br/><br/>")
    .replace(/\n/g,"<br/>");
}

// ── Review section parser ─────────────────────────────────────────────────────
function parseReview(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (!lower.includes("what is strong") && !lower.includes("what's strong") && !lower.includes("what to sharpen")) return null;
  const introMatch = raw.match(/^([\s\S]*?)(?=\*\*What(?:'s| is) strong|\*\*What to sharpen)/i);
  const strongMatch = raw.match(/\*\*What(?:'s| is) strong[:\*]*\*?\*?([\s\S]*?)(?=\*\*What to sharpen|\*\*Suggested|$)/i);
  const sharpenMatch = raw.match(/\*\*What to sharpen[:\*]*\*?\*?([\s\S]*?)(?=\*\*Suggested|$)/i);
  const rewriteMatch = raw.match(/\*\*Suggested rewrites?[:\*]*\*?\*?([\s\S]*?)$/i);
  if (!strongMatch && !sharpenMatch) return null;
  return {
    intro: introMatch ? introMatch[1].trim() : "",
    strong: strongMatch ? strongMatch[1].trim() : "",
    sharpen: sharpenMatch ? sharpenMatch[1].trim() : "",
    rewrite: rewriteMatch ? rewriteMatch[1].trim() : "",
  };
}

// ── File extractors ───────────────────────────────────────────────────────────
async function extractPDF(file) {
  if (typeof pdfjsLib === "undefined") throw new Error("PDF.js unavailable");
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let text = "";
  const max = Math.min(pdf.numPages, 15);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(s => s.str).join(" ") + "\n";
  }
  return text.trim();
}
async function extractDOCX(file) {
  if (typeof mammoth === "undefined") throw new Error("Mammoth unavailable");
  const ab = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: ab });
  return result.value.trim();
}
async function extractXLSX(file) {
  if (typeof XLSX === "undefined") throw new Error("SheetJS unavailable");
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  let allText = `WORKBOOK: ${wb.SheetNames.length} sheets\n`;
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const sheetText = rows
      .filter(r => r.some(c => String(c).trim() !== ""))
      .map(r => r.map(c => String(c)).filter(c => c.trim() !== "").join(" | "))
      .join("\n");
    if (sheetText.trim()) allText += `\n--- Sheet: ${name} ---\n${sheetText}`;
  });
  return allText.trim();
}
async function parseFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return extractPDF(file);
  if (ext === "docx" || ext === "doc") return extractDOCX(file);
  if (ext === "xlsx" || ext === "xls") return extractXLSX(file);
  if (ext === "txt") return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsText(file);
  });
  throw new Error("Unsupported file type. Try PDF, Word, Excel, or .txt");
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Img({ k, w = 18, h = 18, style = {} }) {
  return <img src={IMG[k]} alt="" style={{ width: w, height: h, objectFit: "contain", ...style }} />;
}
function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map(i => (
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

// ── Shared button styles ──────────────────────────────────────────────────────
function pillBtn(extra = {}) {
  return {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 13px", borderRadius: 20,
    border: `0.5px solid ${Tk.line}`, background: Tk.cream,
    fontFamily: FONT, fontSize: 12, color: Tk.ink2,
    cursor: "pointer", whiteSpace: "nowrap",
    ...extra,
  };
}
function chipBtn(extra = {}) {
  return {
    display: "flex", alignItems: "center", gap: 7,
    padding: "8px 14px", borderRadius: 20,
    border: `0.5px solid ${Tk.line}`, background: Tk.paper,
    fontFamily: FONT, fontSize: 13, color: Tk.ink,
    cursor: "pointer",
    ...extra,
  };
}

// ── Review block ──────────────────────────────────────────────────────────────
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
        <div style={{ width: 22, height: 22, borderRadius: 7, background: bg, color: accent, display: "grid", placeItems: "center", fontSize: 13 }}>
          {kind === "strong" ? "✓" : "↑"}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: Tk.ink, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: Tk.ink2, lineHeight: 1.6, position: "relative", zIndex: 1 }} dangerouslySetInnerHTML={{ __html: md(rawContent || "") }} />
    </div>
  );
}

// ── Coach message ─────────────────────────────────────────────────────────────
function CoachMsg({ html: htmlContent, raw, isTyping, chips, onChip }) {
  const review = raw ? parseReview(raw) : null;
  const isRev = review !== null;
  let headline = "", subtitle = "";
  if (isRev && review.intro) {
    const lines = review.intro.split(/\n|<br\/>/).map(l => l.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
    headline = lines[0] || "";
    subtitle = lines.slice(1).join(" ");
  }
  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <BotMark />
        <div style={{ fontSize: 10.5, color: Tk.muted, textTransform: "uppercase", letterSpacing: 1.6, fontFamily: FONT }}>
          {isRev ? "Coach · Review" : "Coach"}
        </div>
      </div>
      {isTyping ? <Dots /> : isRev ? (
        <div>
          {headline && (
            <div style={{ marginBottom: subtitle ? 4 : 14 }}>
              <div style={{ fontFamily: FONT, fontSize: 20, color: Tk.ink, lineHeight: 1.2 }}>{headline}</div>
              {subtitle && <div style={{ fontSize: 13, color: Tk.ink2, marginTop: 4 }}>{subtitle}</div>}
            </div>
          )}
          {review.strong && <ReviewBlock kind="strong" title="What's strong" rawContent={review.strong} />}
          {review.sharpen && <ReviewBlock kind="sharpen" title="What to sharpen" rawContent={review.sharpen} />}
          {review.rewrite && <ReviewBlock kind="rewrite" title="Suggested rewrites" rawContent={review.rewrite} />}
        </div>
      ) : (
        <div style={{ background: Tk.paper, border: `0.5px solid ${Tk.line}`, borderRadius: "4px 18px 18px 18px", padding: "14px 18px", fontSize: 14, lineHeight: 1.7, color: Tk.ink2 }}
          dangerouslySetInnerHTML={{ __html: htmlContent || "" }} />
      )}
      {chips && chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {chips.map(({ label, msg }) => (
            <button key={label} style={chipBtn()} onClick={() => onChip(msg, label)}
              onMouseEnter={e => { e.currentTarget.style.background = Tk.sproutSoft; e.currentTarget.style.borderColor = Tk.sprout; }}
              onMouseLeave={e => { e.currentTarget.style.background = Tk.paper; e.currentTarget.style.borderColor = Tk.line; }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User message ──────────────────────────────────────────────────────────────
function UserMsg({ text, docWords, sheets }) {
  const isDoc = text?.startsWith("Attached: ");
  if (isDoc) {
    const fileName = text.replace("Attached: ", "");
    const meta = [sheets ? `${sheets} sheet${sheets !== 1 ? "s" : ""}` : null, docWords ? `${docWords.toLocaleString()} words` : null].filter(Boolean).join(" · ");
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: Tk.paper, border: `0.5px solid ${Tk.line}`, borderRadius: "18px 4px 18px 18px", padding: "12px 16px", maxWidth: 320, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: Tk.sproutSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Img k="apple_half" w={26} h={26} />
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: Tk.ink, fontWeight: 700 }}>{fileName}</div>
            {meta && <div style={{ fontSize: 11, color: Tk.muted, marginTop: 2 }}>{meta}</div>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ background: Tk.moss, color: Tk.white, borderRadius: "18px 4px 18px 18px", padding: "10px 16px", maxWidth: 460, fontSize: 14, lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────
function Welcome({ onAction }) {
  return (
    <div style={{ maxWidth: 560, paddingBottom: 8 }}>
      <div style={{ fontSize: 10.5, color: Tk.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.6, fontWeight: 800, fontFamily: FONT }}>
        Coach
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontStyle: "normal", color: Tk.ink, lineHeight: 1.1, marginBottom: 14 }}>
        <span style={{ fontSize: 32, display: "block" }}>Hi there, Farmer.</span>
        <span style={{ fontSize: 32, display: "block" }}>
          <span style={{ color: Tk.sprout, position: "relative", display: "inline-block" }}>
            How can I help you grow
            <svg viewBox="0 0 220 9" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -6, width: "100%", height: 8 }}>
              <path d="M2 6 Q 55 2, 110 5 T 218 4" stroke={Tk.sprout} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          {" "}<span style={{ color: Tk.ink }}>today?</span>
        </span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: Tk.ink2, margin: "16px 0 18px" }}>
        {"I'm your goal-setting coach. I can "}
        <b style={{ color: Tk.moss }}>draft</b>{", "}
        <b style={{ color: Tk.moss }}>refine</b>{", "}
        <b style={{ color: Tk.moss }}>review</b>{", or "}
        <b style={{ color: Tk.moss }}>check in</b>
        {" on your OKRs. Attach a doc and I'll read it."}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_STARTS.map(({ label, display, img, msg }) => (
          <button key={label} style={chipBtn()} onClick={() => onAction(msg, display)}
            onMouseEnter={e => { e.currentTarget.style.background = Tk.sproutSoft; e.currentTarget.style.borderColor = Tk.sprout; }}
            onMouseLeave={e => { e.currentTarget.style.background = Tk.paper; e.currentTarget.style.borderColor = Tk.line; }}>
            {img && <img src={img} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} onError={e => { e.currentTarget.style.display = "none"; }} />}
            {display}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function OKRCoach() {
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [docText, setDocText]   = useState(null);
  const [docName, setDocName]   = useState(null);
  const [docWords, setDocWords] = useState(0);
  const [docSheets, setDocSheets] = useState(null);
  const [docOk, setDocOk]     = useState(false);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(5);
  const [drag, setDrag]       = useState(false);

  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const fileRef  = useRef(null);
  const dragN    = useRef(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { setMsgs([{ role: "bot", isWelcome: true }]); }, []);

  const callAPI = useCallback(async (userText, display, hist, doc, docN) => {
    setLoading(true);
    setMsgs(p => [...p, { role: "user", text: display }, { role: "bot", typing: true }]);
    let content = userText;
    if (doc) content = `ATTACHED DOCUMENT: "${docN}"\n\nFull content:\n${doc}\n\n---\n\nUser message: ${userText}`;
    const newH = [...hist, { role: "user", content }];
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newH, system: SYS }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
      const reply = data.content?.find(b => b.type === "text")?.text || "";
      const h2 = [...newH, { role: "assistant", content: reply }];
      setHistory(h2.length > 30 ? h2.slice(-28) : h2);
      setProgress(p => Math.min(p + 10, 90));
      setMsgs(p => [...p.filter(m => !m.typing), { role: "bot", html: md(reply), raw: reply }]);
    } catch (e) {
      setMsgs(p => [...p.filter(m => !m.typing), { role: "bot", html: `<strong>Error:</strong> ${e.message}`, raw: "" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, []);

  const send   = useCallback(() => { const t = input.trim(); if (!t || loading) return; setInput(""); callAPI(t, t, history, docText, docName); }, [input, loading, history, docText, docName, callAPI]);
  const onChip = useCallback((msg, label) => callAPI(msg, label, history, docText, docName), [history, docText, docName, callAPI]);

  const processFile = useCallback(async (file) => {
    setDocOk(false); setDrag(false);
    try {
      const text = await parseFile(file);
      if (!text || text.length < 20) throw new Error("Document appears empty or image-only.");
      const words = text.split(/\s+/).filter(Boolean).length;
      const trimmed = text.substring(0, 15000);
      setDocText(trimmed); setDocName(file.name); setDocWords(words);
      const m = text.match(/WORKBOOK:\s*(\d+)\s*sheets/);
      setDocSheets(m ? parseInt(m[1], 10) : null);
      setDocOk(true);
      callAPI(
        `ATTACHED DOCUMENT: "${file.name}"\n\nContent:\n${trimmed}\n\n---\n\nI just attached "${file.name}". Please acknowledge you received it and tell me what you can see.`,
        `Attached: ${file.name}`,
        history, null, null
      );
    } catch (e) {
      setMsgs(p => [...p, { role: "bot", html: `<strong>Could not read file:</strong> ${e.message}`, raw: "" }]);
    }
  }, [history, callAPI]);

  const handleFile = useCallback((e) => { const f = e.target.files[0]; if (f) processFile(f); e.target.value = ""; }, [processFile]);
  const clearDoc   = useCallback(() => { setDocText(null); setDocName(null); setDocWords(0); setDocSheets(null); setDocOk(false); }, []);
  const restart    = useCallback(() => { setMsgs([{ role: "bot", isWelcome: true }]); setHistory([]); setProgress(5); clearDoc(); setInput(""); }, [clearDoc]);
  const onKey      = useCallback((e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }, [send]);

  const handleDragEnter = useCallback((e) => { e.preventDefault(); dragN.current++; setDrag(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); dragN.current--; if (dragN.current === 0) setDrag(false); }, []);
  const handleDragOver  = useCallback((e) => { e.preventDefault(); }, []);
  const handleDrop      = useCallback((e) => { e.preventDefault(); dragN.current = 0; setDrag(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }, [processFile]);

  return (
    <>
      <Head>
        <title>OKR Coach</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${Tk.cream}; }
        @keyframes dot {
          0%,60%,100% { transform: translateY(0); opacity:.5; }
          30% { transform: translateY(-5px); opacity:1; }
        }
        @keyframes mi {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .mi { animation: mi 0.2s ease both; }
        textarea { resize: none; outline: none; font-family: ${FONT}; }
        button { font-family: ${FONT}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${Tk.lineSoft}; border-radius: 2px; }
      `}</style>

      {/* Page wrapper */}
      <div style={{ minHeight: "100vh", background: Tk.cream, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 0 32px 0" }}>

        {/* Card */}
        <div
          style={{ width: "100%", maxWidth: 720, minHeight: "100vh", background: Tk.paper, display: "flex", flexDirection: "column", position: "relative", borderRadius: 12, border: drag ? `1.5px solid ${Tk.sprout}` : `0.5px solid ${Tk.line}`, overflow: "hidden", transition: "border-color 0.15s" }}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >

          {/* Drag overlay */}
          {drag && (
            <div style={{ position: "absolute", inset: 0, zIndex: 50, background: `${Tk.sproutSoft}cc`, border: `2px dashed ${Tk.sprout}`, borderRadius: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, pointerEvents: "none" }}>
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
          <div style={{ padding: "14px 22px", borderBottom: `0.5px solid ${Tk.line}`, background: Tk.paper, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, position: "relative", zIndex: 2 }}>
            <div style={{ width: 38, height: 38, position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: Tk.sproutSoft }} />
              <div style={{ position: "absolute", top: 3, left: 3 }}>
                <Img k="kale_bunch" w={32} h={32} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 700, fontStyle: "normal", letterSpacing: -0.3, lineHeight: 1, color: Tk.ink }}>OKR Coach</div>
              <div style={{ fontSize: 11, color: Tk.muted, marginTop: 4, fontFamily: FONT }}>Goal-setting strategy support for Farmers, people leaders, and teams</div>
            </div>
            <button style={pillBtn()} onClick={restart}
              onMouseEnter={e => { e.currentTarget.style.background = Tk.sproutSoft; e.currentTarget.style.borderColor = Tk.sprout; }}
              onMouseLeave={e => { e.currentTarget.style.background = Tk.cream; e.currentTarget.style.borderColor = Tk.line; }}>
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
              </svg>
              New conversation
            </button>
          </div>

          {/* Messages area with ambient produce */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 420 }}>

            {/* Scrollable messages */}
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "30px 28px 16px", display: "flex", flexDirection: "column", gap: 24, zIndex: 1 }}>
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
              <div ref={endRef} />
            </div>
          </div>

          {/* Doc attachment bar */}
          {docOk && (
            <div style={{ padding: "8px 22px", background: Tk.sproutSoft, borderTop: `0.5px solid ${Tk.sprout}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, zIndex: 2 }}>
              <Img k="apple_half" w={18} h={18} />
              <span style={{ flex: 1, fontSize: 12, color: Tk.moss, fontFamily: FONT }}>{docName} attached ({docWords.toLocaleString()} words{docSheets ? `, ${docSheets} sheets` : ""})</span>
              <button onClick={clearDoc} style={{ background: "none", border: "none", color: Tk.muted, cursor: "pointer", fontSize: 13, fontFamily: FONT, padding: "2px 6px" }}>Remove</button>
            </div>
          )}

          {/* Composer */}
          <div style={{ padding: 16, borderTop: `0.5px solid ${Tk.line}`, background: Tk.paper, flexShrink: 0, zIndex: 2 }}>
            <div style={{ background: Tk.fieldBg, borderRadius: 18, padding: 14, border: `1px solid ${Tk.line}` }}>
              <textarea
                ref={inputRef} value={input} disabled={loading}
                onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={onKey}
                placeholder="Reply to the coach..."
                rows={1}
                style={{ width: "100%", border: "none", background: "transparent", fontFamily: FONT, fontSize: 14, color: input ? Tk.ink : Tk.mutedSoft, lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.txt" style={{ display: "none" }} onChange={handleFile} />
                  <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: Tk.muted, fontSize: 12, fontFamily: FONT, padding: "4px 8px", borderRadius: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = Tk.lineSoft}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Attach
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: Tk.mutedSoft, fontFamily: FONT }}>↵ to send</span>
                  <button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    style={{ width: 34, height: 34, borderRadius: 11, background: loading || !input.trim() ? Tk.lineSoft : Tk.sprout, border: "none", cursor: loading || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.12s, transform 0.1s" }}
                    onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.background = Tk.moss; }}
                    onMouseLeave={e => { if (!loading && input.trim()) e.currentTarget.style.background = Tk.sprout; }}
                  >
                    <svg viewBox="0 0 24 24" width={17} height={17} fill={Tk.white}>
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
