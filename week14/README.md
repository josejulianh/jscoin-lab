# JScoin Lab - Práctica 14 (Semana/Día 14)

## Simulación multi-nodo educativa y propagación básica

### Teoría

En una blockchain real los nodos forman una red peer-to-peer (P2P). Cada nodo:

1. Mantiene su propia copia de la cadena.
2. Recibe y valida transacciones y bloques de sus vecinos.
3. Propaga (gossip) la información válida a otros nodos.
4. Resuelve conflictos eligiendo la cadena más larga (o con más trabajo acumulado).

En esta práctica simulamos varios nodos en memoria que se comunican a través de un “network bus” simple. No hay sockets reales ni NAT traversal; es un prototipo educativo para entender:

- Propagación de transacciones (mempool).
- Propagación de bloques.
- Sincronización de cadenas (longest chain).
- Validación independiente por cada nodo.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Red P2P real (libp2p, WebRTC, TCP, etc.).
- Descubrimiento de peers, handshake, rate-limiting.
- Consensus real (Nakamoto, PBFT, etc.) más allá de la cadena más larga.
- Seguridad de red (eclipse attacks, sybil, etc.).
- Persistencia, fees complejas, scripts reales.

Solo sirve para visualizar cómo varios nodos pueden converger en la misma cadena.

### Dependencias

```bash
cd week14
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crean varios nodos.
- Una transacción se propaga y aparece en los mempools.
- Un bloque minado por un nodo se propaga y es aceptado por los demás.
- Todos los nodos terminan con la misma cadena válida.
- Intentar propagar un bloque inválido es rechazado.
- Se muestra el estado de cada nodo (altura de cadena, saldo, etc.).

### Ejercicios

1. Ejecuta el código y verifica que todos los nodos tienen la misma altura y la misma cadena válida.
2. Añade un tercer nodo y observa la propagación.
3. Implementa un pequeño retardo aleatorio en la propagación para simular latencia.
4. Haz que un nodo mine un bloque competidor y observa cómo se resuelve el fork (cadena más larga).
5. (Extra) Añade un método para que un nodo solicite la cadena completa a otro (sincronización inicial).
6. (Extra) Simula un nodo malicioso que intenta propagar un bloque con transacción inválida.

### Próximo nivel

Práctica 15 (opcional): Scripts básicos educativos (locking/unlocking estilo P2PKH) o mejoras de fees.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
