import { useNavigate } from "react-router-dom";
import OnDoseLogo from "@/components/OnDoseLogo";

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/30 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <OnDoseLogo size="md" variant="text" />
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">Entrar</button>
            <a href="/termos" className="hover:text-foreground transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground pt-4 border-t border-border/20">
          <span>Presented by OnDose</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
