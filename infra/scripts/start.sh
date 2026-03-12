#!/bin/bash
# Inicia todos os deployments do namespace upvote e aguarda ficarem prontos

set -e

NAMESPACE="upvote"

echo "▶  Iniciando todos os deployments no namespace '$NAMESPACE'..."

# Infra primeiro (rabbitmq e redis)
echo "  → Escalando rabbitmq para 1"
kubectl scale deployment rabbitmq -n "$NAMESPACE" --replicas=1

echo "  → Escalando redis para 1"
kubectl scale deployment redis -n "$NAMESPACE" --replicas=1

echo "  ⏳ Aguardando rabbitmq e redis ficarem prontos..."
kubectl rollout status deployment/rabbitmq -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=120s

# API com 2 réplicas (padrão do HPA)
echo "  → Escalando api para 2"
kubectl scale deployment api -n "$NAMESPACE" --replicas=2

# Frontend
echo "  → Escalando web-deployment para 1"
kubectl scale deployment web-deployment -n "$NAMESPACE" --replicas=1

echo "  ⏳ Aguardando api e web ficarem prontos..."
kubectl rollout status deployment/api -n "$NAMESPACE" --timeout=300s
kubectl rollout status deployment/web-deployment -n "$NAMESPACE" --timeout=120s

echo ""
echo "✅ Todos os deployments estão rodando:"
kubectl get pods -n "$NAMESPACE"
