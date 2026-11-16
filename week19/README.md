# JScoin Lab - Práctica 19 (Semana/Día 19)

## Explorador simple de la cadena y cierre del laboratorio

### Teoría

Un **explorador de blockchain** (blockchain explorer) es una herramienta que permite visualizar de forma legible el contenido de una cadena de bloques:

- Bloques (altura, hash, timestamp, nonce, dificultad, número de transacciones).
- Transacciones (emisor, receptor, importe, fee, firma, etc.).
- Saldos aproximados de direcciones.
- Estado de la cadena (validez, longitud, último hash).

En esta práctica añadimos un método educativo `explore()` que imprime un resumen claro de toda la cadena y de las direcciones conocidas.

Esta es la **práctica de cierre** del laboratorio progresivo JScoin. Hemos recorrido:

1. Fundamentos (bloques y cadena)
2. Prueba de Trabajo (PoW)
3. Transacciones y firmas digitales
4. Consenso básico (cadena más larga)
5. Redes y propagación básica
6. Seguridad básica (double-spending)
7. Mejoras de red y sincronización de mempool
8. Dificultad adaptativa
9. Persistencia y wallets
10. CLI + UTXO básico
11. Árboles de Merkle y SPV
12. Contratos inteligentes básicos
13. Modelo UTXO
14. Simulación multi-nodo
15. Scripts básicos
16. Fees y RBF
17. Estimación de fees y límites de mempool
18. Estimación basada en confirmados y congestión
19. Explorador simple y cierre

**Importante — Prototipo educativo vs. sistemas de producción:**

Todo el laboratorio es un **prototipo educativo**. NO es apto para producción porque carece de:

- Red P2P real y protocolo de propagación.
- Consenso de producción (Nakamoto Consensus completo, finality, reorgs reales).
- Seguridad criptográfica de nivel producción (validación completa de scripts, checksig, etc.).
- Modelo UTXO completo, fees reales por weight, mempool de producción.
- Resistencia a ataques (Sybil, eclipse, 51%, etc.).
- Persistencia robusta, indexadores, APIs públicas.
- Cumplimiento normativo, auditorías, etc.

Sirve únicamente para aprender los conceptos paso a paso en JavaScript.

### Dependencias

```bash
cd week19
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se genera una cadena con varios bloques y transacciones.
- El método `explore()` imprime un resumen legible de bloques, transacciones y saldos.
- La cadena permanece válida (`isChainValid() === true`).
- Se muestra un mensaje de cierre del laboratorio.

### Ejercicios

1. Ejecuta el código y analiza la salida del explorador.
2. Modifica el método `explore()` para que también muestre el fee rate de cada transacción y el total de fees minadas.
3. Añade una función que busque una transacción por su ID y la muestre.
4. Implementa un filtro por dirección: `exploreAddress(address)` que muestre solo las transacciones que involucran esa dirección.
5. (Extra) Combina con prácticas anteriores: haz que el explorador funcione después de simular congestión o multi-nodo.

### Cierre

¡Felicidades! Has completado el laboratorio progresivo de JScoin. Ahora comprendes los fundamentos de una criptomoneda educativa inspirada en Bitcoin.

**Advertencia final**: Nunca uses este código con dinero real. Para sistemas reales estudia Bitcoin Core, Ethereum, o librerías como ethers.js / bitcoinjs-lib, y siempre con auditorías y redes de prueba.
