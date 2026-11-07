# Mis Décimos (PWA lotería de Navidad)
Proyecto nuevo, personal. Angular 22 (standalone, signals, OnPush) + Dexie (IndexedDB) + Service Worker (`@angular/pwa`).
- Datos solo en el móvil (IndexedDB); nada se sube. La app no hace llamadas de red de datos (el OCR de la foto corre en el móvil con Tesseract.js servido desde /ocr).
- Importes SIEMPRE en céntimos enteros (`importeCent`); formato con `formatoEuros`.
- Lógica pura en `src/app/core` (reparto, backup, ocr) con tests `*.spec.ts`; las páginas en `src/app/pages`.
- Textos de UI y errores en castellano; código en inglés/castellano de dominio como el existente.
- «Comprobar décimos» se eliminó a petición del usuario; el premio se introduce a mano en la ficha.
- Favorito = décimo que se juega todos los años: al crear un sorteo nuevo se copian como pendiente de compra (`favoritosParaAnio`).
- Compartir décimo usa la plantilla real `public/plantilla-decimo.png` (coordenadas en `PLANTILLA`, core/compartir.ts); sin imagen dibuja una tarjeta genérica.
- Comandos: `npm start`, `npm test -- --watch=false`, `npm run build`.
