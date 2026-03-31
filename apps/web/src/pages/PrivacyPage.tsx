import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '31 de março de 2026';
const CONTACT_EMAIL = 'guilhermedicasil@gmail.com';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <a href="/" className="text-lg font-bold text-primary-600 hover:opacity-80 transition-opacity">
            Upvote
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-foreground mb-3">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-10 text-muted-foreground">

          <section>
            <p className="leading-relaxed">
              Esta Política de Privacidade descreve como o <strong className="text-foreground">Upvote</strong> coleta, usa e protege
              as informações dos seus usuários e dos usuários finais dos produtos dos nossos parceiros.
              Ao usar nossa plataforma, você concorda com as práticas descritas aqui.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Quem somos</h2>
            <p className="leading-relaxed">
              O Upvote é uma plataforma de captura e análise inteligente de feedback, operada por
              Guilherme Dias Cardoso. Atuamos como <strong className="text-foreground">operador de dados</strong> em
              relação aos feedbacks coletados pelo widget — o <strong className="text-foreground">controlador</strong> é
              a empresa parceira que instalou o widget no seu produto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Dados que coletamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Dados dos parceiros (quem cria conta no Upvote)</h3>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>Nome e endereço de e-mail</li>
                  <li>Dados de autenticação (senha criptografada ou ID Google)</li>
                  <li>Informações de assinatura e pagamento (via Stripe — não armazenamos dados de cartão)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Dados dos usuários finais (coletados via widget)</h3>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>Texto livre do feedback enviado</li>
                  <li>URL e título da página onde o feedback foi enviado</li>
                  <li>Tipo de dispositivo (mobile ou desktop)</li>
                  <li>Elemento da interface interagido antes de abrir o widget</li>
                  <li>Horário do envio</li>
                </ul>
                <p className="mt-2 text-sm leading-relaxed">
                  Não coletamos nome, e-mail ou qualquer dado identificável do usuário final, salvo se o parceiro configurar explicitamente essa captura.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Como usamos os dados</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              <li>Processar e agrupar feedbacks usando inteligência artificial</li>
              <li>Exibir padrões e insights no dashboard do parceiro</li>
              <li>Gerenciar contas, autenticação e assinaturas</li>
              <li>Melhorar a qualidade e precisão dos modelos de IA</li>
              <li>Enviar comunicações sobre o produto (apenas para parceiros)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Base legal (LGPD)</h2>
            <p className="leading-relaxed">
              Tratamos dados com base nas seguintes hipóteses legais previstas na Lei Geral de Proteção
              de Dados (Lei nº 13.709/2018):
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 leading-relaxed">
              <li><strong className="text-foreground">Execução de contrato</strong> — para operar a plataforma e entregar os serviços contratados pelo parceiro</li>
              <li><strong className="text-foreground">Consentimento</strong> — para o envio de comunicações de marketing</li>
              <li><strong className="text-foreground">Legítimo interesse</strong> — para melhorar a plataforma e prevenir fraudes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Compartilhamento de dados</h2>
            <p className="leading-relaxed">
              Não vendemos dados. Compartilhamos apenas com prestadores de serviço essenciais:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 leading-relaxed">
              <li><strong className="text-foreground">Google (Gemini AI)</strong> — processamento de texto dos feedbacks para síntese e agrupamento</li>
              <li><strong className="text-foreground">Stripe</strong> — processamento de pagamentos</li>
              <li><strong className="text-foreground">Neon.tech</strong> — banco de dados (PostgreSQL hospedado)</li>
              <li><strong className="text-foreground">Google Cloud / GKE</strong> — infraestrutura de servidores</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Todos os prestadores são contratados com cláusulas de proteção de dados compatíveis com a LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Retenção de dados</h2>
            <p className="leading-relaxed">
              Mantemos os dados pelo tempo necessário para a prestação do serviço. Dados de contas canceladas
              são removidos em até 90 dias após o encerramento, salvo obrigação legal de retenção. Feedbacks
              arquivados pelo parceiro permanecem armazenados enquanto a conta estiver ativa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Seus direitos</h2>
            <p className="leading-relaxed">Nos termos da LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-2 mt-3 leading-relaxed">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar os dados que temos sobre você</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos seus dados</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Segurança</h2>
            <p className="leading-relaxed">
              Adotamos medidas técnicas e organizacionais para proteger os dados: criptografia em trânsito
              (HTTPS/TLS), autenticação via JWT, senhas armazenadas com hash seguro, acesso restrito à
              infraestrutura e uso de secrets gerenciados pelo Google Secret Manager.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Cookies</h2>
            <p className="leading-relaxed">
              Usamos apenas cookies técnicos essenciais para autenticação e preferências de tema/idioma.
              Não usamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Alterações nesta política</h2>
            <p className="leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos parceiros sobre mudanças
              relevantes por e-mail. O uso continuado da plataforma após a notificação implica aceitação
              das alterações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Contato</h2>
            <p className="leading-relaxed">
              Dúvidas sobre esta política ou sobre o tratamento dos seus dados:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
