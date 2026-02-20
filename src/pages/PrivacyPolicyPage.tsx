import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import OnDoseLogo from "@/components/OnDoseLogo";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: fevereiro de 2026</p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Introdução</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A presente Política de Privacidade descreve como o aplicativo <strong>OnDose</strong> coleta, utiliza, armazena e protege os dados pessoais dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018) e demais legislações aplicáveis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Dados Coletados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose coleta os seguintes tipos de dados:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Dados de cadastro:</strong> nome, e-mail e senha;</li>
              <li><strong>Dados de saúde:</strong> medicamentos cadastrados, horários, doses, histórico de aderência e resultados de exames;</li>
              <li><strong>Dados de uso:</strong> interações com o aplicativo, preferências e configurações;</li>
              <li><strong>Dados de dispositivo:</strong> tipo de dispositivo, sistema operacional e identificadores anônimos;</li>
              <li><strong>Dados de localização:</strong> apenas quando o usuário utiliza a funcionalidade de farmácias próximas, com consentimento explícito;</li>
              <li><strong>Imagens:</strong> fotos de medicamentos e exames enviadas pelo usuário para identificação ou registro.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. Finalidade do Tratamento</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os dados coletados são utilizados para:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Gerenciar medicamentos, horários e lembretes;</li>
              <li>Gerar relatórios de aderência ao tratamento;</li>
              <li>Identificar medicamentos por imagem utilizando inteligência artificial;</li>
              <li>Consultar informações no bulário da ANVISA;</li>
              <li>Localizar farmácias próximas;</li>
              <li>Permitir o acompanhamento por familiares e cuidadores autorizados;</li>
              <li>Enviar notificações e lembretes de doses;</li>
              <li>Melhorar continuamente a experiência do usuário.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. Base Legal</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O tratamento dos dados pessoais é realizado com base no <strong>consentimento do titular</strong> (Art. 7º, I, LGPD) e na <strong>execução de contrato</strong> (Art. 7º, V, LGPD), conforme os Termos e Condições de Uso aceitos pelo usuário.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">5. Compartilhamento de Dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose <strong>não vende, aluga ou comercializa</strong> dados pessoais dos usuários. O compartilhamento ocorre apenas nas seguintes situações:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Com familiares e cuidadores:</strong> somente quando autorizado explicitamente pelo usuário;</li>
              <li><strong>Com prestadores de serviço:</strong> empresas que auxiliam na operação do aplicativo (hospedagem, processamento de pagamentos), sempre com contratos de confidencialidade;</li>
              <li><strong>Por determinação legal:</strong> quando exigido por autoridades competentes ou decisão judicial.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">6. Armazenamento e Segurança</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS/SSL) e em repouso. Adotamos medidas técnicas e administrativas adequadas para proteger os dados contra acessos não autorizados, perda, alteração ou destruição.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">7. Retenção de Dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os dados pessoais são mantidos enquanto a conta do usuário estiver ativa ou conforme necessário para cumprir obrigações legais. Após a exclusão da conta, os dados são removidos dos nossos sistemas em até 30 dias, exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">8. Direitos do Titular</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Em conformidade com a LGPD, o usuário tem direito a:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Solicitar a exclusão completa da conta e dos dados associados.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para exercer esses direitos, entre em contato pelo e-mail: <strong>contato@ondose.app</strong>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">9. Uso de Inteligência Artificial</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose utiliza recursos de inteligência artificial para funcionalidades como identificação de medicamentos por foto, sugestões de medicamentos e mensagens motivacionais. As informações geradas por IA são <strong>meramente informativas</strong> e não substituem orientação médica profissional. As imagens enviadas são processadas temporariamente e não são armazenadas para fins de treinamento de modelos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">10. Dados de Crianças e Adolescentes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose não é destinado a menores de 18 anos. O cadastro de menores requer consentimento expresso dos responsáveis legais, em conformidade com o Art. 14 da LGPD e o Estatuto da Criança e do Adolescente (ECA).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">11. Cookies e Tecnologias de Rastreamento</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OnDose pode utilizar cookies e tecnologias semelhantes para manter a sessão do usuário e melhorar a experiência de uso. Não utilizamos cookies de terceiros para fins publicitários.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">12. Alterações nesta Política</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente. Alterações substanciais serão comunicadas por e-mail ou notificação no aplicativo. Recomendamos a revisão periódica deste documento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">13. Contato</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para dúvidas, solicitações ou reclamações relacionadas à privacidade, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail: <strong>contato@ondose.app</strong>
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
