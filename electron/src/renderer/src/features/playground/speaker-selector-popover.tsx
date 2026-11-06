import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/popover';
import { ChevronDownIcon, PlusIcon, UserCheckIcon, Settings2Icon } from 'lucide-react';
import type { Speaker } from './playground-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// @ts-expect-error shared JSX component has no declaration file
import VoiceSelector from '@shared/components/VoiceSelector';

interface SpeakerSelectorProps {
  currentSpeaker: Speaker;
  speakers: Speaker[];
  profiles: { id: string; name: string }[];
  disabled?: boolean;
  onSelectSpeaker(speakerId: string): void;
  onUpdateSpeaker(updated: Speaker): void;
  onAddSpeaker(): void;
}

export function SpeakerSelector({
  currentSpeaker,
  speakers,
  profiles,
  disabled = false,
  onSelectSpeaker,
  onUpdateSpeaker,
  onAddSpeaker,
}: SpeakerSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              aria-label={t('playground.chooseSpeaker')}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              <span
                className="size-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: currentSpeaker.color || '#3B82F6' }}
              />
              <span className="font-semibold">{currentSpeaker.name}</span>
              <ChevronDownIcon className="size-3 text-muted-foreground ml-0.5" />
            </button>
          }
        />
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-72 p-2 shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md rounded-xl"
        >
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            {t('playground.selectSpeaker')}
          </div>
          <div className="space-y-1 my-1">
            {speakers.map((spk) => {
              const isSelected = spk.id === currentSpeaker.id;
              return (
                <div
                  key={spk.id}
                  className="group flex items-center justify-between rounded-lg p-1.5 hover:bg-muted/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSpeaker(spk.id);
                      setOpen(false);
                    }}
                    className="flex flex-1 items-center gap-2 text-left text-xs font-medium"
                  >
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: spk.color }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{spk.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {spk.voiceName || t('playground.defaultVoice')}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    {isSelected && <UserCheckIcon className="size-3.5 text-primary mr-1" />}
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      title={t('playground.editSpeakerVoice')}
                      onClick={() => {
                        setEditingSpeaker(spk);
                        setOpen(false);
                      }}
                    >
                      <Settings2Icon className="size-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border/60 pt-1.5 mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start gap-1.5 text-xs h-8"
              onClick={() => {
                onAddSpeaker();
                setOpen(false);
              }}
            >
              <PlusIcon className="size-3.5" />
              {t('playground.addSpeaker')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Edit Speaker Dialog */}
      {editingSpeaker && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold">{t('playground.editSpeaker')}</h3>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                {t('playground.speakerName')}
              </label>
              <Input
                value={editingSpeaker.name}
                onChange={(e) =>
                  setEditingSpeaker({ ...editingSpeaker, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                {t('playground.assignedVoice')}
              </label>
              <VoiceSelector
                value={editingSpeaker.voiceId}
                onChange={(voiceId: string) => {
                  const resolvedProfile = profiles.find((p) => p.id === voiceId);
                  setEditingSpeaker({
                    ...editingSpeaker,
                    voiceId,
                    voiceName: resolvedProfile ? resolvedProfile.name : 'Default Voice',
                  });
                }}
                profiles={profiles}
                gallery={true}
                engineDefault={true}
                menuPortal={true}
                ariaLabel={t('playground.assignedVoice')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingSpeaker(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onUpdateSpeaker(editingSpeaker);
                  setEditingSpeaker(null);
                }}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

