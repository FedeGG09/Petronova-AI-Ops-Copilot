import type { AgentCard } from './types';

export const agentCards: AgentCard[] = [
  {
    id: 'supply',
    title: 'Supply Copilot',
    subtitle: 'Proveedores y abastecimiento',
    description: 'Detecta proveedores críticos, atrasos, exposición operativa y riesgo de continuidad.',
    image: '/agents/supply.svg',
    accent: 'cyan',
    prompt: '¿Qué proveedores tienen mayor riesgo?',
  },
  {
    id: 'contracts',
    title: 'Contract Copilot',
    subtitle: 'Cláusulas y vencimientos',
    description: 'Resume contratos, detecta cláusulas sensibles y alerta vencimientos cercanos.',
    image: '/agents/contracts.svg',
    accent: 'violet',
    prompt: '¿Qué contratos están por vencer?',
  },
  {
    id: 'maintenance',
    title: 'Maintenance Copilot',
    subtitle: 'Activos y anomalías',
    description: 'Analiza temperatura, vibración y severidad para recomendar intervención.',
    image: '/agents/maintenance.svg',
    accent: 'emerald',
    prompt: '¿Qué equipo está más crítico?',
  },
  {
    id: 'general',
    title: 'General Copilot',
    subtitle: 'Router inteligente',
    description: 'Orienta al usuario y enruta a supply, contratos o mantenimiento.',
    image: '/agents/general.svg',
    accent: 'blue',
    prompt: 'Ayúdame a elegir agente',
  },
];

export const heroStats = [
  { label: 'Riesgo estimado', value: '0.82', hint: 'Supply top case' },
  { label: 'Documentos indexados', value: '4', hint: 'Contracts + manuals' },
  { label: 'Alertas activas', value: '3', hint: 'Critical / warning' },
  { label: 'Consultas trazadas', value: '8', hint: 'Audit trail enabled' },
];

export const architecture = [
  'Frontend premium',
  'Multi-agent router',
  'Risk engine',
  'Documents + logs',
  'Cloudflare-ready',
];

export const landingCards = [
  {
    title: 'Supply chain y proveedores',
    text: 'Priorización de riesgos, atrasos y exposición operativa.',
  },
  {
    title: 'Contratos y documentación',
    text: 'Resumen, vencimientos, cláusulas críticas y trazabilidad.',
  },
  {
    title: 'Mantenimiento técnico',
    text: 'Anomalías, criticidad, alertas y recomendaciones.',
  },
];

export const quickPrompts: Record<string, string[]> = {
  supply: [
    '¿Qué proveedores tienen mayor riesgo?',
    '¿Qué proveedor impacta más la operación?',
    '¿Hay atrasos recurrentes en entregas?',
  ],
  contracts: [
    '¿Qué contratos están próximos a vencer?',
    '¿Qué cláusulas son sensibles?',
    'Resumime el estado contractual',
  ],
  maintenance: [
    '¿Qué equipo está más crítico?',
    '¿Detectaste anomalías en la planta?',
    '¿Qué activos requieren intervención?',
  ],
  general: [
    'Ayúdame a elegir agente',
    '¿Qué puede hacer este copiloto?',
    'Dame un resumen ejecutivo',
  ],
};
