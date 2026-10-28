# JScoin Lab - Práctica 2 (Semana/Día 2)

## Prueba de Trabajo (Proof-of-Work) simple

### Teoría

En Bitcoin (y en este prototipo) un bloque no se añade simplemente. El minero debe resolver un rompecabezas computacional:

1. Se añade un campo `nonce` (número que se incrementa).
2. Se calcula el hash del bloque (incluyendo el nonce).
3. El hash debe empezar por un número determinado de ceros (la **dificultad**).
4. Si no cumple, se incrementa el nonce y se vuelve a calcular.

Esto hace que:
- Añadir un bloque cueste tiempo/energía.
- Alterar un bloque antiguo requiera re-minar ese bloque y todos los posteriores (muy costoso).

**Importante**: Esto es un prototipo educativo extremadamente simplificado.  
En producción real se usa SHA-256 doble, dificultad adaptativa, árboles de Merkle, firmas ECDSA, red P2P, etc.

### Cómo ejecutar

```bash
node week2/blockchain.js
```

Puedes cambiar la variable `difficulty` (2 = rápido, 4 = lento).

### Resultados esperados (verificables)

- Cada bloque se mina y muestra su hash y nonce.
- La cadena es válida al final.
- Tras alterar los datos de un bloque, `isChainValid()` devuelve `false`.

### Ejercicios

1. Ejecuta el código con dificultad 2 y 3. Anota el tiempo aproximado.
2. Modifica el código para que muestre cuántos hashes se calcularon (cuenta de nonces).
3. Añade un método `getBalance(address)` que recorra la cadena y calcule el saldo (simplificado, sin firmas).
4. Intenta alterar un bloque y luego re-minarlo. Observa que la cadena vuelve a ser válida solo después de re-minar.
5. (Extra) Implementa dificultad adaptativa simple: si el bloque se minó muy rápido, sube la dificultad.

### Próximo nivel

Práctica 3: Transacciones y firmas digitales.
