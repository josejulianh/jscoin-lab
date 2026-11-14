# JScoin Lab - Práctica 18 (Semana/Día 18)

## Estimación de fees basada en bloques confirmados y simulación de congestión

### Teoría

En redes reales como Bitcoin, la estimación de fees se basa principalmente en el comportamiento reciente de la red:

- Se observan las **fee rates** de las transacciones que han sido **confirmadas** en bloques recientes.
- Se calculan percentiles (p50, p75, etc.) para sugerir una fee que permita confirmar en un número determinado de bloques.
- Cuando hay **congestión**, el mempool crece y solo las transacciones con mejor fee rate entran en los siguientes bloques. Las demás esperan.

En esta práctica implementamos una versión **muy simplificada** y educativa:

- Función `estimateFeeFromConfirmed()` que mira los fee rates de txs confirmadas en los últimos N bloques y sugiere según un percentil.
- Combinación con la estimación del mempool.
- Límite educativo de transacciones por bloque (`maxTxsPerBlock`) para simular congestión: solo las mejores entran, el resto permanece en el mempool.

**Importante — Prototipo educativo:**

Este código **NO** es apto para producción. Carece de:

- Fee rate real por peso virtual (vsize / weight).
- Datos históricos reales de la red (solo se usa la cadena local).
- Mempool real con políticas de relay avanzadas.
- Estimación basada en tiempo o número de bloques objetivo sofisticada.
- Protección contra spam, dust, etc.
- Red P2P, consenso de producción, UTXO model completo, scripts, seguridad criptográfica de nivel producción.

Solo sirve para entender cómo se puede estimar una fee mirando lo que ya se confirmó y cómo la congestión afecta qué transacciones se incluyen en un bloque.

### Dependencias

```bash
cd week18
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crea una wallet y se mina recompensa.
- Se añaden transacciones y se mina un bloque.
- La estimación basada en confirmados cambia después de minar.
- Con más transacciones de las que caben en un bloque, se observa la congestión: solo las de mejor fee rate se confirman y el resto permanece en mempool.
- La cadena permanece válida.

### Ejercicios

1. Ejecuta el código y observa las estimaciones antes y después de confirmar bloques, así como el mensaje de congestión.
2. Cambia el percentil en `estimateFeeFromConfirmed` (ej. 0.5 para mediana, 0.9 para más agresivo) y compara las sugerencias.
3. Modifica `maxTxsPerBlock` y observa cómo afecta la congestión.
4. Añade un contador de “bloques de espera estimados” según el fee rate ofrecido frente a los confirmados.
5. (Extra) Combina con la práctica 17: prioriza eviction + congestión + estimación de confirmados.

### Próximo nivel

Práctica 19 (opcional): Cierre formal del laboratorio, explorador simple de la cadena, o temas avanzados adicionales (Merkle proofs más completos, etc.).

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
