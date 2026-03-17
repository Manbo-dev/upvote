const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3333;

// Carrega a configuração do sandbox
function carregarConfig() {
  // Limpa o cache do require para sempre ler o arquivo atualizado
  delete require.cache[require.resolve('./config.js')];
  return require('./config.js');
}

// Serve o widget compilado direto do packages/widget/dist
const widgetPath = path.resolve(__dirname, '../../packages/widget/dist/widget.js');

app.get('/widget.js', (req, res) => {
  if (!fs.existsSync(widgetPath)) {
    res.status(503).send(`
      // Widget não encontrado. Execute primeiro:
      // cd packages/widget && npm run build
      // ou: cd apps/sandbox && npm run build-widget
      console.error('[Upvote Sandbox] widget.js não encontrado. Rode: npm run build-widget');
    `);
    return;
  }
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(widgetPath);
});

// Função que injeta os valores de config no HTML (substitui os placeholders)
function servirPagina(arquivo) {
  return (req, res) => {
    const config = carregarConfig();
    const htmlPath = path.join(__dirname, 'pages', arquivo);

    if (!fs.existsSync(htmlPath)) {
      res.status(404).send('Página não encontrada');
      return;
    }

    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Substitui os placeholders de config
    html = html.replaceAll('{{API_KEY}}', config.apiKey);
    html = html.replaceAll('{{BASE_URL}}', config.baseUrl);
    html = html.replaceAll('{{COLOR}}', config.color || '#6366f1');
    html = html.replaceAll('{{API_KEY_MASKED}}', config.apiKey.substring(0, 12) + '...');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  };
}

// Rotas das páginas
app.get('/', servirPagina('home.html'));
app.get('/produto', servirPagina('produto.html'));
app.get('/checkout', servirPagina('checkout.html'));

// Rota de info da config atual (útil para debug)
app.get('/config-info', (req, res) => {
  const config = carregarConfig();
  res.json({
    apiKey: config.apiKey.substring(0, 12) + '...',
    baseUrl: config.baseUrl,
    color: config.color || '#6366f1',
    widgetDisponivel: fs.existsSync(widgetPath),
  });
});

app.listen(PORT, () => {
  const config = carregarConfig();
  console.log(`\n🚀 Sandbox rodando em http://localhost:${PORT}`);
  console.log(`\n📋 Config atual:`);
  console.log(`   API Key : ${config.apiKey.substring(0, 12)}...`);
  console.log(`   Base URL: ${config.baseUrl}`);
  console.log(`   Cor     : ${config.color || '#6366f1'}`);
  console.log(`\n📄 Páginas:`);
  console.log(`   Home     → http://localhost:${PORT}/`);
  console.log(`   Produto  → http://localhost:${PORT}/produto`);
  console.log(`   Checkout → http://localhost:${PORT}/checkout`);

  if (!fs.existsSync(widgetPath)) {
    console.log(`\n⚠️  widget.js não encontrado!`);
    console.log(`   Execute: npm run build-widget`);
  } else {
    console.log(`\n✅ widget.js encontrado`);
  }

  console.log('\n💡 Para trocar config, edite config.js e recarregue a página (sem reiniciar o servidor)\n');
});
