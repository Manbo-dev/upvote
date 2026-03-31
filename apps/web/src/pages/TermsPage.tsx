import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '31 de março de 2026';
const CONTACT_EMAIL = 'guilhermedicasil@gmail.com';

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-foreground mb-3">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-10 text-muted-foreground">

          <section>
            <p className="leading-relaxed">
              Ao acessar ou usar o <strong className="text-foreground">Upvote</strong>, você concorda com
              estes Termos de Uso. Leia com atenção antes de criar sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. O serviço</h2>
            <p className="leading-relaxed">
              O Upvote é uma plataforma SaaS que permite a empresas e desenvolvedores (os <strong className="text-foreground">"Parceiros"</strong>)
              capturar feedback de seus usuários via widget embarcado, processar e agrupar esse feedback
              com inteligência artificial, e visualizar padrões em um dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Criação de conta</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              <li>Você deve ter pelo menos 18 anos para criar uma conta</li>
              <li>As informações fornecidas no cadastro devem ser verdadeiras e atualizadas</li>
              <li>Você é responsável pela segurança das suas credenciais de acesso</li>
              <li>Uma conta não pode ser transferida para terceiros sem autorização expressa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Uso aceitável</h2>
            <p className="leading-relaxed">Você se compromete a não usar o Upvote para:</p>
            <ul className="list-disc list-inside space-y-2 mt-3 leading-relaxed">
              <li>Coletar dados de usuários sem o devido consentimento previsto na LGPD</li>
              <li>Enviar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros</li>
              <li>Tentar acessar sistemas ou dados de outros parceiros</li>
              <li>Realizar engenharia reversa, decompilação ou extração não autorizada do código</li>
              <li>Sobrecarregar intencionalmente a infraestrutura da plataforma</li>
              <li>Usar a plataforma para fins que violem qualquer lei brasileira aplicável</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Planos e pagamentos</h2>
            <div className="space-y-3 leading-relaxed">
              <p>
                O Upvote oferece planos gratuitos e pagos. Os planos pagos são cobrados mensalmente via
                Stripe. Os preços vigentes estão disponíveis na página de <Link to="/#precos" className="text-primary-600 hover:underline">Preços</Link>.
              </p>
              <p>
                O plano Free está disponível sem prazo de expiração, sujeito aos limites descritos na
                página de preços. Planos pagos são cobrados no início de cada período e não são reembolsáveis
                por períodos já utilizados.
              </p>
              <p>
                O cancelamento pode ser feito a qualquer momento pelo portal do cliente. O acesso ao plano
                pago continua até o fim do período já pago.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Propriedade intelectual</h2>
            <div className="space-y-3 leading-relaxed">
              <p>
                O Upvote e todo o seu código, design, marca e conteúdo são propriedade de Guilherme Dias Cardoso.
                Nenhum desses ativos pode ser copiado, reproduzido ou usado sem autorização expressa.
              </p>
              <p>
                Os dados de feedback coletados via widget pertencem ao Parceiro que os coletou.
                O Upvote possui licença limitada para processar esses dados exclusivamente para
                prestação do serviço contratado.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Responsabilidade dos parceiros</h2>
            <p className="leading-relaxed">
              O Parceiro é o <strong className="text-foreground">controlador de dados</strong> dos feedbacks
              coletados pelo widget instalado em seu produto. É responsabilidade do Parceiro:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 leading-relaxed">
              <li>Informar seus usuários sobre a coleta de dados via widget</li>
              <li>Cumprir as obrigações da LGPD como controlador</li>
              <li>Não instalar o widget em contextos que violem leis ou direitos de terceiros</li>
              <li>Manter a API key do widget segura e não compartilhá-la publicamente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Disponibilidade e SLA</h2>
            <p className="leading-relaxed">
              Buscamos manter a plataforma disponível continuamente, mas não garantimos 100% de uptime.
              Manutenções programadas serão comunicadas com antecedência. Planos Business possuem SLA
              diferenciado definido em contrato separado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Limitação de responsabilidade</h2>
            <p className="leading-relaxed">
              O Upvote não se responsabiliza por danos indiretos, lucros cessantes ou perda de dados
              decorrentes do uso ou impossibilidade de uso da plataforma. Nossa responsabilidade máxima
              fica limitada ao valor pago nos últimos 3 meses de serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Encerramento de conta</h2>
            <p className="leading-relaxed">
              Você pode encerrar sua conta a qualquer momento pelas configurações. Reservamo-nos o
              direito de suspender ou encerrar contas que violem estes Termos, com ou sem aviso prévio,
              dependendo da gravidade da infração.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Lei aplicável e foro</h2>
            <p className="leading-relaxed">
              Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de
              São Paulo/SP para resolução de quaisquer disputas, com renúncia a qualquer outro,
              por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Alterações nos termos</h2>
            <p className="leading-relaxed">
              Podemos atualizar estes Termos periodicamente. Notificaremos por e-mail sobre mudanças
              relevantes com pelo menos 15 dias de antecedência. O uso continuado após o prazo implica
              aceitação das novas condições.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Contato</h2>
            <p className="leading-relaxed">
              Dúvidas sobre estes Termos:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
