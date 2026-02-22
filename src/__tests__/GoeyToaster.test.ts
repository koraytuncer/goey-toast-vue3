import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/vue'
import { defineComponent, h } from 'vue'

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

import GoeyToaster from '../components/GoeyToaster.vue'

describe('GoeyToaster', () => {
  it('renders without crashing', () => {
    const { container } = render(GoeyToaster)
    expect(container).toBeTruthy()
  })

  it('renders with default props', () => {
    const { container } = render(GoeyToaster)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with custom position', () => {
    const { container } = render(GoeyToaster, {
      props: { position: 'top-center' },
    })
    expect(container).toBeTruthy()
  })

  it('renders with dark theme', () => {
    const { container } = render(GoeyToaster, {
      props: { theme: 'dark' },
    })
    expect(container).toBeTruthy()
  })

  it('renders with spring disabled', () => {
    const { container } = render(GoeyToaster, {
      props: { spring: false },
    })
    expect(container).toBeTruthy()
  })

  it('renders with custom bounce value', () => {
    const { container } = render(GoeyToaster, {
      props: { bounce: 0.8 },
    })
    expect(container).toBeTruthy()
  })
})
