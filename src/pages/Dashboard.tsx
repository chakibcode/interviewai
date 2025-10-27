import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { BarChart3, CircleDollarSign, Gauge, Layers, Settings, Wallet, ChevronRight, Search } from "lucide-react";
import UploadCv from "@/components/UploadCv";
import CompanyModal from "@/components/CompanyModal";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService, type AuthUser } from "@/services/authService";

function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-background/60 backdrop-blur">
      <div className="px-4 py-4 border-b">
        <Link to="/" className="text-lg font-semibold">InterviewAI</Link>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-2">
        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50" to="/dashboard">
          <Gauge className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50" to="/interview">
          <Layers className="h-4 w-4" />
          <span>Assets</span>
        </Link>
        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50" to="/pricing">
          <CircleDollarSign className="h-4 w-4" />
          <span>Pricing</span>
        </Link>
        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50" to="/profile">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </nav>
      <div className="px-4 py-4 border-t">
        <Button variant="outline" className="w-full">
          <Wallet className="h-4 w-4 mr-2" /> Connect Wallet
        </Button>
      </div>
    </aside>
  );
}

function AssetCard({ name, rate, trend }: { name: string; rate: string; trend?: "up" | "down" }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Proof of Stake</p>
          <h3 className="font-medium">{name}</h3>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full"><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold">{rate}</div>
        <p className={`mt-1 text-xs ${trend === "down" ? "text-destructive" : "text-green-500"}`}>{trend === "down" ? "↓" : "↑"} {trend === "down" ? "1.89%" : "6.25%"}</p>
      </div>
      <svg viewBox="0 0 100 30" className="mt-4 w-full h-16">
        <path d="M0 20 L20 22 L40 15 L60 18 L80 10 L100 12" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" />
      </svg>
    </div>
  );
}

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
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [structuredText, setStructuredText] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-6">
        <Sidebar />
        <main className="space-y-6">
          <UploadCv onExtracted={setExtractedText} onUploadChange={setIsLoading} onUploaded={setPreviewUrl} />

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-lg">uploading and analyse you CV</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {/* Extracted CV Text */}
                {extractedText && (
                  <>
                    <section className="rounded-xl border bg-card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Extracted CV Text</h2>
                      </div>
                      <Textarea
                        value={extractedText}
                        readOnly
                        className="min-h-[200px] font-mono"
                      />
                    </section>

                    <div className="rounded-xl mt-6 border bg-card p-6 space-y-4">
                      <h2 className="text-base font-semibold">Personnel Info</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <Textarea placeholder="Full Name" value={parsedData.full_name || ''} />
                        <Textarea placeholder="Address" value={parsedData.location || ''} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Textarea placeholder="Email" value={parsedData.email || ''} />
                        <Textarea placeholder="Phone" value={parsedData.phone || ''} />
                      </div>
                      <div className="grid min-h-[200px]  gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Education</h3>
                          <ol className="list-decimal list-inside space-y-2">
                            {parsedData.education?.map((edu, index) => (
                              <li key={index}>
                                <p className="font-semibold">{edu.institution}</p>
                                <p className="text-sm text-muted-foreground">{edu.degree}</p>
                                <p className="text-xs text-muted-foreground">{edu.start_date} - {edu.end_date}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Skills</h3>
                          <ol className="list-decimal list-inside">
                            {parsedData.skills?.map((skill, index) => (
                              <li key={index}>{skill}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Experience</h3>
                          <ol className="list-decimal list-inside space-y-2">
                            {parsedData.experience?.map((exp, index) => (
                              <li key={index}>
                                <p className="font-semibold">{exp.company} - {exp.role}</p>
                                <p className="text-sm text-muted-foreground">{exp.summary}</p>
                                <p className="text-xs text-muted-foreground">{exp.start_date} - {exp.end_date}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div>
                {previewUrl && (
                  <section className="rounded-xl border bg-card p-6 space-y-4">
                    <h2 className="text-base font-semibold">CV Preview</h2>
                    <img src={previewUrl} alt="CV Preview" className="rounded-md" />
                  </section>
                )}
              </div>
            </div>
          )}

          {/* Parsed CV (OpenAI) */}
          {/* {structuredText && (
            <section className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Parsed CV (OpenAI)</h2>
              </div>
              <Textarea
                value={structuredText}
                readOnly
                className="min-h-[200px] font-mono"
              />
            </section>
          )} */}

          {/* Modal: Create New Company */}
          <CompanyModal
            open={companyModalOpen}
            onOpenChange={setCompanyModalOpen}
            onCreate={(data) => {
              toast({
                title: "Company created",
                description: `Saved ${data.name || "Untitled"} in ${data.location || "Unknown location"}`,
              });
            }}
          />





          {/* Right feature card */}
          <PortfolioCard />

          {/* Active staking section */}
          <section className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Your active stakings</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">⟳</Button>
                <Button variant="ghost" size="icon">⚙️</Button>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-2 rounded-lg border bg-background/50 p-6">
                <p className="text-xs text-muted-foreground">Last Update — 45 minutes ago</p>
                <h3 className="mt-2 text-xl font-medium">Stake Avalance (AVAX)</h3>
                <div className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">31.39686</div>
                <div className="mt-4 flex items-center gap-3">
                  <Button>Upgrade</Button>
                  <Button variant="outline">Unstake</Button>
                </div>
                <svg viewBox="0 0 100 30" className="mt-4 w-full h-16">
                  <path d="M0 25 L20 22 L40 24 L60 18 L80 12 L100 14" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
                </svg>
              </div>
              <div className="rounded-lg border bg-background/50 p-6">
                <h3 className="text-sm font-medium">Investment Period</h3>
                <div className="mt-4 h-1.5 rounded bg-muted">
                  <div className="h-1.5 w-2/3 rounded bg-accent" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Contribution Period (Month)</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="px-2 py-1 rounded bg-secondary/60">4 Month</span>
                  <span className="px-2 py-1 rounded bg-secondary/60">6 Month</span>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}