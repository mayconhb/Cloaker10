import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, Shield, ShieldCheck, ShieldX } from "lucide-react";
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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { Campaign, AccessLog } from "@shared/schema";

interface CampaignStats {
  totalClicks: number;
  totalBlocks: number;
  allowedClicks: number;
}

export default function CampaignAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
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

  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", id],
    enabled: isAuthenticated && !!id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<CampaignStats>({
    queryKey: ["/api/campaigns", id, "stats"],
    enabled: isAuthenticated && !!id,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<AccessLog[]>({
    queryKey: ["/api/campaigns", id, "logs"],
    enabled: isAuthenticated && !!id,
  });

  const copyLink = async () => {
    if (campaign) {
      const url = `${window.location.origin}/go/${campaign.slug}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  const pieData = stats ? [
    { name: "Permitidos", value: stats.allowedClicks, color: "#10b981" },
    { name: "Bloqueados", value: stats.totalBlocks, color: "#ef4444" },
  ] : [];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateUserAgent = (ua: string | null) => {
    if (!ua) return "-";
    return ua.length > 50 ? ua.substring(0, 50) + "..." : ua;
  };

  if (authLoading || campaignLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Campanha não encontrada</h2>
            <p className="text-zinc-400 mb-4">A campanha que você procura não existe ou foi removida.</p>
            <Button onClick={() => navigate("/dashboard")} data-testid="button-back-to-dashboard">
              Voltar ao Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{campaign.name}</h1>
                <Badge 
                  variant={campaign.isActive ? "default" : "secondary"}
                  className={campaign.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                >
                  {campaign.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400 mt-1 font-mono">/go/{campaign.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={copyLink} data-testid="button-copy-link">
              <Copy className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Copiar Link
            </Button>
            <a href={campaign.destinationUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" data-testid="button-view-destination">
                <ExternalLink className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Ver Destino
              </Button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total de Cliques</CardTitle>
              <Shield className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-white" data-testid="stat-total-clicks">
                  {stats?.totalClicks?.toLocaleString() ?? 0}
                </p>
              )}
            </CardContent>
            <Shield className="absolute right-4 bottom-4 w-16 h-16 text-zinc-800/30" strokeWidth={1} />
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Permitidos</CardTitle>
              <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-emerald-400" data-testid="stat-allowed">
                  {stats?.allowedClicks?.toLocaleString() ?? 0}
                </p>
              )}
            </CardContent>
            <ShieldCheck className="absolute right-4 bottom-4 w-16 h-16 text-emerald-500/10" strokeWidth={1} />
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 relative overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Bloqueados</CardTitle>
              <ShieldX className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-zinc-800" />
              ) : (
                <p className="text-3xl font-bold text-rose-400" data-testid="stat-blocked">
                  {stats?.totalBlocks?.toLocaleString() ?? 0}
                </p>
              )}
            </CardContent>
            <ShieldX className="absolute right-4 bottom-4 w-16 h-16 text-rose-500/10" strokeWidth={1} />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Skeleton className="w-32 h-32 rounded-full bg-zinc-800" />
                </div>
              ) : stats && (stats.allowedClicks > 0 || stats.totalBlocks > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#fafafa" }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-zinc-300 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                  Sem dados ainda
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-zinc-800/30">
                <span className="text-sm text-zinc-400">URL de Destino</span>
                <a 
                  href={campaign.destinationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-200 hover:text-white truncate max-w-xs"
                >
                  {campaign.destinationUrl}
                </a>
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-zinc-800/30">
                <span className="text-sm text-zinc-400">Safe Page</span>
                <a 
                  href={campaign.safePageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-200 hover:text-white truncate max-w-xs"
                >
                  {campaign.safePageUrl}
                </a>
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-zinc-800/30">
                <span className="text-sm text-zinc-400">Camada 1: Anti-Automação</span>
                <Badge 
                  variant={campaign.blockBots ? "default" : "secondary"}
                  className={campaign.blockBots ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                >
                  {campaign.blockBots ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Logs de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Data</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">IP</TableHead>
                    <TableHead className="text-zinc-400">User Agent</TableHead>
                    <TableHead className="text-zinc-400">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      data-testid={`row-log-${log.id}`}
                    >
                      <TableCell className="text-sm text-zinc-300">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.wasBlocked ? "destructive" : "default"}
                          className={!log.wasBlocked ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                        >
                          {log.wasBlocked ? "Bloqueado" : "Permitido"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 font-mono">
                        {log.ipAddress || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 max-w-xs truncate">
                        {truncateUserAgent(log.userAgent)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {log.botReason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-zinc-500">Nenhum acesso registrado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
