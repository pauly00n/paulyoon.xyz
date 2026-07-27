export interface BackdropSnapshot {
  source: HTMLCanvasElement
  width: number
  height: number
  padX: number
  padY: number
  docWidth: number
  docHeight: number
  scale: number
  heroHeight?: number
}

export type SnapshotStatus =
  | { state: 'idle' }
  | { state: 'fetching-manifest' }
  | { state: 'loading-png'; entry: unknown }
  | { state: 'waiting-fonts' }
  | { state: 'waiting-images' }
  | { state: 'capturing' }
  | { state: 'ready'; data: BackdropSnapshot }
  | { state: 'error'; message: string }
