// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper around the Anthropic Messages API.
//
// Required .env vars:
//   ANTHROPIC_API_KEY   your Anthropic API key (https://console.anthropic.com)
//   ANTHROPIC_MODEL     defaults to "claude-sonnet-5" — change if your account
//                        uses a different model string.
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

/**
 * Send a single-turn message to Claude and return the raw text response.
 * @param {string} system - system prompt
 * @param {string} user - user message
 * @param {object} [opts]
 * @param {number} [opts.maxTokens]
 */
export const askClaude = async (system, user, opts = {}) => {
    if (!isAiConfigured()) {
        throw Object.assign(
            new Error("AI features are not configured. Set ANTHROPIC_API_KEY in the backend .env file."),
            { status: 503 }
        );
    }

    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: opts.maxTokens || 1024,
            system,
            messages: [{ role: "user", content: user }],
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw Object.assign(
            new Error(`AI request failed (${res.status}): ${body.slice(0, 300)}`),
            { status: 502 }
        );
    }

    const data = await res.json();
    const text = (data.content || [])
        .map((block) => (block.type === "text" ? block.text : ""))
        .filter(Boolean)
        .join("\n");

    return text;
};

/** Same as askClaude but strips markdown fences and JSON.parses the result. */
export const askClaudeForJson = async (system, user, opts = {}) => {
    const raw = await askClaude(
        `${system}\n\nIMPORTANT: Respond with ONLY a single valid JSON object. No markdown fences, no commentary, no preamble.`,
        user,
        opts
    );
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        throw Object.assign(new Error("AI returned an unparseable response. Please try rephrasing your request."), { status: 502 });
    }
};
