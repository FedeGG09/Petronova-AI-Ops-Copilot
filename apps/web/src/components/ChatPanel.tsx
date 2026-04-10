import type { AgentType } from '../types';

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  status?: 'ok' | 'warning' | 'critical';
};

type Props = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  selectedAgent: AgentType;
  quickPrompts: string[];
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickPrompt: (prompt: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export function ChatPanel({
  messages,
  input,
  loading,
  selectedAgent,
  quickPrompts,
  onInputChange,
  onSend,
  onQuickPrompt,
  onKeyDown,
}: Props) {
  return (
    <div className="chat-panel">
      <div className="chat-window">
        {messages.map((m, idx) => (
          <div key={idx} className={`bubble ${m.role} ${m.status ?? ''}`.trim()}>
            {m.text}
          </div>
        ))}
        {loading ? <div className="bubble assistant loading">Analizando contexto...</div> : null}
      </div>

      <div className="quick-prompts">
        {quickPrompts.map((p) => (
          <button key={p} type="button" onClick={() => onQuickPrompt(p)}>
            {p}
          </button>
        ))}
      </div>

      <div className="composer">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Escribí una consulta para ${selectedAgent}`}
        />
        <button type="button" onClick={onSend} disabled={loading || !input.trim()}>
          {loading ? 'Pensando…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
