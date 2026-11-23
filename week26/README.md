# JScoin Lab - Práctica 26 (Semana/Día 26)

## Selfish Mining educativo y detección básica

### Teoría

**Selfish Mining** es una estrategia de minería en la que un minero (o pool) **retiene bloques** en lugar de publicarlos inmediatamente. El objetivo es:

- Hacer que el resto de la red miné sobre una cadena que pronto será invalidada.
- Publicar su cadena privada más larga en el momento oportuno y forzar un reorg.
- Aumentar su porcentaje de recompensas más allá de su poder de hash real.

A diferencia del ataque del 51%, el selfish mining puede ser rentable con porcentajes de hashrate significativamente menores (alrededor del 25-33% según el modelo original de Eyal & Sirer, dependiendo de la estrategia de la red).

**Versión educativa de esta práctica:**
- Simulamos un minero "selfish" que acumula bloques en privado.
- Cuando su cadena privada supera a la pública, la publica y provoca un reorg.
- El nodo detecta patrones sospechosos (reorgs frecuentes + concentración de bloques) y emite una alerta educativa.
- Todo ocurre en memoria; no hay red P2P real, propagación de bloques ni dificultad adaptativa de producción.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:

- No implementa propagación P2P, estrategias reales de publicación de bloques, ni modelado de hashrate.
- No tiene protección real contra selfish mining (como la de Bitcoin Core o propuestas de uncle blocks / GHOST).
- La "velocidad de minería" y el "retener bloques" son solo lógica artificial en memoria.
- No maneja UTXO avanzado, firmas completas en todos los escenarios, ni scripts.
- Cualquier valor real de dinero estaría en riesgo total.

Sirve únicamente para visualizar el concepto de selfish mining y su efecto en el consenso y las recompensas.

### Dependencias

```bash
cd week26
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se simula un minero normal y un minero selfish.
- El minero selfish acumula bloques privados y luego fuerza un reorg.
- El sistema detecta el patrón sospechoso y emite una alerta educativa de posible selfish mining.
- Se muestran bloques huérfanos y el cambio en la cadena.
- La cadena final sigue siendo válida según las reglas simplificadas (`isChainValid() === true`).
- Se listan eventos de seguridad registrados.

### Ejercicios

1. Ejecuta el código y observa la alerta de posible selfish mining.
2. Modifica el parámetro `selfishThreshold` (bloques privados mínimos antes de publicar) y observa cuándo se dispara la alerta.
3. Añade un método `calculateRevenueShare()` que compare el porcentaje de recompensas obtenidas vs. el porcentaje de bloques minados.
4. Simula un escenario donde el minero selfish falla (la red publica antes) y pierde sus bloques privados.
5. (Extra) Añade un contador de "bloques retenidos" y un log cronológico de eventos de minería.

### Próximo nivel

Tema avanzado opcional. Puedes estudiar el paper original de Selfish Mining (Eyal & Sirer), estrategias de detección en pools reales, o cómo protocolos con finality o uncle blocks reducen la rentabilidad de este ataque.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
