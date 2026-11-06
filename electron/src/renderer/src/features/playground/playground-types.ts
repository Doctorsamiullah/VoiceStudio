export interface Speaker {
  id: string;
  name: string;
  voiceId: string;
  voiceName: string;
  color: string;
}

export interface SpeechBlock {
  id: string;
  speakerId: string;
  style: string;
  speed: number;
  text: string;
  audioUrl?: string;
  isGenerating?: boolean;
}

export interface PlaygroundDraft {
  title: string;
  speakers: Speaker[];
  blocks: SpeechBlock[];
  pauseMs: number;
}

export const SPEAKER_COLORS = [
  '#3B82F6', // Blue (Speaker 1 default in Google AI Studio)
  '#F59E0B', // Amber (Speaker 2 default in Google AI Studio)
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export const PLAYGROUND_STYLES = [
  { id: 'natural', labelKey: 'playground.styles.natural', speed: 1.0, instruct: '' },
  { id: 'cheerful', labelKey: 'playground.styles.cheerful', speed: 1.06, instruct: 'Cheerful, upbeat and enthusiastic' },
  { id: 'whisper', labelKey: 'playground.styles.whisper', speed: 0.88, instruct: 'Whispering softly and gently' },
  { id: 'storyteller', labelKey: 'playground.styles.storyteller', speed: 0.95, instruct: 'Expressive and engaging storytelling voice' },
  { id: 'serious', labelKey: 'playground.styles.serious', speed: 0.98, instruct: 'Serious and formal tone' },
  { id: 'sad', labelKey: 'playground.styles.sad', speed: 0.86, instruct: 'Sad, quiet and melancholic' },
  { id: 'excited', labelKey: 'playground.styles.excited', speed: 1.12, instruct: 'Excited and very dynamic' },
];

export const EXPRESSION_TAGS = [
  { tag: '<gasp>', label: 'Gasp', description: 'Brief intake of breath', category: 'emotion' },
  { tag: '<laugh>', label: 'Laugh', description: 'Laughter / chuckle', category: 'emotion' },
  { tag: '<sigh>', label: 'Sigh', description: 'Relieved or weary sigh', category: 'emotion' },
  { tag: '<yawn>', label: 'Yawn', description: 'Tired yawn break', category: 'emotion' },
  { tag: '<whisper>', label: 'Whisper', description: 'Intimate quiet tone', category: 'style' },
  { tag: '<throat-clearing>', label: 'Throat clearing', description: 'Quick pause to clear throat', category: 'vocal' },
  { tag: '<cough>', label: 'Cough', description: 'Brief cough pause', category: 'vocal' },
  { tag: '<pause 0.5s>', label: 'Pause (0.5s)', description: 'Half second breath', category: 'timing' },
  { tag: '<pause 1.0s>', label: 'Pause (1.0s)', description: 'Full second pause', category: 'timing' },
  { tag: '[laughter]', label: '[laughter]', description: 'VoiceStudio tone tag', category: 'brackets' },
  { tag: '[sigh]', label: '[sigh]', description: 'VoiceStudio sigh tag', category: 'brackets' },
  { tag: '[pause 0.5s]', label: '[pause 0.5s]', description: 'VoiceStudio pause marker', category: 'brackets' },
  { tag: '[question-en]', label: '[question-en]', description: 'Inquisitive pitch inflection', category: 'brackets' },
  { tag: '[surprise-wa]', label: '[surprise-wa]', description: 'Sudden surprised inflection', category: 'brackets' },
];

export const INITIAL_SPEAKERS: Speaker[] = [
  {
    id: 'speaker-1',
    name: 'Speaker 1 - Fola',
    voiceId: '',
    voiceName: 'Fola',
    color: SPEAKER_COLORS[0],
  },
  {
    id: 'speaker-2',
    name: 'Speaker 2 - Rami',
    voiceId: '',
    voiceName: 'Rami',
    color: SPEAKER_COLORS[1],
  },
];

export const INITIAL_BLOCKS: SpeechBlock[] = [
  {
    id: 'block-1',
    speakerId: 'speaker-1',
    style: 'natural',
    speed: 1.0,
    text: "<gasp> That's a great idea! <laugh> Let's test out the new voices.",
  },
  {
    id: 'block-2',
    speakerId: 'speaker-2',
    style: 'cheerful',
    speed: 1.06,
    text: 'I agree! Now we can make full multi-voice dialogue and save it all as one single audio file.',
  },
  {
    id: 'block-3',
    speakerId: 'speaker-1',
    style: 'natural',
    speed: 1.0,
    text: "Exactly. We can also add natural pauses and expressions whenever we want. <pause 0.5s> It sounds seamless!",
  },
];

