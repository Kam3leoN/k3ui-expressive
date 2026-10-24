export type DebugLevel = 'error' | 'warn' | 'info' | 'verbose';

const ORDER: Record<DebugLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
};

let enabled = false;
let level: DebugLevel = 'info';

function shouldLog(l: DebugLevel): boolean {
  return enabled && ORDER[l] <= ORDER[level];
}

function log(l: DebugLevel, tag: string, ...args: unknown[]): void {
  if (!shouldLog(l)) return;
  const prefix = `[k3ui:${tag}]`;
  switch (l) {
    case 'error':
      console.error(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'verbose':
      console.debug(prefix, ...args);
      break;
    default:
      console.info(prefix, ...args);
  }
}

export const debug = {
  enable(opts: boolean | { level?: DebugLevel } = true): void {
    if (opts === false) {
      enabled = false;
      return;
    }
    enabled = true;
    if (typeof opts === 'object' && opts.level) level = opts.level;
  },
  disable(): void {
    enabled = false;
  },
  get enabled(): boolean {
    return enabled;
  },
  get level(): DebugLevel {
    return level;
  },
  error(tag: string, ...args: unknown[]): void {
    log('error', tag, ...args);
  },
  warn(tag: string, ...args: unknown[]): void {
    log('warn', tag, ...args);
  },
  info(tag: string, ...args: unknown[]): void {
    log('info', tag, ...args);
  },
  verbose(tag: string, ...args: unknown[]): void {
    log('verbose', tag, ...args);
  },
  fromUrl(): void {
    if (typeof location === 'undefined') return;
    const params = new URLSearchParams(location.search);
    if (params.has('k3ui-debug')) {
      const v = params.get('k3ui-debug');
      debug.enable({
        level: v === 'verbose' || v === '1' ? 'verbose' : (v as DebugLevel) || 'info',
      });
    }
  },
};
