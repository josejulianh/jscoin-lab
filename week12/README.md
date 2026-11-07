# JScoin Lab - Práctica 12 (Semana/Día 12)

## Contratos inteligentes básicos educativos

### Teoría

Los **contratos inteligentes** son programas que se despliegan y ejecutan en la blockchain. Su código y estado quedan registrados de forma inmutable (en la práctica, el estado se actualiza mediante transacciones válidas).

Conceptos clave que se demuestran:

1. **Despliegue**: una transacción especial crea el contrato y le asigna una dirección.
2. **Estado**: el contrato guarda datos (en este prototipo, un contador o un valor almacenado).
3. **Llamadas (calls)**: transacciones posteriores invocan métodos del contrato, cambian el estado y quedan registradas en bloques.
4. **Validación**: la cadena verifica que las llamadas sean coherentes con el estado anterior.

En blockchains reales (Ethereum, etc.) se usa una máquina virtual (EVM), lenguajes como Solidity, gas, ABI, etc. Aquí lo simplificamos al máximo para fines educativos.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Máquina virtual real, gas, sandbox seguro, ABI formal.
- Seguridad contra reentrancy, overflow, llamadas recursivas, etc.
- Red P2P, consenso de producción, manejo seguro de claves.
- Persistencia robusta ni optimizaciones.

Solo sirve para entender el concepto de despliegue + estado + llamadas on-chain.

### Dependencias

```bash
cd week12
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se despliega un contrato SimpleStorage/Counter.
- Se realizan llamadas que incrementan el valor.
- El estado final del contrato es coherente.
- La cadena sigue siendo válida (`isChainValid() === true`).
- Se muestra claramente la diferencia entre transacciones normales y llamadas a contratos.

### Ejercicios

1. Ejecuta el código y anota la dirección del contrato y el valor final del contador.
2. Añade un método `reset()` al contrato y llama a él.
3. Implementa un contrato de escrow educativo simple (deposita, libera solo si se cumple una condición).
4. Haz que las llamadas a contratos consuman un “gas” simulado y que falle si no hay suficiente.
5. (Extra) Añade eventos (logs) que se emitan al cambiar el estado.
6. (Extra) Compara este prototipo con un contrato real en Solidity (por ejemplo SimpleStorage).

### Próximo nivel

Práctica 13 (opcional): Simulación multi-nodo más realista o introducción a UTXO + scripts.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
