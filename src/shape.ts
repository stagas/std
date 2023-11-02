export class Shape {
  label?: string
  strokeColor = '#3f3'
  fillColor = '#92e'
  pr = 1
  get values(): readonly number[] { return [] }
  get text() {
    return (this.label ? `${this.label}: ` : '')
      + this.values.map(x =>
        parseFloat(x.toFixed(3)))
        .join(' ')
  }
}
