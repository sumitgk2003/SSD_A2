// script.js - Data Dictionary & Relation Diagram (vanilla JS)

// INSTRUCTIONS: How to convert SQL, Postgres, and SQLite schemas to JSON for this tool
// -------------------------------------------------------------
// 1. Required JSON format:
// {
//   "tables": [
//     {
//       "name": "TableName",
//       "columns": [
//         {"name": "column_name", "type": "TYPE", "primaryKey": true/false, "unique": true/false}
//         // ... more columns
//       ]
//     },
//     // ... more tables
//   ],
//   "relationships": [
//     {
//       "fromTable": "TableA", "fromColumn": "colA", "toTable": "TableB", "toColumn": "colB", "type": "many-to-one|one-to-one|many-to-many"
//     }
//     // ... more relationships
//   ]
// }
// -------------------------------------------------------------
// 2. How to convert your SQL schema:
// - For each CREATE TABLE statement, list the table name and columns.
// - For each column, specify its name, type, and if it is PRIMARY KEY or UNIQUE.
// - For foreign keys, add an entry in "relationships" with the source and target tables/columns.
//
// Example (SQL):
// CREATE TABLE users (
//   user_id INT PRIMARY KEY,
//   name VARCHAR(100),
//   email VARCHAR(150) UNIQUE
// );
//
// JSON:
// {
//   "tables": [
//     {
//       "name": "users",
//       "columns": [
//         {"name": "user_id", "type": "INT", "primaryKey": true},
//         {"name": "name", "type": "VARCHAR(100)"},
//         {"name": "email", "type": "VARCHAR(150)", "unique": true}
//       ]
//     }
//   ]
// }
// -------------------------------------------------------------
// 3. For Postgres and SQLite:
// - The process is the same. Use table/column names, types, and mark primary keys and unique columns.
// - For relationships, use foreign key constraints to fill the "relationships" array.
//
// Example (Postgres):
// CREATE TABLE orders (
//   order_id SERIAL PRIMARY KEY,
//   user_id INT REFERENCES users(user_id)
// );
//
// JSON:
// {
//   "tables": [
//     {"name": "orders", "columns": [
//       {"name": "order_id", "type": "SERIAL", "primaryKey": true},
//       {"name": "user_id", "type": "INT"}
//     ]}
//   ],
//   "relationships": [
//     {"fromTable": "orders", "fromColumn": "user_id", "toTable": "users", "toColumn": "user_id", "type": "many-to-one"}
//   ]
// }
// -------------------------------------------------------------
// 4. Tips:
// - Only "name", "type", "primaryKey", and "unique" are required for columns.
// - "relationships" should describe foreign key links.
// - You can use any SQL type; the tool will map common types to Mermaid types.
// - For composite keys, set "primaryKey": true for each key column.
// -------------------------------------------------------------
// Paste your JSON schema in the input box or upload a file to visualize.
// -------------------------------------------------------------

/**
 * Expected JSON format:
 * {
 *  "tables": [
 *    { "name":"users", "columns":[ {"name":"id","type":"int","pk":true}, {"name":"name","type":"varchar"} ] },
 *    ...
 *  ],
 *  "relationships": [
 *    {"fromTable":"users","fromColumn":"role_id","toTable":"roles","toColumn":"id"}
 *  ]
 * }
 *
 * The tool also accepts simple XML structured similarly (see parseXml).
 */

const schemaFile = document.getElementById("schemaFile");
const schemaText = document.getElementById("schemaText");
const renderBtn = document.getElementById("renderBtn");
const glossaryDiv = document.getElementById("glossary");
const diagramSvg = document.getElementById("diagramSvg");
const useSample = document.getElementById("useSample");
const downloadHtmlBtn = document.getElementById("downloadHtml");
const printPdfBtn = document.getElementById("printPdf");

let currentSchema = null;

const sampleSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true },
        { name: "username", type: "varchar(100)" },
        { name: "email", type: "varchar(150)" },
        { name: "role_id", type: "int" },
      ],
    },
    {
      name: "roles",
      columns: [
        { name: "id", type: "int", pk: true },
        { name: "name", type: "varchar(50)" },
      ],
    },
    {
      name: "posts",
      columns: [
        { name: "id", type: "int", pk: true },
        { name: "user_id", type: "int" },
        { name: "content", type: "text" },
      ],
    },
  ],
  relationships: [
    {
      fromTable: "users",
      fromColumn: "role_id",
      toTable: "roles",
      toColumn: "id",
    },
    {
      fromTable: "posts",
      fromColumn: "user_id",
      toTable: "users",
      toColumn: "id",
    },
  ],
};

