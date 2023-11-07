import { Keyboard } from './keyboard.ts'
import { Mouseable } from './mouseable.ts'

export abstract class Keyboardable {
  constructor(
    public it: Keyboardable.It,
    public keypress = it.ctx.world.keyboard!,
  ) { }
  isFocused = false
  public onKeyboardEvent?(kind: Keyboard.EventKind): Keyboard.Result
}

export namespace Keyboardable {
  export interface It extends Mouseable.It {
    keyboardable: Keyboardable
  }
}
