const fs = require('fs');

// CONFIGURAÇÃO
let API_URL = 'evolution-api-production-d791.up.railway.app';
const API_KEY = 'on-dose-123';
const INSTANCE_NAME = 'OnDose';

if (!API_URL.startsWith('http')) API_URL = `https://${API_URL}`;
API_URL = API_URL.replace(/\/$/, "");

async function connect() {
    console.log("🚀 Iniciando RESET e CONEXÃO (Não desista, estamos chegando!)...");

    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    };

    try {
        // 1. Forçar a remoção da instância se ela existir (Limpeza profunda)
        console.log(`\n1. Fazendo limpeza da instância '${INSTANCE_NAME}'...`);
        try {
            await fetch(`${API_URL}/instance/logout/${INSTANCE_NAME}`, { method: 'DELETE', headers: headers });
            await fetch(`${API_URL}/instance/delete/${INSTANCE_NAME}`, { method: 'DELETE', headers: headers });
            console.log("   🧹 Limpeza concluída.");
        } catch (e) {
            console.log("   A instância já estava limpa.");
        }

        // Aguarda 2 segundos para a API processar
        await new Promise(r => setTimeout(r, 2000));

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

        console.log(`   Status da criação: ${resCreate.status}`);

        // 3. Loop de busca do QR Code
        console.log("\n3. Aguardando a API gerar o QR Code (isso pode levar uns 30 segundos)...");
        console.log("   Prepare seu celular em 'Aparelhos Conectados'...");

        for (let i = 1; i <= 15; i++) {
            await new Promise(r => setTimeout(r, 4000));
            console.log(`   Tentativa ${i} de 15...`);

            try {
                const resQr = await fetch(`${API_URL}/instance/connect/${INSTANCE_NAME}`, { headers: headers });
                const qrData = await resQr.json();

                if (qrData.base64) {
                    const base64Data = qrData.base64.replace(/^data:image\/png;base64,/, "");
                    fs.writeFileSync("qrcode.png", base64Data, 'base64');
                    console.log("\n✅ CONSEGUIMOS! O arquivo 'qrcode.png' foi criado com sucesso!");
                    console.log("👉 Abra agora o arquivo 'qrcode.png' na pasta do projeto e ESCANEIE!");
                    return;
                } else if (qrData.instance && qrData.instance.state === 'open') {
                    console.log("\n📱 STATUS: Seu WhatsApp já está CONECTADO!");
                    return;
                }
            } catch (e) {
                // Silencioso, continua tentando
            }
        }

        console.log("\n⚠️ A API ainda não gerou o QR Code após 60 segundos.");
        console.log("Dica: Verifique se o seu Railway não está com erro nos logs.");

    } catch (err) {
        console.error("\n❌ Erro crítico:", err.message);
    }
}

connect();
