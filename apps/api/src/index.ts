import { calculateRisk, detectAnomaly } from "./ml/riskEngine";

type AgentType = "supply" | "maintenance";
type Intent = AgentType | "contracts" | "general";

type Env = {
  DB: D1Database;
};

type SupplyCase = {
  id: string;
  supplier_name: string;
  contract_id: string;
  province: string;
  status: string;
  amount: number;
  issue: string;
};

type MaintenanceCase = {
  id: string;
  asset_name: string;
  asset_id: string;
  plant: string;
  status: string;
  severity: string;
  temperature_c: number;
  vibration_mm_s: number;
  issue: string;
};

type ContractCase = {
  id: string;
  contract_id: string;
  supplier_name: string;
  status: string;
  expires_in_days: number;
  clause_risk: number;
  issue: string;
};

type DocumentRow = {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  source: string;
};

type AgentReply = {
  answer: string;
  status: "ok" | "warning" | "critical";
  highlights: string[];
  sources: Record<string, unknown>[];
  intent: Intent;
};

const supplySamples: Omit<SupplyCase, "id">[] = [
  {
    supplier_name: "Servicios del Sur SA",
    contract_id: "CON-001",
    province: "Neuquén",
    status: "demorado",
    amount: 185000,
    issue: "Atraso recurrente en entregas",
  },
  {
    supplier_name: "Industria Patagonia SRL",
    contract_id: "OC-117",
    province: "Buenos Aires",
    status: "vigente",
    amount: 42000,
    issue: "Documentación pendiente",
  },
  {
    supplier_name: "Logística Sur",
    contract_id: "CON-221",
    province: "Río Negro",
    status: "vigente",
    amount: 76000,
    issue: "Plazo de pago extendido",
  },
];

const maintenanceSamples: Omit<MaintenanceCase, "id">[] = [
  {
    asset_name: "Bomba centrífuga P-204",
    asset_id: "AST-204",
    plant: "La Plata",
    status: "alerta",
    severity: "alta",
    temperature_c: 91.2,
    vibration_mm_s: 14.6,
    issue: "Aumento de vibración y temperatura",
  },
  {
    asset_name: "Compresor K-11",
    asset_id: "AST-311",
    plant: "Luján de Cuyo",
    status: "normal",
    severity: "media",
    temperature_c: 67.3,
    vibration_mm_s: 4.2,
    issue: "Tendencia de vibración creciente",
  },
  {
    asset_name: "Válvula de control V-88",
    asset_id: "AST-088",
    plant: "Plaza Huincul",
    status: "mantenimiento programado",
    severity: "baja",
    temperature_c: 49,
    vibration_mm_s: 1.8,
    issue: "Intervención planificada",
  },
];

const contractSamples: Omit<ContractCase, "id">[] = [
  {
    contract_id: "CTR-1001",
    supplier_name: "Servicios del Sur SA",
    status: "vigente",
    expires_in_days: 18,
    clause_risk: 0.72,
    issue: "Cláusula de penalidad sensible",
  },
  {
    contract_id: "CTR-1002",
    supplier_name: "Industria Patagonia SRL",
    status: "vigente",
    expires_in_days: 74,
    clause_risk: 0.21,
    issue: "Sin observaciones relevantes",
  },
  {
    contract_id: "CTR-1003",
    supplier_name: "Logística Sur",
    status: "en revisión",
    expires_in_days: 9,
    clause_risk: 0.89,
    issue: "Próximo a vencer y con riesgo de incumplimiento",
  },
];

const seedDocuments: Omit<DocumentRow, "id">[] = [
  {
    title: "Contrato proveedor crítico",
    content: "Proveedor con demoras en entregas y condiciones contractuales sensibles.",
    doc_type: "contract",
    source: "ERP",
  },
  {
    title: "Manual de inspección de bombas",
    content: "La vibración elevada y el aumento de temperatura requieren inspección preventiva.",
    doc_type: "manual",
    source: "Mantenimiento",
  },
  {
    title: "Procedimiento de penalidades",
    content: "Toda demora superior a 7 días activa revisión de cláusulas y penalidades.",
    doc_type: "contract",
    source: "Legal",
  },
  {
    title: "Informe de incidente P-204",
    content: "La bomba P-204 presenta vibración alta y temperatura superior a 90 grados.",
    doc_type: "incident",
    source: "SCADA",
  },
];

