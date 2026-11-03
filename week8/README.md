# JScoin Lab - Práctica 8 (Semana/Día 8)

## Dificultad adaptativa y consideraciones adicionales de seguridad/red

### Teoría

En blockchains reales como Bitcoin, la **dificultad** no es fija. Se ajusta periódicamente para mantener un tiempo de bloque objetivo (10 minutos en Bitcoin).

**Ajuste de dificultad (simplificado):**
1. Cada N bloques se calcula el tiempo real transcurrido vs el tiempo esperado.
2. Si los bloques se minaron más rápido de lo esperado → aumenta la dificultad.
3. Si se minaron más lento → disminuye la dificultad.
4. Esto estabiliza el ritmo de producción de bloques independientemente de la potencia de cómputo de la red.

En este prototipo educativo:
- Intervalo de ajuste: cada 4 bloques.
- Tiempo objetivo por bloque: ~8000 ms (8 segundos, ajustado para que sea observable en consola).
- Ajuste simple: ±1 en la dificultad (número de ceros iniciales).
- Cada bloque registra la dificultad con la que fue minado.
- Validación básica de timestamps (no muy en el futuro).

**Consideraciones adicionales de seguridad y red (educativas):**
- Límite de reenvíos (TTL simple) para evitar bucles infinitos en la propagación.
- Rechazo de transacciones duplicadas más robusto.
- Advertencias sobre lo que falta para producción.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Ajuste de dificultad preciso (fórmula de Bitcoin, compact target, etc.).
- Validación completa de la dificultad en cada bloque durante la verificación de la cadena (en este prototipo la dificultad es principalmente local).
- Protección contra timestamp manipulation o difficulty bombing.
- Red P2P real, gossip protocol formal, anti-spam (fees mínimos, rate limiting por IP/address).
- Manejo de forks con "most work" (suma de dificultad) en lugar de solo longitud.
- Persistencia, sincronización inicial (IBD), etc.
- Criptografía y validaciones de nivel producción.

Solo sirve para observar cómo la dificultad se adapta al ritmo de minería y entender conceptos adicionales de red y seguridad en un entorno controlado.

### Dependencias

```bash
cd week8
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- La dificultad comienza en 2.
- Después de varios bloques rápidos, la dificultad aumenta.
- Si se fuerza minería más lenta (simulado o por azar), puede bajar.
- Cada bloque muestra la dificultad usada.
- Las transacciones se propagan sin bucles infinitos (TTL).
- La cadena permanece válida y los saldos son coherentes.
- Intentos de double-spend siguen siendo rechazados.

### Ejercicios

1. Ejecuta el código y observa cómo cambia la dificultad en la consola después de cada ajuste.
2. Modifica `targetBlockTime` y `adjustmentInterval` y vuelve a ejecutar. Compara el comportamiento.
3. Añade un log del tiempo medio real vs esperado en el método de ajuste.
4. Implementa que la validación de la cadena compruebe que cada bloque cumple la dificultad que declara.
5. (Extra) Cambia el criterio de "cadena más larga" a "cadena con más trabajo" (suma de 2^difficulty o simplemente suma de difficulty).
6. (Extra) Añade un fee mínimo simple y que el minero lo reciba además de la recompensa.

### Próximo nivel

Práctica 9: Persistencia de la cadena, wallets simples y consideraciones finales de producción vs prototipo.
