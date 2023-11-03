import themes from 'plenty-themes/_all.json'
import { alias } from 'signal'
import { luminate as L, saturate as S } from 'utils'

export interface Theme {
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  purple: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightPurple: string
  brightCyan: string
  brightWhite: string
  foreground: string
  background: string
  cursorColor: string
  selectionBackground: string
  meta?: {
    isDark: boolean
  }
}

const theme = themes[8] as Theme

type ColorName =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'white'
  | 'brightBlack'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightPurple'
  | 'brightCyan'
  | 'brightWhite'

export class Colors {
  theme: Theme = theme

  get isDark() {
    return this.theme.meta?.isDark ?? false
  }

  // basic
  get black() { return this.theme.black }
  get red() { return this.theme.red }
  get green() { return this.theme.green }
  get yellow() { return this.theme.yellow }
  get blue() { return this.theme.blue }
  get purple() { return this.theme.purple }
  get cyan() { return this.theme.cyan }
  get white() { return this.theme.white }
  get brightBlack() { return this.theme.brightBlack }
  get brightRed() { return this.theme.brightRed }
  get brightGreen() { return this.theme.brightGreen }
  get brightYellow() { return this.theme.brightYellow }
  get brightBlue() { return this.theme.brightBlue }
  get brightPurple() { return this.theme.brightPurple }
  get brightCyan() { return this.theme.brightCyan }
  get brightWhite() { return this.theme.brightWhite }
  get background() { return this.theme.background }
  get foreground() { return this.theme.foreground }
  get cursorColor() { return this.theme.cursorColor }
  get selectionBackground() { return this.theme.selectionBackground }

  // alias
  fg = alias(this, 'foreground')
  bg = alias(this, 'background')
  cursor = alias(this, 'cursorColor')
  pink = alias(this, 'brightPurple')

  // brand
  brand1ColorName: ColorName = 'brightPurple'
  brand2ColorName: ColorName = 'yellow'
  brand3ColorName: ColorName = 'brightPurple'
  brand4ColorName: ColorName = 'brightRed'
  get brand1() { return this.theme[this.brand1ColorName] }
  get brand1Bright015() {
    return L(this.theme[this.brand1ColorName],
      0.015)
  }
  get brand1Bright025() {
    return L(this.theme[this.brand1ColorName],
      0.025)
  }
  get brand1Bright05() {
    return L(this.theme[this.brand1ColorName],
      0.05)
  }
  get brand1Bright1() {
    return L(this.theme[this.brand1ColorName],
      0.1)
  }
  get brand2() { return this.theme[this.brand2ColorName] }
  get brand3() { return this.theme[this.brand3ColorName] }
  get brand4() { return this.theme[this.brand4ColorName] }

  // derived
  get grey() { return L(S(this.theme.white, -1), -0.39) }
  get dark() { return L(S(this.theme.white, -1), -0.5) }
  get bgBright015() { return L(this.bg, 0.015) }
  get bgBright025() { return L(this.bg, 0.025) }
  get bgBright05() { return L(this.bg, 0.05) }
  get bgBright1() { return L(this.bg, 0.1) }
  get bgBright15() { return L(this.bg, 0.15) }
  get bgBright2() { return L(this.bg, 0.2) }
  get bgBright25() { return L(this.bg, 0.25) }
  get bgBright3() { return L(this.bg, 0.3) }
  get bgBright35() { return L(this.bg, 0.35) }

  get bgDark015() { return L(this.bg, -0.015) }
  get bgDark025() { return L(this.bg, -0.025) }
  get bgDark05() { return L(this.bg, -0.05) }
  get bgDark1() { return L(this.bg, -0.1) }
  get bgDark15() { return L(this.bg, -0.15) }
  get bgDark2() { return L(this.bg, -0.2) }
  get bgDark25() { return L(this.bg, -0.25) }
  get bgDark3() { return L(this.bg, -0.3) }
  get bgDark35() { return L(this.bg, -0.35) }
}
