import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Shield, Bot, Loader2, Monitor, Globe, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Domain } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const campaignFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  slug: z.string()
    .min(1, "Slug é obrigatório")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  destinationUrl: z.string().url("URL de destino inválida"),
  safePageUrl: z.string().url("URL da Safe Page inválida"),
  blockBots: z.boolean().default(true),
  blockDesktop: z.boolean().default(false),
  domainId: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function NewCampaign() {
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

  // Query para carregar domínios do usuário
  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      destinationUrl: "",
      safePageUrl: "",
      blockBots: true,
      blockDesktop: false,
      domainId: undefined,
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Campanha criada!",
        description: "Sua campanha foi criada com sucesso.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sessão expirada",
          description: "Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro ao criar campanha",
        description: error.message || "Ocorreu um erro ao criar a campanha.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormValues) => {
    // Remove domainId se estiver vazio (usar domínio padrão)
    const payload = {
      ...data,
      domainId: data.domainId || undefined,
    };
    createCampaignMutation.mutate(payload);
  };

  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
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
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Nova Campanha</h1>
            <p className="text-sm text-zinc-400 mt-1">Configure sua campanha de proteção</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                  Identidade
                </CardTitle>
                <CardDescription>Informações básicas da campanha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Campanha</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Oferta Black Friday" 
                          {...field} 
                          onBlur={() => {
                            field.onBlur();
                            if (!form.getValues("slug")) {
                              generateSlug();
                            }
                          }}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-400 font-mono">/</span>
                          <Input 
                            placeholder="oferta-black-friday" 
                            {...field} 
                            className="font-mono"
                            data-testid="input-slug"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>URL amigável para sua campanha</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Destino</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://sua-oferta.com/pagina-vendas" 
                          {...field}
                          data-testid="input-destination-url"
                        />
                      </FormControl>
                      <FormDescription>Página real que usuários aprovados verão</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="safePageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Safe Page</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://google.com" 
                          {...field}
                          data-testid="input-safe-page-url"
                        />
                      </FormControl>
                      <FormDescription>Página exibida para bots e visitantes bloqueados</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                        Domínio Personalizado
                      </FormLabel>
                      <Select onValueChange={(val) => field.onChange(val === "default" ? undefined : val)} value={field.value || "default"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-domain">
                            <SelectValue placeholder="Usar domínio padrão do LinkShield" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Usar domínio padrão</SelectItem>
                          {domains.filter(d => d.dnsVerified).map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.entryDomain}
                            </SelectItem>
                          ))}
                          {domains.filter(d => !d.dnsVerified).length > 0 && (
                            <div className="px-2 py-1.5 text-xs text-zinc-500 border-t border-zinc-700 mt-1">
                              Domínios não verificados não podem ser usados
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Vincule a um domínio personalizado ou use o domínio padrão
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                  Escudo de Segurança
                </CardTitle>
                <CardDescription>Configure as camadas de proteção</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="blockBots"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                          <FormLabel className="text-white font-medium cursor-pointer">
                            Camada 1: Anti-Automação
                          </FormLabel>
                        </div>
                        <FormDescription className="text-xs">
                          Bloqueia headless chrome, puppeteer, selenium, python, curl, wget, ahrefs, semrush e outros bots
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-block-bots"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="blockDesktop"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                          <FormLabel className="text-white font-medium cursor-pointer">
                            Camada 2: Filtro de Dispositivo
                          </FormLabel>
                        </div>
                        <FormDescription className="text-xs">
                          Bloqueia acessos via Desktop/PC. A maioria dos espiões e clonadores trabalha sentado na frente de um computador.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-block-desktop"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800/50 p-4 opacity-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-medium text-sm">Camada 3: Geolocalização</span>
                      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">Em breve</span>
                    </div>
                    <p className="text-xs text-zinc-600">Bloqueia países específicos</p>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800/50 p-4 opacity-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-medium text-sm">Camada 4: Trava de Origem</span>
                      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">Em breve</span>
                    </div>
                    <p className="text-xs text-zinc-600">Exige fbclid ou In-App Browser</p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => navigate("/dashboard")}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createCampaignMutation.isPending}
                data-testid="button-create-campaign"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Campanha"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
