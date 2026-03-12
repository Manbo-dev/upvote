#!/bin/bash
# Para todos os deployments do namespace upvote escalando para 0

set -e

NAMESPACE="upvote"
DEPLOYMENTS=("api" "rabbitmq" "redis" "web-deployment")

echo "⏸  Parando todos os deployments no namespace '$NAMESPACE'..."

for deploy in "${DEPLOYMENTS[@]}"; do
  echo "  → Escalando $deploy para 0"
  kubectl scale deployment "$deploy" -n "$NAMESPACE" --replicas=0
done

echo "✅ Todos os deployments foram parados."
