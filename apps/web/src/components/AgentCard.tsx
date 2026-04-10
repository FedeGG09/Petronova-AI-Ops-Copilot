import type { AgentCard as AgentCardType, AgentType } from '../types';

type Props = {
  card: AgentCardType;
  active: boolean;
  onSelect: (id: AgentType) => void;
};

export function AgentCard({ card, active, onSelect }: Props) {
  return (
    <button
      className={`agent-card ${active ? 'active' : ''}`}
      onClick={() => onSelect(card.id)}
      type="button"
    >
      <div className={`agent-badge ${card.accent}`}>
        <img src={card.image} alt={card.title} />
      </div>
      <div className="agent-card-body">
        <div className="agent-kicker">{card.subtitle}</div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <span className="agent-action">{active ? 'Agente activo' : 'Activar agente'}</span>
      </div>
    </button>
  );
}
