import { $ } from 'signal'
import { Colors } from './colors.ts'

export class Skin {
  colors: Colors = $(new Colors)
  fonts = {
    sans: '"Jost", sans-serif',
    cond: '"Ubuntu Condensed", sans-serif',
    mono: '"Roboto Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  }
}
