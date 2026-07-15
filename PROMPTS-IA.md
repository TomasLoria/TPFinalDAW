# Prompts IA

Documento requerido por la cátedra sobre el uso de herramientas de IA durante el
desarrollo del proyecto **Buscaminas**.

- **Herramienta utilizada:** Claude (Anthropic)
- **Modelo utilizado:** Claude Opus 4.8

La IA se usó como apoyo para resolver y explicar las partes algorítmicamente más
complejas del juego. Cada función generada fue revisada, comprendida y ajustada.
A continuación se documentan los prompts más relevantes, los fragmentos generados
y el uso dado a cada uno, junto con notas para poder explicarlos en la defensa.

---

## Prompt 1 — Colocación de minas con "primer click seguro"

**Prompt utilizado:**
> En un buscaminas, ¿cómo coloco las minas de forma aleatoria pero garantizando
> que la primera celda que el jugador toca (y sus 8 vecinas) nunca tenga mina, para
> que el primer click siempre abra un área? En JavaScript ES5.

**Fragmento generado (`js/tablero.js`, función `colocarMinas`):**
```js
prohibidas = {};
prohibidas[filaSegura + "-" + colSegura] = true;
vecinasSeguras = vecinos(estado, filaSegura, colSegura);
for (i = 0; i < vecinasSeguras.length; i += 1) {
    prohibidas[vecinasSeguras[i].fila + "-" + vecinasSeguras[i].columna] = true;
}

colocadas = 0;
while (colocadas < estado.totalMinas) {
    f = Math.floor(Math.random() * estado.filas);
    c = Math.floor(Math.random() * estado.columnas);
    clave = f + "-" + c;
    if (prohibidas[clave] || estado.celdas[f][c].mina) {
        continue;
    }
    estado.celdas[f][c].mina = true;
    colocadas += 1;
}
```

**Uso dado / cómo funciona:**
Las minas se colocan **después** del primer click, no al crear el tablero. Se arma
un objeto `prohibidas` que actúa como conjunto: se marcan con `true` la celda
clickeada y sus 8 vecinas usando una clave de texto `"fila-columna"`. Después, un
`while` sortea posiciones al azar y descarta (con `continue`) las prohibidas o las
que ya tienen mina, hasta colocar la cantidad exacta. Así el primer click nunca
pierde y suele abrir una zona.

**Para la defensa:** por qué se usa un objeto como "set" (búsqueda O(1) por clave),
y por qué las minas se colocan al primer click y no antes.

---

## Prompt 2 — Revelado de áreas vacías (flood fill iterativo)

**Prompt utilizado:**
> Cuando reveló una celda sin minas alrededor (adyacentes = 0), en buscaminas se
> deben abrir en cascada todas las celdas vacías vecinas. ¿Cómo implemento ese
> "flood fill" en ES5 sin recursión, para no arriesgar desbordar la pila en
> tableros grandes?

**Fragmento generado (`js/tablero.js`, función `revelar`):**
```js
pila = [{ fila: filaInicial, columna: colInicial }];
while (pila.length > 0) {
    actual = pila.pop();
    celda = estado.celdas[actual.fila][actual.columna];
    if (celda.revelada || celda.marcada || celda.mina) {
        continue;
    }
    celda.revelada = true;
    estado.reveladasSeguras += 1;
    reveladas.push({ fila: actual.fila, columna: actual.columna });

    if (celda.adyacentes === 0) {
        alrededor = vecinos(estado, actual.fila, actual.columna);
        for (i = 0; i < alrededor.length; i += 1) {
            pila.push(alrededor[i]);
        }
    }
}
```

**Uso dado / cómo funciona:**
Es el corazón del juego. En lugar de recursión se usa una **pila explícita** (un
arreglo con `push` y `pop`). Se arranca con la celda clickeada; en cada vuelta se
saca una, se ignora si ya estaba revelada / marcada / es mina, se revela y se cuenta.
Solo si esa celda tiene `adyacentes === 0` se agregan sus vecinas a la pila para
seguir propagando. Cuando la pila queda vacía, terminó la cascada. La lista
`reveladas` se devuelve para que la interfaz repinte solo lo que cambió.

**Para la defensa:** diferencia entre recursión y versión iterativa con pila; por
qué se cuenta `reveladasSeguras` (sirve para detectar la victoria).

---

## Prompt 3 — Revelar vecinos de un número (chording)

**Prompt utilizado:**
> Quiero que al hacer doble click sobre un número ya revelado, se revelen
> automáticamente sus vecinas tapadas, pero solo si la cantidad de banderas
> alrededor coincide con el número. ¿Cómo lo hago reutilizando mi función revelar?

**Fragmento generado (`js/tablero.js`, función `revelarVecinos`):**
```js
alrededor = vecinos(estado, f, c);
banderas = 0;
for (i = 0; i < alrededor.length; i += 1) {
    if (estado.celdas[alrededor[i].fila][alrededor[i].columna].marcada) {
        banderas += 1;
    }
}
if (banderas !== celda.adyacentes) {
    return { tipo: "nada", reveladas: acumuladas };
}
for (i = 0; i < alrededor.length; i += 1) {
    resultado = revelar(estado, alrededor[i].fila, alrededor[i].columna);
    acumuladas = acumuladas.concat(resultado.reveladas);
    if (resultado.tipo === "detonada") {
        return { tipo: "detonada", reveladas: acumuladas };
    }
    if (resultado.tipo === "victoria") {
        return { tipo: "victoria", reveladas: acumuladas };
    }
}
```

