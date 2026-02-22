type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'

let _position: Position = 'bottom-right'
let _spring: boolean = true
let _bounce: number | undefined = undefined

export function setGoeyPosition(position: Position | undefined) {
  if (position) _position = position
}

export function getGoeyPosition(): Position {
  return _position
}

export function setGoeySpring(spring: boolean) {
  _spring = spring
}

export function getGoeySpring() {
  return _spring
}

export function setGoeyBounce(bounce: number | undefined) {
  _bounce = bounce
}

export function getGoeyBounce() {
  return _bounce
}
