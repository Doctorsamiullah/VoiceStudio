import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon, PauseIcon, XIcon, MicIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeakerSelector } from './speaker-selector-popover';
import { StyleSelector } from './style-selector-popover';
import { ExpressionPicker } from './expression-picker';
import { insertTagAtCaret } from './playground-utils';
import type { SpeechBlock, Speaker } from './playground-types';
import { WaveformPlayer } from '@/components/waveform-player';

interface SpeechBlockCardProps {
  block: SpeechBlock;
  index: number;
  speaker: Speaker;
  speakers: Speaker[];
  profiles: { id: string; name: string }[];
  disabled?: boolean;
  isPlaying?: boolean;
  onUpdateBlock(patch: Partial<SpeechBlock>): void;
  onDeleteBlock(): void;
  onSelectSpeaker(speakerId: string): void;
  onUpdateSpeaker(updated: Speaker): void;
  onAddSpeaker(): void;
  onAudition(): void;
}

export function SpeechBlockCard({
  block,
  speaker,
  speakers,
  profiles,
  disabled = false,
  isPlaying = false,
  onUpdateBlock,
  onDeleteBlock,
  onSelectSpeaker,
  onUpdateSpeaker,
  onAddSpeaker,
  onAudition,
}: SpeechBlockCardProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPlayer, setShowPlayer] = useState(true);

  const handleInsertTag = (tag: string) => {
    const el = textareaRef.current;
    const caret = el ? el.selectionStart : block.text.length;
    const result = insertTagAtCaret(block.text, caret, tag);
    onUpdateBlock({ text: result.text });

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(result.nextCaret, result.nextCaret);
      }
    });
  };

  return (
    <div
      data-slot="speech-block-card"
      className="group relative rounded-2xl border border-border/70 bg-card/75 p-4 shadow-xs transition-all duration-150 hover:border-border hover:shadow-md"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Speaker Selector */}
          <SpeakerSelector
            currentSpeaker={speaker}
            speakers={speakers}
            profiles={profiles}
            disabled={disabled}
            onSelectSpeaker={onSelectSpeaker}
            onUpdateSpeaker={onUpdateSpeaker}
            onAddSpeaker={onAddSpeaker}
          />

          {/* Style Selector */}
          <StyleSelector
            currentStyleId={block.style}
            disabled={disabled}
            onSelectStyle={(style, speed) => onUpdateBlock({ style, speed })}
          />

          {/* Expression Picker */}
          <ExpressionPicker disabled={disabled} onSelect={handleInsertTag} />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1">
          {/* Audition Single Block Button */}
          <Button
            size="icon-xs"
            variant="ghost"
            title={t('playground.playBlock')}
            aria-label={t('playground.playBlock')}
            disabled={disabled || !block.text.trim() || block.isGenerating}
            onClick={onAudition}
            className="text-muted-foreground hover:text-foreground"
          >
            {block.isGenerating ? (
              <Loader2Icon className="size-3.5 animate-spin text-primary" />
            ) : isPlaying ? (
              <PauseIcon className="size-3.5 text-primary fill-current" />
            ) : (
              <PlayIcon className="size-3.5 fill-current" />
            )}
          </Button>

          {/* Mic / Voice info icon */}
          <Button
            size="icon-xs"
            variant="ghost"
            title={t('playground.speakerVoiceInfo', { voice: speaker.voiceName || 'Default' })}
            aria-label={t('playground.speakerVoiceInfo', { voice: speaker.voiceName || 'Default' })}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground"
          >
            <MicIcon className="size-3.5" />
          </Button>

          {/* Delete Block Button */}
          <Button
            size="icon-xs"
            variant="ghost"
            title={t('playground.deleteBlock')}
            aria-label={t('playground.deleteBlock')}
            disabled={disabled}
            onClick={onDeleteBlock}
            className="text-muted-foreground hover:text-destructive"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={block.text}
          disabled={disabled}
          placeholder={t('playground.textPlaceholder')}
          onChange={(e) => onUpdateBlock({ text: e.target.value })}
          rows={3}
          className="w-full resize-y bg-transparent p-1 font-normal text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-0"
        />
      </div>

      {/* Optional Block Audio Player */}
      {block.audioUrl && showPlayer && (
        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <WaveformPlayer
              src={block.audioUrl}
              compact={true}
              height={28}
              source={`block-preview-${block.id}`}
            />
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-[11px] text-muted-foreground"
            onClick={() => setShowPlayer(false)}
          >
            {t('common.dismiss')}
          </Button>
        </div>
      )}
    </div>
  );
}

