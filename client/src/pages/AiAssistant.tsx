import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, TrendingUp, ShieldCheck, AlertTriangle, BarChart3 } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = "#e91e8c";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// ─── Suggested Prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  "Analyze the top revenue leakage risks for this quarter",
  "Which OMCs have the highest discrepancy rates?",
  "Generate a Q1 2026 compliance summary",
  "What enforcement actions should be prioritized?",
  "Explain the fiscal gap and how to reduce it",
  "Compare declared vs SICPA-verified volumes by OMC",
];

// ─── Capability Cards ─────────────────────────────────────────────────────────
const CAPABILITIES = [
  {
    icon: TrendingUp,
    title: "Revenue Analysis",
    desc: "Analyze fiscal gaps, excise duty, VAT, and petroleum levy collections with real-time data.",
    color: ACCENT,
  },
  {
    icon: ShieldCheck,
    title: "Compliance Assessment",
    desc: "Evaluate OMC compliance rates, identify at-risk operators, and recommend corrective actions.",
    color: "#10b981",
  },
  {
    icon: AlertTriangle,
    title: "Discrepancy Detection",
    desc: "Identify volume variances between declared data and SICPA-verified measurements.",
    color: "#f59e0b",
  },
  {
    icon: BarChart3,
    title: "Enforcement Intelligence",
    desc: "Prioritize enforcement cases based on risk scores and historical compliance patterns.",
    color: "#06b6d4",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const chatMutation = trpc.ai.chat.useMutation();

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        message: text,
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });
      const rawContent = result.content;
      const assistantMessage: Message = { role: "assistant", content: typeof rawContent === "string" ? rawContent : String(rawContent ?? "") };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, I encountered an error processing your request. Please check your connection and try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, chatMutation]);

  return (
    <div className="p-5 space-y-5 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
              <Brain className="w-4.5 h-4.5" style={{ color: ACCENT }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">FIS Intelligence Assistant</h1>
            <Badge className="text-[10px] px-2 py-0.5 font-semibold" style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
              <Sparkles className="w-2.5 h-2.5 mr-1 inline" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Gemini AI — Analyzes real-time FIS data to provide compliance insights, revenue intelligence, and enforcement recommendations for the NRA.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border/30 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Connected to FIS Data
        </div>
      </div>

      {/* Capability Cards */}
      {messages.length === 0 && (
        <div className="grid grid-cols-4 gap-3">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="bg-card/50 border border-border/40 rounded-2xl p-4 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cap.color}18` }}>
                <cap.icon className="w-4.5 h-4.5" style={{ color: cap.color }} />
              </div>
              <p className="text-xs font-semibold text-foreground">{cap.title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chat Interface */}
      <div className="bg-card/50 border border-border/40 rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-foreground">FIS Intelligence Assistant</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Gemini 2.5 Flash · NRA Sierra Leone</span>
        </div>
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask about compliance, revenue gaps, SICPA discrepancies, or enforcement priorities..."
          height={480}
          emptyStateMessage="Ask me anything about FIS data — revenue analysis, compliance trends, SICPA discrepancies, or enforcement priorities."
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center pb-2">
        FIS Intelligence Assistant provides analytical insights based on real-time platform data. All decisions should be reviewed by authorized NRA officers.
        Developed by <a href="https://fasosmart.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: ACCENT }}>FASOSMART</a>.
      </p>

    </div>
  );
}
