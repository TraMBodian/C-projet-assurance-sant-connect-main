import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, ChevronDown } from "@/components/ui/Icons";
import { Button } from "@/components/ui/button";
import { ClaudeMessage } from "@/services/claudeService";

interface Props {
  title?: string;
  placeholder?: string;
  systemContext: string;
  onAsk: (question: string, history: ClaudeMessage[]) => Promise<string>;
  suggestedQuestions?: string[];
}

export default function ClaudeChat({
  title = "Assistant IA",
  placeholder = "Posez votre question...",
  systemContext,
  onAsk,
  suggestedQuestions = [],
}: Props) {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState("");
  const [history, setHistory] = useState<ClaudeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setError(null);
    const newHistory: ClaudeMessage[] = [...history, { role: "user", content: q }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const answer = await onAsk(q, history);
      setHistory([...newHistory, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de connexion à l'assistant.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  // ── Bubble fermée ─────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
        title={title}
      >
        <MessageCircle className="w-6 h-6" />
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {history.filter(m => m.role === "assistant").length}
          </span>
        )}
      </button>
    );
  }

  // ── Fenêtre ouverte ───────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-blue-100 overflow-hidden bg-white"
      style={{ height: "520px" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-[10px] text-blue-200">Propulsé par Claude AI</p>
        </div>
        <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {history.length === 0 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Bonjour ! Je suis votre assistant.</p>
            <p className="text-xs text-gray-500 mb-4">Posez vos questions sur {systemContext}.</p>
            {suggestedQuestions.length > 0 && (
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="w-full text-left text-xs bg-white border border-blue-200 text-blue-700 rounded-xl px-3 py-2 hover:bg-blue-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-blue-600" : "bg-white border border-blue-200"
            }`}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
            }`}>
              {msg.content.split("\n").map((line, j) => (
                <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-white border border-blue-200 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span className="text-xs text-gray-500">En train de répondre...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <Button
            size="sm"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-7 w-7 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">Propulsé par Claude AI — Anthropic</p>
      </div>
    </div>
  );
}
