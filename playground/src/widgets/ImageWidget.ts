import { defineComponent, h } from 'vue'

export const ImageWidget = defineComponent({
  name: 'ImageWidget',
  props: {
    src: { type: String, default: 'https://placehold.co/300x200' },
    alt: { type: String, default: 'Image' },
    width: { type: String, default: '300' },
  },
  setup(props) {
    return () => {
      return h('div', { class: 'widget-image' }, [
        h('img', {
          class: 'widget-image__img',
          src: props.src,
          alt: props.alt,
          style: { width: `${props.width}px`, maxWidth: '100%', height: 'auto' },
        }),
      ])
    }
  },
})
