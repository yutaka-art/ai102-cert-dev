/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'papaparse' {
  const Papa: any
  export default Papa
}

declare module 'vuedraggable' {
  import type { Component } from 'vue'
  const draggable: Component
  export default draggable
}
