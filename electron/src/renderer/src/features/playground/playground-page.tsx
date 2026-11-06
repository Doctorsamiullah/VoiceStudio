import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  PlayIcon,
  DownloadIcon,
  SparklesIcon,
  RotateCcwIcon,
  LayersIcon,
  Loader2Icon,
  Volume2Icon,
} from 'lucide-react';
import { WorkspaceHeader } from '@/components/app-shell/workspace-header';
import { Button } from '@/components/ui/button';
import { SpeechBlockCard } from './speech-block-card';
import {
  INITIAL_BLOCKS,
  INITIAL_SPEAKERS,
  PLAYGROUND_STYLES,
  SPEAKER_COLORS,
  type PlaygroundDraft,
  type Speaker,
  type SpeechBlock,
} from './playground-types';
import {
  calculateDialogueStats,
  formatSecondsClock,
  normalizePlaygroundText,
} from './playground-utils';
import { useProfiles } from '@/hooks/use-profiles';
import { apiFetch } from '@/lib/api/client';
import { saveLocalFile } from '@/lib/local-export';
import { WaveformPlayer } from '@/components/waveform-player';
import { exportStoryAudio, exportStems } from '@shared/utils/storyExport';
import { toast } from 'sonner';

const STORAGE_KEY = 'voicestudio.playground.draft.v1';

function loadPersistedDraft(): PlaygroundDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to defaults
  }
  return {
    title: 'Playground',
    speakers: INITIAL_SPEAKERS,
    blocks: INITIAL_BLOCKS,
    pauseMs: 350,
  };
}

