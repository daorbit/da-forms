export type EmbedLang = 'html' | 'react' | 'vue';

export const EMBED_LANG_LABEL: Record<EmbedLang, string> = { html: 'HTML', react: 'React', vue: 'Vue' };

interface SnippetInput {
  shareUrl: string;
  frameId: string;
  title: string;
  height: number | string;
}

function componentNameFor(title: string): string {
  const words = (title || 'Embedded Form').match(/[a-zA-Z0-9]+/g) ?? ['Embedded', 'Form'];
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return /^[0-9]/.test(name) ? `Form${name}` : name;
}

function pixelHeight(height: number | string) {
  return typeof height === 'number' ? height : 600;
}

function htmlSnippet({ shareUrl, frameId, height }: SnippetInput) {
  return `<iframe
  id="${frameId}"
  src="${shareUrl}"
  width="100%"
  height="${height}"
  frameborder="0"
  style="border:0;max-width:100%"
></iframe>
<script>
  window.addEventListener('message', function (e) {
    var frame = document.getElementById('${frameId}');
    if (!frame || !e.data || e.source !== frame.contentWindow) return;
    if (e.data.type === 'da-forms:height') frame.style.height = e.data.height + 'px';
    if (e.data.type === 'da-forms:ready') {
      frame.contentWindow.postMessage({ type: 'da-forms:context', page: location.href, referrer: document.referrer }, '*');
    }
  });
</script>`;
}

function reactSnippet({ shareUrl, title, height }: SnippetInput) {
  return `import { useEffect, useRef } from 'react';

function ${componentNameFor(title)}() {
  const ref = useRef(null);

  useEffect(() => {
    function onMessage(e) {
      const frame = ref.current;
      if (!frame || e.source !== frame.contentWindow) return;
      if (e.data?.type === 'da-forms:height') frame.style.height = e.data.height + 'px';
      if (e.data?.type === 'da-forms:ready') {
        frame.contentWindow.postMessage({ type: 'da-forms:context', page: location.href, referrer: document.referrer }, '*');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src="${shareUrl}"
      title="${(title || 'Form').replace(/"/g, '\\"')}"
      style={{ width: '100%', height: ${pixelHeight(height)}, border: 0 }}
    />
  );
}`;
}

function vueSnippet({ shareUrl, height }: SnippetInput) {
  return `<template>
  <iframe
    ref="frame"
    src="${shareUrl}"
    :style="{ width: '100%', height: height + 'px', border: 0 }"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const frame = ref(null);
const height = ref(${pixelHeight(height)});
function onMessage(e) {
  if (!frame.value || e.source !== frame.value.contentWindow) return;
  if (e.data?.type === 'da-forms:height') height.value = e.data.height;
  if (e.data?.type === 'da-forms:ready') {
    frame.value.contentWindow.postMessage({ type: 'da-forms:context', page: location.href, referrer: document.referrer }, '*');
  }
}
onMounted(() => window.addEventListener('message', onMessage));
onUnmounted(() => window.removeEventListener('message', onMessage));
</script>`;
}

export function embedSnippets(input: SnippetInput): { id: EmbedLang; code: string }[] {
  return [
    { id: 'html', code: htmlSnippet(input) },
    { id: 'react', code: reactSnippet(input) },
    { id: 'vue', code: vueSnippet(input) },
  ];
}
