import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import OnDoseLogo from "../components/OnDoseLogo";

export default function TermsPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length <= 1) {
      navigate("/auth");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <OnDoseLogo size="sm" variant="full" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Termos e Condições de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: fevereiro de 2026</p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ao criar uma conta e utilizar o aplicativo <strong>OnDose</strong>, você declara ter lido, compreendido e concordado com os presentes Termos e Condições de Uso, bem como com nossa Política de Privacidade. Caso não concorde com qualquer disposição deste documento, solicitamos que não utilize nossos serviços.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Descrição do Serviço</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose é um aplicativo de apoio ao gerenciamento de medicamentos, desenvolvido para auxiliar usuários no controle de horários, doses e histórico de medicamentos. O aplicativo também oferece funcionalidades como identificação de medicamentos, consulta ao bulário da ANVISA, localização de farmácias próximas e relatórios de aderência.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. Isenção de Responsabilidade Médica</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>IMPORTANTE:</strong> O OnDose é uma ferramenta de <strong>apoio e organização</strong>, e não substitui em nenhuma hipótese a orientação de profissionais de saúde habilitados. As informações disponibilizadas no aplicativo, incluindo dados de medicamentos, posologias, identificação por imagem e sugestões geradas por inteligência artificial, são meramente informativas e de caráter educacional.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Consulte sempre um médico ou farmacêutico antes de iniciar, alterar ou interromper qualquer tratamento medicamentoso. A equipe do OnDose não se responsabiliza por quaisquer danos à saúde decorrentes do uso inadequado das informações fornecidas pelo aplicativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. Cadastro e Conta do Usuário</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para utilizar o OnDose, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Em caso de uso não autorizado, notifique-nos imediatamente.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O cadastro é permitido apenas para maiores de 18 anos ou com consentimento expresso dos responsáveis legais.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">5. Privacidade e Dados Pessoais</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os dados coletados pelo OnDose são tratados em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Coletamos apenas os dados necessários para a prestação dos serviços, incluindo nome, e-mail, informações de medicamentos cadastrados e dados de uso do aplicativo.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seus dados de saúde são tratados com máxima confidencialidade e não são compartilhados com terceiros sem seu consentimento explícito, exceto quando exigido por lei.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">6. Uso Aceitável</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você concorda em utilizar o OnDose exclusivamente para fins lícitos e pessoais. É proibido:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Utilizar o aplicativo para fins ilegais ou fraudulentos;</li>
              <li>Compartilhar ou revender acesso à plataforma;</li>
              <li>Tentar acessar áreas restritas ou dados de outros usuários;</li>
              <li>Interferir no funcionamento do serviço ou de seus servidores;</li>
              <li>Reproduzir, copiar ou distribuir o conteúdo do aplicativo sem autorização.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">7. Planos e Pagamentos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose oferece planos gratuitos e pagos. Os planos pagos são cobrados de forma recorrente conforme o ciclo escolhido (mensal ou anual). O cancelamento pode ser realizado a qualquer momento pelo usuário, sem multa, sendo válido até o fim do período vigente já pago. Não realizamos reembolsos parciais de períodos não utilizados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">8. Funcionalidade de Familiares e Cuidadores</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O recurso de vínculo com familiares e cuidadores permite que terceiros autorizados acompanhem o gerenciamento de medicamentos de um usuário principal. O usuário principal é o único responsável por conceder e revogar esses acessos. O OnDose não se responsabiliza pelo uso indevido dessas funcionalidades entre os usuários.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">9. Disponibilidade do Serviço</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nos esforçamos para manter o OnDose disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta e nos reservamos o direito de realizar manutenções, atualizações ou suspender temporariamente o serviço sem aviso prévio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">10. Modificações dos Termos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações substanciais serão comunicadas por e-mail ou notificação no aplicativo. O uso continuado do OnDose após a publicação das alterações implica na aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">11. Rescisão</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Podemos suspender ou encerrar sua conta a qualquer momento em caso de violação destes Termos, sem prejuízo de outras medidas legais cabíveis. Você também pode excluir sua conta a qualquer momento pelo perfil do aplicativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">12. Legislação Aplicável</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de domicílio do usuário para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">13. Contato</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Em caso de dúvidas, sugestões ou reclamações, entre em contato conosco pelo e-mail: <strong>contato@ondose.app</strong>
            </p>
          </section>
        </div>

        <div className="pt-4 pb-8">
          <Button onClick={handleBack} className="w-full h-12 rounded-2xl font-bold">
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
