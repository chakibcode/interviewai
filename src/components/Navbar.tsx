import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { authService, type AuthUser } from "@/services/authService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LayoutDashboard, User, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    authService.getUser().then(setUser);
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    navigate("/login");
  };

  const goToFeatures = () => {
    navigate("/");
    setTimeout(() => {
      const el = document.getElementById("features");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-xl font-semibold">
            InterviewAI
          </Link>
        </div>

        {/* Center: Links for Pricing, Features, Login */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-sm font-medium hover:text-accent transition-colors">
            Pricing
          </Link>
          <button onClick={goToFeatures} className="text-sm font-medium hover:text-accent transition-colors">
            Features
          </button>
          {!user && (
            <Link to="/login" className="text-sm font-medium hover:text-accent transition-colors">
              Login
            </Link>
          )}
        </div>

        {/* Right: Circle dropdown menu (Dashboard, Profile, Logout) */}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatarUrl || ""} alt="User" />
                  <AvatarFallback className="text-sm font-medium">
                    {(user?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5">
              <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground">
                {user?.email || "Menu"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
