import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import '../feedback/progress.js';
import '../inputs/slider.js';
import '../actions/fab.js';
import '../actions/icon-button.js';
import '../containment/card.js';
import {
  AudioPlayerSpecs,
  type AudioPlayerVariant,
  type AudioTrack,
} from './audio-player.specs.js';
import { audioPlayerStyles } from './audio-player.styles.js';

export type { AudioTrack, AudioPlayerVariant };
export { AudioPlayerSpecs };

const MUSIC_MUTE_KEY = AudioPlayerSpecs.storageKey;

function readMusicMuted(): boolean {
  try {
    const v = localStorage.getItem(MUSIC_MUTE_KEY);
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
}

function writeMusicMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUSIC_MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* private mode */
  }
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function guessType(src: string): string {
  const lower = src.toLowerCase();
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.aac') || lower.endsWith('.m4a')) return 'audio/aac';
  return 'audio/mpeg';
}

/**
 * Playlist audio player (mp3 / ogg) — play, pause, stop, prev, next.
 * Variants: `card` · `compact` · `sticky` (full-width bottom bar).
 * Timeline: `k3-progress` wavy · volume: `k3-slider`.
 * Music mute is **independent** of interaction `k3-sound-fx`.
 *
 * @fires k3-play · k3-pause · k3-stop · k3-change (track index) · k3-ended
 */
export class K3AudioPlayer extends K3Element {
  static override styles = [hostReset, audioPlayerStyles];

  /** JSON array of {@link AudioTrack}. */
  @property({ type: Array }) tracks: AudioTrack[] = [];
  @property({ type: Number, attribute: 'track-index' }) trackIndex = 0;
  @property({ type: Number }) volume = AudioPlayerSpecs.defaultVolume;
  @property({ type: Boolean, reflect: true }) muted = false;
  @property({ type: Boolean, attribute: 'auto-play' }) autoPlay = false;
  @property({ type: Boolean }) loop = false;
  /** Loop the whole playlist. */
  @property({ type: Boolean, attribute: 'loop-playlist' }) loopPlaylist = false;
  /** `card` (default) · `compact` · `toolbar` · `sticky` */
  @property({ reflect: true }) variant: AudioPlayerVariant = 'card';

  @state() private playing = false;
  @state() private currentTime = 0;
  @state() private duration = 0;
  @state() private musicMuted = false;

