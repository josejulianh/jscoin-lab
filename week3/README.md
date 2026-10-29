# JScoin Lab - Práctica 3 (Semana/Día 3)

## Transacciones y firmas digitales

### Teoría

Hasta ahora los bloques contenían datos arbitrarios. En una criptomoneda real cada bloque contiene **transacciones**.

Una transacción tiene:
- `fromAddress` (dirección del emisor = clave pública)
- `toAddress` (dirección del receptor)
- `amount`
- `timestamp`
- `signature` (firma digital)

**Firmas digitales (ECDSA con secp256k1, la misma curva de Bitcoin):**
1. El emisor genera un par de claves: privada + pública.
2. La clave pública se usa como dirección de wallet.
3. Para enviar monedas, firma el hash de la transacción con su clave **privada**.
4. Cualquiera puede verificar la firma usando la clave **pública** del emisor.
5. Si alguien altera la cantidad o el destinatario, la firma deja de ser válida.

**Flujo típico:**
- Las transacciones se firman y se añaden a un *mempool* (pending transactions).
- Al minar un bloque se incluyen las pendientes + una recompensa de minería.
- El saldo de una dirección se calcula recorriendo toda la cadena.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Árboles de Merkle
- UTXO real (aquí usamos modelo de cuentas simplificado)
- Protección contra double-spending avanzada
- Red P2P
- Dificultad adaptativa
- Seguridad criptográfica de nivel producción (manejo de claves, random, etc.)

Solo sirve para entender el concepto de firmas y transacciones.

### Dependencias

```bash
cd week3
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se generan wallets (claves).
- Se crean y firman transacciones.
- Se minan bloques que incluyen las transacciones.
- `isChainValid()` devuelve `true`.
- Se muestran los saldos.
- Si se altera una transacción o se intenta firmar con la clave equivocada, la validación falla.

### Ejercicios

1. Ejecuta el código y anota los saldos finales de Alice y Bob.
2. Cambia el `amount` de una transacción **después** de firmarla. Observa que `isValid()` falla.
3. Intenta crear una transacción firmada con la clave de otra persona. Debe lanzar error.
4. Añade una tercera wallet (Charlie) y realiza una transferencia Bob → Charlie.
5. Modifica `getBalance` para que ignore transacciones no válidas.
6. (Extra) Añade un campo `fee` y réstalo del saldo del emisor.

### Próximo nivel

Práctica 4: Consenso básico (cadena más larga / regla de mayoría simple).
