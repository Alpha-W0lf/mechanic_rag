/**
 * JH-67: hosted Gemini serving must not spawn the Python CLIP process.
 * Local Compose+Ollama keeps current image-channel behavior when the flag is on.
 */
import { EventEmitter } from 'events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spawn = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
  spawn,
}));

function fakeChild(exitCode = 1) {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  queueMicrotask(() => child.emit('close', exitCode));
  return child;
}

describe('hosted Gemini skips CLIP spawn (JH-67)', () => {
  beforeEach(() => {
    spawn.mockReset();
    spawn.mockImplementation(() => fakeChild(1));
    vi.stubEnv('MECHANIC_IMAGE_CHANNEL', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not spawn Python CLIP when Gemini is serving', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    const { retrieveImageChannel, HOSTED_IMAGE_CHANNEL_SKIP_REASON } =
      await import('@/server/ask_image_channel');
    const result = await retrieveImageChannel({
      vehicleId: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
      topN: 8,
    });
    expect(spawn).not.toHaveBeenCalled();
    expect(result.hits).toEqual([]);
    expect(result.degraded).toBe(true);
    expect(result.reason).toBe(HOSTED_IMAGE_CHANNEL_SKIP_REASON);
    expect(result.reason).toBe('hosted_image_channel_disabled');
  });

  it('still spawns CLIP on the local path when the image channel flag is on', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const { retrieveImageChannel } = await import('@/server/ask_image_channel');
    const result = await retrieveImageChannel({
      vehicleId: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
      topN: 8,
    });
    expect(spawn).toHaveBeenCalledTimes(1);
    const [, args] = spawn.mock.calls[0] as [string, string[]];
    expect(args).toEqual(
      expect.arrayContaining(['-m', 'mecharag.clip_query']),
    );
    expect(result.reason).toBe('clip_query_unavailable');
  });

  it('flag-off skip still wins (no spawn) even when Gemini is serving', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-hosted-key');
    vi.stubEnv('MECHANIC_IMAGE_CHANNEL', '0');
    const { retrieveImageChannel } = await import('@/server/ask_image_channel');
    const result = await retrieveImageChannel({
      vehicleId: 'fixture:honda-s2000-demo',
      question: 'What is the oil drain plug torque?',
      topN: 8,
    });
    expect(spawn).not.toHaveBeenCalled();
    expect(result.reason).toBe('image_channel_disabled');
  });
});
