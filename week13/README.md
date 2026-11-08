# JScoin Lab - Práctica 13 (Semana/Día 13)

## Modelo UTXO básico educativo

### Teoría

En Bitcoin (y muchas criptomonedas) no se usa un modelo de cuentas (como el saldo de Ethereum). Se usa el modelo **UTXO** (Unspent Transaction Output):

1. Cada transacción consume uno o más **outputs** anteriores (inputs) y crea nuevos outputs.
2. Un output que aún no ha sido gastado se llama **UTXO**.
3. El “saldo” de una dirección es la suma de todos los UTXOs que le pertenecen.
4. Para gastar, se referencian UTXOs concretos (txid + índice), se firman y se crean nuevos outputs (cambio + destinatario).

**Conceptos que se demuestran:**
- Creación de UTXOs (coinbase / recompensa de minado).
- Gasto de UTXOs (inputs) y generación de nuevos outputs.
- Cálculo de saldo a partir de UTXOs no gastados.
- Prevención básica de double-spending (un UTXO solo se puede gastar una vez).

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Formato real de transacciones Bitcoin (scriptSig, scriptPubKey, serialización, witness, etc.).
- Manejo correcto de fees, dust, bloqueo por tiempo, multisig, etc.
- Red P2P, consenso de producción, base de datos UTXO eficiente.
- Protección criptográfica completa ni manejo seguro de claves.

Solo sirve para entender la diferencia entre modelo de cuentas y modelo UTXO.

### Dependencias

```bash
cd week13
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se minan bloques que generan UTXOs (recompensas).
- Se crean transacciones que consumen UTXOs y generan nuevos.
- El saldo se calcula correctamente como suma de UTXOs no gastados.
- Intentar gastar el mismo UTXO dos veces falla.
- La cadena sigue siendo válida (`isChainValid() === true`).
- Se muestran los UTXOs activos de cada dirección.

### Ejercicios

1. Ejecuta el código y anota los UTXOs y el saldo final de Alice y Bob.
2. Modifica una transacción para intentar gastar un UTXO ya gastado y observa el error.
3. Añade un método `getUTXOsOfAddress(address)` que devuelva la lista detallada de UTXOs.
4. Implementa el “cambio” (change) de forma explícita en las transacciones.
5. (Extra) Añade una fee simple que vaya al minero.
6. (Extra) Compara este modelo con el modelo de cuentas usado en las prácticas anteriores.

### Próximo nivel

Práctica 14 (opcional): Simulación multi-nodo más realista o scripts básicos (locking/unlocking).

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real ni en entornos de producción.