  @query('audio') private audioEl!: HTMLAudioElement;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', AudioPlayerSpecs.accessibility.role);
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute(
        'aria-label',
        i18n.t('audioPlayer.ariaLabel', 'Audio player'),
      );
    }
    this.musicMuted = this.muted || readMusicMuted();
    this.muted = this.musicMuted;
  }

  override firstUpdated(): void {
    this.applyVolume();
    this.loadCurrent(false);
    if (this.autoPlay && !this.musicMuted) void this.play();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('tracks') || changed.has('trackIndex')) {
      this.loadCurrent(this.playing);
    }
    if (changed.has('volume') || changed.has('muted')) {
      this.musicMuted = this.muted;
      this.applyVolume();
    }
  }

  get currentTrack(): AudioTrack | undefined {
    return this.tracks[this.trackIndex];
  }

  async play(): Promise<void> {
    if (!this.audioEl || !this.currentTrack) return;
    if (this.musicMuted) this.setMusicMuted(false);
    try {
      const p = this.audioEl.play();
      if (p && typeof (p as Promise<void>).then === 'function') {
        await (p as Promise<void>);
      }
      this.playing = true;
      this.emit('k3-play', { index: this.trackIndex, track: this.currentTrack });
    } catch {
      this.playing = false;
    }
  }

  pause(): void {
    try {
      this.audioEl?.pause();
    } catch {
      /* jsdom */
    }
    this.playing = false;
    this.emit('k3-pause', { index: this.trackIndex });
  }

  stop(): void {
    if (!this.audioEl) return;
    try {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    } catch {
      /* jsdom */
    }
    this.playing = false;
    this.currentTime = 0;
    this.emit('k3-stop', { index: this.trackIndex });
  }

  next(): void {
    if (!this.tracks.length) return;
    const last = this.tracks.length - 1;
    if (this.trackIndex >= last) {
      if (this.loopPlaylist) this.trackIndex = 0;
      else {
        this.stop();
        return;
      }
    } else {
      this.trackIndex += 1;
    }
    this.emit('k3-change', { index: this.trackIndex, track: this.currentTrack });
    void this.play();
  }

  prev(): void {
    if (!this.tracks.length) return;
    if (this.audioEl && this.audioEl.currentTime > 2) {
      this.audioEl.currentTime = 0;
      return;
    }
    if (this.trackIndex <= 0) {
      if (this.loopPlaylist) this.trackIndex = this.tracks.length - 1;
      else {
        this.audioEl.currentTime = 0;
        return;
      }
    } else {
      this.trackIndex -= 1;
    }
    this.emit('k3-change', { index: this.trackIndex, track: this.currentTrack });
    void this.play();
  }

  /** Mute/unmute music only (not interaction SFX). */
  setMusicMuted(muted: boolean): void {
    this.musicMuted = muted;
    this.muted = muted;
    writeMusicMuted(muted);
    this.applyVolume();
    if (muted) this.pause();
    this.emit('k3-change', { musicMuted: muted });
  }

  private applyVolume(): void {
    if (!this.audioEl) return;
    this.audioEl.volume = this.musicMuted
      ? 0
      : Math.min(1, Math.max(0, this.volume));
    this.audioEl.muted = this.musicMuted;
  }

  private loadCurrent(resume: boolean): void {
    const track = this.currentTrack;
    if (!this.audioEl || !track) return;
    this.audioEl.loop = this.loop;
    queueMicrotask(() => {
      void this.updateComplete.then(() => {
        try {
          this.audioEl?.load();
        } catch {
          /* jsdom */
        }
        this.applyVolume();
        if (resume) void this.play();
      });
    });
  }

  private timeRaf = 0;

  /** Coalesce timeupdate → one Lit update per frame (4 demos × media events). */
  private onTimeUpdate(): void {
    if (!this.audioEl || this.timeRaf) return;
    this.timeRaf = requestAnimationFrame(() => {
      this.timeRaf = 0;
      if (!this.audioEl) return;
      this.currentTime = this.audioEl.currentTime;
      this.duration = this.audioEl.duration || 0;
    });
  }

  private onEnded(): void {
    this.emit('k3-ended', { index: this.trackIndex });
    if (this.loop) return;
    if (this.trackIndex < this.tracks.length - 1 || this.loopPlaylist) {
      this.next();
    } else {
      this.playing = false;
    }
  }

  private onVolumeInput(e: Event): void {
    const detail = (e as CustomEvent<{ value?: number }>).detail;
    const v = Number(detail?.value);
    if (!Number.isFinite(v)) return;
    this.volume = Math.min(1, Math.max(0, v));
    if (this.musicMuted && this.volume > 0) this.setMusicMuted(false);
    if (!this.musicMuted && this.volume === 0) this.setMusicMuted(true);
    this.applyVolume();
  }

  private togglePlay(): void {
    if (this.playing) this.pause();
    else void this.play();
  }

  private renderIcon(name: string) {
    return html`<span
      class="ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>`;
  }

  private renderAudio(track: AudioTrack | undefined) {
    return html`
      <audio
        part="audio"
        preload="metadata"
        @timeupdate=${() => this.onTimeUpdate()}
        @loadedmetadata=${() => this.onTimeUpdate()}
        @ended=${() => this.onEnded()}
        @play=${() => {
          this.playing = true;
        }}
        @pause=${() => {
          this.playing = false;
        }}
      >
        ${track
          ? html`
              <source
                src=${track.src}
                type=${track.type ?? guessType(track.src)}
              />
              ${track.srcAlt
                ? html`<source
                    src=${track.srcAlt}
                    type=${track.typeAlt ?? guessType(track.srcAlt)}
                  />`
                : nothing}
            `
          : nothing}
      </audio>
    `;
  }

  private renderArtwork(track: AudioTrack | undefined) {
    if (track?.artwork) {
      return html`<img
        class="art"
        part="artwork"
        src=${track.artwork}
        alt=""
        width="56"
        height="56"
        decoding="async"
      />`;
    }
    return html`<div class="art art-fallback" part="artwork" aria-hidden="true">
      ${this.renderIcon('music_note')}
    </div>`;
  }

  private renderMeta(track: AudioTrack | undefined, withArt: boolean) {
    return html`
      <div class="row-meta" part="meta-row">
        ${withArt ? this.renderArtwork(track) : nothing}
        <div class="meta" part="meta" aria-live="polite">
          <p class="title" part="title">
            ${track?.title ?? i18n.t('audioPlayer.noTrack', 'No track')}
          </p>
          ${track?.artist
            ? html`<p class="artist" part="artist">${track.artist}</p>`
            : nothing}
        </div>
      </div>
    `;
  }

  private renderProgress(opts: {
    inlineTimes: boolean;
    showCaption: boolean;
    /** Toolbar / sticky — 8dp stroke, aligned with volume slider track. */
    toolbar?: boolean;
  }) {
    const progressMax = Math.max(0.001, this.duration || 0.001);
    /* Empty label → no visible caption; progress keeps an aria-label fallback. */
    const caption = opts.showCaption
      ? i18n.t('audioPlayer.seek', 'Seek')
      : '';
    return html`
      <div class="timeline" part="timeline">
        <k3-progress
          class="progress"
          part="seek"
          variant="linear"
          wavy
          .thickness=${opts.toolbar ? 8 : 4}
          .value=${this.currentTime}
          .max=${progressMax}
          .showStop=${false}
          label=${caption}
          aria-valuetext=${`${formatTime(this.currentTime)} / ${formatTime(this.duration)}`}
        ></k3-progress>
        ${opts.inlineTimes
          ? html`<div class="times" part="times">
              <span>${formatTime(this.currentTime)}</span>
              <span class="sep" aria-hidden="true">/</span>
              <span>${formatTime(this.duration)}</span>
            </div>`
          : html`<div class="times" part="times">
              <span>${formatTime(this.currentTime)}</span>
              <span>${formatTime(this.duration)}</span>
            </div>`}
      </div>
    `;
  }

  /** Native circular buttons (card / compact). */
  private renderTransport(opts: { stop: boolean; ghost: boolean }) {
    const track = this.currentTrack;
    const playIcon = this.playing ? 'pause' : 'play_arrow';
    const playLabel = this.playing
      ? i18n.t('audioPlayer.pause', 'Pause')
      : i18n.t('audioPlayer.play', 'Play');
    const side = opts.ghost ? 'btn ghost' : 'btn';
    return html`
      <div class="transport" part="transport">
        <button
          type="button"
          class=${side}
          part="prev"
          aria-label=${i18n.t('audioPlayer.prev', 'Previous')}
          ?disabled=${!this.tracks.length}
          @click=${() => this.prev()}
        >
          ${this.renderIcon('skip_previous')}
        </button>
        <button
          type="button"
          class="btn primary"
          part="play"
          aria-label=${playLabel}
          ?disabled=${!track}
          @click=${() => this.togglePlay()}
        >
          ${this.renderIcon(playIcon)}
        </button>
        ${opts.stop
          ? html`<button
              type="button"
              class=${side}
              part="stop"
              aria-label=${i18n.t('audioPlayer.stop', 'Stop')}
              ?disabled=${!track}
              @click=${() => this.stop()}
            >
              ${this.renderIcon('stop')}
            </button>`
          : nothing}
        <button
          type="button"
          class=${side}
          part="next"
          aria-label=${i18n.t('audioPlayer.next', 'Next')}
          ?disabled=${!this.tracks.length}
          @click=${() => this.next()}
        >
          ${this.renderIcon('skip_next')}
        </button>
      </div>
    `;
  }

  /** Toolbar / sticky — prev·next narrow, play default width. */
  private renderToolbarTransport() {
    const track = this.currentTrack;
    const playIcon = this.playing ? 'pause' : 'play_arrow';
    const playLabel = this.playing
      ? i18n.t('audioPlayer.pause', 'Pause')
      : i18n.t('audioPlayer.play', 'Play');
    return html`
      <div class="transport transport--ib" part="transport">
        <k3-icon-button
          part="prev"
          variant="standard"
          size="sm"
          width="narrow"
          label=${i18n.t('audioPlayer.prev', 'Previous')}
          ?disabled=${!this.tracks.length}
          @k3-click=${() => this.prev()}
        >
          ${this.renderIcon('skip_previous')}
        </k3-icon-button>
        <k3-icon-button
          part="play"
          variant="filled"
          size="sm"
          width="default"
          label=${playLabel}
          ?disabled=${!track}
          @k3-click=${() => this.togglePlay()}
        >
          ${this.renderIcon(playIcon)}
        </k3-icon-button>
        <k3-icon-button
          part="next"
          variant="standard"
          size="sm"
          width="narrow"
          label=${i18n.t('audioPlayer.next', 'Next')}
          ?disabled=${!this.tracks.length}
          @k3-click=${() => this.next()}
        >
          ${this.renderIcon('skip_next')}
        </k3-icon-button>
      </div>
    `;
  }

  /** Cover as FAB chrome (artwork via --k3-fab-bg, else music_note). */
  private renderCoverFab(track: AudioTrack | undefined) {
    const art = track?.artwork?.trim();
    const title =
      track?.title ?? i18n.t('audioPlayer.noTrack', 'No track');
    return html`
      <k3-fab
        class="cover-fab"
        part="artwork"
        size="default"
        variant="surface"
        aria-hidden="true"
        tabindex="-1"
        aria-label=${title}
        style=${art
          ? `--k3-fab-bg: center / cover no-repeat url("${art.replace(/"/g, '')}")`
          : nothing}
        @k3-click=${(e: Event) => e.stopPropagation()}
      >
        ${art
          ? nothing
          : html`<span
              slot="icon"
              class="ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="music_note"
              aria-hidden="true"
            ></span>`}
      </k3-fab>
    `;
  }

  private renderVolume() {
    const muteIcon = this.musicMuted ? 'volume_off' : 'volume_up';
    const muteLabel = this.musicMuted
      ? i18n.t('audioPlayer.unmute', 'Unmute music')
      : i18n.t('audioPlayer.mute', 'Mute music');
    const volumeValue = this.musicMuted ? 0 : this.volume;
    const volAria = i18n.t('audioPlayer.volume', 'Volume');
    return html`
      <div class="volume" part="volume">
        <button
          type="button"
          class="btn ghost"
          part="mute"
          aria-pressed=${this.musicMuted ? 'true' : 'false'}
          aria-label=${muteLabel}
          @click=${() => this.setMusicMuted(!this.musicMuted)}
        >
          ${this.renderIcon(muteIcon)}
        </button>
        <k3-slider
          class="vol-slider"
          size="xs"
          min="0"
          max="1"
          step="0.01"
          .value=${volumeValue}
          .label=${volAria}
          @k3-input=${(e: Event) => this.onVolumeInput(e)}
          @k3-change=${(e: Event) => this.onVolumeInput(e)}
        ></k3-slider>
      </div>
    `;
  }

  private renderToolbarShell() {
    const track = this.currentTrack;
    return html`
      ${this.renderAudio(track)}
      <div class="shell shell--toolbar" part="shell">
        ${this.renderCoverFab(track)}
        <div class="toolbar-bar" part="toolbar-bar">
          <div class="meta" part="meta" aria-live="polite">
            <p class="title" part="title">
              ${track?.title ?? i18n.t('audioPlayer.noTrack', 'No track')}
            </p>
            ${track?.artist
              ? html`<p class="artist" part="artist">${track.artist}</p>`
              : nothing}
          </div>
          <div class="controls" part="controls">
            ${this.renderToolbarTransport()}
          </div>
          <div class="seek-vol" part="seek-vol">
            <div class="seek-vol-row" part="seek-vol-row">
              ${this.renderProgress({
                inlineTimes: false,
                showCaption: false,
                toolbar: true,
              })}
              ${this.renderVolume()}
            </div>
            <div class="times times--toolbar" part="times">
              <span>${formatTime(this.currentTime)}</span>
              <span class="sep" aria-hidden="true">/</span>
              <span>${formatTime(this.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    const track = this.currentTrack;
    const v = this.variant;

    if (v === 'compact') {
      return html`
        ${this.renderAudio(track)}
        <k3-card class="player-card" variant="elevated" part="card">
          <div class="shell" part="shell">
            ${this.renderMeta(track, true)}
            <div class="controls" part="controls">
              ${this.renderTransport({ stop: false, ghost: true })}
            </div>
            ${this.renderProgress({ inlineTimes: false, showCaption: false })}
          </div>
        </k3-card>
      `;
    }

    if (v === 'toolbar' || v === 'sticky') {
      return this.renderToolbarShell();
    }

    /* card (default) — chrome via k3-card */
    return html`
      ${this.renderAudio(track)}
      <k3-card class="player-card" variant="elevated" part="card">
        <div class="shell" part="shell">
          ${this.renderMeta(track, Boolean(track?.artwork))}
          ${this.renderProgress({ inlineTimes: false, showCaption: false })}
          <div class="controls" part="controls">
            ${this.renderTransport({ stop: true, ghost: false })}
            ${this.renderVolume()}
          </div>
        </div>
      </k3-card>
    `;
  }
}

export default K3AudioPlayer;

if (!customElements.get('k3-audio-player')) {
  customElements.define('k3-audio-player', K3AudioPlayer);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-audio-player': K3AudioPlayer;
  }
}
