import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary border-accent/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(18_75%_60%/0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(18_75%_60%/0.1),transparent_50%)]" />
          
          <div className="relative z-10 p-12 md:p-20 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Ready to Ace Your
              <span className="block text-accent mt-2">Next Interview?</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their interview preparation with AI
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="hero" size="xl" className="group" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                No credit card required • 7-day free trial
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CTA;
