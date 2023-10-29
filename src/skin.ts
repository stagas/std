import { $ } from 'signal'
import { Colors } from './colors.ts'

export class Skin {
  colors: Colors = $(new Colors)
  fonts = {
    sans: '"Jost", sans-serif',
    mono: '"JetBrains Mono", monospace',
  }
}
