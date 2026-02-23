const fs = require('fs');

// CONFIGURAÇÃO
let API_URL = 'evolution-api-production-d791.up.railway.app';
const API_KEY = 'on-dose-123';
const INSTANCE_NAME = 'OnDoseV2';

if (!API_URL.startsWith('http')) API_URL = `https://${API_URL}`;
API_URL = API_URL.replace(/\/$/, "");

async function connect() {
    console.log("🚀 Iniciando LIMPEZA e CONEXÃO (Não desista, estamos chegando!)...");

    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    };

    try {
        // 1. Tentar DELETAR para começar do zero (Limpeza)
        console.log(`\n1. Fazendo limpeza da instância '${INSTANCE_NAME}'...`);
        await fetch(`${API_URL}/instance/logout/${INSTANCE_NAME}`, { method: 'DELETE', headers: headers });
        await fetch(`${API_URL}/instance/delete/${INSTANCE_NAME}`, { method: 'DELETE', headers: headers });
        console.log("   🧹 Limpeza concluída.");

        // 2. Criar Instância FRESH
        console.log(`\n2. Criando NOVA instância '${INSTANCE_NAME}'...`);
        const resCreate = await fetch(`${API_URL}/instance/create`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                instanceName: INSTANCE_NAME,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            })
        });
        console.log(`   Status: ${resCreate.status}`);

        // 3. Loop de busca do QR Code com MAIS tempo
        console.log("\n3. Aguardando o WhatsApp inicializar (isso leva uns 20 segundos)...");
        console.log("   Vá preparando seu celular no 'Aparelhos Conectados'...");

        for (let i = 1; i <= 8; i++) {
            await new Promise(r => setTimeout(r, 4000));
            console.log(`   Tentativa ${i} de 8...`);

            const resQr = await fetch(`${API_URL}/instance/connect/${INSTANCE_NAME}`, { headers: headers });
            const qrText = await resQr.text();

            try {
                const qrData = JSON.parse(qrText);

                if (qrData.base64) {
                    const base64Data = qrData.base64.replace(/^data:image\/png;base64,/, "");
                    fs.writeFileSync("qrcode.png", base64Data, 'base64');
                    console.log("\n✅ CONSEGUIMOS! O arquivo 'qrcode.png' foi criado com sucesso!");
                    console.log("👉 Abra agora o arquivo 'qrcode.png' na sua pasta e ESCANEIE!");
                    return;
                } else if (qrData.instance && qrData.instance.state === 'open') {
                    console.log("\n📱 STATUS: Seu WhatsApp já está CONECTADO!");
                    return;
                }
            } catch (e) {
                // Continua tentando
            }
        }

        console.log("\n⚠️ A API ainda não gerou o QR Code.");
        console.log("Dica Final: Tente abrir o site https://painel.evapi.com.br/ e use sua URL e Chave lá.");

    } catch (err) {
        console.error("\n❌ Erro crítico:", err.message);
    }
}

connect();
