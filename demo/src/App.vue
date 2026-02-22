<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineComponent, h } from 'vue'
import { GoeyToaster, goeyToast } from 'goey-toast-vue'
import type { GoeyToastOptions, GoeyToasterProps } from 'goey-toast-vue'
import 'goey-toast-vue/styles.css'
import './App.css'

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'
type Page = 'home' | 'changelog'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function failAfter(ms: number) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), ms))
}

const DEMO_DEFAULTS: GoeyToastOptions = {
  spring: true,
  timing: { displayDuration: 3000 },
}

const TOAST_TYPES: ToastType[] = ['default', 'success', 'error', 'warning', 'info']
const POSITIONS: GoeyToasterProps['position'][] = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

// ─── Page / nav state ─────────────────────────────────────────────────────────
const page = ref<Page>('home')
const mobileMenuOpen = ref(false)
const heroVisible = ref(true)
const heroLanding = ref(false)
const heroTitleRef = ref<HTMLHeadingElement | null>(null)

let heroObserver: IntersectionObserver | null = null
let heroLandingTimer: ReturnType<typeof setTimeout> | null = null
let prevHeroVisible = true

onMounted(() => {
  if (!heroTitleRef.value) return
  heroObserver = new IntersectionObserver(
    ([entry]) => { heroVisible.value = entry.isIntersecting },
    { threshold: 0, rootMargin: `-56px 0px 0px 0px` }
  )
  heroObserver.observe(heroTitleRef.value)
})

onUnmounted(() => {
  heroObserver?.disconnect()
  if (heroLandingTimer) clearTimeout(heroLandingTimer)
})

watch(heroVisible, (visible) => {
  if (visible && !prevHeroVisible) {
    heroLanding.value = true
    heroLandingTimer = setTimeout(() => { heroLanding.value = false }, 500)
  }
  prevHeroVisible = visible
})

watch(page, () => {
  mobileMenuOpen.value = false
  window.scrollTo(0, 0)
})

