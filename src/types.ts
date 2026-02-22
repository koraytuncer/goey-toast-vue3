import type { VNode, Component } from 'vue'
import type { ExternalToast, ToasterProps } from 'vue-sonner'

export type GoeyToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export type GoeyToastPhase = 'loading' | 'default' | 'success' | 'error' | 'warning' | 'info'

/** Anything renderable as toast description or custom icon */
export type GoeyRenderable = string | VNode | Component | null | undefined

export interface GoeyToastTimings {
  displayDuration?: number
}

export interface GoeyToastClassNames {
  wrapper?: string
  content?: string
  header?: string
  title?: string
  icon?: string
  description?: string
  actionWrapper?: string
  actionButton?: string
}

export interface GoeyToastAction {
  label: string
  onClick: () => void
  successLabel?: string
}

export interface GoeyToastData {
  title: string
  description?: GoeyRenderable
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: GoeyRenderable
  duration?: number
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  spring?: boolean
  bounce?: number
}

export interface GoeyToastOptions {
  description?: GoeyRenderable
  action?: GoeyToastAction
  icon?: GoeyRenderable
  duration?: number
  id?: string | number
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  spring?: boolean
  bounce?: number
}

export interface GoeyPromiseData<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: unknown) => string)
  description?: {
    loading?: GoeyRenderable
    success?: GoeyRenderable | ((data: T) => GoeyRenderable)
    error?: GoeyRenderable | ((error: unknown) => GoeyRenderable)
  }
  action?: {
    success?: GoeyToastAction
    error?: GoeyToastAction
  }
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  spring?: boolean
  bounce?: number
}

export interface GoeyToasterProps {
  position?: ToasterProps['position']
  duration?: number
  gap?: number
  offset?: number | string
  theme?: 'light' | 'dark' | 'system'
  toastOptions?: Partial<ExternalToast>
  expand?: boolean
  closeButton?: boolean
  richColors?: boolean
  visibleToasts?: number
  dir?: 'ltr' | 'rtl' | 'auto'
  spring?: boolean
  bounce?: number
}
