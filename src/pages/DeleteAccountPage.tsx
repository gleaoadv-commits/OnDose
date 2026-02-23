import { Link } from "react-router-dom";
import { Trash2, Shield, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Exclusão de Conta — OnDose
          </h1>
          <p className="text-sm text-muted-foreground">
            Aplicativo de gerenciamento de medicamentos desenvolvido por <strong className="text-foreground">OnDose</strong>
          </p>
        </div>

        {/* Steps */}
        <Card className="p-6 rounded-2xl border-border/40 space-y-5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Como solicitar a exclusão da sua conta
          </h2>

          <ol className="space-y-4 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-semibold">Acesse o aplicativo OnDose</p>
                <p className="text-muted-foreground">Faça login com seu e-mail e senha cadastrados.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-semibold">Acesse "Meu Perfil"</p>
                <p className="text-muted-foreground">No menu inferior, toque no ícone de perfil para abrir a página de configurações da sua conta.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-semibold">Role até "Excluir conta"</p>
                <p className="text-muted-foreground">Na parte inferior da página de perfil, você encontrará a seção de exclusão de conta.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-semibold">Confirme a exclusão</p>
                <p className="text-muted-foreground">
                  Toque em "Excluir minha conta" e digite <strong>EXCLUIR</strong> no campo de confirmação. 
                  Após confirmar, sua conta será removida imediatamente.
                </p>
              </div>
            </li>
          </ol>
        </Card>

        {/* Data deleted */}
        <Card className="p-6 rounded-2xl border-destructive/20 bg-destructive/5 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Dados excluídos permanentemente
          </h2>
          <p className="text-sm text-muted-foreground">
            Ao excluir sua conta, <strong className="text-foreground">todos os seguintes dados são removidos de forma permanente e irreversível</strong>, sem possibilidade de recuperação:
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            {[
              "Dados de perfil (nome, número de WhatsApp, código de usuário)",
              "Todos os medicamentos cadastrados e configurações de doses",
              "Histórico completo de doses tomadas (agenda)",
              "Resultados de exames e indicadores de saúde",
              "Lembretes de exames configurados",
              "Vínculos familiares e dados de cuidadores",
              "Dados de indicações e cupons de desconto",
              "Credenciais de autenticação (e-mail e senha)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Data retention */}
        <Card className="p-6 rounded-2xl border-border/40 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Período de retenção e dados mantidos
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Nenhum dado pessoal é retido após a exclusão.</strong> A remoção é imediata e completa assim que a confirmação é realizada.
            </p>
            <p>
              <strong className="text-foreground">Planos pagos (PRO/Premium):</strong> caso você possua uma assinatura ativa, o acesso é encerrado imediatamente no momento da exclusão. Nenhum reembolso será realizado para o período restante.
            </p>
            <p>
              <strong className="text-foreground">Logs técnicos anônimos</strong> (sem dados pessoais identificáveis) podem ser retidos por até 30 dias para fins de segurança e prevenção de fraudes, conforme descrito na nossa{" "}
              <Link to="/privacidade" className="text-primary underline hover:text-primary/80">
                Política de Privacidade
              </Link>.
            </p>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-5 rounded-2xl border-border/40 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Se você não conseguir acessar sua conta para realizar a exclusão, entre em contato conosco:
          </p>
          <p className="text-sm font-semibold text-foreground">
            📧 suporte@ondose.app
          </p>
          <p className="text-xs text-muted-foreground">
            Responderemos em até 5 dias úteis com a confirmação da exclusão.
          </p>
        </Card>

        <div className="text-center pb-6">
          <Link to="/auth">
            <Button variant="outline" className="rounded-2xl">
              Voltar ao OnDose
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
