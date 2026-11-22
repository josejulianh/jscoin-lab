# JScoin Lab - Práctica 25 (Semana/Día 25)

## Simulación educativa de ataque del 51% y detección básica de poder de hash

### Teoría

El **ataque del 51%** ocurre cuando un actor (o grupo de actores) controla más del 50% del poder de hash de la red. En ese caso puede:

- Minar bloques más rápido que el resto de la red.
- Crear una cadena privada más larga.
- Realizar un reorg que invalide transacciones recientes (double-spending).
- Impedir que otros mineros confirmen bloques (censura).

En Bitcoin real esto es extremadamente costoso y difícil, pero el concepto es fundamental para entender la seguridad de Proof-of-Work.

**Versión educativa de esta práctica:**
- Simulamos dos “facciones” de mineros con diferentes velocidades de minería.
- Una facción con mayoría de “poder” construye una cadena más larga.
- El nodo detecta el desequilibrio de trabajo y alerta sobre un posible ataque del 51%.
- Todo ocurre en memoria; no hay red P2P real ni dificultad adaptativa de producción.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:

- No implementa propagación P2P, dificultad adaptativa real, ni cálculo preciso de chainwork.
- No tiene protección real contra ataques del 51%, checkpoints, ni finality.
- La “velocidad de minería” es solo un contador artificial, no poder de hash real.
- No maneja UTXO avanzado, firmas completas en todos los escenarios, ni scripts.
- Cualquier valor real de dinero estaría en riesgo total.

Sirve únicamente para visualizar el concepto de mayoría de poder de hash y su efecto en el consenso.

### Dependencias

```bash
cd week25
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se simulan dos mineros (o facciones) con diferentes “velocidades”.
- La facción mayoritaria construye más bloques.
- El sistema detecta cuando el trabajo de una facción supera el 50% y emite una alerta educativa.
- Se muestra un posible reorg forzado por la mayoría.
- La cadena final sigue siendo válida según las reglas simplificadas (`isChainValid() === true`).
- Se listan los bloques de la minoría que quedaron huérfanos.

### Ejercicios

1. Ejecuta el código y observa la alerta de “posible ataque del 51%”.
2. Modifica el parámetro `majorityPower` (por ejemplo a 0.4 y a 0.7) y observa cuándo se dispara la alerta.
3. Añade un método `calculateHashrateShare()` que devuelva el porcentaje de bloques minados por cada dirección en los últimos N bloques.
4. Simula un double-spending: la mayoría reorgs y sustituye una transacción de la minoría.
5. (Extra) Añade un “umbral de alerta” configurable y un log de eventos de seguridad educativos.

### Próximo nivel

Tema avanzado opcional. Puedes estudiar los ataques del 51% reales (historiales de monedas PoW), el concepto de *hashrate*, *selfish mining*, o cómo las cadenas con finality (PoS) mitigan este riesgo.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
