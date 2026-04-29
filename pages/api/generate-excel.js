import ExcelJS from "exceljs";

const TEAL  = "FF00AE7C";
const GRAY  = "FFD8D8D8";
const LBLUE = "FFDDEBF7";
const CREAM = "FFFFFDF0";

// Parse the numbered list format:
// OBJECTIVE 1: Title
// KR1: text
// KR2: text
function parseOKRs(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const okrs = [];
  let cur = null;

  for (const line of lines) {
    // Match "OBJECTIVE N: Title" or "OBJECTIVE: Title"
    const objMatch = line.match(/^OBJECTIVE\s*\d*:\s*(.+)/i);
    if (objMatch) {
      cur = { title: objMatch[1].replace(/\*\*/g,"").trim(), krs: [] };
      okrs.push(cur);
      continue;
    }
    // Match "KR1:", "KR 1:", "KR1 -", etc.
    const krMatch = line.match(/^KR\s*\d+[:\-\s]+(.+)/i);
    if (krMatch && cur) {
      const text = krMatch[1].replace(/\*\*/g,"").trim();
      if (text) cur.krs.push({ text, progress: "Not Started" });
      continue;
    }
  }

  // Fallback: also try pipe table format in case model uses that
  if (okrs.length === 0) {
    const tableLines = lines.filter(l => l.startsWith("|") && !/^\|[\s\-:|]+\|/.test(l));
    if (tableLines.length > 1) {
      const rows = tableLines.slice(1).map(l =>
        l.replace(/^\||\|$/g,"").split("|").map(c => c.replace(/\*\*/g,"").trim())
      );
      for (const [obj, kr, prog] of rows) {
        if (obj) { cur = { title: obj, krs: [] }; okrs.push(cur); }
        if (kr && cur) cur.krs.push({ text: kr, progress: prog || "Not Started" });
      }
    }
  }

  return okrs;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { raw, period, employee, department } = req.body;
  const okrs = parseOKRs(raw);
  if (!okrs.length) return res.status(400).json({ error: "No OKR data found in response." });

  const wb = new ExcelJS.Workbook();
  const sheetTitle = (period || "OKRs").replace(/\s*OKRs?\s*$/i,"").trim() + " OKRs";
  const ws = wb.addWorksheet(sheetTitle);

  ws.columns = [
    { key:"a", width:4  },
    { key:"b", width:18 },
    { key:"c", width:70 },
    { key:"d", width:18 },
    { key:"e", width:22 },
  ];

  const mkFill  = argb => ({ type:"pattern", pattern:"solid", fgColor:{ argb } });
  const mkFont  = (bold, argb="FF000000", sz=11) => ({ bold, color:{ argb }, size:sz, name:"Arial" });
  const mkAlign = (wrap=true) => ({ wrapText:wrap, vertical:"middle" });

  // Header block
  const addHeader = (row, text, merge=true) => {
    const r = ws.addRow([text,"","","",""]);
    r.height = 26;
    if (merge) ws.mergeCells(r.number,1,r.number,5);
    r.getCell(1).fill  = mkFill(CREAM);
    r.getCell(1).font  = mkFont(row===1, "FF1A2D14", row===1 ? 13 : 11);
    r.getCell(1).alignment = mkAlign();
    return r;
  };

  addHeader(1, "Once Upon a Farm");
  addHeader(2, sheetTitle);
  addHeader(3, `Department Objective(s): ${department||""}`);
  addHeader(4, `Employee: ${employee||""}`);
  ws.addRow([]); // blank row 5

  // OKR blocks
  okrs.forEach((okr, idx) => {
    // OKR # header
    const hRow = ws.addRow(["", `OKR #${idx+1}`, "", "Progress", "Self-Assessment"]);
    hRow.height = 28;
    ws.mergeCells(hRow.number, 2, hRow.number, 3);
    [1,2,3,4,5].forEach(c => {
      const cell = hRow.getCell(c);
      cell.fill = mkFill(TEAL);
      cell.font = mkFont(true,"FFFFFFFF");
      cell.alignment = mkAlign(false);
    });

    // Objective row
    const objRow = ws.addRow(["","Objective", okr.title,"",""]);
    objRow.height = 28;
    ws.mergeCells(objRow.number, 3, objRow.number, 5);
    [1,2,3].forEach(c => {
      const cell = objRow.getCell(c);
      cell.fill = mkFill(GRAY);
      cell.font = mkFont(true);
      cell.alignment = mkAlign();
    });

    // Always 5 KR rows
    for (let k=0; k<5; k++) {
      const kr = okr.krs[k];
      const krRow = ws.addRow(["", `Key Result ${k+1}`, kr?.text||"", kr?.progress||"",""]);
      krRow.height = kr?.text ? 38 : 20;
      krRow.getCell(2).font = mkFont(false);
      krRow.getCell(3).alignment = mkAlign();
      const prog = krRow.getCell(4);
      prog.fill = mkFill(LBLUE);
      prog.alignment = mkAlign(false);
      prog.dataValidation = {
        type:"list", allowBlank:true,
        formulae:['"Not Started,In Progress,Complete"'],
      };
    }
    ws.addRow([]); // blank between OKRs
  });

  res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition",`attachment; filename="${sheetTitle.replace(/\s+/g,"_")}.xlsx"`);
  res.send(await wb.xlsx.writeBuffer());
}
