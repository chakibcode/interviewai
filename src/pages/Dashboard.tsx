import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { BarChart3, CircleDollarSign, Gauge, Layers, Settings, Wallet, ChevronRight, Search } from "lucide-react";
import UploadCv from "@/components/UploadCv";
import CompanyModal from "@/components/CompanyModal";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService, type AuthUser } from "@/services/authService";
import PdfThumbnail from "@/components/PdfThumbnail";
import Stepper from "@/components/Stepper";
import Step1 from "@/components/steps/Step1";
import Step2 from "@/components/steps/Step2";
import Step3 from "@/components/steps/Step3";
import Step4 from "@/components/steps/Step4";
import Step5 from "@/components/steps/Step5";


function PortfolioCard() {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-background to-secondary/60 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Liquid Staking Portfolio</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-secondary/70">New</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">An all-in-one portfolio that helps you make smarter investments into Ethereum liquid staking.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Connect with Wallet</Button>
        <Button variant="outline">Enter a Wallet Address</Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [structuredText, setStructuredText] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [story, setStory] = useState("");
  const [services, setServices] = useState("");
  const [budget, setBudget] = useState("");

  const steps = ["Upload CV", "Your Name", "Your Story", "Services", "Budget"];

  useEffect(() => {
    (async () => {
      const u = await authService.getUser();
      setUser(u);
    })();
  }, []);

  useEffect(() => {
    if (extractedText && extractedText.length > 0) {
      setIsLoading(true);
      fetch("http://localhost:8001/openai/parse_cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText }),
      })
        .then((res) => res.json())
        .then((data) => {
          setStructuredText(JSON.stringify(data, null, 2));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [extractedText]);

  const parsedData = structuredText ? JSON.parse(structuredText) : {};

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-6">
        <Sidebar />
        <main className="space-y-6">
          <Stepper steps={steps} currentStep={currentStep} />
          <div className="p-6 bg-card rounded-xl border">
            {currentStep === 1 && (
              <Step1
                onExtracted={setExtractedText}
                onUploadChange={setIsLoading}
                onUploaded={setPreviewUrl}
                previewUrl={previewUrl}
              />
            )}
            {currentStep === 2 && <Step2 fullName={fullName} setFullName={setFullName} />}
            {currentStep === 3 && <Step3 story={story} setStory={setStory} />}
            {currentStep === 4 && <Step4 services={services} setServices={setServices} />}
            {currentStep === 5 && <Step5 budget={budget} setBudget={setBudget} />}
          </div>
          <div className="flex justify-between">
            <Button onClick={handleBack} disabled={currentStep === 1}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={currentStep === steps.length}>
              Next
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}