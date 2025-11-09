import { useTTS } from '@/hooks/useTTS';
import { useEffect } from 'react';

type Props = {
  text: string;
  voiceId: string;
  auto?: boolean; // optional autoplay when the plan changes
};

export const TTSPlayButton: React.FC<Props> = ({ text, voiceId, auto = false }) => {
  const { play, stop, isLoading, isPlaying, error } = useTTS({ voiceId });

  useEffect(() => {
    if (auto) play(text, 'travel-summary');
    // stop when unmounting or text changes mid-play
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, auto]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (isPlaying ? stop() : play(text, 'travel-summary'))}
        className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
        disabled={isLoading || !text}
        title={isPlaying ? 'Stop' : 'Play summary'}
      >
        {isLoading ? 'Generating…' : isPlaying ? 'Stop' : '► Play Summary'}
      </button>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
};
