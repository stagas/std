import { $, fn, fx, of, when } from 'signal'
import { dom, maybeSpliceFind, on } from 'utils'
import { Keyboardable } from './keyboardable.ts'
import { Rect } from './rect.ts'
import { World } from './world.ts'

export class Keyboard {
  constructor(public world: World) { }

  focusIt?: Keyboardable.It
  isFocused = false

  real?: KeyboardEvent
  clip?: ClipboardEvent
  pasted = ''
  keys: Keyboard.Key[] = []
  key?: Keyboard.Key | undefined
  char = ''
  special: (
    Keyboard.Key & {
      kind: Keyboard.KeyKind.Special
    })['value'] | '' = ''
  alt?: boolean | undefined
  ctrl?: boolean | undefined
  shift?: boolean | undefined
  time: number = 0

  style?: CSSStyleDeclaration

  appendTo(el: HTMLElement) {
    el.append(this.textarea)
    this.style = this.textarea.style
    return this
  }
  @fx init_listeners() {
    const { textarea: t } = this
    return [
      on(t, 'contextmenu', dom.prevent.stop),
      on(t, 'keydown', this.handleKey),
      on(t, 'keyup', this.handleKey),
      on(t, 'copy', this.handleClip(Keyboard.EventKind.Copy)),
      on(t, 'cut', this.handleClip(Keyboard.EventKind.Cut)),
      on(t, 'paste', this.handleClip(Keyboard.EventKind.Paste)),
      on(t, 'blur', () => { this.isFocused = false }),
      on(t, 'focus', () => { this.isFocused = true }),
    ]
  }
  @fx textarea_follows_mouse() {
    const { style, world } = of(this)
    const { mouse } = of(world)
    const { pos } = of(mouse)
    const { x, y } = pos
    $()
    this.textareaRect.center.set(pos)
  }
  @fx move_textarea() {
    const { style } = of(this)
    style.transform =
      this.textareaRect.pos.styleTransformTranslate
  }
  @fx update_focusIt() {
    const { style, world } = of(this)
    const { mouse } = of(world)
    const { downIt } = when(mouse)
    $()
    if (downIt.keyboardable) {
      this.focusIt = downIt as Keyboardable.It
    }
  }
  @fx update_isFocused() {
    const { focusIt: { keyboardable: k } } = of(this)
    $()
    k.isFocused = true
    return () => {
      k.isFocused = false
    }
  }
  @fn handleKey =
    (e: KeyboardEvent) => {
      const { keys } = this
      const real = e
      const time = real.timeStamp

      let kind: Keyboard.EventKind = EventMap[real.type]
      if (kind == null) {
        throw new TypeError('Not implemented keyboard event: ' + real.type)
        return
      }

      const { Down, Up } = Keyboard.EventKind

      let key: Keyboard.Key | undefined
      let char = ''
      let special = ''

      switch (kind) {
        case Down:
          if (real.key.length === 1) {
            keys.push(key = {
              kind: Keyboard.KeyKind.Char,
              value: char = real.key,
              real,
              time
            })
          }
          else {
            keys.push(key = {
              kind: Keyboard.KeyKind.Special,
              value: special = real.key as any,
              real,
              time
            })
          }
          break

        case Up:
          key = maybeSpliceFind(
            keys,
            key => key.value === real.key
          )
          break
      }

      this.real = real
      this.time = time
      this.key = key
      this.char = char
      this.special = special as any
      this.alt = real.altKey || void 0
      this.ctrl = (real.ctrlKey || real.metaKey) || void 0
      this.shift = real.shiftKey || void 0

      if (this.focusIt?.keyboardable.onKeyboardEvent?.(kind)) {
        dom.prevent(real)
      }
    }
  @fn handleClip =
    (kind: Keyboard.EventKind) =>
      (e: ClipboardEvent) => {
        this.clip = e

        if (kind === Keyboard.EventKind.Paste) {
          this.pasted = e.clipboardData?.getData('text') ?? ''
        }

        const res = this.focusIt
          ?.keyboardable
          .onKeyboardEvent?.(kind)

        if (res != null) {
          if (typeof res === 'string') {
            this.textarea.value = res
            this.textarea.select()
          }
          else {
            dom.prevent(e)
          }
        }
      }
  textareaRect = $(new Rect, { w: 50, h: 50 })
  textarea: HTMLTextAreaElement = dom.el('textarea', {
    spellcheck: false,
    autocorrect: 'off',
    style: {
      cssText: /*css*/`
      position: fixed;
      opacity: 0.6;
      width: 50px;
      height: 50px;
      pointer-events: none;
      caret-color: transparent;
      border: none;
      resize: none;
      padding: 0;
      outline: none;
      white-space: pre;
      overflow: hidden;
      z-index: 999999;
      `
    }
  })
}

export namespace Keyboard {
  export enum EventKind {
    Down,
    Up,
    Copy,
    Cut,
    Paste,
  }
  export enum KeyKind {
    Char,
    Special,
  }
  export type Key = {
    real: KeyboardEvent
    time: number
  } & ({
    kind: KeyKind.Char
    value: string
  } | {
    kind: KeyKind.Special
    value:
    | 'Control'
    | 'Shift'
    | 'Alt'
    | 'Enter'
    | 'Tab'
    | 'Space'
    | 'Backspace'
    | 'Delete'
    | 'Home'
    | 'End'
    | 'PageUp'
    | 'PageDown'
    | 'ArrowLeft'
    | 'ArrowUp'
    | 'ArrowRight'
    | 'ArrowDown'
  })
}

const EventMap: Record<string, Keyboard.EventKind> = {
  keydown: Keyboard.EventKind.Down,
  keyup: Keyboard.EventKind.Up,
}
