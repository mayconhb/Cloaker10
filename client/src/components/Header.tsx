import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, BarChart3, LogOut, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export function Header() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/domains", label: "Domínios", icon: Globe },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" data-testid="link-logo">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative">
              <Shield className="w-7 h-7 text-emerald-400 transition-all duration-300 group-hover:text-emerald-300" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-emerald-400/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-xl tracking-tighter bg-gradient-to-r from-slate-100 via-white to-slate-200 bg-clip-text text-transparent">
              LinkShield
            </span>
          </motion.div>
        </Link>

        <nav className="flex items-center gap-1 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800/50">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-zinc-800/80 rounded-md"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} strokeWidth={1.5} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full relative group" 
              data-testid="button-user-menu"
            >
              <div className="absolute inset-0 bg-emerald-400/10 rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
              <Avatar className="w-9 h-9 border-2 border-zinc-800 group-hover:border-emerald-500/30 transition-colors duration-300">
                <AvatarImage src={user?.profileImageUrl || undefined} alt="User" className="object-cover" />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50">
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white" data-testid="button-logout">
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Sair
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
