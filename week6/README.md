# JScoin Lab - Práctica 6 (Semana/Día 6)

## Seguridad básica: prevención de double-spending y validaciones adicionales

### Teoría

En una blockchain real la **seguridad** es crítica. Algunos problemas clásicos:

1. **Double-spending**: gastar las mismas monedas dos veces. Se previene verificando que el emisor tiene saldo suficiente **antes** de aceptar la transacción y al validar la cadena.
2. **Transacciones inválidas**: importes negativos, direcciones vacías, firmas falsas, etc.
3. **Alteración de datos**: cualquier cambio en un bloque o transacción debe invalidar el hash y la firma.
4. **Consistencia de saldos**: el saldo se calcula recorriendo toda la cadena; nunca se confía en un estado local no verificado.

**En este prototipo educativo** añadimos:
- Comprobación de saldo suficiente en `addTransaction`.
- Validación de importe positivo.
- Rechazo de transacciones que intentan gastar más de lo disponible.
- Validación extra en `isChainValid` para detectar double-spends históricos (opcional pero educativo).

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- UTXO real o modelo de cuentas con nonces (como Ethereum).
- Protección contra reorganizaciones maliciosas.
- Validación de gas/fees, límites de tamaño de bloque, etc.
- Criptografía de producción (manejo seguro de claves, side-channel resistance).
- Red P2P segura y resistente a ataques (eclipse, Sybil, DoS).
- Consenso formal (Nakamoto, BFT, etc.).
- Auditorías de seguridad.

Solo sirve para entender los principios básicos de validación de saldos y prevención de double-spending en un entorno controlado.

### Dependencias

```bash
cd week6
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Una transacción válida reduce el saldo del emisor y aumenta el del receptor.
- Intentar gastar más de lo que se tiene lanza error y no se añade.
- Importes negativos o cero son rechazados.
- La cadena sigue siendo válida después de operaciones correctas.
- Alterar una transacción después de minada invalida la cadena.
- El saldo calculado coincide con la suma de recompensas menos envíos.

### Ejercicios

1. Ejecuta el código y verifica los saldos antes y después de cada transacción.
2. Intenta crear un double-spend (enviar más de lo disponible) y observa el rechazo.
3. Añade una validación que impida enviar a la misma dirección (`from === to`).
4. Implementa un contador de nonces simple por dirección para evitar reutilización de la misma transacción firmada.
5. (Extra) Calcula el saldo de forma incremental (mapa de balances) en lugar de recorrer toda la cadena y compara resultados.
6. (Extra) Añade un fee de minería pequeño y verifica que el minero lo recibe.

### Próximo nivel

Práctica 7: Mejoras de red y sincronización de mempool (o según avance del curso).