**Uso dado / cómo funciona:**
Primero cuenta cuántas banderas hay entre las 8 vecinas. Si no igualan al número de
la celda, no hace nada (evita revelar por error). Si coinciden, llama a `revelar`
sobre cada vecina y **acumula** los resultados. Si alguna era mina mal marcada,
propaga la derrota; si se completó el tablero, propaga la victoria. Reutiliza la
lógica de `revelar` en vez de duplicarla.

**Para la defensa:** por qué reutilizar `revelar`; qué pasa si el jugador puso una
bandera equivocada (puede perder al hacer chording).

---

## Prompt 4 — Sistema de modales que reemplaza a alert

**Prompt utilizado:**
> La consigna prohíbe usar alert. Necesito un sistema de modales reutilizable donde
> los botones ejecuten acciones distintas según el caso (por ejemplo "Jugar de
> nuevo" o "Ir al menú"), sin agregar y quitar listeners cada vez. ¿Cuál es una
> forma limpia en ES5?

**Fragmento generado (`js/modal.js`, dentro de `iniciar`):**
```js
botonPrimario.addEventListener("click", function () {
    var accion = accionPrimaria;
    cerrar();
    if (typeof accion === "function") {
        accion();
    }
});
```

**Uso dado / cómo funciona:**
Los listeners de los botones se conectan **una sola vez**. En lugar de reasignarlos,
cada botón lee una variable (`accionPrimaria` / `accionSecundaria`) que se cambia al
abrir el modal. Así un mismo botón puede hacer cosas distintas. Se copia la acción a
una variable local y se cierra el modal **antes** de ejecutarla, para que la acción
pueda abrir otro modal sin conflictos (caso victoria → "Jugar de nuevo"). Todo el
módulo usa el patrón módulo (IIFE) para encapsular sus variables internas.

**Para la defensa:** por qué se usa el patrón módulo; por qué se cierra antes de
ejecutar la acción; ventaja de conectar los eventos una sola vez.

---

## Prompt 5 — Ranking de mejores tiempos con LocalStorage

**Prompt utilizado:**
> Quiero guardar los mejores tiempos por dificultad en LocalStorage: agregar un
> tiempo nuevo, ordenar de menor a mayor y quedarme solo con los 5 mejores. ¿Cómo
> lo hago de forma segura en ES5?

**Fragmento generado (`js/juego.js`, función `guardarTiempo`):**
```js
ranking[dificultad].push({ nombre: nombre, tiempo: segundos });
ranking[dificultad].sort(function (a, b) {
    return a.tiempo - b.tiempo;
});
ranking[dificultad] = ranking[dificultad].slice(0, 5);
App.Utils.guardar(CLAVE_RANKING, ranking);
```

**Uso dado / cómo funciona:**
El ranking es un objeto con tres arreglos (`facil`, `medio`, `dificil`). Al ganar se
agrega `{ nombre, tiempo }`, se ordena con un comparador que resta los tiempos
(menor primero) y se recorta a los 5 mejores con `slice`. La lectura y escritura en
LocalStorage se hace con los helpers `leer` y `guardar` de `utils.js`, que envuelven
`JSON.parse`/`JSON.stringify` dentro de `try/catch` para no romper si el dato está
corrupto o el navegador bloquea el almacenamiento.

**Para la defensa:** cómo funciona el comparador de `sort`; por qué se usa
`try/catch` alrededor de LocalStorage; qué se serializa con JSON.

---

## Prompt 6 — Interacción por teclado (cursor sobre el tablero)

**Prompt utilizado:**
> Además del mouse quiero jugar con teclado: mover un cursor con las flechas,
> revelar con Enter/Espacio y poner bandera con F. ¿Cómo manejo el cursor y lo
> muestro en el tablero en ES5?

**Fragmento generado (`js/juego.js`, funciones `alPresionarTecla` y `moverCursor`):**
```js
if (tecla === "ArrowUp") {
    moverCursor(cursorFila - 1, cursorCol);
    evento.preventDefault();
} else if (tecla === "Enter" || tecla === " ") {
    ejecutarRevelar(cursorFila, cursorCol);
    evento.preventDefault();
} else if (tecla === "f" || tecla === "F") {
    ejecutarBandera(cursorFila, cursorCol);
    evento.preventDefault();
}

function moverCursor(f, c) {
    var anteriorFila = cursorFila;
    var anteriorCol = cursorCol;
    if (f < 0 || f >= estado.filas || c < 0 || c >= estado.columnas) {
        return;
    }
    cursorFila = f;
    cursorCol = c;
    pintarCelda(anteriorFila, anteriorCol);
    pintarCelda(cursorFila, cursorCol);
}
```

**Uso dado / cómo funciona:**
Se guardan la fila y columna del cursor en variables del módulo. `alPresionarTecla`
traduce cada tecla a una acción y usa `preventDefault` para que las flechas no
desplacen la página. `moverCursor` valida que la nueva posición esté dentro del
tablero y repinta **solo dos celdas**: la anterior (para sacarle el resaltado) y la
nueva (para marcarla con la clase `celda--foco`). Es más eficiente que redibujar
todo el tablero.

**Para la defensa:** por qué se repintan solo dos celdas; para qué sirve
`preventDefault`; cómo se limita el cursor a los bordes del tablero.

---

## Nota de comprensión general

La separación entre lógica e interfaz es intencional: `js/tablero.js` contiene solo
las reglas y estructuras de datos (no toca el DOM y es testeable de forma aislada),
mientras que `js/juego.js` lee ese estado y lo dibuja. Esta arquitectura permite
explicar y probar las mecánicas por separado de la presentación.
