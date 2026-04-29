import ExcelJS from "exceljs";

// Colors matching reference file
const TEAL   = "FF00AE7C";
const GRAY   = "FFD8D8D8";
const LBLUE  = "FFDDEBF7";
const CREAM  = "FFFFFDF0";
const GREEN  = "FF4CB74A";

function style(fill, bold=false, color="FF000000", size=11) {
  return {
    fill: { type:"pattern", pattern:"solid", fgColor:{ argb: fill } },
    font: { bold, color:{ argb: color }, size, name:"Arial" },
    alignment: { wrapText:true, vertical:"middle" },
  };
}

function parseOKRs(raw) {
  const lines = raw.split("\n");
  const dataRows = lines
    .filter(l => l.trim().startsWith("|"))
    .filter(l => !/^\|[\s\-:|]+\|/.test(l.trim()))
    .map(l => l.replace(/^\||\|$/g,"").split("|").map(c => c.trim().replace(/\*\*/g,"")));

  if (dataRows.length < 2) return [];
  const rows = dataRows.slice(1); // skip header row

  const okrs = [];
  let cur = null;
  for (const [obj, kr, metric, deadline, progress] of rows) {
    if (obj) { cur = { title: obj, krs: [] }; okrs.push(cur); }
    if (kr && cur) cur.krs.push({ text: kr, metric: metric||"", deadline: deadline||"", progress: progress||"Not Started" });
  }
  return okrs;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { raw, period, employee, department } = req.body;
  const okrs = parseOKRs(raw);
  if (!okrs.length) return res.status(400).json({ error: "No OKR table data found in response." });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(period || "OKRs");

  // Column widths matching reference
  ws.columns = [
    { key:"a", width:4  },
    { key:"b", width:18 },
    { key:"c", width:65 },
    { key:"d", width:18 },
    { key:"e", width:18 },
  ];

  const addRow = (vals, styles) => {
    const r = ws.addRow(vals);
    r.height = 28;
    styles.forEach((s, i) => { if (s && r.getCell(i+1)) Object.assign(r.getCell(i+1), s); });
    return r;
  };

  // Header block
  addRow(["Once Upon a Farm","","","",""], [style(CREAM,true,"FF1A2D14",13),null,null,null,null]);
  addRow([period||"OKRs","","","",""],     [style(CREAM,false,"FF1A2D14"),null,null,null,null]);
  addRow([`Department Objective(s): ${department||""}`,"","","",""], [style(CREAM),null,null,null,null]);
  addRow([`Employee: ${employee||""}`,"","","",""], [style(CREAM),null,null,null,null]);
  addRow([],[]); // blank

  // Merge header cols A-E for rows 1-4
  for (let r = 1; r <= 4; r++) ws.mergeCells(r,1,r,5);

  okrs.forEach((okr, idx) => {
    // OKR # header row
    const hRow = ws.addRow(["", `OKR #${idx+1}`, "", "Progress", "Self-Assessment"]);
    hRow.height = 28;
    [2,3,4,5].forEach(c => {
      const cell = hRow.getCell(c);
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: TEAL } };
      cell.font = { bold:true, color:{ argb:"FFFFFFFF" }, name:"Arial" };
      cell.alignment = { vertical:"middle" };
    });
    ws.mergeCells(hRow.number, 2, hRow.number, 3);

    // Objective row
    const objRow = ws.addRow(["", "Objective", okr.title, "", ""]);
    objRow.height = 28;
    [1,2,3,4,5].forEach(c => {
      const cell = objRow.getCell(c);
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: GRAY } };
      cell.font = { bold:true, name:"Arial" };
      cell.alignment = { wrapText:true, vertical:"middle" };
    });

    // Key Results (up to 5 rows)
    for (let k = 0; k < 5; k++) {
      const kr = okr.krs[k];
      const krRow = ws.addRow(["", `Key Result ${k+1}`, kr?.text||"", kr?.progress||"", ""]);
      krRow.height = kr?.text ? 40 : 20;
      const progCell = krRow.getCell(4);
      progCell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: LBLUE } };
      progCell.alignment = { vertical:"middle" };
      krRow.getCell(3).alignment = { wrapText:true, vertical:"middle" };
    }

    ws.addRow([]); // blank between OKRs
  });

  // Add dropdown for progress column
  for (let r = 6; r <= ws.lastRow.number; r++) {
    ws.getCell(`D${r}`).dataValidation = {
      type:"list", allowBlank:true,
      formulae:['"Not Started,In Progress,Complete"'],
    };
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="OKR_Template.xlsx"`);
  const buf = await wb.xlsx.writeBuffer();
  res.send(buf);
}
