import { useEffect, useMemo, useState } from 'react';
import { AgentCard } from './components/AgentCard';
import { ChatPanel, type ChatMessage } from './components/ChatPanel';
import { DataTable } from './components/DataTable';
import { MetricCard } from './components/MetricCard';
import { SectionCard } from './components/SectionCard';
import { agentCards, architecture, heroStats, landingCards, quickPrompts } from './data';
import type { AgentType, DashboardResponse } from './types';
import { chat, fetchDashboard, fetchQueries, seedAll } from './lib/api';

const initialMessage: ChatMessage = {
  role: 'assistant',
  text: 'Hola, soy AESA Copilot 4x4. Puedo ayudarte con supply, contratos y mantenimiento técnico.',
  status: 'ok',
};

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [seedState, setSeedState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    try {
      const [dash, q] = await Promise.all([fetchDashboard().catch(() => null), fetchQueries().catch(() => null)]);
      if (dash) setDashboard(dash);
      if (q?.queries) setLogs(q.queries);
    } catch {
      // ignore
    }
  }

  const selectedCard = useMemo(
    () => agentCards.find((a) => a.id === selectedAgent) ?? agentCards[0],
    [selectedAgent],
  );

  const quicks = quickPrompts[selectedAgent] ?? quickPrompts.general;

  async function handleSeed() {
    setSeedState('loading');
    try {
      await seedAll();
      setSeedState('ready');
      await loadAll();
    } catch {
      setSeedState('error');
    }
  }

  async function sendMessage(question?: string) {
    const text = (question ?? input).trim();
    if (!text || loading) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    if (!question) setInput('');

    try {
      const res = await chat(text, selectedAgent, conversationId || undefined);
      if (res.conversationId) setConversationId(res.conversationId);

      const replyText = res.result?.generated_text ?? res.answer ?? 'Sin respuesta.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          status: res.status ?? 'ok',
        },
      ]);

      await loadAll();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'No pude conectar con el backend.',
          status: 'critical',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickPrompt(prompt: string) {
    setSelectedAgent(
      prompt.toLowerCase().includes('contrato') ? 'contracts'
      : prompt.toLowerCase().includes('mantenimiento') ? 'maintenance'
      : prompt.toLowerCase().includes('proveedor') ? 'supply'
      : selectedAgent,
    );
    void sendMessage(prompt);
  }

  const sectionScroll = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const topSupply = dashboard?.supply?.slice(0, 3) ?? [];
  const topMaint = dashboard?.maintenance?.slice(0, 3) ?? [];
  const topContracts = dashboard?.contracts?.slice(0, 3) ?? [];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>AESA Copilot 4x4</strong>
            <span>Multiagente industrial · Cloudflare-ready</span>
          </div>
        </div>
        <nav className="nav">
          <a href="#agentes">Agentes</a>
          <a href="#demo">Demo</a>
          <a href="#datos">Datos</a>
          <button type="button" className="ghost" onClick={handleSeed}>
            {seedState === 'loading' ? 'Cargando demo…' : seedState === 'ready' ? 'Demo cargada' : 'Cargar demo'}
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">Copiloto inteligente para AESA / YPF</div>
            <h1>Operación, contratos y supply en una sola experiencia ejecutiva.</h1>
            <p>
              Una demo que se siente como producción real: agentes especializados, score de riesgo,
              documentos, trazabilidad y paneles pensados para innovación industrial.
            </p>
            <div className="hero-actions">
              <button type="button" onClick={sectionScroll}>Explorar agentes</button>
              <button type="button" className="secondary" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver demo
              </button>
            </div>
            <div className="stats-grid">
              {heroStats.map((s) => (
                <MetricCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <img src="/hero-industrial.svg" alt="AESA Copilot industrial" />
            <div className="hero-badges">
              {architecture.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="three-cards">
          {landingCards.map((c) => (
            <SectionCard key={c.title} title={c.title} subtitle={c.text}>
              <div className="mini-card-copy">
                Preparado para demostrar valor en entrevista con datos simulados, lógica de negocio y
                un diseño de plataforma real.
              </div>
            </SectionCard>
          ))}
        </section>

        <section id="agentes" className="section-block">
          <div className="section-title">
            <h2>Agentes especializados</h2>
            <p>Seleccioná el agente y la experiencia cambia según su función.</p>
          </div>
          <div className="agent-grid">
            {agentCards.map((card) => (
              <AgentCard
                key={card.id}
                card={card}
                active={selectedAgent === card.id}
                onSelect={setSelectedAgent}
              />
            ))}
          </div>
        </section>

        <section id="demo" className="demo-grid">
          <SectionCard
            title={`Demo activa · ${selectedCard.title}`}
            subtitle={selectedCard.description}
          >
            <div className="demo-panel">
              <div className={`agent-focus ${selectedCard.accent}`}>
                <img src={selectedCard.image} alt={selectedCard.title} />
                <div>
                  <span className="small-label">Agente activo</span>
                  <h3>{selectedCard.title}</h3>
                  <p>{selectedCard.subtitle}</p>
                </div>
              </div>

              <ChatPanel
                messages={messages}
                input={input}
                loading={loading}
                selectedAgent={selectedAgent}
                quickPrompts={quicks}
                onInputChange={setInput}
                onSend={() => void sendMessage()}
                onQuickPrompt={handleQuickPrompt}
                onKeyDown={(e) => e.key === 'Enter' && void sendMessage()}
              />
            </div>
          </SectionCard>

          <aside className="side-column">
            <SectionCard title="Contexto y trazabilidad" subtitle="Última respuesta, estado y fuentes">
              <div className="status-stack">
                <div className={`status-pill ${messages[messages.length - 1]?.status ?? 'ok'}`}>
                  {messages[messages.length - 1]?.status ?? 'ok'}
                </div>
                <div className="status-box">
                  {messages[messages.length - 1]?.text ?? 'Sin respuesta todavía.'}
                </div>
                <div className="mini-list">
                  {dashboard?.queries?.slice(0, 4).map((q) => (
                    <div key={`${q.created_at}-${q.question}`} className="mini-item">
                      <strong>{q.agent_type}</strong>
                      <span>{q.question}</span>
                    </div>
                  )) ?? null}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Señales rápidas" subtitle="Riesgo, contratos y mantenimiento">
              <div className="signal-stack">
                <div className="signal-card red">
                  <span>Riesgo alto</span>
                  <strong>{dashboard?.supply?.[0]?.supplier_name ?? 'Servicios del Sur SA'}</strong>
                </div>
                <div className="signal-card amber">
                  <span>Contrato sensible</span>
                  <strong>{dashboard?.contracts?.[0]?.contract_id ?? 'CTR-1003'}</strong>
                </div>
                <div className="signal-card green">
                  <span>Activo crítico</span>
                  <strong>{dashboard?.maintenance?.[0]?.asset_name ?? 'Bomba centrífuga P-204'}</strong>
                </div>
              </div>
            </SectionCard>
          </aside>
        </section>

        <section id="datos" className="data-grid">
          <SectionCard title="Métricas del sistema" subtitle="Estado general de la demo">
            <div className="metrics-row">
              <MetricCard label="Supply cases" value={dashboard?.metrics.supplyCases ?? 0} />
              <MetricCard label="Maintenance cases" value={dashboard?.metrics.maintenanceCases ?? 0} />
              <MetricCard label="Contracts" value={dashboard?.metrics.contractCases ?? 0} />
              <MetricCard label="Documents" value={dashboard?.metrics.documents ?? 0} />
              <MetricCard label="Queries" value={dashboard?.metrics.queries ?? 0} />
              <MetricCard label="Predictions" value={dashboard?.metrics.predictions ?? 0} />
            </div>
          </SectionCard>

          <SectionCard title="Supply · top riesgo" subtitle="Casos con score dinámico">
            <DataTable
              title=""
              columns={['supplier_name', 'contract_id', 'risk_score', 'level', 'issue']}
              rows={topSupply as any}
            />
          </SectionCard>

          <SectionCard title="Mantenimiento · alertas" subtitle="Anomalías operativas">
            <DataTable
              title=""
              columns={['asset_name', 'asset_id', 'anomaly', 'temperature_c', 'vibration_mm_s']}
              rows={topMaint.map((r) => ({
                ...r,
                anomaly: r.anomaly.state,
              })) as any}
            />
          </SectionCard>

          <SectionCard title="Contratos · vigencias" subtitle="Alertas de vencimiento y cláusulas">
            <DataTable
              title=""
              columns={['contract_id', 'supplier_name', 'expires_in_days', 'clause_risk', 'issue']}
              rows={topContracts as any}
            />
          </SectionCard>

          <SectionCard title="Documentos recientes" subtitle="Contexto documental indexado">
            <DataTable
              title=""
              columns={['title', 'doc_type', 'source', 'created_at']}
              rows={dashboard?.documents ?? []}
            />
          </SectionCard>

          <SectionCard title="Actividad reciente" subtitle="Trazabilidad / audit trail">
            <DataTable
              title=""
              columns={['agent_type', 'question', 'created_at']}
              rows={dashboard?.queries ?? []}
            />
          </SectionCard>
        </section>

        <section className="footer-banner">
          <div>
            <strong>Cloudflare-ready</strong>
            <p>Frontend preparado para Pages y API preparada para Workers + D1.</p>
          </div>
          <div className="footer-tags">
            <span>Multi-agent orchestration</span>
            <span>Risk engine</span>
            <span>Audit trail</span>
            <span>Production-style UI</span>
          </div>
        </section>
      </main>
    </div>
  );
}
