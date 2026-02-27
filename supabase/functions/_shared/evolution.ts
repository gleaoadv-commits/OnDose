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
            text: body,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: false
            }
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(`Evolution API error: ${JSON.stringify(result)}`);
    }
    return result;
}

export async function sendEvolutionButtons(
    apiUrl: string,
    apiKey: string,
    instance: string,
    to: string,
    title: string,
    description: string,
    footer: string,
    buttons: { id: string; label: string }[]
) {
    const url = `${apiUrl}/message/sendButtons/${instance}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "apikey": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            number: to,
            title: title,
            description: description,
            footer: footer,
            buttons: buttons.map(btn => ({
                type: "reply",
                displayText: btn.label,
                id: btn.id
            })),
            options: {
                delay: 1200,
                presence: "composing"
            }
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(`Evolution API Buttons error: ${JSON.stringify(result)}`);
    }
    return result;
}

export async function sendEvolutionList(
    apiUrl: string,
    apiKey: string,
    instance: string,
    to: string,
    title: string,
    description: string,
    buttonText: string,
    footer: string,
    sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
) {
    const url = `${apiUrl}/message/sendList/${instance}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "apikey": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            number: to,
            title: title,
            description: description,
            buttonText: buttonText,
            footerText: footer,
            sections: sections.map(sec => ({
                title: sec.title,
                rows: sec.rows.map(row => ({
                    rowId: row.id,
                    title: row.title,
                    description: row.description
                }))
            })),
            options: {
                delay: 1200,
                presence: "composing"
            }
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(`Evolution API List error: ${JSON.stringify(result)}`);
    }
    return result;
}
