import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import { Bot, User as UserIcon, Send, Sparkles, Star, TrendingUp } from "lucide-react";
import { interviewService, type AnalysisResult } from "@/services/interviewService";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  analysis?: AnalysisResult;
}

const starterQuestions = [
  "Parlez-moi de votre expérience la plus récente.",
  "Quelles sont les compétences clés que vous apportez pour ce poste ?",
  "Décrivez un défi technique que vous avez surmonté et comment.",
  "Comment priorisez-vous vos tâches dans un contexte de forte pression ?",
  "Pourquoi souhaitez-vous rejoindre notre entreprise ?",
];

export default function Interview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Bienvenue dans l'entretien simulé. Je vais vous poser des questions comme un recruteur. Décrivez brièvement votre objectif de carrière.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Set initial question
    setCurrentQuestion(messages[0]?.content || "");
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Get the last assistant question for analysis
      const lastQuestion = currentQuestion || "Question d'introduction";
      
      // Call n8n webhook for analysis
      const analysis = await interviewService.analyzeResponse(lastQuestion, trimmed);
      
      // Update user message with analysis
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === userMsg.id 
            ? { ...msg, analysis }
            : msg
        )
      );

      // Get next question (from analysis or fallback)
      const nextQuestion = analysis.nextQuestion || 
        starterQuestions[qIndex] ||
        "Merci pour vos réponses. Souhaitez-vous passer à une simulation de questions techniques ?";

      setCurrentQuestion(nextQuestion);
      
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: nextQuestion,
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
      setQIndex((i) => Math.min(i + 1, starterQuestions.length));
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Fallback behavior
      const nextQuestion = starterQuestions[qIndex] || "Une erreur s'est produite. Pouvez-vous reformuler votre réponse ?";
      setCurrentQuestion(nextQuestion);
      
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: nextQuestion,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickStart = () => {
    // inject a quick starter answer and prompt next question
    setInput("Je vise un poste de développeur full-stack avec focus sur TypeScript et Next.js.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <header className="pt-20 pb-4 border-b border-border/40">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Entretien IA</h1>
              <p className="text-sm text-muted-foreground">
                Interface type ChatGPT • Session: {interviewService.getSessionId().slice(0, 8)}
              </p>
            </div>
          </div>
          <Button variant="outline-accent" size="sm" onClick={quickStart}>Pré-remplir</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-border/40 bg-card/60 shadow-sm">
          <div className="h-[60vh] sm:h-[70vh]">
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                {messages.map((m) => (
                  <div key={m.id} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <Avatar>
                        <AvatarFallback className="bg-accent/10 text-accent">
                          <Bot className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[80%] space-y-2 ${m.role === "user" ? "flex flex-col items-end" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === "assistant"
                            ? "bg-muted text-foreground"
                            : "bg-accent text-accent-foreground shadow-[var(--shadow-elegant)]"
                        }`}
                      >
                        {m.content}
                      </div>
                      
                      {/* Analysis results for user messages */}
                      {m.role === "user" && m.analysis && (
                        <div className="bg-card border border-border/40 rounded-xl p-3 text-xs space-y-2 max-w-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-muted-foreground">Analyse IA</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="font-bold text-foreground">{m.analysis.grade}/20</span>
                            </div>
                          </div>
                          
                          {m.analysis.feedback && (
                            <p className="text-muted-foreground leading-relaxed">{m.analysis.feedback}</p>
                          )}
                          
                          {m.analysis.strengths.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="font-medium text-green-700 dark:text-green-400">Points forts</span>
                              </div>
                              <ul className="text-muted-foreground space-y-0.5">
                                {m.analysis.strengths.map((strength, i) => (
                                  <li key={i} className="text-xs">• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {m.analysis.improvements.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-blue-500" />
                                <span className="font-medium text-blue-700 dark:text-blue-400">À améliorer</span>
                              </div>
                              <ul className="text-muted-foreground space-y-0.5">
                                {m.analysis.improvements.map((improvement, i) => (
                                  <li key={i} className="text-xs">• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {m.role === "user" && (
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <UserIcon className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-accent/10 text-accent">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                      <span className="inline-block animate-pulse">Le recruteur est en train d'écrire…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="border-t border-border/40 p-4">
            <div className="flex items-end gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tapez votre réponse…"
                className="min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()} className="self-stretch">
                <Send className="w-4 h-4" />
                Envoyer
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Astuce: Utilisez Shift+Enter pour aller à la ligne. Enter envoie le message.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}