# JScoin Lab - Práctica 16 (Semana/Día 16)

## Fees básicos educativos y Replace-By-Fee (RBF) simple

### Teoría

En redes de blockchain reales como Bitcoin:

- Las **fees** (comisiones) son la diferencia entre la suma de los inputs y la suma de los outputs de una transacción. Los mineros priorizan transacciones con mayor fee rate (satoshis por byte) porque obtienen esa diferencia como recompensa adicional.
- **Replace-By-Fee (RBF)** permite a un usuario reemplazar una transacción que aún está en el mempool por otra versión que gasta los mismos inputs pero paga una fee más alta (bajo reglas específicas de BIP 125). Esto ayuda a “desatascar” transacciones cuando la red está congestionada.

En esta práctica implementamos una versión **muy simplificada** y educativa:

- Cada transacción tiene un campo `fee` explícito (en un sistema real se calcula de los montos).
- El mempool ordena/prioriza por fee más alta al minar.
- Se puede hacer un reemplazo RBF básico: si una nueva tx tiene los mismos “inputs” (misma from + mismo id de referencia) y fee mayor, reemplaza la anterior pendiente.
- Validaciones simples de saldo suficiente (incluyendo fee).

**Importante — Prototipo educativo:**

Este código **NO** es apto para producción. Carece de:

- Cálculo real de fee por tamaño de tx (fee rate en sat/vB).
- Reglas completas de RBF (BIP 125: secuencia, confirmaciones, etc.).
- Mempool real con eviction por tamaño, reglas de relay, etc.
- Protección contra fee sniping, MEV, etc.
- Red P2P, consenso de producción, UTXO model completo, scripts, etc.
- Seguridad criptográfica de nivel producción.

Solo sirve para entender los conceptos de priorización por fees y reemplazo de transacciones pendientes.

### Dependencias

```bash
cd week16
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crea una wallet, se mina recompensa.
- Se añade una transacción con fee baja.
- Se añade otra con fee más alta (o RBF).
- Al minar, se confirma preferentemente la de fee más alta.
- Intentos con fee insuficiente o saldo insuficiente son rechazados.
- La cadena permanece válida.

### Ejercicios

1. Ejecuta el código y observa el orden de priorización por fee en el log de minado.
2. Modifica el código para calcular la fee automáticamente como `inputAmount - outputAmount` en lugar de un campo explícito.
3. Añade un fee mínimo (ej. 1) y rechaza transacciones por debajo de ese umbral.
4. Implementa una simulación de “congestión”: solo se minan las N transacciones de mayor fee.
5. (Extra) Combina con los scripts de la práctica 15: fee + locking scripts.

### Próximo nivel

Práctica 17 (opcional): Temas avanzados (mempool eviction, fee estimation simple) o cierre formal del laboratorio.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
