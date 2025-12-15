import { Shield, Zap, Lock, Eye, ArrowRight, CheckCircle, ShieldCheck, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Landing() {
  const features = [
    {
      icon: Lock,
      title: "Anti-Automação",
      description: "Bloqueio inteligente de bots, scrapers e ferramentas de clonagem automatizadas.",
      gradient: "from-emerald-500/20 to-teal-500/5",
    },
    {
      icon: Eye,
      title: "Anti-Espionagem",
      description: "Proteção contra espiões que tentam copiar suas ofertas via biblioteca de anúncios.",
      gradient: "from-blue-500/20 to-cyan-500/5",
    },
    {
      icon: Zap,
      title: "Ultra Rápido",
      description: "Validação em milissegundos para não afetar a experiência do usuário real.",
      gradient: "from-amber-500/20 to-orange-500/5",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime garantido" },
    { value: "<50ms", label: "Latência média" },
    { value: "10M+", label: "Requisições/dia" },
  ];

  const trustBadges = [
    { icon: ShieldCheck, label: "Proteção em tempo real" },
    { icon: Globe, label: "CDN Global" },
    { icon: Users, label: "Suporte 24/7" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Gradient orbs for premium background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-orb w-[600px] h-[600px] bg-emerald-500/20 -top-48 -left-48" />
        <div className="gradient-orb w-[500px] h-[500px] bg-teal-500/15 top-1/2 -right-32 animation-delay-2000" style={{ animationDelay: '2s' }} />
        <div className="gradient-orb w-[400px] h-[400px] bg-emerald-600/10 bottom-0 left-1/3 animation-delay-4000" style={{ animationDelay: '4s' }} />
      </div>

      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Shield className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-emerald-400/30 blur-lg" />
            </div>
            <span className="font-bold text-xl tracking-tighter text-gradient-white">LinkShield</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <a href="/login">
              <Button data-testid="button-login">
                Entrar
                <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
              </Button>
            </a>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-16 relative">
        {/* Hero Section */}
        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Status Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-sm text-zinc-300 font-medium">Camada 1: Anti-Automação Ativa</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Proteja suas ofertas de{" "}
            <span className="text-gradient-emerald">
              espiões e bots
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Sistema de cloaking profissional que detecta e bloqueia ferramentas de automação, 
            protegendo suas landing pages de concorrentes e scrapers.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <a href="/login">
              <Button size="lg" className="text-base px-8 glow-emerald-sm" data-testid="button-get-started">
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-learn-more">
                Saiba Mais
              </Button>
            </a>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 w-full relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
            >
              <Card className="glass-card group relative overflow-visible transition-all duration-300 border-glow-emerald">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="p-6 relative">
                  <div className="w-14 h-14 rounded-xl bg-zinc-800/80 flex items-center justify-center mb-5 relative">
                    <feature.icon className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges Section */}
        <motion.div 
          className="flex flex-wrap items-center justify-center gap-6 mt-20 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
              <badge.icon className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              <span className="text-sm text-zinc-300">{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Security Layers Preview */}
        <motion.div 
          className="max-w-3xl mx-auto mt-24 w-full relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">4 Camadas de Proteção</h2>
            <p className="text-zinc-400">Sistema multicamadas que bloqueia ameaças em diferentes níveis</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { num: 1, title: "Anti-Automação", desc: "Bloqueia bots e scrapers" },
              { num: 2, title: "Filtro de Dispositivo", desc: "Bloqueia acessos Desktop" },
              { num: 3, title: "Geolocalização", desc: "Filtra por país de origem" },
              { num: 4, title: "Trava de Origem", desc: "Exige origem de anúncio" },
            ].map((layer, index) => (
              <motion.div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg glass-card"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-400">{layer.num}</span>
                </div>
                <div>
                  <h4 className="font-medium text-white">{layer.title}</h4>
                  <p className="text-sm text-zinc-400">{layer.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                <span className="font-bold text-lg tracking-tighter text-white">LinkShield</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Proteção inteligente de links para campanhas de marketing digital.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-medium text-white mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} LinkShield. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
              <span className="text-sm text-zinc-400">Sistema operacional</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
