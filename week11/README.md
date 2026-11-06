# JScoin Lab - Práctica 11 (Semana/Día 11)

## Árboles de Merkle y verificación de transacciones (SPV educativa)

### Teoría

En Bitcoin (y blockchains reales) las transacciones de un bloque se organizan en un **árbol de Merkle**:

1. Cada transacción se hashea (hoja del árbol).
2. Se combinan por pares (padre = hash(hijoIzq + hijoDer)).
3. Se repite hasta obtener una única raíz (**Merkle root**).
4. El bloque solo almacena la raíz en su cabecera (junto con el hash anterior, timestamp, nonce, etc.).
5. Un cliente ligero (SPV) puede verificar que una transacción concreta está incluida en el bloque recibiendo solo:
   - La raíz de Merkle (del bloque).
   - La prueba de Merkle (los hashes hermanos necesarios para reconstruir la raíz).

**Ventajas educativas que se demuestran:**
- El bloque no necesita incluir todas las transacciones en el hash final (solo la raíz).
- Se puede probar la inclusión de una transacción sin descargar el bloque completo.
- Alterar una transacción cambia la raíz y por tanto invalida el bloque.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- El formato exacto de Merkle de Bitcoin (duplicación de nodos impares, serialización específica, doble SHA-256).
- Compact blocks, filtros BIP158, o cualquier optimización real de red.
- Red P2P, consenso de producción, UTXO formal, manejo seguro de claves, etc.
- Protección contra ataques de árbol de Merkle (leaf collisions, etc.).

Solo sirve para entender el concepto de Merkle root + prueba de inclusión.

### Dependencias

```bash
cd week11
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crean transacciones, se minan en un bloque y se calcula el Merkle root.
- Se genera una prueba de Merkle para una transacción concreta.
- La verificación de la prueba devuelve `true`.
- Si se altera la transacción, la prueba falla.
- La cadena sigue siendo válida (`isChainValid() === true`).
- Se muestran los hashes intermedios del árbol para inspección.

### Ejercicios

1. Ejecuta el código y anota el Merkle root y el resultado de la verificación de la prueba.
2. Cambia el importe de una transacción después de minar y observa que la prueba y la validez del bloque fallan.
3. Añade un método que imprima el árbol de Merkle completo (niveles) para un bloque con 4–5 transacciones.
4. Implementa la verificación de que el Merkle root está correctamente incluido en el hash del bloque.
5. (Extra) Maneja el caso de número impar de transacciones (duplicar el último nodo, como hace Bitcoin de forma simplificada).
6. (Extra) Compara el tamaño de una prueba de Merkle con el tamaño del bloque completo.

### Próximo nivel

Práctica 12 (opcional): Simulación básica de red multi-proceso o introducción a smart contracts simples.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
