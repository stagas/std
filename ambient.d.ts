import '@total-typescript/ts-reset'
import type { Logger } from 'utils'
declare global {
  var log: Logger
  interface Window {
    log: Logger
  }
}
