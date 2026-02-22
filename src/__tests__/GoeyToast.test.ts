import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

import GoeyToast from '../components/GoeyToast.vue'

function mockReducedMotion(enabled: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: enabled,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
}

describe('GoeyToast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders title text', () => {
    render(GoeyToast, { props: { title: 'Loading...', type: 'success', phase: 'loading' } })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders in compact pill shape during loading phase', () => {
    const { container } = render(GoeyToast, {
      props: { title: 'Loading...', type: 'success', phase: 'loading' },
    })
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Compact')
    expect(contentEl.className).not.toContain('Expanded')
  })

  it('renders in compact pill shape for result without description', () => {
    const { container } = render(GoeyToast, {
      props: { title: 'Done!', type: 'success', phase: 'success' },
    })
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Compact')
  })

  it('renders in expanded shape when description is provided', async () => {
    const { container } = render(GoeyToast, {
      props: { title: 'Done!', description: 'Your file was saved.', type: 'success', phase: 'success' },
    })
    await vi.advanceTimersByTimeAsync(400)
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Expanded')
    expect(screen.getByText('Your file was saved.')).toBeInTheDocument()
  })

  it('renders action button when action is provided', async () => {
    const onClick = vi.fn()
    render(GoeyToast, {
      props: {
        title: 'Error',
        description: 'Something went wrong.',
        type: 'error',
        phase: 'error',
        action: { label: 'Retry', onClick },
      },
    })
    await vi.advanceTimersByTimeAsync(400)
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const onClick = vi.fn()
    render(GoeyToast, {
      props: {
        title: 'Error',
        description: 'Something went wrong.',
        type: 'error',
        phase: 'error',
        action: { label: 'Retry', onClick },
      },
    })
    await vi.advanceTimersByTimeAsync(400)
    const button = screen.getByRole('button', { name: 'Retry' })
    await fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not render description when not provided', () => {
    render(GoeyToast, { props: { title: 'Done!', type: 'success', phase: 'success' } })
    const desc = document.querySelector('[class*="description"]')
    expect(desc).toBeNull()
  })

  it('does not render action button when action is not provided', () => {
    render(GoeyToast, { props: { title: 'Done!', type: 'success', phase: 'success' } })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('uses custom fillColor for SVG blob', () => {
    const { container } = render(GoeyToast, {
      props: { title: 'Dark', type: 'info', phase: 'info', fillColor: '#1a1a2e' },
    })
    const path = container.querySelector('svg path')!
    expect(path.getAttribute('fill')).toBe('#1a1a2e')
  })

  it('uses default fillColor when not provided', () => {
    const { container } = render(GoeyToast, {
      props: { title: 'Default', type: 'info', phase: 'info' },
    })
    const path = container.querySelector('svg path')!
    expect(path.getAttribute('fill')).toBe('#ffffff')
  })

  it('applies classNames to wrapper element', () => {
    const { container } = render(GoeyToast, {
      props: {
        title: 'Styled',
        type: 'info',
        phase: 'info',
        classNames: { wrapper: 'my-custom-wrapper' },
      },
    })
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('my-custom-wrapper')
  })

  it('applies classNames to content, header, title, and icon elements', () => {
    const { container } = render(GoeyToast, {
      props: {
        title: 'Styled',
        type: 'info',
        phase: 'info',
        classNames: {
          content: 'custom-content',
          header: 'custom-header',
          title: 'custom-title',
          icon: 'custom-icon',
        },
      },
    })
    expect(container.querySelector('[class*="content"]')!.className).toContain('custom-content')
    expect(container.querySelector('[class*="header"]')!.className).toContain('custom-header')
    const titleEl = container.querySelector('span[class*="title"]')!
    expect(titleEl.className).toContain('custom-title')
    expect(container.querySelector('[class*="iconWrapper"]')!.className).toContain('custom-icon')
  })

  it('applies classNames to description element', async () => {
    const { container } = render(GoeyToast, {
      props: {
        title: 'Styled',
        description: 'Some text',
        type: 'info',
        phase: 'info',
        classNames: { description: 'custom-desc' },
      },
    })
    await vi.advanceTimersByTimeAsync(400)
    expect(container.querySelector('[class*="description"]')!.className).toContain('custom-desc')
  })

  it('applies classNames to action wrapper and button', async () => {
    const onClick = vi.fn()
    const { container } = render(GoeyToast, {
      props: {
        title: 'Styled',
        description: 'Some text',
        type: 'error',
        phase: 'error',
        action: { label: 'Retry', onClick },
        classNames: { actionWrapper: 'custom-aw', actionButton: 'custom-ab' },
      },
    })
    await vi.advanceTimersByTimeAsync(400)
    expect(container.querySelector('[class*="actionWrapper"]')!.className).toContain('custom-aw')
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button.className).toContain('custom-ab')
  })

  describe('prefers-reduced-motion', () => {
    it('expands immediately with no delay when reduced motion is preferred', async () => {
      mockReducedMotion(true)
      const { container } = render(GoeyToast, {
        props: {
          title: 'Done!',
          description: 'Your file was saved.',
          type: 'success',
          phase: 'success',
        },
      })
      await vi.advanceTimersByTimeAsync(1)
      const contentEl = container.querySelector('[class*="content"]') as HTMLElement
      expect(contentEl.className).toContain('Expanded')
      expect(screen.getByText('Your file was saved.')).toBeInTheDocument()
    })

    it('still renders title and description correctly with reduced motion', async () => {
      mockReducedMotion(true)
      render(GoeyToast, {
        props: {
          title: 'Info',
          description: 'Details here.',
          type: 'info',
          phase: 'info',
        },
      })
      await vi.advanceTimersByTimeAsync(1)
      expect(screen.getByText('Info')).toBeInTheDocument()
      expect(screen.getByText('Details here.')).toBeInTheDocument()
    })

    it('still renders action button with reduced motion', async () => {
      mockReducedMotion(true)
      const onClick = vi.fn()
      render(GoeyToast, {
        props: {
          title: 'Error',
          description: 'Something went wrong.',
          type: 'error',
          phase: 'error',
          action: { label: 'Retry', onClick },
        },
      })
      await vi.advanceTimersByTimeAsync(1)
      const button = screen.getByRole('button', { name: 'Retry' })
      expect(button).toBeInTheDocument()
      await fireEvent.click(button)
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('renders compact pill without motion when no description', () => {
      mockReducedMotion(true)
      const { container } = render(GoeyToast, {
        props: { title: 'Done!', type: 'success', phase: 'success' },
      })
      const contentEl = container.querySelector('[class*="content"]') as HTMLElement
      expect(contentEl.className).toContain('Compact')
    })
  })
})