function scrollTo(id: string) {
  mobileMenuOpen.value = false
  if (page.value !== 'home') {
    page.value = 'home'
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
}

// ─── Copy helper ──────────────────────────────────────────────────────────────
const installCopied = ref(false)
const codeCopied = ref(false)

function copyInstall() {
  navigator.clipboard.writeText('npm install goey-toast-vue')
  installCopied.value = true
  setTimeout(() => { installCopied.value = false }, 1500)
}

function copyCode() {
  navigator.clipboard.writeText(generatedCode.value)
  codeCopied.value = true
  setTimeout(() => { codeCopied.value = false }, 1500)
}

// ─── Builder state ────────────────────────────────────────────────────────────
const bPosition = ref<GoeyToasterProps['position']>('top-left')
const bType = ref<ToastType>('success')
const bTitle = ref('Changes saved')
const bHasDesc = ref(true)
const bDesc = ref('Your changes have been saved and synced successfully.')
const bHasAction = ref(false)
const bActionLabel = ref('Undo')
const bFillColor = ref('#ffffff')
const bHasBorder = ref(false)
const bBorderColor = ref('#E0E0E0')
const bBorderWidth = ref(1.5)
const bDisplayDuration = ref(4000)
const bSpring = ref(true)
const bBounce = ref(0.4)

function fireBuilderToast() {
  const options: GoeyToastOptions = {}
  if (bHasDesc.value && bDesc.value) options.description = bDesc.value
  if (bHasAction.value && bActionLabel.value) {
    options.action = { label: bActionLabel.value, onClick: () => {}, successLabel: 'Done!' }
  }
  if (bFillColor.value !== '#ffffff') options.fillColor = bFillColor.value
  if (bHasBorder.value && bBorderColor.value) {
    options.borderColor = bBorderColor.value
    options.borderWidth = bBorderWidth.value
  }
  if (bDisplayDuration.value !== 4000) {
    options.timing = { displayDuration: bDisplayDuration.value }
  }
  if (!bSpring.value) options.spring = false
  options.bounce = bBounce.value

  if (bType.value === 'default') goeyToast(bTitle.value, options)
  else goeyToast[bType.value](bTitle.value, options)
}

const generatedCode = computed(() => {
  const lines: string[] = []
  const hasFill = bFillColor.value !== '#ffffff'
  const hasBorder = bHasBorder.value && bBorderColor.value
  const hasSpringOff = !bSpring.value
  const hasBounce = bBounce.value !== 0.4
  const hasOpts = bHasDesc.value || bHasAction.value || hasFill || hasBorder || hasSpringOff || hasBounce
  const call = bType.value === 'default' ? 'goeyToast' : `goeyToast.${bType.value}`

  lines.push(`<GoeyToaster position="${bPosition.value}" />`)
  lines.push('')
  if (!hasOpts) {
    lines.push(`${call}('${bTitle.value}')`)
  } else {
    lines.push(`${call}('${bTitle.value}', {`)
    if (bHasDesc.value && bDesc.value) lines.push(`  description: '${bDesc.value}',`)
    if (bHasAction.value && bActionLabel.value) {
      lines.push(`  action: {`)
      lines.push(`    label: '${bActionLabel.value}',`)
      lines.push(`    onClick: () => {},`)
      lines.push(`  },`)
    }
    if (hasFill) lines.push(`  fillColor: '${bFillColor.value}',`)
    if (hasBorder) {
      lines.push(`  borderColor: '${bBorderColor.value}',`)
      lines.push(`  borderWidth: ${bBorderWidth.value},`)
    }
    if (hasSpringOff) lines.push(`  spring: false,`)
    if (hasBounce) lines.push(`  bounce: ${bBounce.value},`)
    if (bDisplayDuration.value !== 4000) {
      lines.push(`  timing: {`)
      lines.push(`    displayDuration: ${bDisplayDuration.value},`)
      lines.push(`  },`)
    }
    lines.push(`})`)
  }
  return lines.join('\n')
})

// ─── Custom VNode description for "Deployment complete" example ───────────────
const DeploymentDesc = defineComponent({
  render() {
    return h('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:300px' }, [
      h('div', { style: 'display:flex;justify-content:space-between;font-size:12px' }, [
        h('span', { style: 'color:#888' }, 'Environment'),
        h('span', { style: 'font-weight:600' }, 'Production'),
      ]),
      h('div', { style: 'display:flex;justify-content:space-between;font-size:12px' }, [
        h('span', { style: 'color:#888' }, 'Branch'),
        h('span', { style: 'font-weight:600' }, 'main @ 3f8a2c1'),
      ]),
      h('div', { style: 'display:flex;justify-content:space-between;font-size:12px' }, [
        h('span', { style: 'color:#888' }, 'Duration'),
        h('span', { style: 'font-weight:600' }, '2m 14s'),
      ]),
      h('div', { style: 'height:1px;background:#e5e5e5' }),
      h('div', { style: 'font-size:11px;color:#888' }, 'https://my-app.example.com'),
    ])
  },
})
</script>

