import { $ } from 'signal'
import { clamp } from 'utils'

export class Scalar {
  static create() { return $(new Scalar) }
  min = 0
  max = 1
  digits?= 1
  $value = 0
  get value() {
    return this.$value
  }
  set value(v) {
    const { digits, min, max } = this
    this.$value = clamp(
      min,
      max,
      digits != null
        ? parseFloat(
          v.toFixed(digits)
        )
        : v
    ) || 0
  }
  get text() {
    const { value, digits } = this
    return value.toFixed(digits)
  }
  get scale() {
    const { min, max } = this
    return max - min
  }
  get normal() {
    const { value, min, scale } = this
    return clamp(0, 1, (value - min) / scale)
  }
  set normal(v) {
    const { scale, min, max } = this
    this.value = clamp(
      min,
      max,
      clamp(0, 1, v) * scale + min
    )
  }
}

export function test_Scalar() {
  // @env browser
  describe('Scalar', () => {
    it('works', () => {
      const s = $(new Scalar, { min: 10, max: 20, value: 15 })
      expect(s.value).toEqual(15)
    })
  })
}
