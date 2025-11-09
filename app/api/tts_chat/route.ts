// app/api/tts/route.ts (TypeScript recommended; remove types if using JS)
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const elevenlabs = new ElevenLabsClient({});

// ---- Config ----
const DEFAULT_MODEL = 'eleven_turbo_v2';
const DEFAULT_FORMAT = 'mp3_44100_128'; // audio/mpeg
const MAX_TEXT_CHARS = 5000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Optional (Next.js): ensure Node runtime since the SDK uses Node/Web streams.
export const runtime = 'nodejs';

// Simple JSON helper
const json = (obj: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });

// Preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

type Body = {
  text?: string;
  voiceId?: string;
  modelId?: string;
  format?: string;           // e.g. 'mp3_44100_128', 'pcm_16000', etc.
  responseType?: 'audio' | 'json';
  filename?: string;         // optional: suggest a filename for downloads
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    // 1) Security check
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error(`[${requestId}] Missing ELEVENLABS_API_KEY`);
      return json(
        { success: false, error: 'Server configuration error: API key missing.' },
        500
      );
    }

    // 2) Parse/validate input
    let body: Body;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON body.' }, 400);
    }

    const text = (body.text ?? '').trim();
    const voiceId = (body.voiceId ?? '').trim();
    const modelId = (body.modelId ?? DEFAULT_MODEL).trim();
    const format = (body.format ?? DEFAULT_FORMAT).trim();
    const responseType =
      body.responseType ??
      // If the client prefers JSON, default to JSON, else stream audio:
      (req.headers.get('accept')?.includes('application/json') ? 'json' : 'audio');

    if (!text || !voiceId) {
      return json({ success: false, error: "Missing required fields: 'text' and 'voiceId'." }, 400);
    }
    if (text.length > MAX_TEXT_CHARS) {
      return json(
        {
          success: false,
          error: `Text too long. Limit is ${MAX_TEXT_CHARS} characters.`,
        },
        400
      );
    }

    // 3) Log (truncated) for observability
    const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
    console.log(
      `[${requestId}] TTS: voice=${voiceId} model=${modelId} format=${format} resp=${responseType} text="${preview}"`
    );

    // 4) Call ElevenLabs (returns a ReadableStream)
    // Docs: voiceId, { text, modelId, outputFormat }
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId,
      outputFormat: format,
    });

    // 5A) Stream audio directly (recommended)
    if (responseType === 'audio') {
      // Choose content type from format
      // Common ElevenLabs outputFormat -> mime hints:
      // - mp3_* -> audio/mpeg
      // - pcm_* -> audio/wave (or audio/L16 if you’re returning raw PCM)
      // - wav_* -> audio/wav
      const mime =
        format.startsWith('mp3') ? 'audio/mpeg'
        : format.startsWith('wav') ? 'audio/wav'
        : format.startsWith('pcm') ? 'audio/wave'
        : 'application/octet-stream';

      const filename = (body.filename ?? 'speech') + (mime === 'audio/mpeg' ? '.mp3'
        : mime === 'audio/wav' ? '.wav'
        : '');

      // NOTE: We intentionally don’t buffer to keep memory low and latency low.
      return new Response(audioStream as unknown as ReadableStream, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': mime,
          'Content-Disposition': `inline; filename="${filename}"`,
          // Disable caches unless you explicitly want CDN caching
          'Cache-Control': 'no-store',
        },
      });
    }

    // 5B) Fallback: Buffer -> base64 JSON (for clients that need JSON)
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    const mime =
      format.startsWith('mp3') ? 'audio/mpeg'
      : format.startsWith('wav') ? 'audio/wav'
      : format.startsWith('pcm') ? 'audio/wave'
      : 'application/octet-stream';

    return json({
      success: true,
      mimeType: mime,
      voiceId,
      modelId,
      format,
      audioBase64,
      // for clients that want a data URL directly:
      dataUrl: `data:${mime};base64,${audioBase64}`,
      requestId,
    });

  } catch (err: any) {
    // 6) Robust error mapping
    console.error(`TTS Endpoint Error [${requestId}]:`, err);

    const message = typeof err?.message === 'string' ? err.message : 'Unknown error';
    const statusFromSDK = typeof err?.status === 'number' ? err.status : undefined;

    // Heuristics if SDK bubbles HTTP details via message/status
    let clientMessage = 'An error occurred during TTS generation.';
    let status = 500;

    if (statusFromSDK === 400 || message.includes('400')) {
      clientMessage = 'Bad request to ElevenLabs. Check voiceId, modelId, text content or format.';
      status = 400;
    } else if (statusFromSDK === 401 || message.includes('401')) {
      clientMessage = 'Unauthorized with ElevenLabs. Check API key.';
      status = 401;
    } else if (statusFromSDK === 404 || message.includes('404')) {
      clientMessage = 'Voice or resource not found. Verify voiceId.';
      status = 404;
    } else if (statusFromSDK === 429 || message.includes('429')) {
      clientMessage = 'Rate limit exceeded. Please retry later.';
      status = 429;
    } else if (statusFromSDK === 503 || message.includes('503')) {
      clientMessage = 'ElevenLabs is temporarily unavailable. Please try again.';
      status = 503;
    }

    return json(
      {
        success: false,
        error: clientMessage,
        details: message,
        requestId,
      },
      status
    );
  }
}
