export const AudioPlayerSpecs = {
  storageKey: 'k3-music-muted',
  defaultVolume: 0.7,
  formats: ['ogg', 'mp3'] as const,
  /** `card` stacked · `compact` mini card · `sticky` full-width bottom bar */
  variants: ['card', 'compact', 'sticky'] as const,
  accessibility: {
    role: 'region' as const,
  },
};

export type AudioPlayerVariant = (typeof AudioPlayerSpecs.variants)[number];

export interface AudioTrack {
  src: string;
  title?: string;
  artist?: string;
  /** Cover / artwork URL (compact & sticky). */
  artwork?: string;
  /** Optional alternate source (e.g. ogg beside mp3). */
  srcAlt?: string;
  type?: string;
  typeAlt?: string;
}
