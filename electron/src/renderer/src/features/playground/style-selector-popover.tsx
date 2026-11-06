import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/popover';
import { ChevronDownIcon, CheckIcon, Wand2Icon } from 'lucide-react';
import { PLAYGROUND_STYLES } from './playground-types';

interface StyleSelectorProps {
  currentStyleId: string;
  disabled?: boolean;
  onSelectStyle(styleId: string, speed: number): void;
}

export function StyleSelector({
  currentStyleId,
  disabled = false,
  onSelectStyle,
}: StyleSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const activeStyle = PLAYGROUND_STYLES.find((s) => s.id === currentStyleId) || PLAYGROUND_STYLES[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-label={t('playground.chooseStyle')}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <Wand2Icon className="size-3 text-muted-foreground" />
            <span>
              {activeStyle.id === 'natural'
                ? t('playground.style')
                : t(activeStyle.labelKey)}
            </span>
            <ChevronDownIcon className="size-3 text-muted-foreground ml-0.5" />
          </button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-48 p-1.5 shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md rounded-xl"
      >
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
          {t('playground.speechStyle')}
        </div>
        <div className="space-y-0.5 my-1">
          {PLAYGROUND_STYLES.map((style) => {
            const isSelected = style.id === currentStyleId;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  onSelectStyle(style.id, style.speed);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-muted/70 transition-colors text-left"
              >
                <span>{t(style.labelKey)}</span>
                {isSelected && <CheckIcon className="size-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

