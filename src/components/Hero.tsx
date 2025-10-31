import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration Medium.webp";
import ShootingStars from "./ShootingStars";

const Hero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 black-wallpaper">
      <ShootingStars />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">AI-Powered Interview Preparation</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Master Your
              <span className="block text-accent mt-2">Next Interview</span>
            </h1>
            
            <p className="text-lg md:text-xl max-w-2xl text-muted-foreground">
              Transform your resume into interview success with AI-powered analysis. 
              Upload, analyze, and prepare with intelligent insights tailored to your career goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="group" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline-accent" size="xl">
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-semibold text-accent">U</span>
                  </div>)}
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-accent">10K+</div>
                <div className="text-sm text-muted-foreground">Successful Interviews</div>
              </div>
            </div>
          </div>
          
          {/* Right content - Image */}
          <div className="relative lg:scale-110">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
            <img src={heroImage} alt="AI Interview Platform" className="relative z-10 rounded-2xl shadow-[0_0_50px_hsl(18_75%_60%/0.3)] border border-accent/20" />
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;