import type { ToasterProps } from 'sonner'

let _position: ToasterProps['position'] = 'bottom-right'
let _spring: boolean = true

export function setGoeyPosition(position: ToasterProps['position']) {
  _position = position
}

export function getGoeyPosition() {
  return _position
}

export function setGoeySpring(spring: boolean) {
  _spring = spring
}

export function getGoeySpring() {
  return _spring
}
