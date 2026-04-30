import React, { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

const FONT = "'Nunito', 'NeueKabel', sans-serif";

const Tk = {
  cream:"#FBF7E1", paper:"#FFFEF5", fieldBg:"#F4F9EF",
  line:"#E8DFB5", lineSoft:"#F1EBC9",
  ink:"#1A2D14", ink2:"#33422F", muted:"#6F7864", mutedSoft:"#9CA396",
  sprout:"#4CB74A", sproutSoft:"#DEEFCC", moss:"#17713B",
  terracotta:"#E77527", terraSoft:"#FBC5A1",
  white:"#FFFFFF",
};

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

const QUICK_STARTS = [
  { label:"Draft new OKRs",          display:"Draft new OKRs",          img:IMG.apple_whole, msg:"I want to draft new OKRs. Please ask me what you need to get started." },
  { label:"Refine existing",          display:"Refine existing",          img:IMG.kale_leaf,   msg:"I have OKRs already drafted and want help refining them. I will share them with you." },
  { label:"Prep a check-in",          display:"Prep a check-in",          img:IMG.avocado,     msg:"I want to prepare for my monthly OKR check-in with my manager." },
  { label:"Explain OKRs",             display:"Explain OKRs",             img:IMG.pumpkin,     msg:"Can you explain what OKRs are and how to write good ones?" },
  { label:"Help with something else", display:"Help with something else", img:IMG.beet,        msg:"I need help with something related to OKRs that is not listed above. Please ask me what I need." },
];

const SYS = `You are the OKR Coach for Once Upon a Farm (OUF), a warm and knowledgeable internal coaching tool that helps Farmers (employees) and people leaders build, refine, and check in on their OKRs.

IMPORTANT RULES:
- Always call employees "Farmers."
- Never use em dashes in your responses. Use a comma, hyphen, or period instead.
- Never assume or infer the user's name. Do not use any specific name unless the user has introduced themselves in this conversation.
- Users can be anyone at Once Upon a Farm: an individual contributor, a people leader, a new hire, or a senior leader. Do not make assumptions about their role unless they tell you.
- When it matters for coaching, ask: "Are you setting OKRs for yourself, your team, or both?" This is clearer than asking if someone is an IC or manager, since most Farmers are both.

COMPANY CONTEXT - The 2026 Barn (company strategy) has five pillars:
1. Drive Existing Core - disciplined execution, customer productivity, brand/packaging, demand building, channel growth
2. Grow Existing Categories - bar category leadership, protein equity, line extensions, household penetration, DTC/ecommerce
3. Expand into New Categories - new high-impact launches, de-risk before launch, phased go-to-market
4. Scale Organization for Growth - SRM/pricing discipline, Marketing Mix Model, systems upgrades, AI forecasting, org structure
5. Advance PBC and Culture - purpose/passion/profit, social impact, nutritional access, One Company culture, employee engagement

OKR RULES:
- 3-5 Objectives per person or team max; 3-5 Key Results per Objective max.
- Key Results are NOT tasks. Each KR must have three ingredients: (a) a specific deadline date, (b) a clear action verb and deliverable title, (c) a measurable outcome - a number, rate, percentage, or binary milestone.
- Every Objective MUST have 3-5 Key Results. Never draft an Objective with fewer than 3 KRs. If you cannot think of 3 real KRs, the Objective is too narrow - merge it or broaden it.
- Bad KR: "Improve the onboarding process." Good KR: "By 8/1, launch refreshed intern onboarding guide achieving 90% completion rate within first week."
- Bad KR: "Work on coaching program." Good KR: "By 6/30, select and contract coaching platform after evaluating at least 3 vendors."
- OKRs are not job duties or daily tasks. They are purposeful projects that drive meaningful change, improvement, and growth.
- OKRs should be aspirational: 70% achievement is considered a success. Encourage stretch.
- Scoring: 0.7-1.0 = green (success), 0.4-0.6 = yellow (partial), 0.0-0.3 = red (missed)
- OKRs should ladder up to a Barn pillar OR be clearly labeled as a personal development goal. Both are valid.
- OKR cadence at OUF is H1 (January to June) and H2 (July to December). Monthly check-ins with manager.
- Cascade: roughly 50% of OKRs should cascade from team strategy, 50% can ladder up from the front line.

WHEN EXPLAINING OKRS: Use this exact framing and language (adapt tone slightly but keep the substance):

"OKRs have two parts:

1. Objective (O): A clear, inspiring goal. It answers the question, 'What do we want to achieve?' It should be ambitious and align with one of the five Barn pillars or a personal development goal. Think of the O as our destination.

2. Key Results (KRs): Measurable outcomes that define success. Each KR answers, 'How will we know we've achieved the Objective?' They should include:
- A deadline date
- A specific action verb and deliverable
- A measurable outcome (a number, rate, percentage, or binary milestone)

Think of the KRs as the steps we need to take to reach our destination."

HANDLING MULTI-SHEET STRATEGY FILES:
When a Farmer uploads a file containing multiple sheets, always read the sheet labels carefully:
- Sheets labeled [TEAM/DEPT STRATEGY] contain a team or department's 1-3 year strategic plan. This is the "Barn" for that team. Use it as the strategic anchor when coaching.
- Sheets labeled [TEAM OKRs] contain OKRs set at the team or department level.
- Sheets labeled [INDIVIDUAL OKRs] contain a specific Farmer's personal OKRs.

When a file has multiple individual OKR sheets (more than one Farmer's tab), ALWAYS ask: "This file has OKR sheets for [list the names]. Which tab would you like me to focus on, or would you like me to review all of them?"

When the user asks about team strategy or how to connect OKRs to strategy:
1. First summarize what you see in the [TEAM/DEPT STRATEGY] sheet - the pillars, key initiatives, and 1-3 year goals.
2. Then help the Farmer understand how their individual or team OKRs ladder up to that strategy.
3. If the file has BOTH strategy sheets AND individual OKR sheets, ask the Farmer which they want help with before diving in - do not assume.

OKR TEMPLATE STRUCTURE - Once Upon a Farm uses a specific Excel template. When reading it, understand:
- "OKR #1", "OKR #2" etc. are section headers, not content
- "Objective" row contains the Objective title
- "Key Result 1" through "Key Result 5" rows contain KR text. Empty KR rows (no text, or only "Not Started") mean that KR slot was not used - do NOT count these as missing KRs or flag them
- "Progress" column contains In Progress / Not Started / Complete status
- The template does NOT have a dedicated Barn pillar field. Do NOT flag missing Barn pillar alignment as a weakness in review. Instead, if you notice a natural connection to a pillar, mention it as a positive observation, not a gap.

COACHING STYLE:
- Be warm, direct, and encouraging. Use plain language. No corporate jargon.
- When reviewing OKRs, identify what is strong first, then what needs sharpening.
- Help users connect their work to a Barn pillar. If it does not connect, help them name it as a personal development goal.
- Push back gently when someone submits tasks as OKRs.
- Offer to generate an Excel template when the user seems ready to finalize their OKRs.
- When doing a review, structure your reply with: "Here is my read on your draft." followed by "What is strong:" and "What to sharpen:" sections.
- After completing a coaching task, always offer a warm closing. Ask "Is there anything else I can help you grow today?" If the Farmer says no, close warmly. Examples (vary these):
  - "Happy farming. Here's to a strong harvest this half."
  - "Go grow something great. The Barn is rooting for you."
  - "Best of luck out in the field. You've got this."
  - "Wishing you a great season. Now go make it count."

CRITICAL - EXCEL OUTPUT FORMAT: When asked to generate an Excel template or OKR file, output the data in this EXACT numbered list format. Do NOT use a markdown table. Do NOT describe or link to a file. Use ONLY this format:

#### 2H 2026 OKRs

OBJECTIVE 1: [Objective title]
KR1: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]
KR2: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]
KR3: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]
KR4: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]

OBJECTIVE 2: [Objective title]
KR1: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]
KR2: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]
KR3: [MM/DD - ACTION: Specific deliverable, achieving measurable outcome]

Every Objective MUST have at least 3 KRs. Never output fewer than 3 KRs per Objective. Each KR must have a date, an action verb, a deliverable, and a measurable outcome. Do not add any explanation before or after the list.`;

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

function parseReview(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (!lower.includes("what is strong") && !lower.includes("what's strong") && !lower.includes("what to sharpen")) return null;
  const introMatch  = raw.match(/^([\s\S]*?)(?=\*\*What(?:'s| is) strong|\*\*What to sharpen)/i);
  const strongMatch = raw.match(/\*\*What(?:'s| is) strong[:\*]*\*?\*?([\s\S]*?)(?=\*\*What to sharpen|\*\*Suggested|$)/i);
  const sharpenMatch= raw.match(/\*\*What to sharpen[:\*]*\*?\*?([\s\S]*?)(?=\*\*Suggested|$)/i);
  const rewriteMatch= raw.match(/\*\*Suggested rewrites?[:\*]*\*?\*?([\s\S]*?)$/i);
  if (!strongMatch && !sharpenMatch) return null;
  return {
    intro:   introMatch  ? introMatch[1].trim()  : "",
    strong:  strongMatch ? strongMatch[1].trim()  : "",
    sharpen: sharpenMatch? sharpenMatch[1].trim() : "",
    rewrite: rewriteMatch? rewriteMatch[1].trim() : "",
  };
}

async function extractPDF(file) {
  if (typeof pdfjsLib==="undefined") throw new Error("PDF.js unavailable");
  const ab=await file.arrayBuffer(), pdf=await pdfjsLib.getDocument({data:ab}).promise;
  let text="";
  for (let i=1;i<=Math.min(pdf.numPages,15);i++) {
    const page=await pdf.getPage(i), content=await page.getTextContent();
    text+=content.items.map(s=>s.str).join(" ")+"\n";
  }
  return text.trim();
}
async function extractDOCX(file) {
  if (typeof mammoth==="undefined") throw new Error("Mammoth unavailable");
  const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  return result.value.trim();
}
async function extractXLSX(file) {
  if (typeof XLSX==="undefined") {
    // Try waiting briefly for the CDN script to load
    await new Promise(r=>setTimeout(r,1500));
    if (typeof XLSX==="undefined") throw new Error("Excel reader not loaded yet. Please wait a moment and try again.");
  }
  const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});
  const sheetCount=wb.SheetNames.length;
  // Per-sheet budget: 40k total chars split evenly, min 2500 per sheet
  const budget=Math.max(2500,Math.floor(40000/sheetCount));
  let t=`WORKBOOK: ${sheetCount} sheets\n`;
  wb.SheetNames.forEach(n=>{
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:""});
    const s=rows
      .filter(r=>r.some(c=>String(c).trim()))
      // Skip empty KR rows: Key Result N with only "Not Started" and no actual text
      .filter(r=>{
        const first=String(r[0]||"").trim();
        const rest=r.slice(1).map(c=>String(c).trim()).filter(Boolean);
        if (/^Key Result \d+$/.test(first) && (rest.length===0||(rest.length===1&&rest[0]==="Not Started"))) return false;
        return true;
      })
      .map(r=>r.map(c=>String(c)).filter(c=>c.trim()).join(" | ")).join("\n");
    if (!s.trim()) return;
    const nl=n.toLowerCase();
    const isStrategy=nl.includes("strategy")||nl.includes("barn")||nl.includes("strategic")||nl.includes("farm")||nl.includes("pillar")||nl.includes("2026-2028")||nl.includes("2025-2027");
    const isTeamOKR=nl.includes("team")||nl.includes("p&c")||nl.includes("dept")||nl.includes("department");
    const isPersonal=/\b(h1|h2|1h|2h)\s*20\d\d\b/i.test(n)||nl.includes("individual");
    const label=isStrategy?"[TEAM/DEPT STRATEGY - 1-3 year plan]":isTeamOKR?"[TEAM OKRs]":isPersonal?"[INDIVIDUAL OKRs]":"[DATA]";
    const out=s.length>budget?s.substring(0,budget)+"\n[...sheet truncated]":s;
    t+=`\n--- Sheet: ${n} ${label} ---\n${out}`;
  });
  return t.trim();
}
async function parseFile(file) {
  const ext=file.name.split(".").pop().toLowerCase();
  if (ext==="pdf") return extractPDF(file);
  if (ext==="docx"||ext==="doc") return extractDOCX(file);
  if (ext==="xlsx"||ext==="xls") return extractXLSX(file);
  if (ext==="csv"||ext==="txt") return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=()=>rej(new Error("Read failed"));r.readAsText(file);});
  throw new Error("Unsupported file type. Try PDF, Word, Excel, CSV, or .txt");
}

