# JScoin Lab - Práctica 4 (Semana/Día 4)

## Consenso básico (regla de la cadena más larga)

### Teoría

En una red blockchain descentralizada, los nodos deben ponerse de acuerdo sobre cuál es la cadena canónica (la “verdad”).

**Regla simplificada de Nakamoto (Bitcoin):**
- Cada nodo mantiene su propia copia de la cadena.
- Cuando recibe una cadena más larga **y válida**, la adopta como nueva cadena principal.
- Esto resuelve forks temporales (dos mineros encuentran bloques casi al mismo tiempo).
- La cadena con más trabajo acumulado (más larga, en este prototipo) gana.

**Flujo típico:**
1. Nodo A mina bloques → cadena de longitud N.
2. Nodo B mina más rápido → cadena de longitud N+1.
3. Nodo A recibe la cadena de B, verifica que es válida y más larga, y la reemplaza.
4. Las transacciones que estaban solo en la cadena corta se descartan o vuelven al mempool.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Red peer-to-peer real
- Propagación eficiente de bloques
- Cálculo de “trabajo acumulado” real (solo compara longitud)
- Manejo de reorganizaciones complejas
- Protección contra ataques de 51%
- Sincronización de mempool
- Seguridad criptográfica de nivel producción

Solo sirve para entender el concepto de consenso por cadena más larga.

### Dependencias

```bash
cd week4
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crean dos cadenas de diferentes longitudes.
- `replaceChain` adopta la más larga solo si es válida.
- Los saldos cambian al adoptar la nueva cadena.
- Una cadena más corta o inválida es rechazada.
- `isChainValid()` sigue devolviendo `true`.

### Ejercicios

1. Ejecuta el código y anota las longitudes y saldos antes y después del reemplazo.
2. Modifica el código para que una cadena más larga pero con una transacción alterada sea rechazada.
3. Simula un fork: crea una cadena con 3 bloques y otra con 2, y verifica cuál gana.
4. Añade un método `getCumulativeDifficulty()` que sume la dificultad de cada bloque y usa eso en lugar de solo la longitud.
5. (Extra) Implementa un mempool simple que se actualice al cambiar de cadena.

### Próximo nivel

Práctica 5: Redes y propagación básica de bloques.
