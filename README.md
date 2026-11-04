# JScoin Lab

Laboratorio progresivo e **interactivo online** para aprender a desarrollar **JScoin**, una criptomoneda educativa inspirada en Bitcoin, usando JavaScript.

## Laboratorio interactivo (recomendado)

Abre el archivo `index.html` en el navegador o actívalo con GitHub Pages:

**URL del laboratorio:**  
https://josejulianh.github.io/jscoin-lab/

### Cómo activar GitHub Pages (1 minuto)
1. Ve a **Settings** del repositorio.
2. En el menú izquierdo, entra en **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. Branch: `main`, Folder: `/ (root)`.
5. Guarda. En unos segundos estará disponible en la URL de arriba.

## Prácticas disponibles

| Práctica | Tema | Carpeta |
|-----------|------|---------|
| 1 (Semana 1) | Fundamentos: Bloques y Cadena | `week1/` |
| 2 (Semana/Día 2) | Prueba de Trabajo (PoW) simple | `week2/` |
| 3 (Semana/Día 3) | Transacciones y firmas digitales | `week3/` |
| 4 (Semana/Día 4) | Consenso básico (cadena más larga) | `week4/` |
| 5 (Semana/Día 5) | Redes y propagación básica de bloques | `week5/` |
| 6 (Semana/Día 6) | Seguridad básica (double-spending y validaciones) | `week6/` |
| 7 (Semana/Día 7) | Mejoras de red y sincronización de mempool | `week7/` |
| 8 (Semana/Día 8) | Dificultad adaptativa y consideraciones adicionales | `week8/` |
| 9 (Semana/Día 9) | Persistencia de la cadena y wallets simples | `week9/` |

### Ejecución Node

```bash
node week1/blockchain.js
node week2/blockchain.js
cd week3 && npm init -y && npm install elliptic && node blockchain.js
cd week4 && npm init -y && npm install elliptic && node blockchain.js
cd week5 && npm init -y && npm install elliptic && node blockchain.js
cd week6 && npm init -y && npm install elliptic && node blockchain.js
cd week7 && npm init -y && npm install elliptic && node blockchain.js
cd week8 && npm init -y && npm install elliptic && node blockchain.js
cd week9 && npm init -y && npm install elliptic && node blockchain.js
```

**Importante**: Todo es un prototipo educativo. No tiene red P2P real, consenso de producción ni seguridad de nivel producción. Cada día a las 16:00 se añade la siguiente práctica.

## Progreso

- [x] Semana/Día 1: Fundamentos
- [x] Semana/Día 2: PoW
- [x] Semana/Día 3: Transacciones y firmas
- [x] Semana/Día 4: Consenso básico
- [x] Semana/Día 5: Redes y propagación básica
- [x] Semana/Día 6: Seguridad básica (double-spending)
- [x] Semana/Día 7: Mejoras de red y sincronización de mempool
- [x] Semana/Día 8: Dificultad adaptativa y consideraciones adicionales
- [x] Semana/Día 9: Persistencia de la cadena y wallets simples
- [ ] Semana/Día 10+: Temas avanzados opcionales o cierre del laboratorio