function Img({k,w=18,h=18,style={}}) { return <img src={IMG[k]} alt="" style={{width:w,height:h,objectFit:"contain",...style}}/>; }
function Dots() { return <div style={{display:"flex",gap:5,alignItems:"center",padding:"4px 2px"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:Tk.sprout,opacity:.5,animation:`dot 1.2s infinite ${i*.2}s`}}/>)}</div>; }
function BotMark() { return <div style={{width:28,height:28,borderRadius:"50%",background:Tk.sproutSoft,display:"grid",placeItems:"center",flexShrink:0,overflow:"hidden"}}><Img k="kale_bunch" w={24} h={24}/></div>; }
function pillBtn(x={}) { return {display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:20,border:`0.5px solid ${Tk.line}`,background:Tk.cream,fontFamily:FONT,fontSize:12,color:Tk.ink2,cursor:"pointer",whiteSpace:"nowrap",...x}; }
function chipBtn(x={}) { return {display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:20,border:`0.5px solid ${Tk.line}`,background:Tk.paper,fontFamily:FONT,fontSize:13,color:Tk.ink,cursor:"pointer",...x}; }

function hasExcelTemplate(raw) {
  if (!raw) return false;
  const lines = raw.split("\n").map(l=>l.trim());
  const hasObj = lines.some(l=>/^OBJECTIVE\s*\d*:/i.test(l));
  const krCount = lines.filter(l=>/^KR\s*\d+[:\-]/i.test(l)).length;
  if (hasObj && krCount >= 3) return true;
  const dataRows = lines.filter(l=>l.startsWith("|")&&!(/^\|[\s\-:|]+\|/.test(l)));
  const lower = raw.toLowerCase();
  return dataRows.length>=3 && (lines.some(l=>/^#{1,4}\s/.test(l))||lower.includes("excel")||lower.includes("okr"));
}

function ExcelDownloadButton({raw}) {
  const [done,setDone]=React.useState(false);
  const [loading,setLoading]=React.useState(false);
  const download=async()=>{
    setLoading(true);
    try {
      const pm=raw.match(/\b(1H|2H)\s*(20\d\d)\b/i);
      const period=pm?`${pm[1].toUpperCase()} ${pm[2]}`:"OKRs";
      const nm=raw.match(/(?:for|employee:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      const employee=nm?nm[1]:"";
      const resp=await fetch("/api/generate-excel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({raw,period,employee,department:""})});
      if (!resp.ok){const e=await resp.json().catch(()=>({}));alert(e.error||"Failed to generate Excel.");return;}
      const blob=await resp.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download=`${period.replace(/\s+/g,"_")}_OKRs.xlsx`;a.click();URL.revokeObjectURL(url);
      setDone(true);
    } catch(e){alert("Error: "+e.message);}
    finally{setLoading(false);}
  };
  return <button onClick={download} style={{marginTop:14,display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:20,background:done?Tk.sproutSoft:Tk.sprout,border:`1px solid ${done?Tk.sprout:Tk.moss}`,color:done?Tk.moss:Tk.white,fontFamily:FONT,fontSize:13,fontWeight:700,cursor:loading?"default":"pointer",transition:"all 0.15s"}}>
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    {loading?"Generating...":done?"Downloaded!":"Download Excel file"}
  </button>;
}

function ReviewBlock({kind,title,rawContent}) {
  const accent=kind==="strong"?Tk.sprout:Tk.terracotta,bg=kind==="strong"?Tk.sproutSoft:Tk.terraSoft,imgKey=kind==="strong"?"kale_leaf":"apple_whole";
  return <div style={{background:Tk.paper,border:`0.5px solid ${Tk.line}`,borderRadius:14,padding:"14px 16px",marginBottom:10,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",right:-14,bottom:-16,width:76,opacity:.14,transform:kind==="strong"?"rotate(8deg)":"rotate(-8deg)",pointerEvents:"none"}}><Img k={imgKey} w={76} h={76}/></div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,position:"relative",zIndex:1}}>
      <div style={{width:22,height:22,borderRadius:7,background:bg,color:accent,display:"grid",placeItems:"center",fontSize:13}}>{kind==="strong"?"✓":"↑"}</div>
      <div style={{fontFamily:FONT,fontSize:12,color:Tk.ink,textTransform:"uppercase",letterSpacing:.8,fontWeight:700}}>{title}</div>
    </div>
    <div style={{fontSize:13,color:Tk.ink2,lineHeight:1.6,position:"relative",zIndex:1}} dangerouslySetInnerHTML={{__html:md(rawContent||"")}}/>
  </div>;
}

function CoachMsg({html:htmlContent,raw,isTyping,chips,onChip}) {
  const review=raw?parseReview(raw):null,isRev=review!==null;
  let headline="",subtitle="";
  if (isRev&&review.intro){const lines=review.intro.split(/\n|<br\/>/).map(l=>l.replace(/<[^>]+>/g,"").trim()).filter(Boolean);headline=lines[0]||"";subtitle=lines.slice(1).join(" ");}
  return <div style={{maxWidth:580}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
      <BotMark/><div style={{fontSize:10.5,color:Tk.muted,textTransform:"uppercase",letterSpacing:1.6,fontFamily:FONT}}>{isRev?"Coach · Review":"Coach"}</div>
    </div>
    {isTyping?<Dots/>:isRev?<div>
      {headline&&<div style={{marginBottom:subtitle?4:14}}><div style={{fontFamily:FONT,fontSize:20,color:Tk.ink,lineHeight:1.2}}>{headline}</div>{subtitle&&<div style={{fontSize:13,color:Tk.ink2,marginTop:4}}>{subtitle}</div>}</div>}
      {review.strong&&<ReviewBlock kind="strong" title="What's strong" rawContent={review.strong}/>}
      {review.sharpen&&<ReviewBlock kind="sharpen" title="What to sharpen" rawContent={review.sharpen}/>}
      {review.rewrite&&<ReviewBlock kind="rewrite" title="Suggested rewrites" rawContent={review.rewrite}/>}
    </div>:<div style={{background:Tk.paper,border:`0.5px solid ${Tk.line}`,borderRadius:"4px 18px 18px 18px",padding:"14px 18px",fontSize:14,lineHeight:1.7,color:Tk.ink2}} dangerouslySetInnerHTML={{__html:htmlContent||""}}/>}
    {hasExcelTemplate(raw)&&!isTyping&&<ExcelDownloadButton raw={raw}/>}
    {chips&&chips.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>{chips.map(({label,msg})=><button key={label} style={chipBtn()} onClick={()=>onChip(msg,label)} onMouseEnter={e=>{e.currentTarget.style.background=Tk.sproutSoft;e.currentTarget.style.borderColor=Tk.sprout;}} onMouseLeave={e=>{e.currentTarget.style.background=Tk.paper;e.currentTarget.style.borderColor=Tk.line;}}>{label}</button>)}</div>}
  </div>;
}

function UserMsg({text,docWords,sheets}) {
  const isDoc=text?.startsWith("Attached: ");
  if (isDoc){const fn=text.replace("Attached: ",""),meta=[sheets?`${sheets} sheet${sheets!==1?"s":""}`:"",docWords?`${docWords.toLocaleString()} words`:""].filter(Boolean).join(" · ");
    return <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{background:Tk.paper,border:`0.5px solid ${Tk.line}`,borderRadius:"18px 4px 18px 18px",padding:"12px 16px",maxWidth:320,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:36,height:36,borderRadius:10,background:Tk.sproutSoft,display:"grid",placeItems:"center",flexShrink:0}}><Img k="apple_half" w={26} h={26}/></div>
      <div><div style={{fontFamily:FONT,fontSize:13,color:Tk.ink,fontWeight:700}}>{fn}</div>{meta&&<div style={{fontSize:11,color:Tk.muted,marginTop:2}}>{meta}</div>}</div>
    </div></div>;}
  return <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{background:Tk.moss,color:Tk.white,borderRadius:"18px 4px 18px 18px",padding:"10px 16px",maxWidth:460,fontSize:14,lineHeight:1.6}}>{text}</div></div>;
}

function Welcome({onAction}) {
  return <div style={{maxWidth:560,paddingBottom:8}}>
    <div style={{fontSize:10.5,color:Tk.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1.6,fontWeight:800,fontFamily:FONT}}>Coach</div>
    <div style={{fontFamily:FONT,fontWeight:700,fontStyle:"normal",color:Tk.ink,lineHeight:1.1,marginBottom:14}}>
      <span style={{fontSize:32,display:"block"}}>Hi there, Farmer.</span>
      <span style={{fontSize:32,display:"block"}}>
        <span style={{color:Tk.sprout,position:"relative",display:"inline-block"}}>
          How can I help you grow
          <svg viewBox="0 0 220 9" preserveAspectRatio="none" style={{position:"absolute",left:0,bottom:-6,width:"100%",height:8}}>
            <path d="M2 6 Q 55 2, 110 5 T 218 4" stroke={Tk.sprout} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
        </span>{" "}<span style={{color:Tk.ink}}>today?</span>
      </span>
    </div>
    <div style={{fontSize:14,lineHeight:1.7,color:Tk.ink2,margin:"16px 0 18px"}}>
      {"I'm your goal-setting coach. I can "}<b style={{color:Tk.moss}}>draft</b>{", "}<b style={{color:Tk.moss}}>refine</b>{", "}<b style={{color:Tk.moss}}>review</b>{", or "}<b style={{color:Tk.moss}}>check in</b>{" on your OKRs. Attach a doc and I'll read it."}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {QUICK_STARTS.map(({label,display,img,msg})=><button key={label} style={chipBtn()} onClick={()=>onAction(msg,display)}
        onMouseEnter={e=>{e.currentTarget.style.background=Tk.sproutSoft;e.currentTarget.style.borderColor=Tk.sprout;}}
        onMouseLeave={e=>{e.currentTarget.style.background=Tk.paper;e.currentTarget.style.borderColor=Tk.line;}}>
        {img&&<img src={img} alt="" style={{width:18,height:18,objectFit:"contain"}} onError={e=>{e.currentTarget.style.display="none";}}/>}{display}
      </button>)}
    </div>
  </div>;
}

export default function OKRCoach() {
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [docText,setDocText]=useState(null),[docName,setDocName]=useState(null),[docWords,setDocWords]=useState(0);
  const [docSheets,setDocSheets]=useState(null),[docOk,setDocOk]=useState(false);
  const [history,setHistory]=useState([]),[progress,setProgress]=useState(5),[drag,setDrag]=useState(false);
  const endRef=useRef(null),inputRef=useRef(null),fileRef=useRef(null),dragN=useRef(0);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  useEffect(()=>{setMsgs([{role:"bot",isWelcome:true}]);},[]);

  const callAPI=useCallback(async(userText,display,hist,doc,docN)=>{
    setLoading(true);setMsgs(p=>[...p,{role:"user",text:display},{role:"bot",typing:true}]);
    let content=userText;
    if (doc) content=`ATTACHED DOCUMENT: "${docN}"\n\nFull content:\n${doc}\n\n---\n\nUser message: ${userText}`;
    const newH=[...hist,{role:"user",content}];
    try{
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:newH,system:SYS})});
      const data=await r.json();
      if (!r.ok) throw new Error(data.error||`Error ${r.status}`);
      const reply=data.content?.find(b=>b.type==="text")?.text||"";
      const h2=[...newH,{role:"assistant",content:reply}];
      setHistory(h2.length>30?h2.slice(-28):h2);setProgress(p=>Math.min(p+10,90));
      setMsgs(p=>[...p.filter(m=>!m.typing),{role:"bot",html:md(reply),raw:reply}]);
    }catch(e){setMsgs(p=>[...p.filter(m=>!m.typing),{role:"bot",html:`<strong>Error:</strong> ${e.message}`,raw:""}]);}
    finally{setLoading(false);setTimeout(()=>inputRef.current?.focus(),50);}
  },[]);

  const send=useCallback(()=>{const t=input.trim();if(!t||loading)return;setInput("");callAPI(t,t,history,docText,docName);},[input,loading,history,docText,docName,callAPI]);
  const onChip=useCallback((msg,label)=>callAPI(msg,label,history,docText,docName),[history,docText,docName,callAPI]);

  const processFile=useCallback(async(file)=>{
    setDocOk(false);setDrag(false);
    try{
      const text=await parseFile(file);if(!text||text.length<20)throw new Error("Document appears empty.");
      const words=text.split(/\s+/).filter(Boolean).length,trimmed=text.substring(0,40000);
      setDocText(trimmed);setDocName(file.name);setDocWords(words);
      const m=text.match(/WORKBOOK:\s*(\d+)\s*sheets/);setDocSheets(m?parseInt(m[1],10):null);setDocOk(true);
      callAPI(`ATTACHED DOCUMENT: "${file.name}"\n\nContent:\n${trimmed}\n\n---\n\nI just attached "${file.name}". Please acknowledge and tell me what you can see.`,`Attached: ${file.name}`,history,null,null);
    }catch(e){setMsgs(p=>[...p,{role:"bot",html:`<strong>Could not read file:</strong> ${e.message}`,raw:""}]);}
  },[history,callAPI]);

  const handleFile=useCallback(e=>{const f=e.target.files[0];if(f)processFile(f);e.target.value="";},[processFile]);
  const clearDoc=useCallback(()=>{setDocText(null);setDocName(null);setDocWords(0);setDocSheets(null);setDocOk(false);},[]);
  const restart=useCallback(()=>{setMsgs([{role:"bot",isWelcome:true}]);setHistory([]);setProgress(5);clearDoc();setInput("");},[clearDoc]);
  const onKey=useCallback(e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}},[send]);
  const handleDragEnter=useCallback(e=>{e.preventDefault();dragN.current++;setDrag(true);},[]);
  const handleDragLeave=useCallback(e=>{e.preventDefault();dragN.current--;if(dragN.current===0)setDrag(false);},[]);
  const handleDragOver=useCallback(e=>{e.preventDefault();},[]);
  const handleDrop=useCallback(e=>{e.preventDefault();dragN.current=0;setDrag(false);const f=e.dataTransfer.files[0];if(f)processFile(f);},[processFile]);

  return <>
    <Head>
      <title>OKR Coach</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"/>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"/>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"/>
    </Head>
    <style>{`*,*::before,*::after{box-sizing:border-box;font-style:normal;}body{margin:0;background:${Tk.cream};}@keyframes dot{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-5px);opacity:1;}}@keyframes mi{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}.mi{animation:mi 0.2s ease both;}textarea{resize:none;outline:none;font-family:${FONT};}button{font-family:${FONT};}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${Tk.lineSoft};border-radius:2px;}`}</style>
    <div style={{minHeight:"100vh",background:Tk.cream,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"0 0 32px 0"}}>
      <div style={{width:"100%",maxWidth:720,minHeight:"100vh",background:Tk.paper,display:"flex",flexDirection:"column",position:"relative",borderRadius:12,border:drag?`1.5px solid ${Tk.sprout}`:`0.5px solid ${Tk.line}`,overflow:"hidden",transition:"border-color 0.15s"}}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
        {drag&&<div style={{position:"absolute",inset:0,zIndex:50,background:`${Tk.sproutSoft}cc`,border:`2px dashed ${Tk.sprout}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,pointerEvents:"none"}}>
          <Img k="apple_half" w={48} h={48}/><div style={{fontFamily:FONT,fontSize:16,color:Tk.moss}}>Drop your document here</div><div style={{fontSize:12,color:Tk.muted}}>PDF, Word, Excel, or plain text</div>
        </div>}
        <div style={{height:3,background:Tk.lineSoft,flexShrink:0}}><div style={{height:"100%",width:`${progress}%`,background:Tk.sprout,transition:"width 0.4s ease"}}/></div>
        <div style={{padding:"14px 22px",borderBottom:`0.5px solid ${Tk.line}`,background:Tk.paper,display:"flex",alignItems:"center",gap:12,flexShrink:0,position:"relative",zIndex:2}}>
          <div style={{width:38,height:38,position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",background:Tk.sproutSoft}}/>
            <div style={{position:"absolute",top:3,left:3}}><Img k="kale_bunch" w={32} h={32}/></div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:FONT,fontSize:19,fontWeight:700,fontStyle:"normal",letterSpacing:-0.3,lineHeight:1,color:Tk.ink}}>OKR Coach</div>
            <div style={{fontSize:11,color:Tk.muted,marginTop:4,fontFamily:FONT}}>Goal-setting strategy support for Farmers, people leaders, and teams</div>
          </div>
          <button style={pillBtn()} onClick={restart}
            onMouseEnter={e=>{e.currentTarget.style.background=Tk.sproutSoft;e.currentTarget.style.borderColor=Tk.sprout;}}
            onMouseLeave={e=>{e.currentTarget.style.background=Tk.cream;e.currentTarget.style.borderColor=Tk.line;}}>
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            New conversation
          </button>
        </div>
        <div style={{flex:1,position:"relative",overflow:"hidden",minHeight:420}}>
          <div style={{position:"absolute",inset:0,overflowY:"auto",padding:"30px 28px 16px",display:"flex",flexDirection:"column",gap:24,zIndex:1}}>
            {msgs.map((m,i)=><div key={i} className="mi">
              {m.role==="user"?<UserMsg text={m.text} docWords={docWords} sheets={docSheets}/>:m.isWelcome?<Welcome onAction={onChip}/>:<CoachMsg html={m.html} raw={m.raw} isTyping={m.typing} chips={m.chips} onChip={onChip}/>}
            </div>)}
            <div ref={endRef}/>
          </div>
        </div>
        {docOk&&<div style={{padding:"8px 22px",background:Tk.sproutSoft,borderTop:`0.5px solid ${Tk.sprout}`,display:"flex",alignItems:"center",gap:10,flexShrink:0,zIndex:2}}>
          <Img k="apple_half" w={18} h={18}/>
          <span style={{flex:1,fontSize:12,color:Tk.moss,fontFamily:FONT}}>{docName} attached ({docWords.toLocaleString()} words{docSheets?`, ${docSheets} sheets`:""})</span>
          <button onClick={clearDoc} style={{background:"none",border:"none",color:Tk.muted,cursor:"pointer",fontSize:13,fontFamily:FONT,padding:"2px 6px"}}>Remove</button>
        </div>}
        <div style={{padding:16,borderTop:`0.5px solid ${Tk.line}`,background:Tk.paper,flexShrink:0,zIndex:2}}>
          <div style={{background:Tk.fieldBg,borderRadius:18,padding:14,border:`1px solid ${Tk.line}`}}>
            <textarea ref={inputRef} value={input} disabled={loading}
              onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
              onKeyDown={onKey} placeholder="Reply to the coach..." rows={1}
              style={{width:"100%",border:"none",background:"transparent",fontFamily:FONT,fontSize:14,color:input?Tk.ink:Tk.mutedSoft,lineHeight:1.5}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt" style={{display:"none"}} onChange={handleFile}/>
                <button onClick={()=>fileRef.current?.click()} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:Tk.muted,fontSize:12,fontFamily:FONT,padding:"4px 8px",borderRadius:8}}
                  onMouseEnter={e=>e.currentTarget.style.background=Tk.lineSoft}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  Attach
                </button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:Tk.mutedSoft,fontFamily:FONT}}>↵ to send</span>
                <button onClick={send} disabled={loading||!input.trim()}
                  style={{width:34,height:34,borderRadius:11,background:loading||!input.trim()?Tk.lineSoft:Tk.sprout,border:"none",cursor:loading||!input.trim()?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.12s"}}
                  onMouseEnter={e=>{if(!loading&&input.trim())e.currentTarget.style.background=Tk.moss;}}
                  onMouseLeave={e=>{if(!loading&&input.trim())e.currentTarget.style.background=Tk.sprout;}}>
                  <svg viewBox="0 0 24 24" width={17} height={17} fill={Tk.white}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>;
}
