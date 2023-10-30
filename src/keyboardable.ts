import { Keyboard } from './keyboard.ts'
import { Mouseable } from './mouseable.ts'

export abstract class Keyboardable {
  constructor(
    public it: Keyboardable.It,
    public keys = it.ctx.world.keyboard!.keys
  ) { }
  isFocused = false
  public onKeyboardEvent?(kind: Keyboard.EventKind): true | undefined | void
}

export namespace Keyboardable {
  export interface It extends Mouseable.It {
    keyboardable: Keyboardable
  }
}
