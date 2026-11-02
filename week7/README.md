# JScoin Lab - Práctica 7 (Semana/Día 7)

## Mejoras de red: sincronización de mempool y propagación de transacciones

### Teoría

En una blockchain real, además de los bloques, se propagan las **transacciones pendientes** (mempool):

1. Un usuario crea y firma una transacción y la envía a un nodo.
2. El nodo valida la transacción (firma, saldo suficiente, no double-spend en mempool, etc.).
3. Si es válida, la añade a su mempool y la **propaga** (broadcast) a sus peers.
4. Los peers hacen lo mismo: validan y reenvían.
5. Cuando un minero mina un bloque, incluye transacciones de su mempool, las elimina y propaga el bloque.
6. Al recibir un bloque válido, los nodos eliminan del mempool las transacciones que ya están incluidas.

Esto permite que las transacciones se conozcan en toda la red antes de ser minadas.

**En este prototipo educativo** simulamos:
- Propagación de transacciones (`broadcastTransaction`).
- Sincronización básica de mempool entre nodos.
- Limpieza del mempool al recibir un bloque que las incluye.
- Integración con las validaciones de saldo de la práctica 6.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Red P2P real (sockets, libp2p, WebRTC, etc.).
- Descubrimiento de peers, DHT, etc.
- Protección contra spam de transacciones (fees, rate limiting).
- Mempool avanzado (prioridad por fee, eviction, etc.).
- Manejo de forks y reorganizaciones complejas.
- Consenso formal, seguridad criptográfica de producción, etc.

Solo sirve para entender el flujo básico de propagación de transacciones y sincronización de mempool en un entorno controlado.

### Dependencias

```bash
cd week7
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Una transacción creada en un nodo se propaga a los peers.
- Los peers la añaden a su mempool solo si es válida y hay saldo suficiente.
- Al minar un bloque, las transacciones se incluyen y se eliminan del mempool de todos los nodos que adoptan el bloque.
- Intentos de double-spend o saldo insuficiente son rechazados en todos los nodos.
- Los saldos finales son coherentes en todos los nodos.
- La cadena permanece válida.

### Ejercicios

1. Ejecuta el código y observa la propagación de la transacción de Alice a Bob.
2. Verifica los mempools de cada nodo antes y después de minar.
3. Intenta propagar una transacción con saldo insuficiente y observa el rechazo.
4. Añade un método para sincronizar el mempool completo entre dos nodos (`syncMempool`).
5. (Extra) Implementa un fee simple y que el minero lo reciba.
6. (Extra) Añade un contador de cuántas veces se reenvía cada transacción para detectar bucles.

### Próximo nivel

Práctica 8: Dificultad adaptativa y consideraciones adicionales de seguridad/red.