<template>
  <GoeyToaster :position="bPosition" />

  <!-- ══════════════════════════════════════════
       Header
       ══════════════════════════════════════════ -->
  <header :class="['site-header', !heroVisible && page === 'home' ? 'header--hero-hidden' : '']">
    <div class="header-inner">
      <button class="header-logo" @click="() => { page = 'home'; window.scrollTo(0, 0) }">
        goey-toast-vue
        <img src="/mascot.png" alt="" class="header-mascot" />
      </button>

      <nav class="header-nav">
        <button class="nav-link" @click="scrollTo('examples')">Examples</button>
        <button class="nav-link" @click="scrollTo('builder')">Builder</button>
        <button class="nav-link" @click="scrollTo('docs')">Docs</button>
        <button :class="['nav-link', page === 'changelog' ? 'nav-link--active' : '']" @click="page = 'changelog'">Changelog</button>
      </nav>

      <div class="header-icons">
        <a href="https://github.com/koraytuncer/goey-toast-vue" target="_blank" rel="noopener noreferrer" class="header-icon-link" aria-label="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <a href="https://www.npmjs.com/package/goey-toast-vue" target="_blank" rel="noopener noreferrer" class="header-icon-link" aria-label="npm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
          </svg>
        </a>
      </div>

      <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menu">
        <svg v-if="mobileMenuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>

    <div v-if="mobileMenuOpen" class="mobile-menu">
      <button class="mobile-menu-link" @click="scrollTo('examples')">Examples</button>
      <button class="mobile-menu-link" @click="scrollTo('builder')">Builder</button>
      <button class="mobile-menu-link" @click="scrollTo('docs')">Docs</button>
      <button :class="['mobile-menu-link', page === 'changelog' ? 'mobile-menu-link--active' : '']" @click="() => { page = 'changelog'; mobileMenuOpen = false }">Changelog</button>
      <div class="mobile-menu-divider" />
      <div class="mobile-menu-icons">
        <a href="https://github.com/koraytuncer/goey-toast-vue" target="_blank" rel="noopener noreferrer" class="header-icon-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          GitHub
        </a>
        <a href="https://www.npmjs.com/package/goey-toast-vue" target="_blank" rel="noopener noreferrer" class="header-icon-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" /></svg>
          npm
        </a>
      </div>
    </div>
  </header>

  <!-- ══════════════════════════════════════════
       Changelog Page
       ══════════════════════════════════════════ -->
  <div v-if="page === 'changelog'" class="page-changelog">
    <button class="back-link" @click="page = 'home'">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
      Back to home
    </button>

    <div class="changelog-header">
      <h1>Changelog</h1>
      <p>What's new in goey-toast-vue.</p>
    </div>

    <div class="changelog-entry">
      <div class="changelog-version">
        <span class="changelog-tag">v0.1.0</span>
        <span class="changelog-date">Feb 2026</span>
      </div>
      <div class="changelog-body">
        <h4>Initial Vue Release</h4>
        <ul>
          <li>Full Vue 3 port of goey-toast</li>
          <li>Organic blob morph animation (pill to blob and back)</li>
          <li>Five toast types: default, success, error, warning, info</li>
          <li>Description body with string or VNode/Component support</li>
          <li>Action button with optional success label morph-back</li>
          <li>Promise toasts with loading to success/error transitions</li>
          <li>Configurable display duration and bounce intensity</li>
          <li>6 positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right</li>
          <li>Right-side positions auto-mirror the blob horizontally</li>
          <li>Hover pause: hovering an expanded toast pauses the dismiss timer</li>
          <li>Hover re-expand: hovering a collapsed pill re-expands the toast</li>
          <li>Pre-dismiss collapse animation (blob shrinks to pill before exit)</li>
          <li>Custom fill color, border color, and border width</li>
          <li>CSS class overrides via classNames prop</li>
          <li>Built on vue-sonner and Motion</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       Home Page
       ══════════════════════════════════════════ -->
  <template v-else>
    <!-- Hero -->
    <div class="hero">
      <div class="hero-badge">
        <span /> v0.1.0
      </div>
      <h1
        ref="heroTitleRef"
        :class="heroLanding ? 'hero-title--landing' : ''"
      >
        goey-toast-vue
        <img
          src="/mascot.png"
          alt="mascot"
          :class="['hero-mascot', heroLanding ? 'hero-mascot--landing' : '']"
        />
      </h1>
      <p class="hero-description">
        Morphing toast notifications for Vue 3. Organic blob animations,
        promise tracking, and full customization out of the box.
      </p>
      <div class="hero-install">
        <div class="install-wrapper">
          <code><span class="prompt">$</span> npm install goey-toast-vue</code>
          <button class="copy-btn" @click="copyInstall">
            <svg v-if="installCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Two-column: Examples + Builder -->
    <div class="two-col" id="examples">

      <!-- Quick-fire examples -->
      <div class="examples">
        <div class="examples-header">
          <h2>Examples</h2>
          <span>Click to preview</span>
        </div>

        <div class="section">
          <div class="section-label">Toast Types</div>
          <div class="buttons">
            <button @click="goeyToast('Notification received', DEMO_DEFAULTS)">Default</button>
            <button @click="goeyToast.success('Changes Saved', DEMO_DEFAULTS)">Success</button>
            <button @click="goeyToast.error('Something went wrong', DEMO_DEFAULTS)">Error</button>
            <button @click="goeyToast.warning('Storage is almost full', DEMO_DEFAULTS)">Warning</button>
            <button @click="goeyToast.info('New update available', DEMO_DEFAULTS)">Info</button>
          </div>
        </div>

        <div class="section">
          <div class="section-label">With Description</div>
          <div class="buttons">
            <button @click="goeyToast.warning('Your session is about to expire', { ...DEMO_DEFAULTS, description: `You've been inactive for 25 minutes. Please save your work or your session will end automatically.` })">
              Warning + Description
            </button>
            <button @click="goeyToast.error('Connection lost', { ...DEMO_DEFAULTS, description: 'Unable to reach the server. Check your internet connection and try again.' })">
              Error + Description
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-label">With Action Button</div>
          <div class="buttons">
            <button @click="goeyToast.error('Payment failed', { ...DEMO_DEFAULTS, description: 'Your card ending in 4242 was declined. Please update your payment method to continue.', action: { label: 'Update Payment', onClick: () => goeyToast.success('Redirecting...', DEMO_DEFAULTS) } })">
              Error + Action
            </button>
            <button @click="goeyToast.info('Share link ready', { ...DEMO_DEFAULTS, description: 'Your share link has been generated and is ready to copy.', action: { label: 'Copy to Clipboard', onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'), successLabel: 'Copied!' } })">
              Action + Success Pill
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Custom Component Body</div>
          <div class="buttons">
            <button @click="goeyToast.success('Deployment complete', { ...DEMO_DEFAULTS, description: DeploymentDesc })">
              VNode Description
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-label">No Spring (Smooth Easing)</div>
          <div class="buttons">
            <button @click="goeyToast.success('Changes Saved', { ...DEMO_DEFAULTS, spring: false })">Success (no spring)</button>
            <button @click="goeyToast.error('Connection lost', { ...DEMO_DEFAULTS, spring: false, description: 'Unable to reach the server. Check your internet connection and try again.' })">Error + Desc (no spring)</button>
            <button @click="goeyToast.info('Share link ready', { ...DEMO_DEFAULTS, spring: false, description: 'Your share link has been generated and is ready to copy.', action: { label: 'Copy to Clipboard', onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'), successLabel: 'Copied!' } })">Action (no spring)</button>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Promise (Morph Animation)</div>
          <div class="buttons">
            <button @click="goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })">
              Promise + Success (pill)
            </button>
            <button @click="goeyToast.promise(failAfter(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })">
              Promise + Error (pill)
            </button>
            <button @click="goeyToast.promise(failAfter(2000), { ...DEMO_DEFAULTS, loading: 'Uploading file...', success: 'Upload complete', error: 'Upload failed', description: { error: `You've used 95% of your available storage. Please upgrade your plan to continue.` }, action: { error: { label: 'Action Button', onClick: () => goeyToast.info('Retrying...', DEMO_DEFAULTS) } } })">
              Promise + Error (expanded)
            </button>
            <button @click="goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Processing...', success: 'All done!', error: 'Failed', description: { success: 'Your data has been processed and saved successfully.' } })">
              Promise + Success (expanded)
            </button>
          </div>
        </div>
      </div>

      <!-- Interactive Builder -->
      <div class="builder" id="builder">
        <div class="builder-header">
          <h2>Builder</h2>
          <p>Design and test your toast in real time.</p>
        </div>

        <div class="builder-card">
          <!-- Position -->
          <div class="builder-row">
            <div class="builder-label">Position</div>
            <div class="type-pills">
              <button
                v-for="p in POSITIONS"
                :key="p"
                class="type-pill"
                data-type="position"
                :data-active="bPosition === p"
                @click="bPosition = p"
              >{{ p }}</button>
            </div>
          </div>

          <!-- Type -->
          <div class="builder-row">
            <div class="builder-label">Type</div>
            <div class="type-pills">
              <button
                v-for="t in TOAST_TYPES"
                :key="t"
                class="type-pill"
                :data-type="t"
                :data-active="bType === t"
                @click="bType = t"
              >{{ t }}</button>
            </div>
          </div>

          <!-- Title -->
          <div class="builder-row">
            <div class="builder-label">Title</div>
            <input
              class="builder-input"
              v-model="bTitle"
              placeholder="Toast title..."
            />
          </div>

          <!-- Description -->
          <div class="builder-row">
            <div class="toggle-row">
              <span class="toggle-row-label">Description</span>
              <button class="toggle" :data-on="bHasDesc" @click="bHasDesc = !bHasDesc">
                <div class="toggle-knob" />
              </button>
            </div>
            <textarea
              v-if="bHasDesc"
              class="builder-input"
              style="margin-top: 10px"
              v-model="bDesc"
              placeholder="Description text..."
            />
          </div>

          <!-- Action -->
          <div class="builder-row">
            <div class="toggle-row">
              <span class="toggle-row-label">Action Button</span>
              <button class="toggle" :data-on="bHasAction" @click="bHasAction = !bHasAction">
                <div class="toggle-knob" />
              </button>
            </div>
            <input
              v-if="bHasAction"
              class="builder-input"
              style="margin-top: 10px"
              v-model="bActionLabel"
              placeholder="Button label..."
            />
          </div>

          <!-- Style -->
          <div class="builder-row">
            <div class="builder-label">Style</div>
            <div class="style-controls">
              <div class="color-row">
                <span class="color-row-label">Fill Color</span>
                <div class="color-picker-group">
                  <input type="color" class="color-input" v-model="bFillColor" />
                  <input class="builder-input color-hex" v-model="bFillColor" placeholder="#ffffff" />
                </div>
              </div>
              <div class="border-section">
                <div class="toggle-row">
                  <span class="toggle-row-label">Border</span>
                  <button class="toggle" :data-on="bHasBorder" @click="bHasBorder = !bHasBorder">
                    <div class="toggle-knob" />
                  </button>
                </div>
                <div v-if="bHasBorder" class="border-controls">
                  <div class="color-row">
                    <span class="color-row-label">Color</span>
                    <div class="color-picker-group">
                      <input type="color" class="color-input" v-model="bBorderColor" />
                      <input class="builder-input color-hex" v-model="bBorderColor" placeholder="#E0E0E0" />
                    </div>
                  </div>
                  <div class="slider-item">
                    <div class="slider-item-header">
                      <span class="slider-item-label">Width</span>
                      <span class="slider-item-value">{{ bBorderWidth }}px</span>
                    </div>
                    <input type="range" class="slider" min="0.5" max="4" step="0.5" v-model.number="bBorderWidth" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timing -->
          <div class="builder-row">
            <div class="builder-label">Timing</div>
            <div class="slider-group">
              <div class="slider-item">
                <div class="slider-item-header">
                  <span class="slider-item-label">Display Duration</span>
                  <span class="slider-item-value">{{ (bDisplayDuration / 1000).toFixed(1) }}s</span>
                </div>
                <input type="range" class="slider" min="1000" max="20000" step="500" v-model.number="bDisplayDuration" />
              </div>
            </div>
          </div>

          <!-- Spring -->
          <div class="builder-row">
            <div class="builder-label">Spring Effect</div>
            <div class="slider-group">
              <div class="slider-item">
                <div class="slider-item-header">
                  <span class="slider-item-label">{{ bSpring ? `Bounce: ${bBounce.toFixed(2)}` : 'Off' }}</span>
                  <button class="toggle" :data-on="bSpring" @click="bSpring = !bSpring" style="transform: scale(0.85)">
                    <div class="toggle-knob" />
                  </button>
                </div>
                <input v-if="bSpring" type="range" class="slider" min="0.05" max="0.8" step="0.05" v-model.number="bBounce" />
              </div>
            </div>
          </div>

          <!-- Fire button -->
          <div class="builder-row">
            <button class="fire-btn" @click="fireBuilderToast">Fire Toast</button>
          </div>

          <!-- Generated code -->
          <div class="builder-code">
            <button class="code-copy-btn" @click="copyCode">
              {{ codeCopied ? 'Copied!' : 'Copy' }}
            </button>
            <pre><code>{{ generatedCode }}</code></pre>
          </div>
        </div>
      </div>

    </div><!-- end two-col -->

    <!-- Documentation -->
    <div class="docs" id="docs">
      <div class="docs-header">
        <h2>Documentation</h2>
        <p>Everything you need to add morphing toast notifications to your Vue 3 app.</p>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">01</div>
          <h3>Quick Start</h3>
        </div>
        <div class="doc-section-content">
          <p>Add the <span class="inline-code">GoeyToaster</span> component and call <span class="inline-code">goeyToast</span> from anywhere.</p>
          <pre><code>import { GoeyToaster, goeyToast } from 'goey-toast-vue'
