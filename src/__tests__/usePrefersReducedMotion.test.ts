import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

function createTestComponent() {
  return defineComponent({
    setup() {
      const prefersReducedMotion = usePrefersReducedMotion()
      return { prefersReducedMotion }
    },
    render() {
      return h('div', { 'data-value': String(this.prefersReducedMotion) })
    },
  })
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when matchMedia is not available', () => {
    vi.stubGlobal('matchMedia', undefined)
    const wrapper = mount(createTestComponent())
    expect(wrapper.attributes('data-value')).toBe('false')
  })

  it('returns false when reduced motion is not preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    const wrapper = mount(createTestComponent())
    expect(wrapper.attributes('data-value')).toBe('false')
  })

  it('returns true when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    const wrapper = mount(createTestComponent())
    expect(wrapper.attributes('data-value')).toBe('true')
  })

  it('adds event listener on mount', () => {
    const addEventListener = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener,
      removeEventListener: vi.fn(),
    })))
    mount(createTestComponent())
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes event listener on unmount', () => {
    const removeEventListener = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener,
    })))
    const wrapper = mount(createTestComponent())
    wrapper.unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
