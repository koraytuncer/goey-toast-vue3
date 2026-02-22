<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import type { GoeyToasterProps } from '../types'
import { setGoeyPosition, setGoeySpring, setGoeyBounce } from '../context'

const props = withDefaults(defineProps<GoeyToasterProps>(), {
  position: 'bottom-right',
  gap: 14,
  offset: '24px',
  theme: 'light',
  spring: true,
})

watch(() => props.position, (val) => setGoeyPosition(val), { immediate: true })
watch(() => props.spring, (val) => setGoeySpring(val ?? true), { immediate: true })
watch(() => props.bounce, (val) => setGoeyBounce(val), { immediate: true })

onMounted(() => {
  if (!import.meta.env.DEV) return

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
      '[goey-toast-vue] Styles not found. Make sure to import the CSS:\n\n' +
      '  import "goey-toast-vue/styles.css";\n'
    )
  }
})
</script>

<template>
  <Toaster
    :position="position"
    :duration="duration"
    :gap="gap"
    :offset="offset"
    :theme="theme"
    :toast-options="{ unstyled: true, ...toastOptions }"
    :expand="expand"
    :close-button="closeButton"
    :rich-colors="richColors"
    :visible-toasts="visibleToasts"
    :dir="dir"
  />
</template>
