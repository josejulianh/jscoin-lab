# JScoin Lab - Práctica 5 (Semana/Día 5)

## Redes y propagación básica de bloques

### Teoría

En una blockchain real los nodos forman una **red peer-to-peer (P2P)** descentralizada:

1. Cada nodo mantiene su propia copia de la cadena.
2. Cuando un minero encuentra un bloque válido, lo **propaga** (broadcast) a sus peers.
3. Los peers validan el bloque y, si es correcto, lo añaden a su cadena y lo reenvían a sus propios peers.
4. Las transacciones también se propagan por el mempool de la red.
5. Si dos nodos minan bloques casi a la vez se crea un *fork* temporal. La regla de la cadena más larga (vista en la práctica anterior) resuelve el conflicto cuando se propaga la cadena más larga.

**Simulación educativa:**
En este prototipo no hay sockets reales ni TCP/IP. Simulamos una red pequeña en memoria con varios nodos que se conocen entre sí y se intercambian cadenas o bloques.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Red P2P real (libp2p, WebRTC, TCP, etc.)
- Descubrimiento de peers (DHT, DNS seeds)
- Propagación eficiente (inv, getdata, compact blocks)
- Manejo de latencia, pérdida de paquetes o ataques de eclipse
- Mempool sincronizado
- Seguridad de red (autenticación de peers, DoS protection)
- Consenso real más allá de la comparación de longitud

Solo sirve para entender el flujo básico de propagación y adopción de cadenas.

### Dependencias

```bash
cd week5
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crean varios nodos independientes.
- Un nodo mina bloques y propaga su cadena.
- Los demás nodos adoptan la cadena más larga y válida.
- Los saldos se actualizan de forma coherente en todos los nodos que adoptan la cadena.
- Una cadena más corta o inválida es rechazada.
- `isChainValid()` sigue siendo `true`.

### Ejercicios

1. Ejecuta el código y anota las longitudes y saldos de cada nodo antes y después de la propagación.
2. Simula un fork: haz que dos nodos minen en paralelo y luego propaguen. Observa cuál cadena gana.
3. Añade un método `broadcastTransaction` que propague una transacción al mempool de los peers.
4. Modifica el código para que un nodo rechace bloques con dificultad incorrecta.
5. (Extra) Implementa un retraso artificial (`setTimeout`) para simular latencia de red y observa cómo afecta la adopción.
6. (Extra) Añade un contador de cuántas veces se propaga un bloque.

### Próximo nivel

Práctica 6: Seguridad básica (double-spending, validaciones adicionales, etc.).