import 'goey-toast-vue/styles.css'

// In your App.vue template:
// &lt;GoeyToaster position="bottom-right" /&gt;

goeyToast.success('Saved!')</code></pre>
          <p>Requires <span class="inline-code">vue</span> and <span class="inline-code">motion</span> as peer dependencies.</p>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">02</div>
          <h3>Toast Types</h3>
        </div>
        <div class="doc-section-content">
          <pre><code>goeyToast('Hello')                    // default (neutral)
goeyToast.success('Saved!')           // green
goeyToast.error('Failed')             // red
goeyToast.warning('Careful')          // yellow
goeyToast.info('FYI')                 // blue</code></pre>
          <div class="doc-try-buttons">
            <button @click="goeyToast('Notification received', DEMO_DEFAULTS)">Default</button>
            <button @click="goeyToast.success('Changes Saved', DEMO_DEFAULTS)">Success</button>
            <button @click="goeyToast.error('Something went wrong', DEMO_DEFAULTS)">Error</button>
            <button @click="goeyToast.warning('Storage is almost full', DEMO_DEFAULTS)">Warning</button>
            <button @click="goeyToast.info('New update available', DEMO_DEFAULTS)">Info</button>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">03</div>
          <h3>Description</h3>
        </div>
        <div class="doc-section-content">
          <p>Pass a string or any Vue <span class="inline-code">Component</span> as the description to expand the toast into a blob.</p>
          <pre><code>goeyToast.error('Payment failed', {
  description: 'Your card was declined.',
})

