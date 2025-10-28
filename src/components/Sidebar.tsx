import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, CircleDollarSign, Gauge, Layers, Settings, Wallet } from "lucide-react";

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

export default Sidebar;