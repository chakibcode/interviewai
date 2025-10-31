import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Apple, Github } from "lucide-react";
import cvImage from "@/assets/cv_image.webp";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Veuillez remplir email et mot de passe", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email, password, remember);
      toast({ title: "Connexion réussie", description: "Ravi de vous revoir !" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Erreur de connexion", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      
      <main className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Left visual panel */}
          <section className="hidden md:block relative rounded-2xl overflow-hidden border bg-card">
            <img
              src={cvImage}
              alt="Login visual"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />

            <div className="relative z-10 p-6 flex justify-between items-center">
              <Link to="/" className="text-lg font-semibold">InterviewAI</Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/70 text-foreground text-sm hover:bg-secondary/90 transition-colors"
              >
                Back to website
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="relative z-10 px-6 pb-6 md:px-10 md:pb-10 mt-auto h-full flex flex-col justify-end">
              <div className="flex items-center gap-2 mt-4 opacity-80">
                <span className="inline-block w-8 h-1 rounded-full bg-muted" />
                <span className="inline-block w-8 h-1 rounded-full bg-muted" />
                <span className="inline-block w-8 h-1 rounded-full bg-muted" />
              </div>
            </div>
          </section>

          {/* Right form panel */}
          <section className="rounded-2xl border bg-transparent p-6 md:p-8">
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-bold tracking-tight">Se connecter</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pas encore de compte ? {" "}
                <Link to="/signup" className="text-accent hover:underline">Créer un compte</Link>
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium bg-green">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="mt-1 border-spacing-2 border-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mot de passe</label>
                  <Input

                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 border border-green-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-border bg-input"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label htmlFor="remember">Se souvenir de moi</label>
                  </div>
                  <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Mot de passe oublié ?</Link>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>

                <div className="flex items-center gap-3 my-6">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground">Ou continuer avec</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" className="w-full">
                    <span className="sr-only">Google</span>
                    Google
                  </Button>
                  <Button type="button" variant="outline" className="w-full">
                    <Apple className="h-4 w-4 mr-2" />
                    Apple
                  </Button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}