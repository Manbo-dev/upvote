# Infra — Secrets e Deploy

## Gerenciamento de Secrets

Os secrets de produção ficam no **Google Secret Manager**. O arquivo `.env` local continua sendo usado para desenvolvimento.

### Setup inicial (primeira vez)

```bash
# Preencha o .env.production com os valores reais (ou digite interativamente)
cp .env.example .env.production

# Rode o setup — cria os secrets no GCP e configura permissões
./infra/scripts/setup-secret-manager.sh
```

O script:
1. Ativa a API do Secret Manager no projeto GCP
2. Cria cada secret lendo do `.env.production` (se existir) ou pedindo o valor no terminal
3. Concede permissão `roles/secretmanager.secretAccessor` para a service account do GKE

### Adicionar ou atualizar um secret

```bash
echo -n "novo-valor" | gcloud secrets versions add NOME_DO_SECRET \
  --data-file=- \
  --project=project-38c32df4-c37c-41d9-b5d
```

### Aplicar secrets no Kubernetes

```bash
# Busca valores do Secret Manager e aplica no cluster
./infra/k8s/apply-secrets.sh
```

### Desenvolvimento local

Para dev local, use o `.env` na raiz do projeto:

```bash
cp .env.example .env
# Edite com seus valores locais
```

O Spring Boot usa os defaults do `application.yml` (localhost) quando as variáveis não estão definidas.

## Deploy

```bash
# Build e push da imagem para o Artifact Registry
./infra/k8s/build-and-push.sh

# Deploy completo no GKE (aplica secrets + manifests)
./infra/k8s/deploy.sh
```
