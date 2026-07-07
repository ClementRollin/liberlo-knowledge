<template>
  <div class="min-h-full bg-white">
    <div class="px-12 py-10">
      <h1 class="text-2xl font-semibold text-gray-900 mb-8">Import de documents</h1>
      <ImportWizard />
    </div>
  </div>
</template>

<script setup lang="ts">
import ImportWizard from '@/components/domain/import/ImportWizard.vue'
</script>
