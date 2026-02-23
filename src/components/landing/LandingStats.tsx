import { ShieldCheck, Clock } from "lucide-react";

export default function LandingStats() {
    return (
        <section className="max-w-4xl mx-auto px-6 py-24 flex flex-col md:flex-row justify-around items-center gap-12">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <div className="text-4xl font-black text-primary">98%</div>
                    <div className="text-muted-foreground font-medium text-sm">Adesão ao tratamento</div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Clock size={32} />
                </div>
                <div>
                    <div className="text-4xl font-black text-primary">24/7</div>
                    <div className="text-muted-foreground font-medium text-sm">Lembretes ativos</div>
                </div>
            </div>
        </section>
    );
}