export function PlaygroundPage() {
  const { t } = useTranslation();
  const { data: profiles = [] } = useProfiles();

  const [draft, setDraft] = useState<PlaygroundDraft>(loadPersistedDraft);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [masterAudioBlob, setMasterAudioBlob] = useState<Blob | null>(null);
  const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(null);
  const [activeAuditionId, setActiveAuditionId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist draft on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage quota or error safe
    }
  }, [draft]);

  // Clean up audio URL
  useEffect(() => {
    return () => {
      if (masterAudioUrl) URL.revokeObjectURL(masterAudioUrl);
    };
  }, [masterAudioUrl]);

  // Compute live stats
  const stats = useMemo(
    () => calculateDialogueStats(draft.blocks, draft.pauseMs),
    [draft.blocks, draft.pauseMs],
  );

  // Add new speech block, alternating speaker automatically
  const handleAddBlock = () => {
    const lastBlock = draft.blocks[draft.blocks.length - 1];
    let nextSpeakerId = draft.speakers[0]?.id || 'speaker-1';

    if (lastBlock && draft.speakers.length > 1) {
      const lastIndex = draft.speakers.findIndex((s) => s.id === lastBlock.speakerId);
      const nextIndex = (lastIndex + 1) % draft.speakers.length;
      nextSpeakerId = draft.speakers[nextIndex].id;
    }

    const newBlock: SpeechBlock = {
      id: crypto.randomUUID(),
      speakerId: nextSpeakerId,
      style: 'natural',
      speed: 1.0,
      text: '',
    };

    setDraft((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const handleUpdateBlock = (id: string, patch: Partial<SpeechBlock>) => {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const handleDeleteBlock = (id: string) => {
    if (draft.blocks.length <= 1) {
      // Keep at least one block
      setDraft((prev) => ({
        ...prev,
        blocks: [
          {
            id: crypto.randomUUID(),
            speakerId: prev.speakers[0]?.id || 'speaker-1',
            style: 'natural',
            speed: 1.0,
            text: '',
          },
        ],
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  const handleSelectSpeaker = (blockId: string, speakerId: string) => {
    handleUpdateBlock(blockId, { speakerId });
  };

  const handleUpdateSpeaker = (updated: Speaker) => {
    setDraft((prev) => ({
      ...prev,
      speakers: prev.speakers.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleAddSpeaker = () => {
    const nextIdx = draft.speakers.length;
    const newSpeaker: Speaker = {
      id: `speaker-${nextIdx + 1}`,
      name: `Speaker ${nextIdx + 1}`,
      voiceId: '',
      voiceName: 'Default Voice',
      color: SPEAKER_COLORS[nextIdx % SPEAKER_COLORS.length],
    };
    setDraft((prev) => ({
      ...prev,
      speakers: [...prev.speakers, newSpeaker],
    }));
  };

  // Audition / Play a single speech block
  const handleAuditionBlock = async (block: SpeechBlock) => {
    if (!block.text.trim()) return;

    handleUpdateBlock(block.id, { isGenerating: true });
    setActiveAuditionId(block.id);

    try {
      const speaker = draft.speakers.find((s) => s.id === block.speakerId);
      const styleObj = PLAYGROUND_STYLES.find((s) => s.id === block.style);

      const normalizedText = normalizePlaygroundText(block.text);

      const formData = new FormData();
      formData.set('text', normalizedText);
      formData.set('speed', String(block.speed || styleObj?.speed || 1.0));
      if (speaker?.voiceId) {
        formData.set('profile_id', speaker.voiceId);
      }
      if (styleObj?.instruct) {
        formData.set('instruct', styleObj.instruct);
      }

      const response = await apiFetch('/generate', {
        method: 'POST',
        body: formData,
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      handleUpdateBlock(block.id, { audioUrl: url, isGenerating: false });
    } catch (err) {
      console.error('Failed to audition block', err);
      toast.error(t('playground.previewFailed'));
      handleUpdateBlock(block.id, { isGenerating: false });
    } finally {
      setActiveAuditionId(null);
    }
  };

  // Run all speech blocks and stitch into one audio file
  const handleRunAll = async () => {
    const validBlocks = draft.blocks.filter((b) => b.text.trim());
    if (validBlocks.length === 0) {
      toast.error(t('playground.emptyBlocksError'));
      return;
    }

    setIsGeneratingAll(true);
    setProgress({ done: 0, total: validBlocks.length });

    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    try {
      // Map valid speech blocks to tracks for exportStoryAudio
      const tracks = validBlocks.map((block) => {
        const speaker = draft.speakers.find((s) => s.id === block.speakerId);
        const styleObj = PLAYGROUND_STYLES.find((s) => s.id === block.style);
        const normalized = normalizePlaygroundText(block.text);

        // Add pause after block if not last block
        const textWithInterPause = `${normalized} [pause ${draft.pauseMs / 1000}s]`;

        return {
          id: block.id,
          character: speaker?.name || 'Speaker',
          profileId: speaker?.voiceId || null,
          speed: block.speed || styleObj?.speed || 1.0,
          text: textWithInterPause,
        };
      });

      const resolveOpts = (tk: { profileId: string | null; speed: number }) => ({
        profileId: tk.profileId,
        speed: tk.speed,
      });

      const fetchChunkBlob = async (text: string, profileId: string | null, speed: number | null) => {
        currentController.signal.throwIfAborted();
        const formData = new FormData();
        formData.set('text', text);
        formData.set('speed', String(speed || 1.0));
        formData.set('num_step', '32');
        if (profileId) formData.set('profile_id', profileId);

        const response = await apiFetch('/generate', {
          method: 'POST',
          body: formData,
          signal: currentController.signal,
        });
        return response.blob();
      };

      const result = await exportStoryAudio(
        tracks,
        resolveOpts,
        fetchChunkBlob,
        (done, total) => setProgress({ done, total }),
      );

      setMasterAudioBlob(result.blob);
      if (masterAudioUrl) URL.revokeObjectURL(masterAudioUrl);
      const url = URL.createObjectURL(result.blob);
      setMasterAudioUrl(url);

      toast.success(t('playground.generationSuccess'));
    } catch (err) {
      if (!currentController.signal.aborted) {
        console.error('Generation error', err);
        toast.error(t('playground.generationFailed'));
      }
    } finally {
      setIsGeneratingAll(false);
      abortControllerRef.current = null;
    }
  };

  // Download the combined master audio file
  const handleDownloadMaster = async () => {
    if (!masterAudioBlob) {
      toast.error(t('playground.noAudioToDownload'));
      return;
    }
    await saveLocalFile(masterAudioBlob, 'playground-dialogue.wav');
    toast.success(t('playground.downloadStarted'));
  };

  // Export individual speaker stems
  const handleExportStems = async () => {
    const validBlocks = draft.blocks.filter((b) => b.text.trim());
    if (validBlocks.length === 0) return;

    setIsGeneratingAll(true);
    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    try {
      const tracks = validBlocks.map((block) => {
        const speaker = draft.speakers.find((s) => s.id === block.speakerId);
        const styleObj = PLAYGROUND_STYLES.find((s) => s.id === block.style);
        return {
          id: block.id,
          character: speaker?.name || 'Speaker',
          profileId: speaker?.voiceId || null,
          speed: block.speed || styleObj?.speed || 1.0,
          text: normalizePlaygroundText(block.text),
        };
      });

      const resolveOpts = (tk: { profileId: string | null; speed: number }) => ({
        profileId: tk.profileId,
        speed: tk.speed,
      });

      const fetchChunkBlob = async (text: string, profileId: string | null, speed: number | null) => {
        currentController.signal.throwIfAborted();
        const formData = new FormData();
        formData.set('text', text);
        formData.set('speed', String(speed || 1.0));
        formData.set('num_step', '32');
        if (profileId) formData.set('profile_id', profileId);

        const response = await apiFetch('/generate', {
          method: 'POST',
          body: formData,
          signal: currentController.signal,
        });
        return response.blob();
      };

      const stems = await exportStems(tracks, resolveOpts, fetchChunkBlob, (done, total) =>
        setProgress({ done, total }),
      );

      for (const stem of stems) {
        const sanitized = stem.character.replace(/[^a-zA-Z0-9_-]/g, '_');
        await saveLocalFile(stem.blob, `${sanitized}_stem.wav`);
      }

      toast.success(t('playground.stemsExported'));
    } catch (err) {
      if (!currentController.signal.aborted) {
        toast.error(t('playground.stemsFailed'));
      }
    } finally {
      setIsGeneratingAll(false);
      abortControllerRef.current = null;
    }
  };

  // Load sample dialogue
  const handleLoadSample = () => {
    setDraft({
      title: 'Playground',
      speakers: INITIAL_SPEAKERS,
      blocks: INITIAL_BLOCKS,
      pauseMs: 350,
    });
    setMasterAudioBlob(null);
    if (masterAudioUrl) URL.revokeObjectURL(masterAudioUrl);
    setMasterAudioUrl(null);
    toast.success(t('playground.sampleLoaded'));
  };

  // Clear all blocks
  const handleClearAll = () => {
    setDraft((prev) => ({
      ...prev,
      blocks: [
        {
          id: crypto.randomUUID(),
          speakerId: prev.speakers[0]?.id || 'speaker-1',
          style: 'natural',
          speed: 1.0,
          text: '',
        },
      ],
    }));
    setMasterAudioBlob(null);
    if (masterAudioUrl) URL.revokeObjectURL(masterAudioUrl);
    setMasterAudioUrl(null);
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGeneratingAll) {
          void handleRunAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draft, isGeneratingAll]);

  return (
    <div data-slot="playground-page" className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Titlebar Header */}
      <WorkspaceHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              {t('playground.title')}
            </h1>
          </div>
          <span className="hidden sm:inline-block h-4 w-px bg-border/60" />
          <span className="hidden sm:inline-block text-xs text-muted-foreground">
            {t('playground.subtitle')}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadSample}
            disabled={isGeneratingAll}
            className="text-xs h-8 gap-1.5"
            title={t('playground.loadSampleHint')}
          >
            <RotateCcwIcon className="size-3.5" />
            <span className="hidden md:inline">{t('playground.loadSample')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={isGeneratingAll}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            {t('common.clear')}
          </Button>
        </div>
      </WorkspaceHeader>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8 max-w-4xl mx-auto w-full space-y-4">
        {/* Dialogue Blocks List */}
        <div className="space-y-3">
          {draft.blocks.map((block, index) => {
            const speaker =
              draft.speakers.find((s) => s.id === block.speakerId) || draft.speakers[0];
            return (
              <SpeechBlockCard
                key={block.id}
                index={index}
                block={block}
                speaker={speaker}
                speakers={draft.speakers}
                profiles={profiles}
                disabled={isGeneratingAll}
                isPlaying={activeAuditionId === block.id}
                onUpdateBlock={(patch) => handleUpdateBlock(block.id, patch)}
                onDeleteBlock={() => handleDeleteBlock(block.id)}
                onSelectSpeaker={(speakerId) => handleSelectSpeaker(block.id, speakerId)}
                onUpdateSpeaker={handleUpdateSpeaker}
                onAddSpeaker={handleAddSpeaker}
                onAudition={() => void handleAuditionBlock(block)}
              />
            );
          })}
        </div>

        {/* Add Speech Block Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddBlock}
            disabled={isGeneratingAll}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/20 py-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-muted/40 hover:text-foreground transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PlusIcon className="size-4 group-hover:scale-110 transition-transform text-primary" />
            <span>{t('playground.addSpeechBlock')}</span>
          </button>
        </div>

        {/* Master Output Audio Player Card (when generated) */}
        {masterAudioUrl && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2Icon className="size-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {t('playground.generatedMasterAudio')}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({stats.wordCount} {t('playground.words')})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportStems}
                  disabled={isGeneratingAll}
                  className="h-8 gap-1.5 text-xs"
                >
                  <LayersIcon className="size-3.5" />
                  {t('playground.exportStems')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadMaster}
                  className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground shadow-sm"
                >
                  <DownloadIcon className="size-3.5" />
                  {t('playground.saveAudioFile')}
                </Button>
              </div>
            </div>

            <WaveformPlayer
              src={masterAudioUrl}
              height={44}
              showWaveform={true}
              source="playground-master"
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="shrink-0 border-t border-border/60 bg-card/90 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Stats & Pauses */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {draft.blocks.length} {t('playground.blocks')} · ~{formatSecondsClock(stats.estimatedSeconds)}
          </span>
          <span className="hidden sm:inline-block h-3 w-px bg-border/60" />
          <div className="hidden sm:flex items-center gap-1.5">
            <span>{t('playground.gap')}:</span>
            <input
              type="number"
              min="0"
              max="2000"
              step="50"
              value={draft.pauseMs}
              onChange={(e) =>
                setDraft((p) => ({ ...p, pauseMs: Math.max(0, Number(e.target.value) || 0) }))
              }
              className="h-6 w-14 rounded border border-border/60 bg-background px-1.5 text-xs font-mono text-center outline-none focus:border-primary"
            />
            <span>ms</span>
          </div>
        </div>

        {/* Right: Run / Generate Button */}
        <div className="flex items-center gap-2">
          {masterAudioBlob && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadMaster}
              disabled={isGeneratingAll}
              className="h-9 gap-1.5 text-xs"
            >
              <DownloadIcon className="size-3.5" />
              <span className="hidden md:inline">{t('playground.saveAudioFile')}</span>
            </Button>
          )}

          <Button
            size="default"
            disabled={isGeneratingAll}
            onClick={() => void handleRunAll()}
            className="h-9 px-5 gap-2 font-medium bg-primary text-primary-foreground shadow-sm hover:brightness-105 active:scale-98 transition-all"
          >
            {isGeneratingAll ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>
                  {t('playground.generating')} ({progress.done}/{progress.total})
                </span>
              </>
            ) : (
              <>
                <PlayIcon className="size-4 fill-current" />
                <span>{t('playground.run')}</span>
                <kbd className="hidden sm:inline-block rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono">
                  Ctrl ↵
                </kbd>
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

