<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ content: string }>()

const html = computed(() => marked(props.content) as string)
</script>

<template>
  <div class="prose" v-html="html" />
</template>

<style>
.prose { color: #374151; line-height: 1.75; font-size: 1rem; }
.prose h2 { font-size: 1.375rem; font-weight: 600; color: #111827; margin: 2rem 0 0.75rem; }
.prose h3 { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 1.5rem 0 0.5rem; }
.prose h4 { font-size: 1rem; font-weight: 600; color: #374151; margin: 1.25rem 0 0.5rem; }
.prose p  { margin: 0.75rem 0; }
.prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
.prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
.prose li { margin: 0.3rem 0; }
.prose strong { font-weight: 600; color: #111827; }
.prose a { color: #6b2fa0; text-decoration: underline; }
.prose code {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  background: #f3f4f6;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  color: #6b2fa0;
}
.prose pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1rem 0;
  font-size: 0.875rem;
}
.prose pre code { background: transparent; color: inherit; padding: 0; }
.prose table { display: block; width: 100%; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
.prose th { background: #f9fafb; font-weight: 600; text-align: left; padding: 0.6rem 0.75rem; border-bottom: 2px solid #e5e7eb; }
.prose td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
.prose tr:hover td { background: #fafafa; }
.prose blockquote { border-left: 3px solid #6b2fa0; padding-left: 1rem; color: #6b7280; margin: 1rem 0; font-style: italic; }
.prose hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
</style>
