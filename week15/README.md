# JScoin Lab - Práctica 15 (Semana/Día 15)

## Scripts básicos educativos (locking / unlocking estilo simplificado)

### Teoría

En Bitcoin y muchas blockchains, las salidas (UTXOs) están protegidas por **scripts**. Un script de bloqueo (locking script / scriptPubKey) define las condiciones para gastar esa salida. El script de desbloqueo (unlocking script / scriptSig) proporciona los datos (normalmente firma y clave pública) que satisfacen esas condiciones.

En esta práctica implementamos una versión **muy simplificada** y educativa:

- Scripts expresados como arrays de opcodes simples (`OP_DUP`, `OP_HASH160`, `OP_EQUALVERIFY`, `OP_CHECKSIG` simulado).
- Una salida puede tener un locking script.
- Al crear una transacción, el input incluye un unlocking script.
- Validamos que el unlocking script + locking script se evalúe a true (de forma básica).

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Lenguaje de scripts real (Bitcoin Script completo, opcodes seguros).
- Verificación criptográfica robusta de firmas en el contexto del script.
- Protección contra malleability, script size limits, etc.
- Fees reales, RBF, etc.
- Red P2P, consenso de producción, persistencia segura.

Solo sirve para entender el concepto de “condiciones programables” en las salidas.

### Dependencias

```bash
cd week15
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crea una wallet y se mina un bloque con recompensa.
- Se crea una salida protegida por un locking script simple.
- Se intenta gastar esa salida con un unlocking script correcto → éxito.
- Se intenta gastar con un unlocking script incorrecto → rechazo.
- La cadena permanece válida.

### Ejercicios

1. Ejecuta el código y verifica que la transacción válida se acepta y la inválida se rechaza.
2. Modifica el locking script para exigir una condición extra (por ejemplo, un valor mínimo).
3. Implementa un opcode adicional simple (por ejemplo `OP_EQUAL`).
4. Añade un fee básico: parte de los inputs no se devuelve en outputs.
5. (Extra) Combina con la simulación multi-nodo de la práctica 14.

### Próximo nivel

Práctica 16 (opcional): Fees más completos, RBF educativo, o cierre del laboratorio.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