const AGENT_LABELS: Record<Intent, string> = {
  supply: "Supply",
  maintenance: "Maintenance",
  contracts: "Contracts",
  general: "General",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/") {
      return json({
        ok: true,
        message: "AESA Copilot API OK",
        endpoints: ["/ask", "/api/chat", "/seed", "/seed-docs", "/dashboard", "/queries"],
      });
    }

    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/seed" && request.method === "POST") {
      await seedDatabase(env);
      return json({ ok: true, seeded: true });
    }

    if (url.pathname === "/seed-docs" && request.method === "POST") {
      await seedDocumentsOnly(env);
      return json({ ok: true, docs_seeded: true });
    }

    if (url.pathname === "/dashboard" && request.method === "GET") {
      await ensureSchema(env);
      const dashboard = await buildDashboard(env);
      return json({ ok: true, ...dashboard });
    }

    if (url.pathname === "/queries" && request.method === "GET") {
      await ensureSchema(env);
      const { results } = await env.DB.prepare(
        `SELECT id, question, response, agent_type, created_at
         FROM queries
         ORDER BY created_at DESC
         LIMIT 50`
      ).all<any>();

      return json({ ok: true, queries: results ?? [] });
    }

    if (url.pathname === "/ask" && request.method === "POST") {
      return handleAsk(request, env);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const body = await safeJson(request);
      const fakeRequest = new Request("http://internal/ask", {
        method: "POST",
        body: JSON.stringify({
          question: body.message,
          agentType: body.agentType,
        }),
      });

      const res = await handleAsk(fakeRequest, env);
      const data = await res.json();

      return json({
        result: {
          generated_text: data.answer,
        },
        intent: data.intent,
        highlights: data.highlights,
        sources: data.sources,
        status: data.status,
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(),
    });
  },
};

