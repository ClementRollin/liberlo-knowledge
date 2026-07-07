<template>
  <div class="flex flex-col items-center justify-center py-16 text-center px-4">
    <div class="text-5xl mb-4 opacity-70">{{ icon }}</div>
    <h3 class="text-base font-semibold text-gray-700 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-400 max-w-sm">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
  }>(),
  { icon: '📭' },
)
</script>
