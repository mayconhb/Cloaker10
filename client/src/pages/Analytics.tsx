import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Shield, ShieldCheck, ShieldX, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Campaign } from "@shared/schema";

interface GlobalStats {
  totalCampaigns: number;
  totalClicks: number;
  totalBlocks: number;
  totalAllowed: number;
}

interface ChartData {
  name: string;
  allowed: number;
  blocked: number;
}

export default function Analytics() {
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

  const { data: globalStats, isLoading: statsLoading } = useQuery<GlobalStats>({
    queryKey: ["/api/analytics/global"],
    enabled: isAuthenticated,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData[]>({
    queryKey: ["/api/analytics/chart"],
    enabled: isAuthenticated,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">Visão geral do desempenho de proteção</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Campanhas</CardTitle>
              <Shield className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-white" data-testid="stat-campaigns">
                  {globalStats?.totalCampaigns ?? 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Cliques</CardTitle>
              <BarChart3 className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-white" data-testid="stat-total-clicks">
                  {globalStats?.totalClicks?.toLocaleString() ?? 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Permitidos</CardTitle>
              <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-emerald-400" data-testid="stat-allowed">
                  {globalStats?.totalAllowed?.toLocaleString() ?? 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Bloqueados</CardTitle>
              <ShieldX className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-rose-400" data-testid="stat-blocked">
                  {globalStats?.totalBlocks?.toLocaleString() ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="w-full h-48 bg-zinc-800" />
                </div>
              ) : chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#fafafa" }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-zinc-300 text-sm">
                          {value === "allowed" ? "Permitidos" : "Bloqueados"}
                        </span>
                      )}
                    />
                    <Bar dataKey="allowed" name="allowed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="blocked" name="blocked" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                  Sem dados suficientes para exibir o gráfico
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold text-white">Campanhas Ativas</CardTitle>
              {campaigns && (
                <Badge variant="secondary" className="text-xs">
                  {campaigns.filter(c => c.isActive).length} ativas
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                      <div 
                        className="flex items-center justify-between gap-4 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        data-testid={`campaign-card-${campaign.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{campaign.name}</p>
                          <p className="text-xs text-zinc-500 font-mono truncate">/{campaign.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={campaign.isActive ? "default" : "secondary"}
                            className={campaign.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                          >
                            {campaign.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <ExternalLink className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-zinc-500">Nenhuma campanha criada</p>
                  <Link href="/campaigns/new">
                    <Button variant="secondary" size="sm" className="mt-4" data-testid="button-create-campaign">
                      Criar Campanha
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
