<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)

onErrorCaptured((error, instance, info) => {
  hasError.value = true
  if (import.meta.env.DEV) {
    console.error('[GoeyToast] Rendering error:', error, info)
  }
  // Return false to stop error propagation
  return false
})
</script>

<template>
  <slot v-if="!hasError" />
</template>
