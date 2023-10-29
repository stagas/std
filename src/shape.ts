export class Shape {
  label?: string
  strokeColor = '#3f3'
  fillColor = '#92e'
  get values(): readonly number[] { return [] }
  get text() {
    return (this.label ? `${this.label}: ` : '')
      + this.values.join(' ')
  }
}
