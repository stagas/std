import { $ } from 'signal'
import { clamp } from 'utils'

export class Scalar {
  min = 0
  max = 1
  fixed = 1
  $value = 0
  get value() {
    return this.$value
  }
  set value(v) {
    const { fixed, min, max } = this
    this.$value = clamp(min, max, fixed
      ? parseFloat(v.toFixed(fixed))
      : v
    )
  }
  get text() {
    const { value, fixed } = this
    return value.toFixed(fixed)
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
    const { scale, min } = this
    this.value = v * scale + min
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
