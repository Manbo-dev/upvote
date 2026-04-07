# Widget — Upvote Embarcável

## O que é
Script JavaScript que clientes do Upvote embarcam no produto deles
com uma única linha de HTML. Injeta um botão flutuante que abre
um modal com o board de sugestões do produto.

## Como o cliente usa
<script
  src="https://upvote.com/widget.js"
  data-api-key="upv_sua_chave_aqui"
  data-color="#6366f1"
  data-position="bottom-right"
  data-user-token="jwt-opcional-do-usuario-logado">
</script>

## Atributos disponíveis
- data-api-key (obrigatório) → chave de API do produto (gerada ao criar o produto)
- data-color → cor primária do widget (default: #6366f1)
- data-position → bottom-right | bottom-left (default: bottom-right)
- data-user-token → JWT do usuário logado no produto do cliente
  Se fornecido, o widget identifica o usuário automaticamente
  Se não fornecido, pede email antes de enviar sugestão

## Regras técnicas
- Zero dependências externas — Vanilla TypeScript puro
- Bundle final deve ter menos de 30kb minificado
- Não pode poluir o escopo global (usar IIFE)
- Não pode conflitar com CSS da página host (usar shadow DOM ou prefixos)
- Build via Vite em modo library → gera dist/widget.js
- Compatível com os últimos 2 anos de browsers modernos

## Build
npm run build → gera dist/widget.js para deploy na CDN
