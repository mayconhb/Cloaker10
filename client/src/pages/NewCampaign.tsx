import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Shield, Bot, Loader2, Monitor, Globe, Plus, MapPin, X, Link2, Sparkles } from "lucide-react";
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
import { motion } from "framer-motion";
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
  enableOriginLock: z.boolean().default(false),
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
      enableOriginLock: false,
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
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Nova Campanha
              <Sparkles className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Configure sua campanha de proteção</p>
          </div>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="glass-card border-glow-emerald">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">Identidade</CardTitle>
                      <CardDescription className="text-zinc-500">Informações básicas da campanha</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Nome da Campanha</FormLabel>
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
                            className="bg-zinc-800/50 border-zinc-700/50 focus:border-emerald-500/50"
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
                        <FormLabel className="text-zinc-300">Slug (URL)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-500 font-mono">/</span>
                            <Input 
                              placeholder="oferta-black-friday" 
                              {...field} 
                              className="font-mono bg-zinc-800/50 border-zinc-700/50 focus:border-emerald-500/50"
                              data-testid="input-slug"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-zinc-500">URL amigável para sua campanha</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">URL de Destino</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://sua-oferta.com/pagina-vendas" 
                            {...field}
                            className="bg-zinc-800/50 border-zinc-700/50 focus:border-emerald-500/50"
                            data-testid="input-destination-url"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500">Página real que usuários aprovados verão</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="safePageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">URL da Safe Page</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://google.com" 
                            {...field}
                            className="bg-zinc-800/50 border-zinc-700/50 focus:border-emerald-500/50"
                            data-testid="input-safe-page-url"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500">Página exibida para bots e visitantes bloqueados</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="domainId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-zinc-300">
                          <Globe className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                          Domínio de Entrada
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-domain" className="bg-zinc-800/50 border-zinc-700/50">
                              <SelectValue placeholder="Selecione um domínio verificado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50">
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
                        <FormDescription className="text-zinc-500">
                          Selecione o domínio que será usado nos anúncios
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="glass-card border-glow-emerald">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">Escudo de Segurança</CardTitle>
                      <CardDescription className="text-zinc-500">Configure as camadas de proteção</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="blockBots"
                    render={({ field }) => (
                      <FormItem 
                        className={`security-toggle flex items-center justify-between gap-4`}
                        data-enabled={field.value}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${field.value ? 'bg-emerald-500/20' : 'bg-zinc-800/60'}`}>
                              <Bot className={`w-4 h-4 transition-colors duration-300 ${field.value ? 'text-emerald-400' : 'text-zinc-500'}`} strokeWidth={1.5} />
                            </div>
                            <div>
                              <FormLabel className="text-white font-medium cursor-pointer">
                                Camada 1: Anti-Automação
                              </FormLabel>
                              <FormDescription className="text-xs text-zinc-500">
                                Bloqueia headless chrome, puppeteer, selenium e bots
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-block-bots"
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blockDesktop"
                    render={({ field }) => (
                      <FormItem 
                        className={`security-toggle flex items-center justify-between gap-4`}
                        data-enabled={field.value}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${field.value ? 'bg-emerald-500/20' : 'bg-zinc-800/60'}`}>
                              <Monitor className={`w-4 h-4 transition-colors duration-300 ${field.value ? 'text-emerald-400' : 'text-zinc-500'}`} strokeWidth={1.5} />
                            </div>
                            <div>
                              <FormLabel className="text-white font-medium cursor-pointer">
                                Camada 2: Filtro de Dispositivo
                              </FormLabel>
                              <FormDescription className="text-xs text-zinc-500">
                                Bloqueia acessos via Desktop/PC
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-block-desktop"
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blockedCountries"
                    render={({ field }) => (
                      <FormItem className="security-toggle" data-enabled={field.value.length > 0}>
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${field.value.length > 0 ? 'bg-emerald-500/20' : 'bg-zinc-800/60'}`}>
                                <MapPin className={`w-4 h-4 transition-colors duration-300 ${field.value.length > 0 ? 'text-emerald-400' : 'text-zinc-500'}`} strokeWidth={1.5} />
                              </div>
                              <div>
                                <FormLabel className="text-white font-medium cursor-pointer">
                                  Camada 3: Geolocalização
                                </FormLabel>
                                <FormDescription className="text-xs text-zinc-500">
                                  Bloqueia acessos de países específicos
                                </FormDescription>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-11">
                          <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-zinc-400 bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600"
                                data-testid="button-select-countries"
                              >
                                <Plus className="w-3 h-3 mr-2" strokeWidth={1.5} />
                                Adicionar país bloqueado
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0 bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50" align="start">
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
                                    className="flex items-center gap-1 cursor-pointer bg-zinc-800/60 hover:bg-zinc-700/60 border-zinc-700/50 text-zinc-300"
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

                  <FormField
                    control={form.control}
                    name="enableOriginLock"
                    render={({ field }) => (
                      <FormItem 
                        className={`security-toggle flex items-center justify-between gap-4`}
                        data-enabled={field.value}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${field.value ? 'bg-emerald-500/20' : 'bg-zinc-800/60'}`}>
                              <Link2 className={`w-4 h-4 transition-colors duration-300 ${field.value ? 'text-emerald-400' : 'text-zinc-500'}`} strokeWidth={1.5} />
                            </div>
                            <div>
                              <FormLabel className="text-white font-medium cursor-pointer">
                                Camada 4: Trava de Origem Híbrida
                              </FormLabel>
                              <FormDescription className="text-xs text-zinc-500">
                                Exige fbclid ou navegador interno do Facebook/Instagram
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-enable-origin-lock"
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex items-center justify-end gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => navigate("/dashboard")}
                className="bg-zinc-800/60 hover:bg-zinc-700/60 border-zinc-700/50"
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createCampaignMutation.isPending}
                className="glow-emerald-sm"
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
            </motion.div>
          </form>
        </Form>
      </main>
    </div>
  );
}
