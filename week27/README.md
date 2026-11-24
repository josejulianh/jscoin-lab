# JScoin Lab - Práctica 27 (Semana/Día 27)

## Ataques Eclipse y Sybil educativos básicos

### Teoría

**Ataque Eclipse**: Un atacante controla todas (o la mayoría) de las conexiones de un nodo víctima, aislándolo de la red honesta. Así puede:

- Alimentarlo solo con bloques y transacciones falsas o de una cadena atacante.
- Impedir que vea la cadena real (censoría de bloques).
- Facilitar double-spending o mining attacks contra ese nodo.

**Ataque Sybil**: Un atacante crea múltiples identidades falsas (nodos) para dominar una red o influir en el consenso/votación. En redes P2P sin costes de identidad puede parecer que hay más nodos honestos de los que realmente hay.

**Versión educativa de esta práctica:**
- Simulamos un nodo víctima y un conjunto de "peers".
- Un atacante Sybil genera múltiples peers falsos.
- Luego realiza un eclipse: el nodo víctima solo recibe información de los peers atacantes.
- Mostramos cómo el nodo puede ser engañado con una cadena alternativa y cómo detectar patrones sospechosos (alta concentración de peers del mismo origen o falta de diversidad).
- Todo en memoria; no hay red P2P real, sockets ni discovery real.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:

- No implementa red P2P real, discovery, ban lists, diversity scoring ni protecciones contra eclipse/Sybil de Bitcoin Core u otros clientes.
- Las "conexiones" y la "diversidad de peers" son solo estructuras en memoria.
- No tiene costos de identidad, proof-of-work de peers, ni mecanismos de reputación reales.
- Cualquier valor real de dinero está en riesgo total.

Sirve únicamente para visualizar los conceptos de eclipse y Sybil y su impacto en la visión de la cadena de un nodo.

### Dependencias

```bash
cd week27
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crean peers honestos y múltiples peers Sybil del atacante.
- El nodo víctima es eclipsado y solo ve la cadena del atacante.
- Se detecta baja diversidad de peers y se emite una alerta educativa.
- La cadena del nodo eclipsado puede diferir de la cadena honesta.
- La cadena final del nodo (después de reconectar) es válida según las reglas simplificadas.
- Se listan eventos de seguridad registrados.

### Ejercicios

1. Ejecuta el código y observa la alerta de posible eclipse/Sybil.
2. Modifica el número de peers Sybil y el umbral de diversidad; observa cuándo se dispara la alerta.
3. Añade un método `reconnectToHonestPeers()` que restaure la visión de la cadena real y registre el evento.
4. Simula un double-spend solo visible para el nodo eclipsado y verifica que desaparece al reconectar.
5. (Extra) Añade un contador de "peers únicos por origen" y un log cronológico de eventos de red.

### Próximo nivel

Tema avanzado opcional. Puedes estudiar las protecciones de Bitcoin Core contra eclipse (diversidad de buckets, feelers, etc.), ataques Sybil en redes permissionless, o mecanismos de identidad/reputación en otras blockchains.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
