# JScoin Lab - Práctica 28 (Semana/Día 28)

## Cierre avanzado del laboratorio: estadísticas completas, exportación JSON y lecciones para sistemas de producción

### Teoría

Tras 27 prácticas progresivas (fundamentos → bloques → transacciones → consenso → redes → seguridad → temas avanzados) es momento de consolidar todo y reflexionar sobre la distancia entre un **prototipo educativo** y un sistema apto para producción.

En esta práctica final:

- Calculamos **estadísticas completas** de la cadena (número de bloques, transacciones, fees totales, recompensa total emitida, tiempo medio de bloque, dificultad media, etc.).
- Exportamos la cadena completa a JSON (para inspección, visualización o pruebas).
- Ejecutamos una **validación final** exhaustiva.
- Listamos de forma clara qué falta para que algo así pudiera acercarse a un sistema real (y por qué este código nunca lo es).

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado** y el cierre del laboratorio.  
**NO** es apto para producción porque:

- No implementa red P2P real, consensus de Nakamoto completo, dificultad adaptativa de producción, Merkle trees de nivel Bitcoin, UTXO set optimizado, script system, fees de mercado, mempool con eviction real, etc.
- La criptografía es básica (no HD wallets, no manejo seguro de claves, no firmas Schnorr, etc.).
- No hay persistencia robusta, pruning, checkpoints, ni protección contra ataques reales (51 %, eclipse, Sybil, DDoS, selfish mining, etc.).
- Cualquier valor real de dinero está en riesgo total. No uses este código con dinero real.

Sirve únicamente para consolidar los conceptos aprendidos y visualizar el estado final de una cadena educativa.

### Dependencias

```bash
cd week28
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se construye una cadena de ejemplo con varias transacciones y bloques minados.
- Se imprimen estadísticas detalladas (bloques, txs, fees, recompensas, tiempos, etc.).
- Se exporta la cadena a `chain-export.json`.
- La validación final devuelve `true`.
- Se muestra un resumen claro de lo que falta para producción.

### Ejercicios

1. Ejecuta el código y revisa las estadísticas impresas. Comprueba que coinciden con lo que ves en la cadena.
2. Abre el archivo `chain-export.json` generado y examina su estructura.
3. Modifica el código para añadir una estadística extra (por ejemplo, media de fees por transacción o número de direcciones únicas).
4. Añade un método que calcule el hashrate aproximado simulado (bloques por segundo × dificultad).
5. (Extra) Compara mentalmente este prototipo con Bitcoin Core o con una biblioteca como `bitcoinjs-lib` y lista 5 diferencias fundamentales.
6. (Extra) Escribe un pequeño script que lea el JSON exportado y muestre un resumen visual en consola.

### Próximo nivel

**Fin del laboratorio progresivo JScoin.**  
Has recorrido: fundamentos, PoW, transacciones firmadas, consenso, redes simuladas, seguridad, Merkle, UTXO, multi-sig, HTLC, canales de pago, watchtowers, reorgs, 51 %, selfish mining y eclipse/Sybil.

Para continuar:
- Estudia Bitcoin Core, Ethereum o Solana.
- Experimenta con bibliotecas reales (`bitcoinjs-lib`, `ethers.js`, `libp2p`).
- Implementa un nodo P2P mínimo con WebSockets.
- Aprende sobre capas 2, zero-knowledge, etc.

¡Enhorabuena por completar el laboratorio completo de JScoin!

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