// --- Utilities

function log(...args) {
  console.log("[DataDict]", ...args);
}

function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}

function tryParseJsonOrXml(text) {
  text = text.trim();
  if (!text) return null;
  // Try JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    /* not JSON */
  }
  // Try XML
  try {
    const parsed = parseXml(text);
    return parsed;
  } catch (e) {
    throw new Error("Invalid JSON or XML schema input.");
  }
}

/**
 * parseXml - expects XML with <schema><tables> <table name="..."> <column name="..." type="..." pk="true"/> ... </table> ... </tables> <relationships> <rel fromTable="..." fromColumn="..." toTable="..." toColumn="..."/> </relationships></schema>
 * Converts to same JS object as JSON format above.
 */
function parseXml(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid XML");
  const schema = { tables: [], relationships: [] };

  const tableNodes = doc.querySelectorAll("table");
  tableNodes.forEach((tn) => {
    const name =
      tn.getAttribute("name") ||
      tn.getAttribute("tableName") ||
      tn.getAttribute("id");
    const cols = [];
    tn.querySelectorAll("column").forEach((cn) => {
      cols.push({
        name: cn.getAttribute("name"),
        type: cn.getAttribute("type"),
        pk: cn.getAttribute("pk") === "true" || cn.getAttribute("pk") === "1",
      });
    });
    schema.tables.push({ name, columns: cols });
  });

  doc.querySelectorAll("relationship,rel,foreignKey").forEach((rn) => {
    schema.relationships.push({
      fromTable: rn.getAttribute("fromTable") || rn.getAttribute("sourceTable"),
      fromColumn:
        rn.getAttribute("fromColumn") || rn.getAttribute("sourceColumn"),
      toTable: rn.getAttribute("toTable") || rn.getAttribute("targetTable"),
      toColumn: rn.getAttribute("toColumn") || rn.getAttribute("targetColumn"),
    });
  });

  return schema;
}

