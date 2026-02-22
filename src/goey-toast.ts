import { ref, defineComponent, h, watch } from 'vue'
import { toast } from 'vue-sonner'
import GoeyToast from './components/GoeyToast.vue'
import ToastErrorBoundary from './components/ToastErrorBoundary.vue'
import type {
  GoeyToastOptions,
  GoeyPromiseData,
  GoeyToastPhase,
  GoeyToastType,
  GoeyRenderable,
} from './types'

const DEFAULT_EXPANDED_DURATION = 4000

// ─── GoeyToastWrapper ─────────────────────────────────────────────────────────
// Thin wrapper that renders GoeyToast inside ToastErrorBoundary

function createToastWrapper(props: {
  initialPhase: GoeyToastPhase
  title: string
  type: GoeyToastType
  description?: GoeyRenderable
  action?: GoeyToastOptions['action']
  icon?: GoeyRenderable
  classNames?: GoeyToastOptions['classNames']
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastOptions['timing']
  spring?: boolean
  bounce?: number
  toastId?: string | number
}) {
  return defineComponent({
    name: 'GoeyToastWrapper',
    setup() {
      return () =>
        h(ToastErrorBoundary, null, {
          default: () =>
            h(GoeyToast, {
              title: props.title,
              description: props.description,
              type: props.type,
              action: props.action,
              icon: props.icon,
              phase: props.initialPhase,
              classNames: props.classNames,
              fillColor: props.fillColor,
              borderColor: props.borderColor,
              borderWidth: props.borderWidth,
              timing: props.timing,
              spring: props.spring,
              bounce: props.bounce,
              toastId: props.toastId,
            }),
        })
    },
  })
}

// ─── PromiseToastWrapper ──────────────────────────────────────────────────────
// Tracks promise state (loading → success/error) and re-renders GoeyToast

function createPromiseWrapper<T>(
  promise: Promise<T>,
  data: GoeyPromiseData<T>,
  toastId: string | number
) {
  return defineComponent({
    name: 'PromiseToastWrapper',
    setup() {
      const phase = ref<GoeyToastPhase>('loading')
      const title = ref(data.loading)
      const description = ref<GoeyRenderable | undefined>(data.description?.loading)
      const action = ref<GoeyToastOptions['action'] | undefined>(undefined)

      const resetDuration = (hasExpandedContent: boolean) => {
        const baseDuration = data.timing?.displayDuration ?? (hasExpandedContent ? DEFAULT_EXPANDED_DURATION : undefined)
        const collapseDurMs = 0.9 * 1000
        const duration = baseDuration != null && hasExpandedContent ? baseDuration + collapseDurMs : baseDuration
        if (duration != null) {
          toast.custom(createPromiseWrapper(promise, data, toastId), { id: toastId, duration })
        }
      }

      promise
        .then((result) => {
          const desc = typeof data.description?.success === 'function'
            ? data.description.success(result)
            : data.description?.success
          title.value = typeof data.success === 'function' ? data.success(result) : data.success
          description.value = desc
          action.value = data.action?.success
          phase.value = 'success'
          resetDuration(Boolean(desc || data.action?.success))
        })
        .catch((err) => {
          const desc = typeof data.description?.error === 'function'
            ? data.description.error(err)
            : data.description?.error
          title.value = typeof data.error === 'function' ? data.error(err) : data.error
          description.value = desc
          action.value = data.action?.error
          phase.value = 'error'
          resetDuration(Boolean(desc || data.action?.error))
        })

      return () =>
        h(ToastErrorBoundary, null, {
          default: () =>
            h(GoeyToast, {
              title: title.value,
              description: description.value,
              type: phase.value === 'loading' ? 'info' : (phase.value as GoeyToastType),
              action: action.value,
              phase: phase.value,
              classNames: data.classNames,
              fillColor: data.fillColor,
              borderColor: data.borderColor,
              borderWidth: data.borderWidth,
              timing: data.timing,
              spring: data.spring,
              bounce: data.bounce,
            }),
        })
    },
  })
}

// ─── createGoeyToast ──────────────────────────────────────────────────────────

function createGoeyToast(
  title: string,
  type: GoeyToastType,
  options?: GoeyToastOptions
) {
  const hasExpandedContent = Boolean(options?.description || options?.action)
  const baseDuration = options?.timing?.displayDuration ?? options?.duration ?? (options?.description ? DEFAULT_EXPANDED_DURATION : undefined)
  const duration = hasExpandedContent ? Infinity : baseDuration
  const toastId = options?.id ?? Math.random().toString(36).slice(2)

  const WrapperComponent = createToastWrapper({
    initialPhase: type,
    title,
    type,
    description: options?.description,
    action: options?.action,
    icon: options?.icon,
    classNames: options?.classNames,
    fillColor: options?.fillColor,
    borderColor: options?.borderColor,
    borderWidth: options?.borderWidth,
    timing: options?.timing,
    spring: options?.spring,
    bounce: options?.bounce,
    toastId: hasExpandedContent ? toastId : undefined,
  })

  return toast.custom(WrapperComponent, { duration, id: toastId })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const goeyToast = Object.assign(
  (title: string, options?: GoeyToastOptions) =>
    createGoeyToast(title, 'default', options),
  {
    success: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'success', options),
    error: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'error', options),
    warning: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'warning', options),
    info: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'info', options),
    promise: <T,>(promise: Promise<T>, data: GoeyPromiseData<T>) => {
      const id = Math.random().toString(36).slice(2)
      const WrapperComponent = createPromiseWrapper(promise, data, id)
      return toast.custom(WrapperComponent, {
        id,
        duration: (data.timing?.displayDuration != null || data.description) ? Infinity : undefined,
      })
    },
    dismiss: toast.dismiss,
  }
)
