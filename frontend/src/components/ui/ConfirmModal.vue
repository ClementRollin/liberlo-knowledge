<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="$emit('cancel')"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h2>
          <p class="text-sm text-gray-600 mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              @click="$emit('cancel')"
            >
              Annuler
            </button>
            <button
              class="px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors"
              :class="
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#6b2fa0] hover:bg-purple-800'
              "
              @click="$emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'primary'
  }>(),
  { confirmLabel: 'Confirmer', variant: 'danger' },
)

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
