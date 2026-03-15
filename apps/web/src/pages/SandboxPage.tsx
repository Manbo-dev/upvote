import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

// ─── Página sandbox para demonstrar o widget ─────────────────────────────────

export default function SandboxPage() {
  const { theme, toggle } = useThemeStore();
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = () => {
    if (!feedbackTexto.trim()) return;
    setEnviando(true);

    // Simula envio (será substituído pela integração real com o backend)
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setFeedbackTexto('');

      // Reseta após 3 segundos
      setTimeout(() => setEnviado(false), 3000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar simples */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              Upvote
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={toggle}
                aria-label="Alternar tema"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <Link
                to="/"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Voltar ao site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 mb-4">
            Sandbox
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Experimente o widget do Upvote
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Veja como seus usuários vão interagir com o widget. Escreva um feedback
            na caixa abaixo e simule o envio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Coluna esquerda: App simulado */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Sua aplicação
            </p>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
              {/* Barra do navegador */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="ml-3 text-xs text-gray-500 dark:text-gray-400 font-mono">meuapp.com.br/checkout</span>
              </div>

              {/* Conteúdo do app simulado */}
              <div className="p-6 space-y-4 min-h-[400px] relative">
                {/* UI fictícia do app */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meu App</h2>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="h-24 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800"></div>
                  <div className="h-24 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800"></div>
                </div>

                <div className="flex gap-2 mt-4">
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex-1"></div>
                  <div className="h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg w-28 flex items-center justify-center">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Pagar</span>
                  </div>
                </div>

                {/* Widget do Upvote (posicionado no canto inferior direito) */}
                <div className="absolute bottom-4 right-4">
                  <WidgetDemo
                    texto={feedbackTexto}
                    onTextoChange={setFeedbackTexto}
                    onEnviar={handleEnviar}
                    enviando={enviando}
                    enviado={enviado}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita: Contexto capturado */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Contexto capturado automaticamente
            </p>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esses dados são capturados junto com cada feedback, sem nenhuma ação do usuário.
                </p>

                <div className="space-y-3">
                  <ContextoItem
                    label="URL da página"
                    valor="meuapp.com.br/checkout"
                    icone={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                    }
                  />
                  <ContextoItem
                    label="Título da página"
                    valor="Checkout — Meu App"
                    icone={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    }
                  />
                  <ContextoItem
                    label="Último elemento interagido"
                    valor='Botão "Pagar"'
                    icone={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                      </svg>
                    }
                  />
                  <ContextoItem
                    label="Dispositivo"
                    valor="Desktop"
                    icone={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
                      </svg>
                    }
                  />
                  <ContextoItem
                    label="Acionamento do widget"
                    valor="Botão no produto"
                    icone={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                      </svg>
                    }
                  />
                  <ContextoItem
                    label="Horário"
                    valor={new Date().toLocaleString('pt-BR')}
                    icone={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    }
                  />
                </div>

                {/* Dica */}
                <div className="mt-6 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    <strong>Dica:</strong> No produto real, esses dados são capturados automaticamente
                    pelo script do widget. O usuário só precisa escrever o feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* Como o feedback é processado */}
            <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
              <div className="p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  O que acontece após o envio?
                </h3>
                <ol className="space-y-3">
                  {[
                    'A IA sintetiza o comentário do usuário',
                    'Busca feedbacks similares já existentes',
                    'Se encontra similar → adiciona um voto automático',
                    'Se não encontra → cria um novo feedback agrupado',
                    'O padrão aparece no dashboard do parceiro',
                  ].map((passo, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{passo}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente do widget demo ───────────────────────────────────────────────

function WidgetDemo({
  texto,
  onTextoChange,
  onEnviar,
  enviando,
  enviado,
}: {
  texto: string;
  onTextoChange: (valor: string) => void;
  onEnviar: () => void;
  enviando: boolean;
  enviado: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Popup do widget */}
      {aberto && (
        <div className="absolute bottom-14 right-0 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Enviar feedback</span>
              <button
                onClick={() => setAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Fechar widget"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {enviado ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Obrigado!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Seu feedback foi recebido.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={texto}
                  onChange={(e) => onTextoChange(e.target.value)}
                  placeholder="Descreva seu feedback, sugestão ou problema..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />

                <button
                  onClick={onEnviar}
                  disabled={!texto.trim() || enviando}
                  className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar feedback'
                  )}
                </button>

                <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center">
                  Ao enviar, você concorda com nossa política de feedback
                </p>
              </>
            )}
          </div>

          {/* Powered by */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Powered by <span className="font-semibold text-indigo-500">Upvote</span>
            </p>
          </div>
        </div>
      )}

      {/* Botão flutuante do widget */}
      <button
        onClick={() => setAberto(!aberto)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="Abrir widget de feedback"
      >
        {aberto ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        )}
      </button>
    </>
  );
}

// ─── Item de contexto ────────────────────────────────────────────────────────

function ContextoItem({
  label,
  valor,
  icone,
}: {
  label: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        {icone}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{valor}</p>
      </div>
    </div>
  );
}
