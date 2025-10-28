import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

export default function Index() {
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
