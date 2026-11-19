# JScoin Lab - Práctica 22 (Semana/Día 22)

## Canales de pago educativos básicos (inspirados en Lightning Network)

### Teoría

Un **canal de pago** permite realizar múltiples transferencias off-chain entre dos partes, liquidando solo el estado final en la blockchain. Esto reduce el número de transacciones on-chain y mejora la escalabilidad.

Conceptos clave (versión educativa):
- Apertura del canal: se bloquean fondos (funding transaction).
- Actualizaciones de estado: se firman balances intermedios (commitment transactions).
- Cierre del canal: se publica el último estado válido.
- Uso de HTLC (de la práctica 21) para enrutamiento multi-salto educativo.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:
- No implementa el protocolo Lightning real (BOLT, P2P, watchtowers, penalty transactions, etc.).
- No maneja UTXO real, firmas Schnorr, muSig, ni scripts Bitcoin.
- No tiene red P2P, consenso de producción, ni seguridad criptográfica completa.
- Los estados del canal y las firmas se simulan a nivel de aplicación.

Sirve únicamente para entender el concepto de canales de pago de forma interactiva en JavaScript.

### Dependencias

```bash
cd week22
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
- Se cierra el canal y se liquida el estado final on-chain.
- Intentos de usar estados antiguos son rechazados (simulación básica).
- Cadena permanece válida.
- Se muestra claramente la diferencia entre prototipo y producción.

### Ejercicios

1. Ejecuta el código y observa la apertura, actualizaciones y cierre del canal.
2. Añade un método `getChannelBalance()` que muestre los saldos actuales del canal.
3. Implementa una verificación simple de que no se puede cerrar con un estado anterior.
4. Combina con el HTLC de la práctica 21 para simular un pago multi-salto básico.
5. (Extra) Añade un límite máximo de actualizaciones o un timeout de canal.

### Próximo nivel

Tema avanzado opcional. Puedes estudiar el protocolo Lightning Network real, BOLT specifications, o implementar watchtowers educativos.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real.
