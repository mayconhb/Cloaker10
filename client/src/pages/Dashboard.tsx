import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Copy, ExternalLink, LayoutGrid, MousePointerClick, ShieldX, Shield, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import type { Campaign, Domain } from "@shared/schema";

interface CampaignWithDomain extends Campaign {
  domain?: Domain | null;
  stats?: { totalClicks: number; totalBlocks: number; allowedClicks: number };
}

interface DashboardStats {
  totalCampaigns: number;
  todayClicks: number;
  todayBlocks: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Sessão expirada",
        description: "Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignWithDomain[]>({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const getCampaignUrl = (campaign: CampaignWithDomain) => {
    if (campaign.domain?.entryDomain && campaign.domain?.dnsVerified) {
      return `https://${campaign.domain.entryDomain}/${campaign.slug}`;
    }
    return `${window.location.origin}/${campaign.slug}`;
  };

  const copyLink = async (campaign: CampaignWithDomain) => {
    const url = getCampaignUrl(campaign);
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const kpiCards = [
    {
      title: "Total de Campanhas",
      value: stats?.totalCampaigns ?? 0,
      icon: LayoutGrid,
      gradient: "card-gradient-emerald",
      iconColor: "text-emerald-400",
    },
    {
      title: "Cliques Hoje",
      value: stats?.todayClicks ?? 0,
      icon: MousePointerClick,
      gradient: "card-gradient-blue",
      iconColor: "text-blue-400",
    },
    {
      title: "Bloqueios Hoje",
      value: stats?.todayBlocks ?? 0,
      icon: ShieldX,
      gradient: "card-gradient-rose",
      iconColor: "text-rose-400",
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Page Header */}
        <motion.div 
          className="flex items-center justify-between gap-4 mb-8 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Dashboard
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Pro
              </Badge>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Gerencie suas campanhas de proteção</p>
          </div>
          <Link href="/campaigns/new">
            <Button data-testid="button-new-campaign" className="glow-emerald-sm">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Nova Campanha
            </Button>
          </Link>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {kpiCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card className={`glass-card relative overflow-visible group transition-all duration-300 border-glow-emerald`}>
                <div className={`absolute inset-0 ${card.gradient} rounded-lg`} />
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-zinc-400">{card.title}</CardTitle>
                  <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center">
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} strokeWidth={1.5} />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {statsLoading ? (
                    <Skeleton className="h-9 w-24 bg-zinc-800" />
                  ) : (
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-bold text-white" data-testid={`stat-${card.title.toLowerCase().replace(/\s/g, '-')}`}>
                        {card.value.toLocaleString()}
                      </p>
                      {index === 1 && card.value > 0 && (
                        <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" strokeWidth={1.5} />
                      )}
                    </div>
                  )}
                </CardContent>
                <card.icon 
                  className="absolute right-4 bottom-4 w-20 h-20 text-zinc-800/20 transition-transform duration-300 group-hover:scale-110" 
                  strokeWidth={0.5} 
                />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Campaigns Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Campanhas</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">Gerencie suas campanhas ativas</p>
                </div>
              </div>
              {campaigns && campaigns.length > 0 && (
                <Badge variant="secondary" className="bg-zinc-800/60 text-zinc-300 border-zinc-700/50">
                  {campaigns.length} {campaigns.length === 1 ? "campanha" : "campanhas"}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full bg-zinc-800/50 rounded-lg" />
                  ))}
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800/50 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-medium">Nome</TableHead>
                        <TableHead className="text-zinc-400 font-medium">Slug</TableHead>
                        <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                        <TableHead className="text-zinc-400 font-medium text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign, index) => (
                        <motion.tr 
                          key={campaign.id}
                          className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                          data-testid={`row-campaign-${campaign.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                        >
                          <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                          <TableCell>
                            <code className="text-xs text-zinc-400 font-mono bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-700/30">
                              /{campaign.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={campaign.isActive ? "default" : "secondary"}
                              className={campaign.isActive 
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
                                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/30"
                              }
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${campaign.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                              {campaign.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => copyLink(campaign)}
                                data-testid={`button-copy-${campaign.id}`}
                              >
                                <Copy className="w-4 h-4" strokeWidth={1.5} />
                              </Button>
                              <Link href={`/campaigns/${campaign.id}`}>
                                <Button variant="ghost" size="icon" data-testid={`button-view-${campaign.id}`}>
                                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="w-20 h-20 rounded-2xl bg-zinc-800/40 flex items-center justify-center mx-auto mb-6 relative">
                    <LayoutGrid className="w-10 h-10 text-zinc-600" strokeWidth={1.5} />
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-2xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhuma campanha ainda</h3>
                  <p className="text-sm text-zinc-400 mb-8 max-w-sm mx-auto">
                    Crie sua primeira campanha para começar a proteger seus links e filtrar tráfego indesejado.
                  </p>
                  <Link href="/campaigns/new">
                    <Button data-testid="button-create-first-campaign" className="glow-emerald-sm">
                      <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Criar Primeira Campanha
                    </Button>
                  </Link>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
