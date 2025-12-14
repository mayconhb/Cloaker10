import { Shield, Zap, Lock, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const features = [
    {
      icon: Lock,
      title: "Anti-Automação",
      description: "Bloqueio inteligente de bots, scrapers e ferramentas de clonagem automatizadas.",
    },
    {
      icon: Eye,
      title: "Anti-Espionagem",
      description: "Proteção contra espiões que tentam copiar suas ofertas via biblioteca de anúncios.",
    },
    {
      icon: Zap,
      title: "Ultra Rápido",
      description: "Validação em milissegundos para não afetar a experiência do usuário real.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className="font-bold text-lg tracking-tighter text-white">LinkShield</span>
          </div>
          <a href="/login">
            <Button data-testid="button-login">
              Entrar
              <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">Camada 1: Anti-Automação Ativa</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Proteja suas ofertas de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              espiões e bots
            </span>
          </h1>

          <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Sistema de cloaking profissional que detecta e bloqueia ferramentas de automação, 
            protegendo suas landing pages de concorrentes e scrapers.
          </p>

          <a href="/login">
            <Button size="lg" className="text-base px-8" data-testid="button-get-started">
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20 w-full">
          {features.map((feature, index) => (
            <Card key={index} className="bg-zinc-900/50 border-zinc-800/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-zinc-800/50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-800/50 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-zinc-500">LinkShield - Proteção Inteligente de Links</p>
        </div>
      </footer>
    </div>
  );
}
