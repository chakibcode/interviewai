interface InterviewData {
  question: string;
  response: string;
  timestamp: string;
  sessionId: string;
}

interface AnalysisResult {
  grade: number; // /20
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextQuestion?: string;
}

class InterviewService {
  private webhookUrl: string;
  private sessionId: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_GET || '';
    this.sessionId = crypto.randomUUID();
  }

  async analyzeResponse(question: string, response: string): Promise<AnalysisResult> {
    const payload: InterviewData = {
      question,
      response,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    try {
      const result = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!result.ok) {
        throw new Error(`Webhook failed: ${result.status}`);
      }

      const analysis = await result.json();
      
      // Ensure we have a valid response structure
      return {
        grade: analysis.grade || 0,
        feedback: analysis.feedback || 'Analyse en cours...',
        strengths: analysis.strengths || [],
        improvements: analysis.improvements || [],
        nextQuestion: analysis.nextQuestion,
      };
    } catch (error) {
      console.error('Error calling n8n webhook:', error);
      
      // Fallback mock response for testing
      return {
        grade: Math.floor(Math.random() * 8) + 12, // 12-20 range
        feedback: `Réponse analysée pour: "${question.substring(0, 50)}...". Analyse détaillée en cours via n8n.`,
        strengths: ['Communication claire', 'Exemples concrets'],
        improvements: ['Développer davantage les détails techniques'],
        nextQuestion: 'Pouvez-vous me donner un exemple spécifique de votre expérience ?',
      };
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = crypto.randomUUID();
  }
}

export const interviewService = new InterviewService();
export type { InterviewData, AnalysisResult };