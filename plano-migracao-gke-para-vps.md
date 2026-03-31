# Plano de Migração: GKE → VPS Hostinger (Upvote)

> Criado em: Março 2026  
> Status: **Pendente**

---

## Contexto

O Upvote atualmente roda em:
- **Backend:** GKE Autopilot (`upvote-cluster`, `europe-west1`) — gratuito por enquanto, mas com risco de cobrança inesperada
- **Banco de dados:** Neon.tech free tier — próximo do limite de 0.5 GB, com latência alta para usuários brasileiros
- **Frontend:** Vercel (free tier) — continua igual após a migração
- **DNS/CDN:** Cloudflare + domínio `upvote.pro` na Hostinger — continua igual

---

## Objetivo

Migrar backend e banco de dados para um VPS fixo e previsível, reduzindo:
- Risco de billing inesperado do GKE
- Latência do banco (de externo para localhost)
- Complexidade operacional (Kubernetes → Docker Compose)

---

## Plano de infraestrutura alvo

### Servidor
- **Provedor:** Hostinger VPS
- **Plano:** KVM 2
  - 2 vCPU cores
  - 8 GB RAM
  - 100 GB NVMe SSD
  - 8 TB bandwidth
  - $8.99/mo (promo) → renova a $14.99/mo
- **Região recomendada:** Brasil (São Paulo) — mercado-alvo do Upvote

### Arquitetura no VPS

```
VPS (Brasil)
├── nginx          → reverse proxy + SSL via Let's Encrypt
├── api            → Spring Boot (Docker)
├── rabbitmq       → Docker
└── postgres       → Docker (substituindo Neon)

Externo (sem mudança):
├── Vercel         → frontend React/Next.js
└── Cloudflare     → DNS + CDN para upvote.pro
```

---

## Docker Compose — configuração de produção

Todos os containers devem usar `restart: unless-stopped` para garantir que sobem automaticamente caso o VPS reinicie.

### Restart policies
| Policy | Uso recomendado |
|---|---|
| `unless-stopped` | **Produção** — reinicia sempre, exceto parada manual |
| `always` | Reinicia inclusive após parada manual |
| `on-failure` | Só reinicia em crash com erro |
| `no` | Padrão — não reinicia |

### Health check (Spring Boot)
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```
O endpoint `/actuator/health` já está disponível no Spring Boot Actuator.

---

## Proteção e resiliência

### Cobertura do `restart: unless-stopped`
| Cenário | Coberto? |
|---|---|
| Container crashou (OOM, bug) | ✅ |
| VPS reiniciou | ✅ |
| Docker daemon reiniciou | ✅ |
| Disco cheio | ❌ |
| VPS inacessível (datacenter caiu) | ❌ |
| Problema na imagem Docker | ❌ |

### Monitoramento externo
- **UptimeRobot** (gratuito) — monitora o domínio `upvote.pro` de fora do servidor
- Alerta via email/WhatsApp se o site ficar fora por mais de 5 minutos
- Essencial para detectar quando o VPS inteiro cai

### Backups do PostgreSQL
```bash
# Cron job — roda todo dia às 3am
# Salva dump comprimido no Google Cloud Storage
0 3 * * * pg_dump upvote | gzip | gsutil cp - gs://upvote-backups/$(date +%Y%m%d).sql.gz
```

---

## Migração do banco de dados (Neon → PostgreSQL local)

### Passos
1. Fazer dump do banco atual no Neon:
   ```bash
   pg_dump "postgresql://user:pass@neon-host/upvote" > upvote_backup.sql
   ```
2. Instalar PostgreSQL no VPS via Docker
3. Restaurar o dump:
   ```bash
   psql -h localhost -U postgres upvote < upvote_backup.sql
   ```
4. Atualizar variáveis de ambiente do Spring Boot (`SPRING_DATASOURCE_URL`)
5. Rodar Flyway migrations para validar estado
6. Testar em staging antes de apontar produção

### Benefício de latência
| | Neon (externo) | PostgreSQL no VPS |
|---|---|---|
| Latência | ~20–80ms | < 1ms (localhost) |
| Cold start | Sim (scale-to-zero) | Não |
| Storage free | 0.5 GB | ~80 GB livres |
| Custo | Grátis (limitado) | Incluído no VPS |

---

## Atualização do CI/CD (GitHub Actions)

O workflow atual faz deploy no GKE. Após a migração, o deploy será via SSH no VPS:

```yaml
- name: Deploy no VPS
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /opt/upvote
      docker compose pull
      docker compose up -d
```

---

## Checklist de migração

### Preparação
- [ ] Contratar VPS KVM 2 na Hostinger (região Brasil)
- [ ] Configurar SSH e firewall no VPS
- [ ] Instalar Docker e Docker Compose no VPS
- [ ] Criar estrutura de diretórios `/opt/upvote`

### Banco de dados
- [ ] Fazer dump do Neon
- [ ] Subir PostgreSQL no Docker Compose
- [ ] Restaurar dump
- [ ] Validar dados e migrations (Flyway)

### Aplicação
- [ ] Criar `docker-compose.yml` de produção com todas as restart policies
- [ ] Configurar health checks
- [ ] Configurar nginx + SSL (Let's Encrypt / Certbot)
- [ ] Atualizar variáveis de ambiente

### CI/CD
- [ ] Adaptar GitHub Actions para deploy via SSH
- [ ] Adicionar secrets no repositório (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`)
- [ ] Testar pipeline completo

### Monitoramento
- [ ] Configurar UptimeRobot no `upvote.pro`
- [ ] Configurar cron de backup do PostgreSQL
- [ ] Configurar alertas de disco cheio

### Go-live
- [ ] Testar aplicação completa no VPS (staging)
- [ ] Atualizar DNS no Cloudflare para apontar para o IP do VPS
- [ ] Monitorar por 48h após migração
- [ ] Desativar cluster GKE e encerrar conta Neon

---

## Custo estimado pós-migração

| Serviço | Custo |
|---|---|
| VPS Hostinger KVM 2 | $8.99/mo (promo) → $14.99/mo |
| Vercel (frontend) | $0 (free tier) |
| Cloudflare (DNS/CDN) | $0 (free tier) |
| UptimeRobot | $0 (free tier) |
| GCS backups (~1GB/mês) | ~$0.02/mo |
| **Total** | **~$9–15/mo** |

Comparado ao risco de cobrança do GKE que pode chegar facilmente a $50–200+/mo.
