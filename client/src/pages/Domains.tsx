import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Globe, CheckCircle, XCircle, RefreshCw, Trash2, Copy, Info } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Domain } from "@shared/schema";

interface DomainWithInstructions extends Domain {
  dnsInstructions?: {
    cnameInstructions: { host: string; target: string };
    txtInstructions: { host: string; value: string };
  };
}

export default function Domains() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainWithInstructions | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  const [newDomain, setNewDomain] = useState({ entryDomain: "", offerDomain: "" });

  const { data: domains, isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { entryDomain: string; offerDomain?: string }) => {
      const response = await apiRequest("POST", "/api/domains", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsAddDialogOpen(false);
      setNewDomain({ entryDomain: "", offerDomain: "" });
      toast({
        title: "Domínio adicionado",
        description: "Configure o DNS para verificar o domínio.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar domínio",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/domains/${id}?action=verify`);
      return response.json();
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      if (data.verificationResult?.verified) {
        toast({
          title: "DNS Verificado",
          description: "Seu domínio está configurado corretamente.",
        });
      } else {
        toast({
          title: "DNS não verificado",
          description: data.verificationResult?.reason || "Falha na verificação do DNS",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Domínio removido",
        description: "O domínio foi removido com sucesso.",
      });
    },
  });

  const fetchDomainDetails = async (id: string) => {
    const response = await fetch(`/api/domains/${id}`, { credentials: "include" });
    const data = await response.json();
    setSelectedDomain(data);
    setIsInstructionsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Valor copiado para a área de transferência.",
    });
  };

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
            <h1 className="text-2xl font-bold tracking-tight text-white">Domínios</h1>
            <p className="text-sm text-zinc-400 mt-1">Configure seus domínios de entrada e oferta</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-domain">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Adicionar Domínio
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Domínio</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Configure um domínio de entrada para usar nos anúncios e um domínio de oferta para a página real.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="entryDomain" className="text-zinc-300">
                    Domínio de Entrada (usado nos anúncios)
                  </Label>
                  <Input
                    id="entryDomain"
                    placeholder="promo.seusite.com"
                    value={newDomain.entryDomain}
                    onChange={(e) => setNewDomain({ ...newDomain, entryDomain: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-entry-domain"
                  />
                  <p className="text-xs text-zinc-500">
                    Este domínio aparecerá nos seus anúncios do Facebook
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerDomain" className="text-zinc-300">
                    Domínio de Oferta (opcional)
                  </Label>
                  <Input
                    id="offerDomain"
                    placeholder="oferta-secreta.com"
                    value={newDomain.offerDomain}
                    onChange={(e) => setNewDomain({ ...newDomain, offerDomain: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-offer-domain"
                  />
                  <p className="text-xs text-zinc-500">
                    Este domínio nunca será exposto - apenas usuários reais o verão
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-zinc-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate(newDomain)}
                  disabled={!newDomain.entryDomain || createMutation.isPending}
                  data-testid="button-save-domain"
                >
                  {createMutation.isPending ? "Salvando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800/50 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              Como funciona?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-zinc-800/50 rounded-md">
                <div className="font-medium text-white mb-2">1. Adicione seu domínio</div>
                <p className="text-zinc-400">
                  Cadastre o domínio que você usará nos anúncios do Facebook (domínio de entrada).
                </p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-md">
                <div className="font-medium text-white mb-2">2. Configure o DNS</div>
                <p className="text-zinc-400">
                  Adicione um registro CNAME apontando para nosso servidor.
                </p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-md">
                <div className="font-medium text-white mb-2">3. Verifique e use</div>
                <p className="text-zinc-400">
                  Após verificar o DNS, vincule às suas campanhas. O domínio real da oferta ficará oculto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold text-white">Seus Domínios</CardTitle>
            {domains && domains.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {domains.length} {domains.length === 1 ? "domínio" : "domínios"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
                ))}
              </div>
            ) : domains && domains.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Domínio de Entrada</TableHead>
                    <TableHead className="text-zinc-400">Domínio de Oferta</TableHead>
                    <TableHead className="text-zinc-400">Status DNS</TableHead>
                    <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow
                      key={domain.id}
                      className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      data-testid={`row-domain-${domain.id}`}
                    >
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                          {domain.entryDomain}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {domain.offerDomain || "-"}
                      </TableCell>
                      <TableCell>
                        {domain.dnsVerified ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" strokeWidth={1.5} />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <XCircle className="w-3 h-3 mr-1" strokeWidth={1.5} />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchDomainDetails(domain.id)}
                            data-testid={`button-dns-info-${domain.id}`}
                          >
                            <Info className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => verifyMutation.mutate(domain.id)}
                            disabled={verifyMutation.isPending}
                            data-testid={`button-verify-${domain.id}`}
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${verifyMutation.isPending ? "animate-spin" : ""}`}
                              strokeWidth={1.5}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDomainToDelete(domain);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${domain.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-zinc-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Nenhum domínio</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Adicione seu primeiro domínio para proteger suas ofertas
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-domain">
                  <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Adicionar Domínio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Configuração de DNS</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Configure um dos registros abaixo no seu provedor de DNS
            </DialogDescription>
          </DialogHeader>
          {selectedDomain?.dnsInstructions && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Opção 1: Registro CNAME (Recomendado)</h4>
                <div className="bg-zinc-800 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Host / Nome</p>
                      <code className="text-sm text-emerald-400 font-mono">
                        {selectedDomain.dnsInstructions.cnameInstructions.host}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedDomain.dnsInstructions!.cnameInstructions.host)}
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Valor / Target</p>
                      <code className="text-sm text-emerald-400 font-mono">
                        {selectedDomain.dnsInstructions.cnameInstructions.target}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedDomain.dnsInstructions!.cnameInstructions.target)}
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-3">Opção 2: Registro TXT (Alternativo)</h4>
                <div className="bg-zinc-800 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Host / Nome</p>
                      <code className="text-sm text-emerald-400 font-mono">
                        {selectedDomain.dnsInstructions.txtInstructions.host}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedDomain.dnsInstructions!.txtInstructions.host)}
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Valor</p>
                      <code className="text-sm text-emerald-400 font-mono break-all">
                        {selectedDomain.dnsInstructions.txtInstructions.value}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedDomain.dnsInstructions!.txtInstructions.value)}
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsInstructionsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover domínio?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. As campanhas vinculadas a este domínio serão desvinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => domainToDelete && deleteMutation.mutate(domainToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
