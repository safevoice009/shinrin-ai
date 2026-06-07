// Vercel Serverless Function Proxy for Named Entity Recognition (NER)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // Handle body parsing safely depending on request content-type
    let text = "";
    try {
        if (typeof req.body === 'string') {
            const parsed = JSON.parse(req.body);
            text = parsed.text;
        } else if (req.body && req.body.text) {
            text = req.body.text;
        }
    } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON payload' });
    }

    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Missing required "text" field in request body' });
    }

    const hfToken = process.env.HF_ACCESS_TOKEN || "";
    const model = 'blaze999/Medical-NER';
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const headers = {
        'Content-Type': 'application/json'
    };
    if (hfToken) {
        headers['Authorization'] = `Bearer ${hfToken}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                inputs: text,
                parameters: {
                    aggregation_strategy: 'simple'
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
        return res.status(200).json(data);
    } catch (err) {
        console.error("Vercel Serverless Function NER Error:", err);
        return res.status(500).json({ error: `Serverless Function Error: ${err.message}` });
    }
}
