# JScoin Lab

Laboratorio progresivo para aprender a desarrollar **JScoin**, una criptomoneda educativa inspirada en Bitcoin, usando JavaScript.

## Semana 1: Fundamentos (Bloques y Cadena)

### Objetivo
Crear las estructuras de datos mínimas de un bloque y una blockchain local.

### Cómo ejecutar
```bash
node week1/blockchain.js
```

### Ejercicios
1. Ejecuta el código y verifica que la cadena es válida.
2. Modifica el `data` del bloque 1 después de añadirlo y comprueba que `isChainValid()` pasa a `false`.
3. Añade un método `printChain()` que muestre de forma legible índice, hash y previousHash de cada bloque.
4. Crea 3 bloques más con datos inventados y confirma que la validez se mantiene.

**Importante**: Este es un prototipo educativo mínimo. No tiene prueba de trabajo, firmas, red ni consenso.

Cada semana se añadirá una nueva práctica en su carpeta correspondiente.
