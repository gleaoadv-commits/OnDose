export async function sendEvolutionMessage(
    apiUrl: string,
    apiKey: string,
    instance: string,
    to: string,
    body: string
) {
    const url = `${apiUrl}/message/sendText/${instance}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "apikey": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            number: to,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: false
            },
            textMessage: {
                text: body
            }
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(`Evolution API error: ${JSON.stringify(result)}`);
    }
    return result;
}
