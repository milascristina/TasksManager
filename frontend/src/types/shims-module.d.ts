// src/types/shims-module.d.ts

// Declarație pentru a include fișierele .js fără un fișier .d.ts explicit
declare module '@/services/api' {
  // Puteți folosi 'any' dacă nu doriți să definiți tipurile
  const api: any;
  export default api;
}

// Puteți adăuga declarații similare pentru orice alte module .js custom
// de exemplu: declare module '@/utils/my-helpers';
// src/shims-vue.d.ts
// ... (restul fișierului tău)

declare module '@/services/socket' {
    export const initializeSocket: () => Promise<any>;
    export const disconnectSocket: () => void;
    export const getSocket: () => any;
    export const reconnectSocket: () => Promise<any>;
}
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}