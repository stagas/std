import type { Logger } from 'utils'
declare global {
  var log: Logger
  interface Window {
    log: Logger
  }
}
