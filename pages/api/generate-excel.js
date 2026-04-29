import ExcelJS from "exceljs";

const TEAL  = "FF00AE7C";
const GRAY  = "FFD8D8D8";
const LBLUE = "FFDDEBF7";
const CREAM = "FFFFFDF0";

function parseOKRs(raw) {
  const lines = raw.split("\n");
  const dataRows = lines
    .filter(l => l.trim().startsWith("|"))
    .filter(l => !/^\|[\s\-:|]+\|/.test(l.trim()))
    .map(l => l.replace(/^\||\|$/g, "").split("|").map(c => c.trim().replace(/\*\*/g, "")));

  if (dataRows.length < 2) return [];

  // First row is header - skip it
  const rows = dataRows.slice(1);
  const okrs = [];
  let cur = null;

  for (const row of rows) {
    const obj  = row[0] || "";
    const kr   = row[1] || "";
    const prog = row[2] || row[4] || "Not Started"; // handle 3-col or 5-col tables

    if (obj.trim()) {
      cur = { title: obj.trim(), krs: [] };
      okrs.push(cur);
    }
    if (kr.trim() && cur) {
      cur.krs.push({ text: kr.trim(), progress: prog.trim() || "Not Started" });
    }
  }
  return okrs;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { raw, period, employee, department } = req.body;
  const okrs = parseOKRs(raw);
  if (!okrs.length) return res.status(400).json({ error: "No OKR table data found." });

  const wb  = new ExcelJS.Workbook();
  const sheetTitle = period || "OKRs";
  const ws  = wb.addWorksheet(sheetTitle);

  ws.columns = [
    { key: "a", width: 4  },
    { key: "b", width: 18 },
    { key: "c", width: 70 },
    { key: "d", width: 18 },
    { key: "e", width: 22 },
  ];

  const mkFill = argb => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const mkFont = (bold, argb = "FF000000", size = 11) => ({ bold, color: { argb }, size, name: "Arial" });
  const mkAlign = (wrap = true) => ({ wrapText: wrap, vertical: "middle" });

  const addStyledRow = (vals, fills, bolds) => {
    const r = ws.addRow(vals);
    r.height = 24;
    vals.forEach((_, i) => {
      const c = r.getCell(i + 1);
      if (fills[i]) c.fill = mkFill(fills[i]);
      c.font = mkFont(!!bolds[i], bolds[i] === "white" ? "FFFFFFFF" : "FF000000");
      c.alignment = mkAlign();
    });
    return r;
  };

  // ── Header block ──────────────────────────────────────────────────────────
  const h1 = ws.addRow(["Once Upon a Farm", "", "", "", ""]);
  h1.height = 28;
  ws.mergeCells(1, 1, 1, 5);
  h1.getCell(1).fill  = mkFill(CREAM);
  h1.getCell(1).font  = mkFont(true, "FF1A2D14", 13);
  h1.getCell(1).alignment = mkAlign();

  const h2 = ws.addRow([sheetTitle, "", "", "", ""]);
  ws.mergeCells(2, 1, 2, 5);
  h2.getCell(1).fill  = mkFill(CREAM);
  h2.getCell(1).font  = mkFont(false, "FF1A2D14");
  h2.getCell(1).alignment = mkAlign();

  const h3 = ws.addRow([`Department Objective(s): ${department || ""}`, "", "", "", ""]);
  ws.mergeCells(3, 1, 3, 5);
  h3.getCell(1).fill  = mkFill(CREAM);
  h3.getCell(1).alignment = mkAlign();

  const h4 = ws.addRow([`Employee: ${employee || ""}`, "", "", "", ""]);
  ws.mergeCells(4, 1, 4, 5);
  h4.getCell(1).fill  = mkFill(CREAM);
  h4.getCell(1).alignment = mkAlign();

  ws.addRow([]); // blank row 5

  // ── OKR blocks ────────────────────────────────────────────────────────────
  okrs.forEach((okr, idx) => {
    // OKR # header row
    const hRow = ws.addRow(["", `OKR #${idx + 1}`, "", "Progress", "Self-Assessment"]);
    hRow.height = 28;
    ws.mergeCells(hRow.number, 2, hRow.number, 3);
    [2, 3, 4, 5].forEach(c => {
      const cell = hRow.getCell(c);
      cell.fill = mkFill(TEAL);
      cell.font = mkFont(true, "FFFFFFFF");
      cell.alignment = mkAlign(false);
    });
    hRow.getCell(1).fill = mkFill(TEAL);

    // Objective row
    const objRow = ws.addRow(["", "Objective", okr.title, "", ""]);
    objRow.height = 28;
    ws.mergeCells(objRow.number, 3, objRow.number, 5);
    [1, 2, 3].forEach(c => {
      const cell = objRow.getCell(c);
      cell.fill = mkFill(GRAY);
      cell.font = mkFont(true);
      cell.alignment = mkAlign();
    });

    // Key Result rows (always 5 rows, filled with real data or blank)
    for (let k = 0; k < 5; k++) {
      const kr = okr.krs[k];
      const krRow = ws.addRow(["", `Key Result ${k + 1}`, kr?.text || "", kr?.progress || "", ""]);
      krRow.height = kr?.text ? 36 : 20;
      krRow.getCell(2).font = mkFont(false);
      krRow.getCell(3).alignment = mkAlign();
      const progCell = krRow.getCell(4);
      progCell.fill = mkFill(LBLUE);
      progCell.alignment = mkAlign(false);
      // Progress dropdown
      progCell.dataValidation = {
        type: "list", allowBlank: true,
        formulae: ['"Not Started,In Progress,Complete"'],
      };
    }

    ws.addRow([]); // blank row between OKRs
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${sheetTitle.replace(/\s+/g, "_")}.xlsx"`);
  const buf = await wb.xlsx.writeBuffer();
  res.send(buf);
}
