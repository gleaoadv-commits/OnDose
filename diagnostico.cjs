const API_URL = 'https://evolution-api-production-d791.up.railway.app';
const API_KEY = 'on-dose-123';
const INSTANCE_NAME = 'OnDose';

async function diagnose() {
    console.log(`Testando conexão com ${API_URL}...`);

    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    };

    try {
        console.log("1. Tentando listar instâncias...");
        const resList = await fetch(`${API_URL}/instance/fetchInstances`, { headers });
        const list = await resList.json();
        console.log("   Resultado:", JSON.stringify(list, null, 2));

        console.log("\n2. Tentando criar instância 'OnDose'...");
        const resCreate = await fetch(`${API_URL}/instance/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                instanceName: INSTANCE_NAME,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            })
        });

        const createResult = await resCreate.json();
        console.log(`   Status: ${resCreate.status}`);
        console.log("   Resposta:", JSON.stringify(createResult, null, 2));

        if (resCreate.status === 403) {
            console.log("\n⚠️ ERRO 403 IDENTIFICADO.");
            console.log("Isso geralmente significa que a Evolution API está configurada para NÃO permitir a criação de instâncias via API sem uma chave global administrativa diferente, ou que o plano no Railway atingiu algum limite.");
        }

    } catch (err) {
        console.error("\n❌ Erro na execução:", err.message);
    }
}

diagnose();
