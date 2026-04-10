import type { ChatResponse, DashboardResponse, AgentType } from '../types';

const localHost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);

const baseUrl = import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : localHost
    ? 'http://127.0.0.1:8787'
    : '';

function withBase(path: string) {
  return `${baseUrl}${path}`;
}

export async function seedAll() {
  const [seedRes, docsRes] = await Promise.all([
    fetch(withBase('/seed'), { method: 'POST' }),
    fetch(withBase('/seed-docs'), { method: 'POST' }),
  ]);

  if (!seedRes.ok || !docsRes.ok) {
    throw new Error('No se pudo cargar el demo');
  }

  return true;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(withBase('/dashboard'));
  if (!res.ok) throw new Error('No se pudo cargar dashboard');
  const data = await res.json();
  return data as DashboardResponse;
}

export async function fetchQueries() {
  const res = await fetch(withBase('/queries'));
  if (!res.ok) throw new Error('No se pudieron cargar queries');
  return res.json();
}

export async function chat(message: string, agentType: AgentType, conversationId?: string) {
  const res = await fetch(withBase('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, agentType, conversationId }),
  });

  if (!res.ok) {
    throw new Error('Error en el chat');
  }

  const data = await res.json();
  return data as ChatResponse & { conversationId?: string };
}
