# JScoin Lab - Práctica 17 (Semana/Día 17)

## Estimación básica de fees y límites de mempool (eviction educativo)

### Teoría

En redes reales como Bitcoin:

- Los mineros y nodos priorizan transacciones según el **fee rate** (satoshis por virtual byte).
- El mempool tiene un tamaño limitado. Cuando se llena, se expulsan (evict) las transacciones con menor fee rate para hacer espacio a otras mejores.
- Los usuarios y wallets estiman una fee adecuada observando el estado del mempool para que su transacción se confirme en un tiempo razonable.

En esta práctica implementamos una versión **muy simplificada** y educativa:

- Cada transacción tiene un tamaño simulado (en “bytes” educativos).
- Se calcula un fee rate = fee / size.
- El mempool tiene un límite máximo de transacciones (o de “tamaño”).
- Al añadir una nueva tx, si el mempool está lleno, se expulsa la de menor fee rate si la nueva es mejor.
- Se incluye una función simple de estimación de fee basada en el percentil de fees actuales en el mempool.

**Importante — Prototipo educativo:**

Este código **NO** es apto para producción. Carece de:

- Fee rate real por peso virtual (vsize / weight).
- Mempool real con políticas de relay (BIP 125, replace-by-fee avanzado, ancestor/descendant limits).
- Estimación de fees basada en datos históricos de confirmaciones.
- Protección contra spam, dust, etc.
- Red P2P, consenso de producción, UTXO model completo, scripts, seguridad criptográfica de nivel producción.

Solo sirve para entender los conceptos de priorización por fee rate y gestión de un mempool con capacidad limitada.

### Dependencias

```bash
cd week17
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crea una wallet y se mina recompensa.
- Se añaden varias transacciones con diferentes fees y tamaños.
- El mempool se llena y se observa la eviction de la tx con peor fee rate.
- La función de estimación sugiere una fee razonable.
- Al minar, se confirman las de mayor fee rate.
- La cadena permanece válida.

### Ejercicios

1. Ejecuta el código y observa los logs de fee rate, eviction y estimación.
2. Modifica el límite del mempool y el tamaño simulado de las transacciones.
3. Implementa una estimación más simple: “fee media de las últimas N tx confirmadas”.
4. Añade un fee rate mínimo para aceptar transacciones en el mempool.
5. (Extra) Combina con el RBF de la práctica 16: permitir reemplazo solo si mejora el fee rate.

### Próximo nivel

Práctica 18 (opcional): Temas avanzados (simulación de congestión, fee estimation más realista) o cierre formal del laboratorio.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
