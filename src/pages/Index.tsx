import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

export default function Index() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await authService.getUser();
      if (user) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecked(true);
    })();
  }, [navigate]);

  if (!checked) return null;

  return (
    <div className="min-h-screen">
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
    </div>
  );
}
