# JScoin Lab - Práctica 21 (Semana/Día 21)

## Contratos Hash Time-Locked (HTLC) educativos básicos

### Teoría

Un **HTLC** (Hash Time-Locked Contract) bloquea fondos hasta que se revela una preimagen de un hash **o** hasta que expira un tiempo límite.

Casos de uso educativos:
- Canales de pago (inspiración Lightning Network)
- Intercambios atómicos (atomic swaps) entre cadenas
- Pagos condicionales

Flujo simplificado:
1. Emisor bloquea fondos con el hash de una preimagen secreta y un timeout.
2. Receptor puede reclamar revelando la preimagen antes del timeout.
3. Si expira, el emisor puede recuperar los fondos.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:
- No implementa scripts reales de Bitcoin (P2SH, OP_HASH160, OP_CHECKLOCKTIMEVERIFY, etc.).
- No maneja UTXO real, canales de pago reales ni red Lightning.
- No tiene red P2P, consenso de producción, fees avanzados ni seguridad criptográfica completa.
- El timeout y la preimagen se simulan a nivel de aplicación.

Sirve únicamente para entender el concepto de HTLC de forma interactiva en JavaScript.

### Dependencias

```bash
cd week21
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crea un HTLC con hash de preimagen.
- Reclamación con preimagen correcta → éxito y fondos transferidos.
- Intento con preimagen incorrecta → rechazo.
- Simulación de expiración → recuperación por el emisor.
- Cadena permanece válida.
- Se muestra claramente la diferencia entre prototipo y producción.

### Ejercicios

1. Ejecuta el código y observa el flujo completo de HTLC.
2. Modifica la preimagen y verifica que la reclamación falla.
3. Añade un método `listPendingHTLCs()` que muestre los contratos abiertos.
4. Implementa una verificación de que el timeout no ha expirado antes de reclamar.
5. (Extra) Combina con la multi-firma de la práctica 20 para un HTLC multi-firma educativo.

### Próximo nivel

Tema avanzado opcional. Puedes seguir experimentando o estudiar Lightning Network / Bitcoin Script real.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real.
