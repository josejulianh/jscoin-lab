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

### Ejecución Node

```bash
node week1/blockchain.js
node week2/blockchain.js
cd week3 && npm init -y && npm install elliptic && node blockchain.js
cd week4 && npm init -y && npm install elliptic && node blockchain.js
```

**Importante**: Todo es un prototipo educativo. No tiene red P2P, consenso real ni seguridad de producción. Cada día a las 16:00 se añade la siguiente práctica.

## Progreso

- [x] Semana/Día 1: Fundamentos
- [x] Semana/Día 2: PoW
- [x] Semana/Día 3: Transacciones y firmas
- [x] Semana/Día 4: Consenso básico
- [ ] Semana/Día 5+: Redes y seguridad
