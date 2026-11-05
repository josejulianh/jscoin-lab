# JScoin Lab - Práctica 10 (Semana/Día 10)

## CLI interactivo, UTXO set básico y cierre del laboratorio progresivo

### Teoría

En esta práctica final del núcleo del laboratorio unimos varios conceptos:

**Interfaz de línea de comandos (CLI):**
- Permite interactuar de forma dinámica con la blockchain (crear wallets, enviar, minar, consultar saldos).
- En producción los wallets y nodos tienen interfaces más robustas (GUI, API REST/gRPC, etc.).

**UTXO (Unspent Transaction Output):**
- Modelo usado por Bitcoin: en lugar de saldos por cuenta, se rastrean salidas no gastadas.
- Cada transacción consume UTXOs y crea nuevos.
- Evita double-spending de forma más precisa y permite paralelismo.
- En este prototipo educativo mantenemos un mapa simple de UTXOs además del cálculo de saldo por cuenta (híbrido simplificado).

**Cierre del laboratorio:**
- Resumen de todo lo aprendido.
- Lista clara de lo que falta para un sistema de producción.
- Recomendaciones de próximos pasos (bibliotecas reales, Bitcoin Core, Ethereum, etc.).

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Red P2P real, consenso de producción (Nakamoto Consensus completo, finality, etc.).
- Criptografía de nivel producción (manejo seguro de claves, HD wallets, BIP39, etc.).
- Persistencia robusta (LevelDB/RocksDB, pruning, checkpoints).
- Protección contra ataques reales (51%, eclipse, Sybil, DDoS, etc.).
- Fees, script system, multi-sig, etc.
- Auditorías, tests exhaustivos, manejo de errores de producción.

Solo sirve para consolidar los conceptos fundamentales de una blockchain educativa en JavaScript.

### Dependencias

```bash
cd week10
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

Se abrirá un menú interactivo.

### Resultados esperados (verificables)

- El menú permite crear wallets, minar, enviar y consultar saldos.
- La cadena se persiste y se carga correctamente.
- Los saldos se mantienen coherentes.
- Se muestran advertencias claras de prototipo educativo.
- La cadena sigue siendo válida después de varias operaciones.

### Ejercicios

1. Ejecuta el CLI, crea dos wallets, mina varios bloques y envía monedas entre ellas. Verifica saldos.
2. Reinicia el programa y comprueba que la cadena y los saldos persisten.
3. Añade una opción al menú para exportar/importar una wallet (clave privada) con advertencia de seguridad.
4. Implementa un UTXO set más formal (mapa de txid:vout → valor) y valida gastos contra él.
5. (Extra) Añade fees simples a las transacciones y que el minero los reciba.
6. (Extra) Lee la documentación de Bitcoin o de una biblioteca como `bitcoinjs-lib` y compara con este prototipo.

### Próximo nivel

**Fin del laboratorio progresivo.**  
Has cubierto: bloques, PoW, transacciones firmadas, consenso básico, red simulada, seguridad básica, dificultad adaptativa, persistencia, wallets y CLI interactivo.

Para ir más allá:
- Estudia Bitcoin Core o Ethereum.
- Experimenta con bibliotecas reales (`elliptic` ya la usamos; mira `bitcoinjs-lib`, `ethers.js`).
- Implementa un nodo P2P mínimo con WebSockets.
- Aprende sobre capas 2, smart contracts, etc.

¡Enhorabuena por completar el núcleo de JScoin Lab!
