# JScoin Lab - Práctica 23 (Semana/Día 23)

## Watchtowers educativos básicos

### Teoría

En los **canales de pago** (práctica 22), una de las preocupaciones de seguridad es que una de las partes intente cerrar el canal publicando un estado antiguo más favorable para ella.

Un **watchtower** es un servicio (o nodo) que:

1. Observa el estado más reciente del canal (off-chain).
2. Monitoriza la blockchain.
3. Si detecta un intento de cierre con un estado anterior, alerta o reacciona (en Lightning real, mediante penalty transactions).

**Versión educativa de esta práctica:**
- Simulamos el almacenamiento de estados del canal.
- Un watchtower simple registra la última versión conocida.
- Detecta y rechaza (a nivel de aplicación) intentos de cierre con versiones anteriores.
- Todo ocurre en memoria; no hay red P2P ni transacciones de penalización reales.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:

- No implementa el protocolo Lightning real (BOLT, P2P, watchtowers reales, penalty transactions, revocation keys, etc.).
- No maneja UTXO real, firmas Schnorr, muSig, ni scripts Bitcoin.
- No tiene red P2P, consenso de producción, ni seguridad criptográfica completa.
- La detección de estados antiguos es solo a nivel de aplicación y en memoria.
- No hay mecanismos de penalización económicos reales.

Sirve únicamente para entender el concepto de watchtower de forma interactiva en JavaScript.

### Dependencias

```bash
cd week23
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se abre un canal entre Alice y Bob.
- Se realizan varias actualizaciones de balance off-chain.
- El watchtower registra la última versión.
- Un intento de cierre con estado antiguo es detectado y rechazado por el watchtower.
- El cierre con el estado más reciente es aceptado.
- La cadena permanece válida (`isChainValid() === true`).
- Se muestran alertas del watchtower.

### Ejercicios

1. Ejecuta el código y observa la detección del intento de cierre con estado antiguo.
2. Añade un método `getStateHistory()` que devuelva todos los estados registrados del canal.
3. Modifica el watchtower para que guarde un historial de las últimas N versiones y las compare.
4. Simula un escenario donde Bob intenta cerrar con un estado anterior después de recibir pagos.
5. (Extra) Añade un contador de "penalización educativa" (por ejemplo, reducir el saldo del atacante en la simulación).

### Próximo nivel

Tema avanzado opcional. Puedes estudiar el protocolo Lightning Network real, las especificaciones BOLT, el funcionamiento de los watchtowers en la práctica, o explorar conceptos como revocation keys y justice transactions.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
