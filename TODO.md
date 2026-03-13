# TODOs do Projeto

## Infraestrutura

### [ ] Configurar HTTPS no GKE (alta prioridade antes de ir a produção)

Atualmente o backend está exposto via HTTP puro (http://34.140.194.229).
O frontend na Vercel usa um proxy reverso como solução temporária.

**O que precisa ser feito:**

1. Reservar IP estático global no GCP:
   ```bash
   gcloud compute addresses create upvote-api-ip --global \
     --project=project-38c32df4-c37c-41d9-b5d
   ```

2. Apontar DNS: `api.upvote.com` → IP estático reservado (registro A)

3. Criar `infra/k8s/managed-certificate.yaml` com ManagedCertificate do GKE
   para `api.upvote.com`

4. Substituir o `ingress.yaml` atual (usa nginx, não instalado no Autopilot)
   por ingress nativo GKE (`ingressClassName: gce`) com a ManagedCertificate

5. Mudar `api-service` de `type: LoadBalancer` para `type: NodePort`
   (GKE Ingress L7 exige NodePort ou NEG)

6. Atualizar `VITE_API_URL` na Vercel para `https://api.upvote.com`
   e remover o proxy do `vercel.json`

**Referência:** https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs
