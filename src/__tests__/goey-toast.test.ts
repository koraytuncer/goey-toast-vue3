import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import { defineComponent, h } from 'vue'

vi.mock('motion', () => ({
  animate: vi.fn(() => ({ stop: vi.fn() })),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: defineComponent({
    name: 'Toaster',
    setup(_, { attrs }) {
      return () => h('div', { 'data-testid': 'sonner-toaster', ...attrs })
    },
  }),
}))

import { toast } from 'vue-sonner'
import GoeyToast from '../components/GoeyToast.vue'
import GoeyToaster from '../components/GoeyToaster.vue'
import { goeyToast } from '../goey-toast'

// ─── Icon components ──────────────────────────────────────────────────────────

describe('Icon components', () => {
  it('renders SuccessIcon SVG with correct size and stroke', async () => {
    const { default: SuccessIcon } = await import('../icons/SuccessIcon.vue')
    const { container } = render(SuccessIcon, { props: { size: 18 } })
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('renders ErrorIcon SVG with correct size and stroke', async () => {
    const { default: ErrorIcon } = await import('../icons/ErrorIcon.vue')
    const { container } = render(ErrorIcon, { props: { size: 18 } })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('renders WarningIcon SVG with correct size and stroke', async () => {
    const { default: WarningIcon } = await import('../icons/WarningIcon.vue')
    const { container } = render(WarningIcon, { props: { size: 18 } })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('renders InfoIcon SVG with correct size and stroke', async () => {
    const { default: InfoIcon } = await import('../icons/InfoIcon.vue')
    const { container } = render(InfoIcon, { props: { size: 18 } })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('renders SpinnerIcon SVG with correct size and stroke', async () => {
    const { default: SpinnerIcon } = await import('../icons/SpinnerIcon.vue')
    const { container } = render(SpinnerIcon, { props: { size: 18 } })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })
})

// ─── GoeyToast component ──────────────────────────────────────────────────────

describe('GoeyToast component', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders in compact mode with title only', () => {
    render(GoeyToast, { props: { title: 'Success!', type: 'success', phase: 'success' } })
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('renders in expanded mode with title and description', async () => {
    render(GoeyToast, {
      props: { title: 'Warning', description: 'Something needs attention', type: 'warning', phase: 'warning' },
    })
    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('Something needs attention')).toBeInTheDocument()
  })

  it('renders action button with correct label', async () => {
    const onClick = vi.fn()
    render(GoeyToast, {
      props: { title: 'Error occurred', type: 'error', phase: 'error', action: { label: 'Retry', onClick } },
    })
    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders spinner icon in loading state', () => {
    const { container } = render(GoeyToast, {
      props: { title: 'Loading...', type: 'info', phase: 'loading' },
    })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    const svg = container.querySelector('svg[stroke="currentColor"]')!
    expect(svg).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const onClick = vi.fn()
    render(GoeyToast, {
      props: { title: 'Error', type: 'error', phase: 'error', action: { label: 'Retry', onClick } },
    })
    await vi.advanceTimersByTimeAsync(400)
    await fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

// ─── GoeyToaster ──────────────────────────────────────────────────────────────

describe('GoeyToaster', () => {
  it('renders without crashing', () => {
    const { container } = render(GoeyToaster)
    expect(container).toBeTruthy()
  })
})

// ─── goeyToast API ────────────────────────────────────────────────────────────

describe('goeyToast API', () => {
  it('has success method as a function', () => {
    expect(typeof goeyToast.success).toBe('function')
  })

  it('has error method as a function', () => {
    expect(typeof goeyToast.error).toBe('function')
  })

  it('has warning method as a function', () => {
    expect(typeof goeyToast.warning).toBe('function')
  })

  it('has info method as a function', () => {
    expect(typeof goeyToast.info).toBe('function')
  })

  it('has promise method as a function', () => {
    expect(typeof goeyToast.promise).toBe('function')
  })

  it('has dismiss method as a function', () => {
    expect(typeof goeyToast.dismiss).toBe('function')
  })
})

// ─── goeyToast.promise ────────────────────────────────────────────────────────

describe('goeyToast.promise', () => {
  const mockCustom = toast.custom as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockCustom.mockClear()
  })
  afterEach(() => { vi.useRealTimers() })

  function renderPromiseToast<T>(
    promise: Promise<T>,
    data: Parameters<typeof goeyToast.promise<T>>[1]
  ) {
    goeyToast.promise(promise, data)
    const ComponentClass = mockCustom.mock.calls[0][0]
    return render(ComponentClass)
  }

  it('calls toast.custom when promise is invoked', () => {
    const promise = new Promise(() => {})
    goeyToast.promise(promise, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
    })
    expect(mockCustom).toHaveBeenCalledTimes(1)
    expect(mockCustom).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: expect.any(String), duration: undefined })
    )
  })

  it('passes Infinity duration when description is provided', () => {
    const promise = new Promise(() => {})
    goeyToast.promise(promise, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
      description: { loading: 'Please wait' },
    })
    expect(mockCustom).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: Infinity })
    )
  })

  it('passes Infinity duration when timing.displayDuration is set', () => {
    const promise = new Promise(() => {})
    goeyToast.promise(promise, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
      timing: { displayDuration: 5000 },
    })
    expect(mockCustom).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: Infinity })
    )
  })

  it('renders loading state initially', () => {
    const promise = new Promise(() => {})
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
    })
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('transitions to success state when promise resolves with string title', async () => {
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
    })
    expect(screen.getByText('Saving...')).toBeInTheDocument()

    await resolve!('ok')
    await vi.runAllTimersAsync()

    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('transitions to success state with function title receiving resolved data', async () => {
    let resolve: (value: { count: number }) => void
    const promise = new Promise<{ count: number }>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Uploading...',
      success: (data) => `Uploaded ${data.count} files`,
      error: 'Upload failed',
    })

    await resolve!({ count: 5 })
    await vi.runAllTimersAsync()

    expect(screen.getByText('Uploaded 5 files')).toBeInTheDocument()
  })

  it('transitions to error state when promise rejects with string title', async () => {
    let reject!: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    promise.catch(() => {})
    renderPromiseToast(promise, {
      loading: 'Deleting...',
      success: 'Deleted!',
      error: 'Delete failed',
    })

    reject(new Error('Network error'))
    await vi.runAllTimersAsync()

    expect(screen.getByText('Delete failed')).toBeInTheDocument()
  })

  it('transitions to error state with function title receiving error', async () => {
    let reject!: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    promise.catch(() => {})
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: (err) => `Error: ${(err as Error).message}`,
    })

    reject(new Error('Timeout'))
    await vi.runAllTimersAsync()

    expect(screen.getByText('Error: Timeout')).toBeInTheDocument()
  })

  it('shows success description as string after promise resolves', async () => {
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed',
      description: { success: 'Your changes have been saved' },
    })

    await resolve!('ok')
    await vi.advanceTimersByTimeAsync(400)

    expect(screen.getByText('Your changes have been saved')).toBeInTheDocument()
  })

  it('shows success description from function after promise resolves', async () => {
    let resolve: (value: { name: string }) => void
    const promise = new Promise<{ name: string }>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Creating...',
      success: 'Created!',
      error: 'Failed',
      description: { success: (data) => `Created project "${data.name}"` },
    })

    await resolve!({ name: 'My Project' })
    await vi.advanceTimersByTimeAsync(400)

    expect(screen.getByText('Created project "My Project"')).toBeInTheDocument()
  })

  it('shows error description as string after promise rejects', async () => {
    let reject!: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    promise.catch(() => {})
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed',
      description: { error: 'Please try again later' },
    })

    reject(new Error('oops'))
    await vi.advanceTimersByTimeAsync(400)

    expect(screen.getByText('Please try again later')).toBeInTheDocument()
  })

  it('shows success action button after promise resolves', async () => {
    const onClick = vi.fn()
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Processing...',
      success: 'Done!',
      error: 'Failed',
      action: { success: { label: 'View', onClick } },
    })

    await resolve!('ok')
    await vi.advanceTimersByTimeAsync(400)

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
  })

  it('shows error action button after promise rejects', async () => {
    const onClick = vi.fn()
    let reject!: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    promise.catch(() => {})
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
      action: { error: { label: 'Retry', onClick } },
    })

    reject(new Error('fail'))
    await vi.advanceTimersByTimeAsync(400)

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
