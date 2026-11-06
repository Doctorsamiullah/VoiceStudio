import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/popover';
import { Button } from '@/components/ui/button';
import { EXPRESSION_TAGS } from './playground-types';
import { Code2Icon, SparklesIcon, TimerIcon, LaughIcon } from 'lucide-react';

interface ExpressionPickerProps {
  disabled?: boolean;
  onSelect(tag: string): void;
}

export function ExpressionPicker({ disabled = false, onSelect }: ExpressionPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleSelect = (tag: string) => {
    onSelect(tag);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-label={t('playground.addExpression')}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <span className="font-mono text-[11px] text-muted-foreground">&lt; &gt;</span>
            <span>+ {t('playground.expression')}</span>
          </button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-2.5 shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md rounded-xl"
      >
        <div className="mb-2 px-1 text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <SparklesIcon className="size-3.5 text-primary" />
            {t('playground.expressionTags')}
          </span>
          <span className="text-[10px] text-muted-foreground/70">Type &apos;&lt;&apos; in text</span>
        </div>

        <div className="space-y-2">
          {/* Emotions & Reactions */}
          <div>
            <span className="px-1 text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1 mb-1">
              <LaughIcon className="size-3" />
              {t('playground.categoryEmotions')}
            </span>
            <div className="flex flex-wrap gap-1">
              {EXPRESSION_TAGS.filter((e) => e.category === 'emotion').map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => handleSelect(item.tag)}
                  title={item.description}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-mono font-medium hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Vocal / Style */}
          <div>
            <span className="px-1 text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1 mb-1">
              <Code2Icon className="size-3" />
              {t('playground.categoryVocal')}
            </span>
            <div className="flex flex-wrap gap-1">
              {EXPRESSION_TAGS.filter((e) => e.category === 'vocal' || e.category === 'style').map(
                (item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleSelect(item.tag)}
                    title={item.description}
                    className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-mono font-medium hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                  >
                    {item.tag}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Timing / Pauses */}
          <div>
            <span className="px-1 text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1 mb-1">
              <TimerIcon className="size-3" />
              {t('playground.categoryTiming')}
            </span>
            <div className="flex flex-wrap gap-1">
              {EXPRESSION_TAGS.filter((e) => e.category === 'timing').map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => handleSelect(item.tag)}
                  title={item.description}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-mono font-medium hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>

          {/* VoiceStudio Brackets */}
          <div>
            <span className="px-1 text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1 mb-1">
              {t('playground.categoryBrackets')}
            </span>
            <div className="flex flex-wrap gap-1">
              {EXPRESSION_TAGS.filter((e) => e.category === 'brackets').map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => handleSelect(item.tag)}
                  title={item.description}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-mono font-medium hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