// Vue component as body
goeyToast.success('Deployed', {
  description: DeploymentInfoComponent,
})</code></pre>
          <div class="doc-try-buttons">
            <button @click="goeyToast.warning('Your session is about to expire', { ...DEMO_DEFAULTS, description: `You've been inactive for 25 minutes. Please save your work.` })">Warning + Description</button>
            <button @click="goeyToast.error('Connection lost', { ...DEMO_DEFAULTS, description: 'Unable to reach the server. Check your internet connection and try again.' })">Error + Description</button>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">04</div>
          <h3>Action Button</h3>
        </div>
        <div class="doc-section-content">
          <p>Add <span class="inline-code">successLabel</span> for a pill morph-back animation on click.</p>
          <pre><code>goeyToast.info('Share link ready', {
  description: 'Your link has been generated.',
  action: {
    label: 'Copy to Clipboard',
    onClick: () => navigator.clipboard.writeText(url),
    successLabel: 'Copied!',   // optional morph-back
  },
})</code></pre>
          <div class="doc-try-buttons">
            <button @click="goeyToast.error('Payment failed', { ...DEMO_DEFAULTS, description: 'Your card ending in 4242 was declined.', action: { label: 'Update Payment', onClick: () => goeyToast.success('Redirecting...', DEMO_DEFAULTS) } })">Error + Action</button>
            <button @click="goeyToast.info('Share link ready', { ...DEMO_DEFAULTS, description: 'Your share link has been generated and is ready to copy.', action: { label: 'Copy to Clipboard', onClick: () => navigator.clipboard.writeText('https://example.com/share/abc123'), successLabel: 'Copied!' } })">Action + Success Pill</button>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">05</div>
          <h3>Promise Toasts</h3>
        </div>
        <div class="doc-section-content">
          <p>Automatically transitions from loading to success/error when the promise resolves.</p>
          <pre><code>goeyToast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Changes saved',
  error: 'Something went wrong',
  description: {
    success: 'All changes have been synced.',
    error: 'Please try again later.',
  },
  action: {
    error: {
      label: 'Retry',
      onClick: () => retry(),
    },
  },
})</code></pre>
          <div class="doc-try-buttons">
            <button @click="goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })">Promise + Success (pill)</button>
            <button @click="goeyToast.promise(failAfter(2000), { ...DEMO_DEFAULTS, loading: 'Saving...', success: 'Changes Saved', error: 'Something went wrong' })">Promise + Error (pill)</button>
            <button @click="goeyToast.promise(sleep(2000), { ...DEMO_DEFAULTS, loading: 'Processing...', success: 'All done!', error: 'Failed', description: { success: 'Your data has been processed and saved successfully.' } })">Promise + Success (expanded)</button>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">06</div>
          <h3>Timings</h3>
        </div>
        <div class="doc-section-content">
          <p>Control how long toasts stay visible with the <span class="inline-code">timing</span> option.</p>
          <div class="table-scroll">
            <table class="prop-table">
              <thead><tr><th>Property</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
              <tbody><tr><td>displayDuration</td><td>number</td><td>4000</td><td>Milliseconds toast stays visible</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">07</div>
          <h3>Toaster Props</h3>
        </div>
        <div class="doc-section-content">
          <p>6 positions supported. Right-side positions auto-mirror the blob horizontally. Center positions use a symmetric morph.</p>
          <pre><code>&lt;GoeyToaster position="top-center" /&gt;</code></pre>
          <div class="table-scroll">
            <table class="prop-table">
              <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td>position</td><td>string</td><td>'bottom-right'</td><td>6 positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right</td></tr>
                <tr><td>duration</td><td>number</td><td>—</td><td>Default display duration (ms)</td></tr>
                <tr><td>gap</td><td>number</td><td>14</td><td>Gap between stacked toasts</td></tr>
                <tr><td>offset</td><td>number | string</td><td>'24px'</td><td>Distance from screen edge</td></tr>
                <tr><td>theme</td><td>'light' | 'dark'</td><td>'light'</td><td>Color theme</td></tr>
                <tr><td>spring</td><td>boolean</td><td>true</td><td>Enable spring/bounce animations globally</td></tr>
                <tr><td>bounce</td><td>number</td><td>0.4</td><td>Spring intensity: 0.05 (subtle) to 0.8 (dramatic)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">08</div>
          <h3>Options</h3>
        </div>
        <div class="doc-section-content">
          <div class="table-scroll">
            <table class="prop-table">
              <thead><tr><th>Option</th><th>Type</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td>description</td><td>string | Component</td><td>Body content (string or Vue component)</td></tr>
                <tr><td>action</td><td>GoeyToastAction</td><td>Action button config</td></tr>
                <tr><td>icon</td><td>string | Component</td><td>Custom icon override</td></tr>
                <tr><td>duration</td><td>number</td><td>Display duration in ms</td></tr>
                <tr><td>id</td><td>string | number</td><td>Unique toast identifier</td></tr>
                <tr><td>classNames</td><td>GoeyToastClassNames</td><td>CSS class overrides</td></tr>
                <tr><td>fillColor</td><td>string</td><td>Background color of the blob</td></tr>
                <tr><td>borderColor</td><td>string</td><td>Border color of the blob</td></tr>
                <tr><td>borderWidth</td><td>number</td><td>Border width in px (default 1.5)</td></tr>
                <tr><td>timing</td><td>GoeyToastTimings</td><td>Animation timing overrides</td></tr>
                <tr><td>spring</td><td>boolean</td><td>Enable spring/bounce animations (default true)</td></tr>
                <tr><td>bounce</td><td>number</td><td>Spring intensity: 0.05 (subtle) to 0.8 (dramatic), default 0.4</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">09</div>
          <h3>Custom Styling</h3>
        </div>
        <div class="doc-section-content">
          <p>Override styles for any part of the toast with <span class="inline-code">classNames</span>.</p>
          <pre><code>goeyToast.success('Styled!', {
  fillColor: '#1a1a2e',
  borderColor: '#333',
  borderWidth: 2,
  classNames: {
    wrapper: 'my-wrapper',
    title: 'my-title',
    description: 'my-desc',
    actionButton: 'my-btn',
  },
})</code></pre>
          <div class="doc-try-buttons">
            <button @click="goeyToast.success('Styled!', { ...DEMO_DEFAULTS, fillColor: '#1a1a2e', borderColor: '#333', borderWidth: 2, description: 'Custom fill and border styling.' })">Try Custom Style</button>
          </div>
          <div class="table-scroll">
            <table class="prop-table">
              <thead><tr><th>Key</th><th>Target</th></tr></thead>
              <tbody>
                <tr><td>wrapper</td><td>Outer container</td></tr>
                <tr><td>content</td><td>Content area</td></tr>
                <tr><td>header</td><td>Icon + title row</td></tr>
                <tr><td>title</td><td>Title text</td></tr>
                <tr><td>icon</td><td>Icon wrapper</td></tr>
                <tr><td>description</td><td>Body text</td></tr>
                <tr><td>actionWrapper</td><td>Button container</td></tr>
                <tr><td>actionButton</td><td>Action button</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <div class="doc-section-label">
          <div class="doc-number">10</div>
          <h3>Spring Animation</h3>
        </div>
        <div class="doc-section-content">
          <p>Disable the spring/bounce effect for a cleaner, more subtle animation style. Set per-toast or globally on the Toaster.</p>
          <pre><code>// Per-toast
goeyToast.success('Saved', {
  description: 'Your changes have been synced.',
  spring: false,
})

// Global default
&lt;GoeyToaster :spring="false" /&gt;</code></pre>
          <p>When <span class="inline-code">spring</span> is <span class="inline-code">false</span>, all spring-based animations use smooth ease-in-out curves instead. Error shake still works regardless.</p>
          <div class="doc-try-buttons">
            <button @click="goeyToast.success('Smooth save', DEMO_DEFAULTS)">No Spring (pill)</button>
            <button @click="goeyToast.warning('Storage warning', { ...DEMO_DEFAULTS, description: 'You are using 95% of your available storage.' })">No Spring (expanded)</button>
            <button @click="goeyToast.success('Bouncy save', { ...DEMO_DEFAULTS, spring: true })">With Spring (compare)</button>
          </div>
        </div>
      </div>

    </div><!-- end docs -->
  </template>
</template>