// --- Render glossary
function renderGlossary(schema) {
  // Normalize primaryKey to pk for glossary
  schema.tables.forEach((tbl) => {
    tbl.columns.forEach((col) => {
      if (col.primaryKey) col.pk = true;
    });
  });
  glossaryDiv.innerHTML = "";
  if (!schema || !schema.tables) return;
  schema.tables.forEach((tbl) => {
    const title = document.createElement("h3");
    title.textContent = tbl.name;
    glossaryDiv.appendChild(title);

    const table = document.createElement("table");
    table.className = "glossary-table";
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Column</th><th>Type</th><th>PK</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    tbl.columns.forEach((col) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${col.name}</td><td>${col.type || ""}</td><td>${
        col.pk ? "YES" : ""
      }</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    glossaryDiv.appendChild(table);
  });

  // Relationships list
  if (schema.relationships && schema.relationships.length) {
    const h = document.createElement("h3");
    h.textContent = "Relationships";
    glossaryDiv.appendChild(h);
    const ul = document.createElement("ul");
    schema.relationships.forEach((rel) => {
      const li = document.createElement("li");
      li.textContent = `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
      ul.appendChild(li);
    });
    glossaryDiv.appendChild(ul);
  }
}

function sqlTypeToMermaid(type) {
  type = (type || "string").toLowerCase();
  if (type.startsWith("varchar")) return "string";
  if (type.startsWith("int")) return "int";
  if (type.startsWith("decimal")) return "decimal";
  if (type === "datetime") return "datetime";
  return "string";
}

// --- Mermaid ER Diagram rendering
function schemaToMermaidER(schema) {
  let out = ["erDiagram"];
  // Tables
  schema.tables.forEach((tbl) => {
    out.push(`  ${tbl.name} {`);
    tbl.columns.forEach((col) => {
      let pk = (col.pk || col.primaryKey) ? " PK" : "";
      let type = sqlTypeToMermaid(col.type);
      out.push(`    ${type} ${col.name}${pk}`);
    });
    out.push("  }");
  });
  // Relationships
  (schema.relationships || []).forEach((rel) => {
    let arrow = "||--o{"; // default to many-to-one
    if (rel.type === "one-to-one") arrow = "|o--o|";
    if (rel.type === "many-to-many") arrow = "}o--o{";
    // Mermaid does not allow escaped quotes, so use plain label
    out.push(
      `  ${rel.fromTable} ${arrow} ${rel.toTable} : ${rel.fromColumn}_${rel.toColumn}`
    );
  });
  return out.join("\n");
}

function renderDiagram(schema) {
  if (!schema) return;
  // Remove old diagram
  diagramSvg.innerHTML = "";
  // Generate Mermaid code
  const mermaidCode = schemaToMermaidER(schema);
  // Create Mermaid div
  const mermaidDiv = document.createElement("div");
  mermaidDiv.className = "mermaid";
  mermaidDiv.textContent = mermaidCode;
  diagramSvg.appendChild(mermaidDiv);
  // Render with Mermaid
  if (window.mermaid) {
    window.mermaid.init(undefined, mermaidDiv);
  } else {
    // If Mermaid not loaded, show error
    const err = document.createElement("div");
    err.textContent = "Mermaid.js not loaded. Please include Mermaid.js in your HTML.";
    diagramSvg.appendChild(err);
  }
}

// --- Export / Print

function generateHtmlExport(schema) {
  const docHtml = `
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Data Dictionary Export</title>
<style>
body{font-family: Arial; padding:12px}
h1{font-size:18px}
table{border-collapse: collapse; width:100%; margin-bottom:16px}
th,td{border:1px solid #ccc; padding:6px; text-align:left}
</style>
</head>
<body>
  <h1>Data Dictionary Export</h1>
  <h2>Tables</h2>
  ${schema.tables
    .map((t) => {
      return `<h3>${t.name}</h3>
    <table><thead><tr><th>Column</th><th>Type</th><th>PK</th></tr></thead>
    <tbody>${t.columns
      .map(
        (c) =>
          `<tr><td>${c.name}</td><td>${c.type || ""}</td><td>${
            c.pk ? "YES" : ""
          }</td></tr>`
      )
      .join("")}</tbody></table>`;
    })
    .join("")}
  <h2>Relationships</h2>
  <ul>${(schema.relationships || [])
    .map(
      (r) =>
        `<li>${r.fromTable}.${r.fromColumn} → ${r.toTable}.${r.toColumn}</li>`
    )
    .join("")}</ul>
  <p>Generated by Data Dictionary tool</p>
</body>
</html>
`.trim();
  return docHtml;
}

function downloadHtml(schema) {
  const html = generateHtmlExport(schema);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data-dictionary.html";
  a.click();
  URL.revokeObjectURL(url);
}

function openPrintableView(schema) {
  // open new window with the HTML export and call print
  const html = generateHtmlExport(schema);
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  // wait a bit for rendering then call print
  setTimeout(() => w.print(), 500);
}

// --- Event wiring

schemaFile.addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  try {
    const text = await readFileAsText(f);
    const parsed = tryParseJsonOrXml(text);
    if (!parsed) {
      alert("Could not parse file");
      return;
    }
    currentSchema = parsed;
    schemaText.value = JSON.stringify(currentSchema, null, 2);
    renderGlossary(currentSchema);
    renderDiagram(currentSchema);
  } catch (err) {
    alert("Error reading file: " + err.message);
  }
});

useSample.addEventListener("click", () => {
  currentSchema = sampleSchema;
  schemaText.value = JSON.stringify(sampleSchema, null, 2);
  renderGlossary(sampleSchema);
  renderDiagram(sampleSchema);
});

renderBtn.addEventListener("click", () => {
  const txt = schemaText.value.trim();
  if (!txt && !currentSchema) {
    alert("Paste schema JSON/XML or load a file or sample.");
    return;
  }
  try {
    const parsed = txt ? tryParseJsonOrXml(txt) : currentSchema;
    currentSchema = parsed;
    renderGlossary(parsed);
    renderDiagram(parsed);
  } catch (err) {
    alert("Invalid schema: " + err.message);
  }
});

downloadHtmlBtn.addEventListener("click", () => {
  if (!currentSchema) {
    alert("Render or load a schema first.");
    return;
  }
  downloadHtml(currentSchema);
});

printPdfBtn.addEventListener("click", () => {
  if (!currentSchema) {
    alert("Render or load a schema first.");
    return;
  }
  openPrintableView(currentSchema);
});
