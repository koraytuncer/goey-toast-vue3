import { useEffect } from 'react'
import { Toaster } from 'sonner'
import type { GoeyToasterProps } from '../types'
import { setGoeyPosition } from '../context'

export function GoeyToaster({
  position = 'bottom-right',
  duration,
  gap = 14,
  offset = '24px',
  theme = 'light',
  toastOptions,
  expand,
  closeButton,
  richColors,
  visibleToasts,
  dir,
}: GoeyToasterProps) {
  useEffect(() => {
    setGoeyPosition(position)
  }, [position])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const el = document.createElement('div')
    el.setAttribute('data-goey-toast-css', '')
    el.style.position = 'absolute'
    el.style.width = '0'
    el.style.height = '0'
    el.style.overflow = 'hidden'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)

    const value = getComputedStyle(el).getPropertyValue('--goey-toast')
    document.body.removeChild(el)

    if (!value) {
      console.warn(
        '[goey-toast] Styles not found. Make sure to import the CSS:\n\n' +
        '  import "goey-toast/styles.css";\n'
      )
    }
  }, [])

  return (
    <Toaster
      position={position}
      duration={duration}
      gap={gap}
      offset={offset}
      theme={theme}
      toastOptions={{ unstyled: true, ...toastOptions }}
      expand={expand}
      closeButton={closeButton}
      richColors={richColors}
      visibleToasts={visibleToasts}
      dir={dir}
    />
  )
}
