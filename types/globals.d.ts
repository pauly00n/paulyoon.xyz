import type { SnapshotStatus } from '@/types/backdrop-snapshot'

declare global {
  interface Window {
    __captureGlasspillReady?: boolean
    __glasspillAlign?: string
    __glasspillDebug?: SnapshotStatus
    __glasspillOffsetY?: number
  }
}

export {}
