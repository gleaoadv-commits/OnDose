export default function LandingFooter() {
  return (
    <footer className="bg-card border-t border-border/40 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-2xl font-bold text-primary">OnDose</div>
        <div className="flex gap-8 text-sm text-muted-foreground font-medium">
          <a href="/auth" className="hover:text-primary transition-colors">Entrar</a>
          <a href="/privacidade" className="hover:text-primary transition-colors">Privacidade</a>
          <a href="/termos" className="hover:text-primary transition-colors">Termos</a>
          <a href="#" className="hover:text-primary transition-colors">Sobre</a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} OnDose. Todos os direitos reservados.</p>
        <div className="flex gap-6 font-semibold">
          <span className="cursor-pointer hover:text-foreground">Google Play</span>
          <span className="cursor-pointer hover:text-foreground">App Store</span>
        </div>
      </div>
    </footer>
  );
}

