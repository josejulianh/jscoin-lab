# JScoin Lab - Práctica 9 (Semana/Día 9)

## Persistencia de la cadena, wallets simples y consideraciones finales

### Teoría

En una blockchain real los nodos deben **persistir** la cadena en disco para no perder el estado al reiniciar, y los usuarios manejan **wallets** (pares de claves) de forma segura.

**Persistencia:**
- La cadena se serializa (normalmente como bloques + UTXO set o estado) y se guarda en disco.
- Al arrancar, el nodo carga la cadena y verifica su validez.
- Se usan bases de datos (LevelDB, RocksDB, etc.) en producción, no archivos JSON simples.

**Wallets:**
- Un wallet genera y gestiona claves privadas (nunca se comparten).
- La dirección pública se deriva de la clave pública.
- Las transacciones se firman localmente con la clave privada.
- En producción se usan HD wallets (BIP32/39/44), cifrado de claves, hardware wallets, etc.

**En este prototipo educativo:**
- Persistencia simple en archivo JSON (`chain.json`) usando `fs`.
- Clase `Wallet` básica que genera keypair con elliptic y expone dirección + método para firmar.
- Carga y guardado de la cadena al iniciar/terminar la demo.
- Advertencias claras sobre lo que falta para producción.

**Importante — Prototipo educativo:**
Este código **NO** es apto para producción. Carece de:
- Persistencia robusta (bases de datos, checkpoints, recovery de corrupción).
- Wallets seguros (encriptación de claves privadas, seeds mnemónicas, gestión de backups).
- Separación real entre nodo y wallet (en producción el wallet suele ser un cliente ligero).
- Validación completa de dificultad histórica al cargar la cadena.
- Red P2P real, consenso de producción, protección contra reorgs, fees, etc.
- Auditorías de seguridad, manejo de errores de I/O, concurrencia, etc.

Solo sirve para entender cómo un nodo puede guardar/cargar su estado y cómo un usuario genera y usa una clave de forma básica.

### Dependencias

```bash
cd week9
npm init -y
npm install elliptic
```

### Cómo ejecutar

```bash
node blockchain.js
```

El programa guarda la cadena en `chain.json` y la carga si existe al inicio.

### Resultados esperados (verificables)

- Al ejecutar la primera vez se crea `chain.json`.
- Al ejecutar de nuevo, la cadena se carga y se continúa desde el último bloque.
- Los saldos se mantienen coherentes después de la carga.
- Las wallets generan direcciones válidas y pueden firmar transacciones.
- La cadena sigue siendo válida después de persistir y cargar.
- Se muestran advertencias claras de que es un prototipo.

### Ejercicios

1. Ejecuta el código dos veces seguidas y verifica que la cadena crece y los saldos se conservan.
2. Borra `chain.json` y observa que se reinicia desde el génesis.
3. Añade un método `exportWallet()` / `importWallet()` que guarde la clave privada en un archivo (con advertencia de seguridad).
4. Implementa que al cargar la cadena se verifique la dificultad de cada bloque.
5. (Extra) Añade un UTXO set simple persistido junto a la cadena.
6. (Extra) Crea un pequeño menú interactivo (readline) para crear wallets, enviar y minar.

### Próximo nivel

Práctica 10+: Temas avanzados opcionales (UTXO real, SPV, P2P básico con WebSockets, o cierre del laboratorio).

**Fin del núcleo del laboratorio progresivo.** Todos los conceptos fundamentales (bloques, transacciones, firmas, consenso básico, red simulada, seguridad básica, dificultad, persistencia y wallets) han sido cubiertos en forma educativa.
