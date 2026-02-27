const fs = require('fs');

const API_URL = 'https://evolution-api-production-d791.up.railway.app';
const API_KEY = 'on-dose-123';
const INSTANCE_NAME = 'OnDose';

async function waitQR() {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    };

    console.log(`Buscando QR Code para a instância '${INSTANCE_NAME}'...`);

    for (let i = 1; i <= 20; i++) {
        await new Promise(r => setTimeout(r, 5000));
        console.log(`Tentativa ${i} de 20...`);

        try {
            const resQr = await fetch(`${API_URL}/instance/connect/${INSTANCE_NAME}`, { headers });
            const data = await resQr.json();

            if (data.base64) {
                const base64Data = data.base64.replace(/^data:image\/png;base64,/, "");
                fs.writeFileSync("qrcode.png", base64Data, 'base64');
                console.log("\n✅ QR CODE GERADO COM SUCESSO!");
                console.log("👉 Abra o arquivo 'qrcode.png' e escaneie.");
                return;
            } else if (data.instance && data.instance.state === 'open') {
                console.log("\n📱 STATUS: Já está CONECTADO!");
                return;
            } else {
                console.log(`   Estado atual: ${data.instance?.state || 'Aguardando...'}`);
            }
        } catch (e) {
            console.log(`   Erro na tentativa: ${e.message}`);
        }
    }

    console.log("\n⚠️ O QR Code ainda não apareceu. Tente abrir o painel da Evolution API no seu navegador para ver o que está acontecendo.");
}

waitQR();
