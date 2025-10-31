
import { Button } from "@/components/ui/button";


import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authService, type AuthUser } from "@/services/authService";
import Stepper from "@/components/Stepper";
import Step1 from "@/components/steps/Step1";
import Step3 from "@/components/steps/Step3";
import Step4 from "@/components/steps/Step4";
import Step5 from "@/components/steps/Step5";
import { BACKEND_URL } from "@/services/api";


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

  const steps = ["Upload CV", "Your Story", "Services", "Budget"];

  useEffect(() => {
    (async () => {
      const u = await authService.getUser();
      setUser(u);
    })();
  }, []);

  useEffect(() => {
    if (extractedText && extractedText.length > 0) {
      setIsLoading(true);
      fetch(`${BACKEND_URL}/openai/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText, user_id: user?.id ?? null }),
      })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 401) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.detail || "OpenAI API key is missing or invalid. Please configure OPENAI_API_KEY in the backend environment.");
            }
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setStructuredText(JSON.stringify(data, null, 2));
        })
        .catch((err) => {
          const message = String(err).includes("OpenAI API key") 
            ? "OpenAI API key is missing or invalid. Please check the backend configuration."
            : `Failed to parse CV: ${err}`;
          toast({ title: "CV Parsing Error", description: message, variant: "destructive" });
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
      <div className="container mx-auto px-4 py-6">
        
        <main className="space-y-6">
          <Stepper steps={steps} currentStep={currentStep} />
          <div className="p-6 bg-card rounded-xl border">
            {currentStep === 1 && (
              <Step1
                onExtracted={setExtractedText}
                onUploadChange={setIsLoading}
                onUploaded={setPreviewUrl}
                previewUrl={previewUrl}
                fullName={fullName}
                setFullName={setFullName}
                parsedData={parsedData}
                userId={user?.id ?? null}
                extractedText={extractedText}
                isLoading={isLoading}
              />
            )}
            {currentStep === 2 && <Step3 story={story} setStory={setStory} />}
            {currentStep === 3 && <Step4 services={services} setServices={setServices} />}
            {currentStep === 4 && <Step5 budget={budget} setBudget={setBudget} />}
          </div>
          <div className="flex justify-between">
            <Button onClick={handleBack} disabled={currentStep === 1}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                currentStep === steps.length ||
                (currentStep === 1 && (
                  isLoading ||
                  !extractedText ||
                  extractedText.length === 0 ||
                  !parsedData ||
                  Object.keys(parsedData).length === 0
                ))
              }
            >
              Next
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}