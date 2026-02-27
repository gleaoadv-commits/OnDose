const API_URL = 'https://evolution-api-production-d791.up.railway.app';
const API_KEY = 'on-dose-123';
const INSTANCE_NAME = 'OnDose';

async function getPairingCode(phoneNumber) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    };

    console.log(`Solicitando Pairing Code para o número ${phoneNumber}...`);

    try {
        const url = `${API_URL}/instance/connect/pairingCode/${INSTANCE_NAME}?number=${phoneNumber}`;
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        console.log("Resposta da API:", JSON.stringify(data, null, 2));

        if (data.code) {
            console.log(`\n✅ CÓDIGO DE EMPARELHAMENTO: ${data.code}`);
            console.log("\nComo usar:");
            console.log("1. No WhatsApp, vá em Configurações > Aparelhos Conectados.");
            console.log("2. Clique em 'Conectar um aparelho'.");
            console.log("3. Escolha 'Conectar com número de telefone'.");
            console.log("4. Digite este código lá.");
        }
    } catch (err) {
        console.error("\n❌ Erro ao solicitar Pairing Code:", err.message);
    }
}

// O número deve ser passado como argumento: node pairing.cjs 5511999999999
const num = process.argv[2];
if (!num) {
    console.log("Uso: node pairing.cjs <numero_com_ddd>");
} else {
    getPairingCode(num);
}
