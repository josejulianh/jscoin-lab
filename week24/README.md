# JScoin Lab - Práctica 24 (Semana/Día 24)

## Reorganizaciones de cadena (reorgs) y bloques huérfanos educativos

### Teoría

En una blockchain, cuando dos mineros encuentran un bloque válido casi al mismo tiempo, pueden aparecer **bloques huérfanos** (orphan blocks) o **bloques tíos** (uncles).

El **consenso de la cadena más larga** (o más pesada, en PoW) resuelve el conflicto:

- Los nodos adoptan la cadena con mayor trabajo acumulado.
- Los bloques de la cadena más corta se convierten en **huérfanos**.
- Las transacciones de los bloques huérfanos vuelven al mempool (si aún son válidas).
- Esto se llama **reorganización** (reorg).

**Versión educativa de esta práctica:**
- Simulamos dos ramas de la cadena.
- Un nodo detecta cuál es la cadena con más trabajo.
- Realiza un reorg simple: descarta la rama corta y adopta la larga.
- Todo ocurre en memoria; no hay red P2P real.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:

- No implementa propagación P2P real, validación completa de headers, ni cálculo real de dificultad acumulada.
- No maneja reorgs profundos, checkpoints, ni protección contra ataques de reorg.
- No tiene red, consenso de producción, ni seguridad de nivel Bitcoin.
- La detección y el reorg son solo a nivel de aplicación y en memoria.
- No hay manejo real de UTXO, firmas avanzadas ni scripts.

Sirve únicamente para entender el concepto de bloques huérfanos y reorganizaciones de forma interactiva en JavaScript.

### Dependencias

```bash
cd week24
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crea una cadena principal.
- Se simula una bifurcación (dos bloques válidos con el mismo previousHash).
- Se añade más trabajo a una de las ramas.
- El nodo detecta la cadena más larga y realiza un reorg.
- Las transacciones de la rama descartada vuelven al mempool (simulado).
- La cadena final es válida (`isChainValid() === true`).
- Se muestran los bloques huérfanos.

### Ejercicios

1. Ejecuta el código y observa la detección de la bifurcación y el reorg.
2. Añade un método `getOrphanBlocks()` que devuelva la lista de bloques huérfanos detectados.
3. Modifica la simulación para crear una bifurcación de 2 bloques de profundidad y realiza el reorg.
4. Simula un escenario donde una transacción que estaba en el bloque huérfano se vuelve a minar en la nueva cadena.
5. (Extra) Añade un contador de "profundidad de reorg" y muestra una alerta si el reorg es mayor a N bloques.

### Próximo nivel

Tema avanzado opcional. Puedes estudiar los reorgs en Bitcoin real, el concepto de "chainwork", las protecciones contra ataques de 51%, o explorar cómo los exploradores muestran bloques huérfanos.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
