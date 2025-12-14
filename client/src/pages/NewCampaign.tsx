import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Shield, Bot, Loader2, Monitor, Globe, Plus, MapPin, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import type { Domain } from "@shared/schema";

interface Country {
  code: string;
  name: string;
}
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
  blockedCountries: z.array(z.string()).default([]),
  domainId: z.string().min(1, "Selecione um domínio de entrada"),
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

  const [countrySearchOpen, setCountrySearchOpen] = useState(false);

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: availableCountries = [] } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
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
      blockedCountries: [],
      domainId: "",
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
                        Domínio de Entrada
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-domain">
                            <SelectValue placeholder="Selecione um domínio verificado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {domains.filter(d => d.dnsVerified).length > 0 ? (
                            domains.filter(d => d.dnsVerified).map((domain) => (
                              <SelectItem key={domain.id} value={domain.id}>
                                {domain.entryDomain}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-3 text-xs text-zinc-500 text-center">
                              Nenhum domínio verificado disponível.
                              <br />
                              Cadastre um domínio na página de Domínios.
                            </div>
                          )}
                          {domains.filter(d => !d.dnsVerified).length > 0 && (
                            <div className="px-2 py-1.5 text-xs text-zinc-500 border-t border-zinc-700 mt-1">
                              Domínios não verificados não podem ser usados
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o domínio que será usado nos anúncios
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

                <FormField
                  control={form.control}
                  name="blockedCountries"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-zinc-800 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                            <FormLabel className="text-white font-medium cursor-pointer">
                              Camada 3: Geolocalização
                            </FormLabel>
                          </div>
                          <FormDescription className="text-xs">
                            Bloqueia acessos de países específicos. Selecione os países que deseja bloquear.
                          </FormDescription>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-zinc-400"
                              data-testid="button-select-countries"
                            >
                              <Plus className="w-3 h-3 mr-2" strokeWidth={1.5} />
                              Adicionar país bloqueado
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar país..." />
                              <CommandList>
                                <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {availableCountries
                                    .filter(country => !field.value.includes(country.code))
                                    .map((country) => (
                                      <CommandItem
                                        key={country.code}
                                        value={country.name}
                                        onSelect={() => {
                                          field.onChange([...field.value, country.code]);
                                          setCountrySearchOpen(false);
                                        }}
                                        data-testid={`item-country-${country.code}`}
                                      >
                                        {country.name} ({country.code})
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {field.value.map((code) => {
                              const country = availableCountries.find(c => c.code === code);
                              return (
                                <Badge
                                  key={code}
                                  variant="secondary"
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    field.onChange(field.value.filter(c => c !== code));
                                  }}
                                  data-testid={`badge-country-${code}`}
                                >
                                  {country?.name || code}
                                  <X className="w-3 h-3" strokeWidth={1.5} />
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

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
