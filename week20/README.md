# JScoin Lab - Práctica 20 (Semana/Día 20)

## Multi-firma educativa básica (temas avanzados opcionales)

### Teoría

Una **transacción multi-firma** (multisig) requiere múltiples firmas válidas para ser gastada. En Bitcoin, por ejemplo, un script 2-de-3 significa que se necesitan al menos 2 firmas de 3 claves públicas posibles.

Casos de uso educativos:
- Custodia compartida
- Mayor seguridad (una clave comprometida no basta)
- Organizaciones o wallets empresariales

En esta práctica simulamos de forma muy simplificada:
- Una "dirección" multisig representada por un conjunto de claves.
- Una transacción que requiere N firmas de M posibles.
- Verificación de que se alcanzan las firmas requeridas.

**Importante — Prototipo educativo vs. sistemas de producción:**

Este código es un **prototipo educativo extremadamente simplificado**.  
**NO** es apto para producción porque:
- No implementa scripts reales (P2SH, P2WSH, OP_CHECKMULTISIG, etc.).
- No maneja UTXO real ni gastos parciales.
- No tiene red P2P, consenso de producción ni seguridad criptográfica completa.
- Las firmas se simulan a nivel de aplicación, no a nivel de script de Bitcoin.
- Carece de protección contra ataques, reorgs reales, fees avanzados, etc.

Sirve únicamente para entender el concepto de multi-firma de forma interactiva en JavaScript.

### Dependencias

```bash
cd week20
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

### Resultados esperados (verificables)

- Se crean wallets individuales y una "multisig" 2-de-3.
- Se intenta una transacción con 1 firma → falla.
- Se añaden firmas suficientes → se acepta y se mina.
- La cadena permanece válida.
- Se muestra claramente la diferencia entre prototipo y producción.

### Ejercicios

1. Ejecuta el código y observa los mensajes de validación de firmas.
2. Modifica el umbral de 2-de-3 a 3-de-3 y prueba.
3. Añade un método para listar las claves públicas de una multisig.
4. Implementa una verificación de que las firmas corresponden a las claves permitidas.
5. (Extra) Combina con el explorador de la práctica 19 para mostrar transacciones multisig de forma especial.

### Próximo nivel

Este es un tema avanzado opcional. El laboratorio progresivo principal concluye en la práctica 19. Puedes seguir experimentando o estudiar Bitcoin Core / librerías reales.

**Advertencia**: Todo el laboratorio es un prototipo educativo. No uses este código con dinero real.
