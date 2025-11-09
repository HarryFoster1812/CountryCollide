import { useCallback, useEffect, useRef, useState } from 'react';

type UseTTSOptions = {
  voiceId: string;
  modelId?: string;
  format?: string; // e.g. 'mp3_44100_128'
  endpoint?: string; // default '/api/tts'
};

export function useTTS({ voiceId, modelId = 'eleven_turbo_v2', format = 'mp3_44100_128', endpoint = '/api/tts_chat' }: UseTTSOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const play = useCallback(async (text: string, filename = 'summary') => {
    if (!text || !voiceId) return;

    // Stop anything currently playing
    stop();
    setError(null);
    setIsLoading(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch(endpoint, {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'audio/*' },
        body: JSON.stringify({
          text,
          voiceId,
          modelId,
          format,
          responseType: 'audio',
          filename,
        }),
      });

      if (!res.ok) {
        const msg = `TTS failed (HTTP ${res.status})`;
        setError(msg);
        setIsLoading(false);
        return;
      }

      const blob = await res.blob(); // non-blocking for UI; only this hook "waits"
      // Clean up prior URL
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      // (Re)create the audio element if needed
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.src = url;
      audio.onended = () => setIsPlaying(false);

      await audio.play();
      setIsPlaying(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(e?.message || 'TTS error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, format, modelId, stop, voiceId]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stop();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      audioRef.current = null;
    };
  }, [stop]);

  return { play, stop, isLoading, isPlaying, error };
}
