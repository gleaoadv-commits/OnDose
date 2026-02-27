const API_URL = 'http://187.77.55.115:8080';
const API_KEY = 'OnDoseAPI2026!';
const INSTANCE_NAME = 'OnDose';

async function getPairingCode(phoneNumber) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_KEY
    };

    console.log(`Solicitando Pairing Code para o número ${phoneNumber}...`);

    try {
        const url = `${API_URL}/instance/connect/${INSTANCE_NAME}?number=${phoneNumber}`;
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const data = await response.json();
        console.log("Resposta da API:", JSON.stringify(data, null, 2));

        if (data.code) {
            console.log(`\n✅ CÓDIGO DE EMPARELHAMENTO: ${data.code}`);
        } else if (data.response && data.response.message) {
            console.log(`\n❌ Mensagem da API: ${data.response.message}`);
        }
    } catch (err) {
        console.error("\n❌ Erro na execução:", err.message);
    }
}

const num = process.argv[2] || '553131579232';
getPairingCode(num);
