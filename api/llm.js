// Vercel Serverless Function Proxy for LLM queries (Clinical Copilot, Anatomy custom, and Simulator Patient chatbot)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    let prompt = "";
    let systemInstruction = "";
    try {
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }
        prompt = body.prompt;
        systemInstruction = body.systemInstruction || "";
    } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON payload' });
    }

    if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Missing required "prompt" field' });
    }

    const hfToken = process.env.HF_ACCESS_TOKEN || "";
    const model = 'Qwen/Qwen2.5-7B-Instruct';
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const headers = {
        'Content-Type': 'application/json'
    };
    if (hfToken) {
        headers['Authorization'] = `Bearer ${hfToken}`;
    }

    const fullInput = systemInstruction 
        ? `<|im_start|>system\n${systemInstruction}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`
        : prompt;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                inputs: fullInput,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    return_full_text: false
                },
                options: {
                    wait_for_model: true
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `Hugging Face API returned error: ${errText}` });
        }

        const data = await response.json();
        if (Array.isArray(data) && data[0] && data[0].generated_text) {
            let text = data[0].generated_text.trim();
            // Remove conversational scaffolding if present
            text = text.replace(/<\|im_end\|>$/, '').replace(/<\|im_start\|>assistant/, '').trim();
            return res.status(200).json({ generated_text: text });
        }

        return res.status(500).json({ error: "Invalid response format from Hugging Face model" });
    } catch (err) {
        console.error("Vercel Serverless Function LLM Error:", err);
        return res.status(500).json({ error: `Serverless Function Error: ${err.message}` });
    }
}
