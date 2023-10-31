import { Keyboard } from './keyboard.ts'
import { Mouseable } from './mouseable.ts'

export abstract class Keyboardable {
  constructor(
    public it: Keyboardable.It,
    public kbd = it.ctx.world.keyboard!,
  ) { }
  isFocused = false
  public onKeyboardEvent?(kind: Keyboard.EventKind): true | string | undefined | void
}

export namespace Keyboardable {
  export interface It extends Mouseable.It {
    keyboardable: Keyboardable
  }
}
