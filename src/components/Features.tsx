import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, Target, Zap } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Resume Analysis",
    description: "Advanced AI extracts and structures every detail from your resume with precision.",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get personalized feedback and suggestions to strengthen your interview performance.",
  },
  {
    icon: Target,
    title: "Role-Specific Prep",
    description: "Tailored interview questions and scenarios based on your target position.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Upload your resume and receive comprehensive analysis in seconds.",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powered by <span className="text-accent">Advanced AI</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our intelligent platform analyzes your resume and prepares you for success
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-[0_0_30px_hsl(75_85%_75%/0.2)] transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm border-accent/10"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
