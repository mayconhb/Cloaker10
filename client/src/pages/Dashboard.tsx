import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Copy, ExternalLink, LayoutGrid, MousePointerClick, ShieldX } from "lucide-react";
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
import type { Campaign } from "@shared/schema";

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

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
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
    },
    {
      title: "Cliques Hoje",
      value: stats?.todayClicks ?? 0,
      icon: MousePointerClick,
    },
    {
      title: "Bloqueios Hoje",
      value: stats?.todayBlocks ?? 0,
      icon: ShieldX,
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Gerencie suas campanhas de proteção</p>
          </div>
          <Link href="/campaigns/new">
            <Button data-testid="button-new-campaign">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Nova Campanha
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {kpiCards.map((card, index) => (
            <Card key={index} className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">{card.title}</CardTitle>
                <card.icon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 bg-zinc-800" />
                ) : (
                  <p className="text-3xl font-bold text-white" data-testid={`stat-${card.title.toLowerCase().replace(/\s/g, '-')}`}>
                    {card.value.toLocaleString()}
                  </p>
                )}
              </CardContent>
              <card.icon 
                className="absolute right-4 bottom-4 w-16 h-16 text-zinc-800/30" 
                strokeWidth={1} 
              />
            </Card>
          ))}
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold text-white">Campanhas</CardTitle>
            {campaigns && campaigns.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {campaigns.length} {campaigns.length === 1 ? "campanha" : "campanhas"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
                ))}
              </div>
            ) : campaigns && campaigns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Nome</TableHead>
                    <TableHead className="text-zinc-400">Slug</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow 
                      key={campaign.id} 
                      className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      data-testid={`row-campaign-${campaign.id}`}
                    >
                      <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                      <TableCell>
                        <code className="text-xs text-zinc-400 font-mono bg-zinc-800/50 px-2 py-1 rounded">
                          /{campaign.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={campaign.isActive ? "default" : "secondary"}
                          className={campaign.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                        >
                          {campaign.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => copyLink(campaign.slug)}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="w-8 h-8 text-zinc-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Nenhuma campanha</h3>
                <p className="text-sm text-zinc-400 mb-6">Crie sua primeira campanha para começar a proteger seus links</p>
                <Link href="/campaigns/new">
                  <Button data-testid="button-create-first-campaign">
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Criar Campanha
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