async function handleAsk(request: Request, env: Env) {
  await ensureSchema(env);

  const body = await safeJson(request);
  const question = String(body.question ?? body.message ?? "").trim();
  const forcedAgent = parseIntent(body.agentType);

  if (!question) {
    return json({ error: "question required" }, 400);
  }

  const conversationId = String(body.conversationId ?? crypto.randomUUID());
  await env.DB.prepare(
    "INSERT OR IGNORE INTO conversations (id, agent_type, created_at) VALUES (?, ?, datetime('now'))"
  )
    .bind(conversationId, forcedAgent ?? detectIntent(question))
    .run();

  await env.DB.prepare(
    "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
  )
    .bind(crypto.randomUUID(), conversationId, "user", question)
    .run();

  const intent = forcedAgent ?? detectIntent(question);
  const reply = await routeAgent(intent, question, env);

  await env.DB.prepare(
    `INSERT INTO messages (id, conversation_id, role, content, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  )
    .bind(crypto.randomUUID(), conversationId, "assistant", reply.answer)
    .run();

  await env.DB.prepare(
    `INSERT INTO queries (id, question, response, agent_type, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  )
    .bind(
      crypto.randomUUID(),
      question,
      reply.answer,
      AGENT_LABELS[intent] ?? "general"
    )
    .run();

  return json({
    ok: true,
    conversationId,
    intent,
    status: reply.status,
    answer: reply.answer,
    highlights: reply.highlights,
    sources: reply.sources,
  });
}

function detectIntent(question: string): Intent {
  const q = question.toLowerCase();

  if (q.includes("proveedor") || q.includes("supply") || q.includes("orden") || q.includes("compra")) {
    return "supply";
  }

  if (q.includes("mantenimiento") || q.includes("falla") || q.includes("temperatura") || q.includes("vibración")) {
    return "maintenance";
  }

  if (q.includes("contrato") || q.includes("cláusula") || q.includes("vigencia") || q.includes("legal")) {
    return "contracts";
  }

  return "general";
}

function parseIntent(value: unknown): Intent | undefined {
  const v = String(value ?? "").toLowerCase();
  if (v === "supply" || v === "maintenance" || v === "contracts" || v === "general") {
    return v;
  }
  return undefined;
}

async function routeAgent(intent: Intent, question: string, env: Env): Promise<AgentReply> {
  switch (intent) {
    case "supply":
      return await supplyAgent(question, env);
    case "maintenance":
      return await maintenanceAgent(question, env);
    case "contracts":
      return await contractAgent(question, env);
    default:
      return await generalAgent();
  }
}

async function supplyAgent(question: string, env: Env): Promise<AgentReply> {
  const { results } = await env.DB.prepare(
    `SELECT supplier_name, contract_id, province, status, amount, issue
     FROM supply_cases
     ORDER BY amount DESC
     LIMIT 5`
  ).all<any>();

  if (!results.length) {
    return {
      answer: "No hay casos de supply registrados.",
      status: "ok",
      highlights: [],
      sources: [],
      intent: "supply",
    };
  }

  const enriched = [];
  for (const row of results as any[]) {
    const risk = calculateRisk({
      amount: Number(row.amount),
      province: String(row.province ?? ""),
      status: String(row.status ?? ""),
      issue: String(row.issue ?? ""),
    });

    enriched.push({
      ...row,
      risk_score: risk.risk_score,
      level: risk.level,
      reasons: risk.reasons,
    });

    await env.DB.prepare(
      `INSERT INTO predictions_log (id, supplier_name, predicted_risk, level, reasons, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        String(row.supplier_name),
        risk.risk_score,
        risk.level,
        JSON.stringify(risk.reasons)
      )
      .run();
  }

  enriched.sort((a, b) => b.risk_score - a.risk_score);
  const top = enriched[0];

  const docContext = await getDocumentContext(env, question, ["contract", "incident"]);

  const intent = "supply";
  const status = top.risk_score > 0.75 ? "critical" : top.risk_score > 0.4 ? "warning" : "ok";

  let answer = "";
  if (question.toLowerCase().includes("impacto")) {
    answer = `📦 Impacto operativo en supply

Proveedor más expuesto: ${top.supplier_name} (${top.contract_id})
Riesgo ML: ${top.risk_score} (${top.level})

El impacto probable es atraso en entregas, presión sobre inventario y posible afectación en la continuidad operativa.
`;
  } else if (question.toLowerCase().includes("riesgo") || question.toLowerCase().includes("más")) {
    answer = "📦 Riesgos en supply:

" + enriched.map(formatSupplyLine).join("

");
  } else {
    answer = `📦 Resumen de supply

Proveedor crítico: ${top.supplier_name} (${top.contract_id})
Riesgo ML: ${top.risk_score} (${top.level})
Motivos: ${top.reasons.join(", ")}

${docContext}`;
  }

  return {
    answer,
    status,
    highlights: enriched.slice(0, 3).map((r: any) => `${r.supplier_name} · ${r.level} · ${r.risk_score}`),
    sources: enriched,
    intent,
  };
}

async function maintenanceAgent(question: string, env: Env): Promise<AgentReply> {
  const { results } = await env.DB.prepare(
    `SELECT asset_name, asset_id, plant, status, severity, temperature_c, vibration_mm_s, issue
     FROM maintenance_cases
     ORDER BY temperature_c DESC, vibration_mm_s DESC
     LIMIT 5`
  ).all<any>();

  if (!results.length) {
    return {
      answer: "No hay datos de mantenimiento.",
      status: "ok",
      highlights: [],
      sources: [],
      intent: "maintenance",
    };
  }

  const enriched = (results as any[]).map((row) => ({
    ...row,
    anomaly: detectAnomaly({
      temperature_c: Number(row.temperature_c),
      vibration_mm_s: Number(row.vibration_mm_s),
      severity: String(row.severity ?? ""),
    }),
  }));

  const top = enriched[0];
  const docContext = await getDocumentContext(env, question, ["manual", "incident"]);
  const status = top.anomaly.state === "CRITICAL" ? "critical" : top.anomaly.state === "WARNING" ? "warning" : "ok";

  let answer = "";
  const q = question.toLowerCase();

  if (q.includes("anomal") || q.includes("detectar")) {
    answer = "🔧 Anomalías detectadas:

" + enriched.map(formatMaintenanceLine).join("

");
  } else if (q.includes("intervención") || q.includes("accion") || q.includes("acción")) {
    answer = `🔧 Recomendación operativa

Equipo crítico: ${top.asset_name} (${top.asset_id})
Estado: ${top.anomaly.state}
Acción sugerida: mantenimiento preventivo inmediato y validación de rodamientos.
`;
  } else {
    answer = `🔧 Alerta técnica

Equipo: ${top.asset_name} (${top.asset_id})
Planta: ${top.plant}
Severidad: ${top.severity}
Temp: ${top.temperature_c}°C
Vibración: ${top.vibration_mm_s} mm/s
Estado: ${top.anomaly.state}
Problema: ${top.issue}

${docContext}`;
  }

  return {
    answer,
    status,
    highlights: enriched.slice(0, 3).map((r: any) => `${r.asset_name} · ${r.anomaly.state}`),
    sources: enriched,
    intent: "maintenance",
  };
}

async function contractAgent(question: string, env: Env): Promise<AgentReply> {
  const { results } = await env.DB.prepare(
    `SELECT contract_id, supplier_name, status, expires_in_days, clause_risk, issue
     FROM contract_cases
     ORDER BY expires_in_days ASC, clause_risk DESC
     LIMIT 5`
  ).all<any>();

  if (!results.length) {
    return {
      answer: "No hay contratos cargados.",
      status: "ok",
      highlights: [],
      sources: [],
      intent: "contracts",
    };
  }

  const q = question.toLowerCase();
  const docContext = await getDocumentContext(env, question, ["contract", "manual"]);

  const status = results[0].expires_in_days < 30 || results[0].clause_risk > 0.75 ? "warning" : "ok";

  let answer = "";
  if (q.includes("vencer") || q.includes("expir")) {
    answer = "📄 Contratos próximos a vencer:

" + results.map((r: any) =>
      `• ${r.contract_id} · ${r.supplier_name} · ${r.expires_in_days} días · riesgo cláusula ${r.clause_risk}
  Motivo: ${r.issue}`
    ).join("

");
  } else if (q.includes("cláus") || q.includes("riesgo")) {
    answer = "📄 Riesgo contractual:

" + results.map((r: any) =>
      `• ${r.contract_id} · ${r.supplier_name}
  Riesgo cláusula: ${r.clause_risk}
  Vence en: ${r.expires_in_days} días
  Observación: ${r.issue}`
    ).join("

");
  } else {
    const top = results[0];
    answer = `📄 Resumen contractual

Contrato más sensible: ${top.contract_id} · ${top.supplier_name}
Vence en ${top.expires_in_days} días
Riesgo cláusula: ${top.clause_risk}
Observación: ${top.issue}

${docContext}`;
  }

  return {
    answer,
    status,
    highlights: results.slice(0, 3).map((r: any) => `${r.contract_id} · ${r.expires_in_days} días`),
    sources: results,
    intent: "contracts",
  };
}

async function generalAgent(): Promise<AgentReply> {
  return {
    answer:
      "🤖 Puedo ayudarte con supply, contratos o mantenimiento. Probá: 'proveedores con riesgo', 'contratos por vencer' o 'problemas de mantenimiento'.",
    status: "ok",
    highlights: [
      "Supply: riesgo de proveedores",
      "Contratos: vigencias y cláusulas",
      "Mantenimiento: anomalías y alertas",
    ],
    sources: [],
    intent: "general",
  };
}

function formatSupplyLine(r: any) {
  return `• ${r.supplier_name} (${r.contract_id}) → Riesgo ${r.risk_score} (${r.level})
  Motivos: ${r.reasons.join(", ")}
  Issue: ${r.issue}`;
}

function formatMaintenanceLine(r: any) {
  return `• ${r.asset_name} (${r.asset_id}) → ${r.anomaly.state}
  Temp: ${r.temperature_c}°C · Vibración: ${r.vibration_mm_s} mm/s
  Motivos: ${r.anomaly.reasons.join(", ")}
  Issue: ${r.issue}`;
}

async function getDocumentContext(env: Env, question: string, docTypes: string[]) {
  const placeholders = docTypes.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT title, content, doc_type, source
     FROM documents
     WHERE (content LIKE ? OR title LIKE ?) AND doc_type IN (${placeholders})
     ORDER BY created_at DESC
     LIMIT 2`
  )
    .bind(`%${question}%`, `%${question}%`, ...docTypes)
    .all<any>();

  if (!results.length) {
    return "Sin contexto documental relevante.";
  }

  return (results as any[])
    .map((d) => `[${d.doc_type}] ${d.title} — ${d.content}`)
    .join(" | ");
}

async function buildDashboard(env: Env) {
  const supply = await env.DB.prepare(
    `SELECT supplier_name, contract_id, province, status, amount, issue
     FROM supply_cases
     ORDER BY amount DESC
     LIMIT 5`
  ).all<any>();

  const maintenance = await env.DB.prepare(
    `SELECT asset_name, asset_id, plant, status, severity, temperature_c, vibration_mm_s, issue
     FROM maintenance_cases
     ORDER BY temperature_c DESC, vibration_mm_s DESC
     LIMIT 5`
  ).all<any>();

  const contracts = await env.DB.prepare(
    `SELECT contract_id, supplier_name, status, expires_in_days, clause_risk, issue
     FROM contract_cases
     ORDER BY expires_in_days ASC, clause_risk DESC
     LIMIT 5`
  ).all<any>();

  const documents = await env.DB.prepare(
    `SELECT title, doc_type, source, created_at
     FROM documents
     ORDER BY created_at DESC
     LIMIT 6`
  ).all<any>();

  const queries = await env.DB.prepare(
    `SELECT question, response, agent_type, created_at
     FROM queries
     ORDER BY created_at DESC
     LIMIT 8`
  ).all<any>();

  const counts = await Promise.all([
    countTable(env, "supply_cases"),
    countTable(env, "maintenance_cases"),
    countTable(env, "contract_cases"),
    countTable(env, "documents"),
    countTable(env, "queries"),
    countTable(env, "predictions_log"),
  ]);

  return {
    metrics: {
      supplyCases: counts[0],
      maintenanceCases: counts[1],
      contractCases: counts[2],
      documents: counts[3],
      queries: counts[4],
      predictions: counts[5],
    },
    supply: (supply.results ?? []).map((row: any) => {
      const risk = calculateRisk({
        amount: Number(row.amount),
        province: String(row.province ?? ""),
        status: String(row.status ?? ""),
        issue: String(row.issue ?? ""),
      });
      return {
        ...row,
        risk_score: risk.risk_score,
        level: risk.level,
      };
    }),
    maintenance: (maintenance.results ?? []).map((row: any) => ({
      ...row,
      anomaly: detectAnomaly({
        temperature_c: Number(row.temperature_c),
        vibration_mm_s: Number(row.vibration_mm_s),
        severity: String(row.severity ?? ""),
      }),
    })),
    contracts: contracts.results ?? [],
    documents: documents.results ?? [],
    queries: queries.results ?? [],
  };
}

async function countTable(env: Env, table: string) {
  const { results } = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).all<any>();
  return Number(results?.[0]?.n ?? 0);
}

async function seedDatabase(env: Env) {
  await ensureSchema(env);

  await Promise.all([
    env.DB.prepare("DELETE FROM supply_cases").run(),
    env.DB.prepare("DELETE FROM maintenance_cases").run(),
    env.DB.prepare("DELETE FROM contract_cases").run(),
    env.DB.prepare("DELETE FROM documents").run(),
    env.DB.prepare("DELETE FROM queries").run(),
    env.DB.prepare("DELETE FROM conversations").run(),
    env.DB.prepare("DELETE FROM messages").run(),
    env.DB.prepare("DELETE FROM predictions_log").run(),
  ]);

  for (const row of supplySamples) {
    await env.DB.prepare(
      `INSERT INTO supply_cases
       (id, supplier_name, contract_id, province, status, amount, issue, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        row.supplier_name,
        row.contract_id,
        row.province,
        row.status,
        row.amount,
        row.issue
      )
      .run();
  }

  for (const row of maintenanceSamples) {
    await env.DB.prepare(
      `INSERT INTO maintenance_cases
       (id, asset_name, asset_id, plant, status, severity, temperature_c, vibration_mm_s, issue, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        row.asset_name,
        row.asset_id,
        row.plant,
        row.status,
        row.severity,
        row.temperature_c,
        row.vibration_mm_s,
        row.issue
      )
      .run();
  }

  for (const row of contractSamples) {
    await env.DB.prepare(
      `INSERT INTO contract_cases
       (id, contract_id, supplier_name, status, expires_in_days, clause_risk, issue, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        row.contract_id,
        row.supplier_name,
        row.status,
        row.expires_in_days,
        row.clause_risk,
        row.issue
      )
      .run();
  }

  await seedDocumentsOnly(env);
}

async function seedDocumentsOnly(env: Env) {
  await ensureSchema(env);

  for (const doc of seedDocuments) {
    await env.DB.prepare(
      `INSERT INTO documents
       (id, title, content, doc_type, source, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        doc.title,
        doc.content,
        doc.doc_type,
        doc.source
      )
      .run();
  }
}

async function ensureSchema(env: Env) {
  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS supply_cases (" +
      "id TEXT PRIMARY KEY," +
      "supplier_name TEXT," +
      "contract_id TEXT," +
      "province TEXT," +
      "status TEXT," +
      "amount REAL," +
      "issue TEXT," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS maintenance_cases (" +
      "id TEXT PRIMARY KEY," +
      "asset_name TEXT," +
      "asset_id TEXT," +
      "plant TEXT," +
      "status TEXT," +
      "severity TEXT," +
      "temperature_c REAL," +
      "vibration_mm_s REAL," +
      "issue TEXT," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS contract_cases (" +
      "id TEXT PRIMARY KEY," +
      "contract_id TEXT," +
      "supplier_name TEXT," +
      "status TEXT," +
      "expires_in_days INTEGER," +
      "clause_risk REAL," +
      "issue TEXT," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS documents (" +
      "id TEXT PRIMARY KEY," +
      "title TEXT," +
      "content TEXT," +
      "doc_type TEXT," +
      "source TEXT," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS conversations (" +
      "id TEXT PRIMARY KEY," +
      "agent_type TEXT NOT NULL," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS messages (" +
      "id TEXT PRIMARY KEY," +
      "conversation_id TEXT NOT NULL," +
      "role TEXT NOT NULL," +
      "content TEXT NOT NULL," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS queries (" +
      "id TEXT PRIMARY KEY," +
      "question TEXT NOT NULL," +
      "response TEXT NOT NULL," +
      "agent_type TEXT NOT NULL," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );

  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS predictions_log (" +
      "id TEXT PRIMARY KEY," +
      "supplier_name TEXT NOT NULL," +
      "predicted_risk REAL NOT NULL," +
      "level TEXT NOT NULL," +
      "reasons TEXT NOT NULL," +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ");"
  );
}

function parseIntent(value: unknown): Intent | undefined {
  const v = String(value ?? "").toLowerCase();
  if (v === "supply" || v === "maintenance" || v === "contracts" || v === "general") {
    return v;
  }
  return undefined;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
