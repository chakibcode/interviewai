import Navbar from "@/components/Navbar";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold">Pricing</h1>
            <p className="text-muted-foreground text-lg">Choose a plan that fits your interview goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border p-6 bg-card">
              <h2 className="text-xl font-semibold">Starter</h2>
              <p className="text-sm text-muted-foreground mb-4">Best for trying things out</p>
              <div className="text-3xl font-bold mb-6">Free</div>
              <ul className="space-y-2 text-sm">
                <li>Basic resume analysis</li>
                <li>Limited interview questions</li>
              </ul>
            </div>
            <div className="rounded-lg border p-6 bg-card">
              <h2 className="text-xl font-semibold">Pro</h2>
              <p className="text-sm text-muted-foreground mb-4">For active job seekers</p>
              <div className="text-3xl font-bold mb-6">$9/mo</div>
              <ul className="space-y-2 text-sm">
                <li>Full resume analysis</li>
                <li>Role-specific prep</li>
                <li>Priority processing</li>
              </ul>
            </div>
            <div className="rounded-lg border p-6 bg-card">
              <h2 className="text-xl font-semibold">Team</h2>
              <p className="text-sm text-muted-foreground mb-4">For small teams</p>
              <div className="text-3xl font-bold mb-6">$29/mo</div>
              <ul className="space-y-2 text-sm">
                <li>Shared access</li>
                <li>Team insights</li>
                <li>Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;