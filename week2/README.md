# JScoin Lab - Práctica 2 (Semana/Día 2)

## Prueba de Trabajo (Proof-of-Work) simple

### Teoría

Después de los fundamentos (bloques y cadena de la Semana 1), el siguiente paso es hacer costoso añadir un bloque. En Bitcoin un minero debe resolver un rompecabezas computacional:

1. Se añade un campo `nonce` (número que se incrementa).
2. Se calcula el hash del bloque (incluyendo el nonce, datos, previousHash, etc.).
3. El hash debe empezar por un número determinado de ceros (la **dificultad**).
4. Si no cumple, se incrementa el nonce y se vuelve a calcular hasta encontrar uno válido.

Esto hace que:
- Añadir un bloque cueste tiempo/energía (computación).
- Alterar un bloque antiguo requiera re-minar ese bloque y todos los posteriores (muy costoso).

**Importante — Prototipo educativo vs. producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción. Carece de:
- SHA-256 doble, dificultad adaptativa real, árboles de Merkle
- Firmas ECDSA / criptografía de clave pública
- Red P2P, consenso de producción (Nakamoto), recompensas de minería
- Validaciones de transacciones, UTXO, protección contra double-spending real
- Seguridad de nivel producción

Solo sirve para entender el concepto de PoW de forma interactiva.

### Cómo ejecutar

```bash
node week2/blockchain.js
```

Puedes cambiar la variable `difficulty` (2 = rápido, 3 = medio, 4 = lento).

### Resultados esperados (verificables)

- Cada bloque se mina y muestra su hash, nonce y tiempo.
- La cadena es válida al final (`isChainValid() === true`).
- Tras alterar los datos de un bloque, `isChainValid()` devuelve `false`.
- El hash de cada bloque minado empieza por el número de ceros de la dificultad.

### Ejercicios

1. Ejecuta el código con dificultad 2 y 3. Anota el tiempo aproximado de cada bloque.
2. Modifica el código para que muestre cuántos hashes se calcularon (cuenta de nonces intentados).
3. Añade un método `getBalance(address)` que recorra la cadena y calcule el saldo (simplificado, sin firmas).
4. Intenta alterar un bloque y luego re-mínalo. Observa que la cadena vuelve a ser válida solo después de re-minar.
5. (Extra) Implementa dificultad adaptativa simple: si el bloque se minó muy rápido, sube la dificultad para el siguiente.

### Próximo nivel

Práctica 3: Transacciones y firmas digitales.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
