import { useNavigate } from "react-router-dom";

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/30 py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex gap-4 font-medium">
          <a href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</a>
          <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
        </div>
        <span>© {new Date().getFullYear()} OnDose</span>
      </div>
    </footer>
  );
}
