export type AgentType = 'supply' | 'maintenance' | 'contracts' | 'general';

export type DashboardResponse = {
  ok: boolean;
  metrics: {
    supplyCases: number;
    maintenanceCases: number;
    contractCases: number;
    documents: number;
    queries: number;
    predictions: number;
  };
  supply: Array<{
    supplier_name: string;
    contract_id: string;
    province: string;
    status: string;
    amount: number;
    issue: string;
    risk_score: number;
    level: 'bajo' | 'medio' | 'alto';
  }>;
  maintenance: Array<{
    asset_name: string;
    asset_id: string;
    plant: string;
    status: string;
    severity: string;
    temperature_c: number;
    vibration_mm_s: number;
    issue: string;
    anomaly: {
      state: 'OK' | 'WARNING' | 'CRITICAL';
      reasons: string[];
    };
  }>;
  contracts: Array<{
    contract_id: string;
    supplier_name: string;
    status: string;
    expires_in_days: number;
    clause_risk: number;
    issue: string;
  }>;
  documents: Array<{
    title: string;
    doc_type: string;
    source: string;
    created_at: string;
  }>;
  queries: Array<{
    question: string;
    response: string;
    agent_type: string;
    created_at: string;
  }>;
};

export type ChatResponse = {
  ok: boolean;
  intent: AgentType | 'general';
  status: 'ok' | 'warning' | 'critical';
  answer: string;
  highlights: string[];
  sources: Array<Record<string, unknown>>;
};

export type AgentCard = {
  id: AgentType;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  accent: string;
  prompt: string;
};
