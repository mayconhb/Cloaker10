# Deploy na Vercel + Supabase

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com)
3. Projeto no GitHub/GitLab/Bitbucket

## Passo 1: Configurar Supabase

1. Crie um novo projeto no Supabase
2. Vá em **Project Settings > Database**
3. Copie a **Connection String** (URI mode)
4. Substitua `[YOUR-PASSWORD]` pela senha do banco

## Passo 2: Criar tabelas no Supabase

Execute este SQL no **SQL Editor** do Supabase:

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

CREATE TABLE IF NOT EXISTS domains (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  entry_domain VARCHAR(255) NOT NULL UNIQUE,
  offer_domain VARCHAR(255),
  dns_verified BOOLEAN DEFAULT FALSE,
  ssl_active BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(64),
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  domain_id VARCHAR REFERENCES domains(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  safe_page_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  block_bots BOOLEAN DEFAULT TRUE,
  block_desktop BOOLEAN DEFAULT FALSE,
  blocked_countries TEXT[] DEFAULT '{}',
  enable_origin_lock BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id),
  user_agent TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(2),
  referer TEXT,
  device_type VARCHAR(20),
  is_bot BOOLEAN DEFAULT FALSE,
  bot_reason VARCHAR(255),
  was_blocked BOOLEAN DEFAULT FALSE,
  block_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS IDX_access_logs_campaign ON access_logs(campaign_id);
CREATE INDEX IF NOT EXISTS IDX_access_logs_created ON access_logs(created_at);
```

## Passo 3: Ajustar package.json

Adicione este script no `package.json` (manualmente no seu repositório):

```json
"scripts": {
  "build:vercel": "vite build"
}
```

## Passo 4: Deploy na Vercel

1. Importe o projeto do seu repositório Git na Vercel
2. Configure as **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string do Supabase |
| `JWT_SECRET` | Uma string aleatória segura (mínimo 32 caracteres) |
| `NODE_ENV` | `production` |

3. Configure o **Build Command**: `npm run build:vercel`
4. Configure o **Output Directory**: `dist`
5. Clique em **Deploy**

## Passo 5: Testar

Após o deploy:

1. Acesse `seu-projeto.vercel.app` para ver o frontend
2. Crie uma conta pelo formulário de registro
3. Crie campanhas e teste os redirecionamentos em `/r/seu-slug`

## Estrutura de URLs

- **Frontend**: `/`, `/dashboard`, `/campaigns`, etc.
- **API**: `/api/auth/*`, `/api/campaigns/*`, `/api/domains/*`
- **Cloaker**: `/r/:slug` (redireciona baseado nas regras da campanha)

## Domínios Personalizados

Na Vercel, vá em **Settings > Domains** para adicionar domínios customizados.

## Dúvidas?

- A autenticação usa JWT com cookies
- As camadas de segurança do cloaker funcionam em serverless
- A geolocalização usa os headers `x-vercel-ip-country` da Vercel automaticamente
