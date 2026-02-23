import OnDoseLogo from "../OnDoseLogo";
import { useNavigate } from "react-router-dom";

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#0D9488] text-white py-6 mt-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-sm opacity-90">OnDose</span>
          <a href="/termos" className="text-xs opacity-70 hover:opacity-100 transition-opacity">Termos</a>
        </div>
        <button
          onClick={() => navigate('/auth?mode=signup')}
          className="px-6 py-2.5 rounded-full bg-white text-[#0D9488] font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          Começar Agora — É Grátis
        </button>
        <p className="text-xs opacity-70">© All rights reserved.</p>
      </div>
    </footer>
  );
}
