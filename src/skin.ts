import { $ } from 'signal'
import { Colors } from './colors.ts'

export class Skin {
  colors: Colors = $(new Colors)
  fonts = {
    sans: "'Helvetica Neue', 'Segoe UI', 'Roboto', 'Arial', sans-serif",
    cond: "'Ubuntu Condensed', 'Roboto Condensed', 'Helvetica Neue', Arial, sans-serif",
    mono: "'Noto Sans Mono', 'Roboto Mono', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace"
  }
}
