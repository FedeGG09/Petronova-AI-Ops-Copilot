export type SupplyRiskInput = {
  amount: number;
  province: string;
  status: string;
  issue: string;
};

export type RiskResult = {
  risk_score: number;
  level: "bajo" | "medio" | "alto";
  reasons: string[];
};

export type MaintenanceInput = {
  temperature_c: number;
  vibration_mm_s: number;
  severity: string;
};

export type MaintenanceState = {
  state: "OK" | "WARNING" | "CRITICAL";
  reasons: string[];
};

export function calculateRisk(data: SupplyRiskInput): RiskResult {
  let risk = 0;
  const reasons: string[] = [];

  if (data.amount > 200000) {
    risk += 0.3;
    reasons.push("Monto elevado");
  } else if (data.amount > 120000) {
    risk += 0.15;
    reasons.push("Monto medio-alto");
  }

  const status = data.status.toLowerCase();
  if (status === "demorado" || status === "atrasado") {
    risk += 0.3;
    reasons.push("Contrato demorado");
  } else if (status === "cancelado") {
    risk += 0.5;
    reasons.push("Contrato cancelado");
  }

  const issue = data.issue.toLowerCase();
  if (issue.includes("crítico")) {
    risk += 0.4;
    reasons.push("Issue crítico");
  } else if (issue.includes("incumplimiento")) {
    risk += 0.5;
    reasons.push("Incumplimiento contractual");
  } else if (issue.includes("leve")) {
    risk += 0.1;
    reasons.push("Issue leve");
  } else if (issue.includes("atraso")) {
    risk += 0.2;
    reasons.push("Historial de atrasos");
  }

  if (data.province.toLowerCase() === "neuquén") {
    risk += 0.05;
    reasons.push("Zona operativa compleja");
  }

  risk = Math.min(1, Math.max(0, risk));

  return {
    risk_score: Number(risk.toFixed(2)),
    level: getRiskLevel(risk),
    reasons,
  };
}

export function detectAnomaly(input: MaintenanceInput): MaintenanceState {
  const reasons: string[] = [];
  const severity = input.severity.toLowerCase();

  if (input.temperature_c > 85) reasons.push("Temperatura elevada");
  if (input.vibration_mm_s > 10) reasons.push("Vibración elevada");
  if (severity === "alta") reasons.push("Severidad alta");

  if (input.temperature_c > 85 && input.vibration_mm_s > 10) {
    return { state: "CRITICAL", reasons: reasons.length ? reasons : ["Anomalía severa"] };
  }

  if (input.temperature_c > 70 || input.vibration_mm_s > 7 || severity === "alta") {
    return { state: "WARNING", reasons: reasons.length ? reasons : ["Desvío operativo"] };
  }

  return { state: "OK", reasons: ["Dentro de rango"] };
}

function getRiskLevel(risk: number): "bajo" | "medio" | "alto" {
  if (risk > 0.75) return "alto";
  if (risk > 0.4) return "medio";
  return "bajo";
}
