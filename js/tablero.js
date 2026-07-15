"use strict";

var App = App || {};

/* Mecanicas puras del tablero. No manipula el DOM: solo datos y reglas. */
App.Tablero = (function () {
    /* Crea el estado inicial con la grilla vacia (sin minas colocadas) */
    function crearEstado(filas, columnas, totalMinas) {
        var estado;
        var celdas;
        var f;
        var c;
        var fila;

        celdas = [];
        for (f = 0; f < filas; f += 1) {
            fila = [];
            for (c = 0; c < columnas; c += 1) {
                fila.push({
                    mina: false,
                    revelada: false,
                    marcada: false,
                    adyacentes: 0
                });
            }
            celdas.push(fila);
        }

        estado = {
            filas: filas,
            columnas: columnas,
            totalMinas: totalMinas,
            celdas: celdas,
            minasColocadas: false,
            banderas: 0,
            reveladasSeguras: 0,
            terminado: false,
            victoria: false
        };
        return estado;
    }

    /* Indica si una coordenada esta dentro del tablero */
    function dentro(estado, f, c) {
        return f >= 0 && f < estado.filas && c >= 0 && c < estado.columnas;
    }

    /* Devuelve las coordenadas de los 8 vecinos validos */
    function vecinos(estado, f, c) {
        var lista;
        var df;
        var dc;

        lista = [];
        for (df = -1; df <= 1; df += 1) {
            for (dc = -1; dc <= 1; dc += 1) {
                if (df === 0 && dc === 0) {
                    continue;
                }
                if (dentro(estado, f + df, c + dc)) {
                    lista.push({ fila: f + df, columna: c + dc });
                }
            }
        }
        return lista;
    }

    /* Coloca las minas evitando la celda segura y sus vecinos */
    function colocarMinas(estado, filaSegura, colSegura) {
        var prohibidas;
        var vecinasSeguras;
        var i;
        var colocadas;
        var f;
        var c;
        var clave;

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

        calcularAdyacentes(estado);
        estado.minasColocadas = true;
    }

    /* Calcula, para cada celda, cuantas minas hay alrededor */
    function calcularAdyacentes(estado) {
        var f;
        var c;
        var lista;
        var i;
        var conteo;

        for (f = 0; f < estado.filas; f += 1) {
            for (c = 0; c < estado.columnas; c += 1) {
                if (estado.celdas[f][c].mina) {
                    continue;
                }
                lista = vecinos(estado, f, c);
                conteo = 0;
                for (i = 0; i < lista.length; i += 1) {
                    if (estado.celdas[lista[i].fila][lista[i].columna].mina) {
                        conteo += 1;
                    }
                }
                estado.celdas[f][c].adyacentes = conteo;
            }
        }
    }

    /* Verifica la victoria: todas las celdas sin mina reveladas */
    function verificarVictoria(estado) {
        var seguras = estado.filas * estado.columnas - estado.totalMinas;
        return estado.reveladasSeguras >= seguras;
    }

    /* Revela una celda; propaga en areas vacias (flood fill iterativo) */
    function revelar(estado, filaInicial, colInicial) {
        var reveladas;
        var pila;
        var actual;
        var celda;
        var alrededor;
        var i;

        reveladas = [];

        if (estado.terminado) {
            return { tipo: "nada", reveladas: reveladas };
        }

        celda = estado.celdas[filaInicial][colInicial];
        if (celda.revelada || celda.marcada) {
            return { tipo: "nada", reveladas: reveladas };
        }

        if (!estado.minasColocadas) {
            colocarMinas(estado, filaInicial, colInicial);
        }

        if (estado.celdas[filaInicial][colInicial].mina) {
            estado.celdas[filaInicial][colInicial].revelada = true;
            estado.terminado = true;
            estado.victoria = false;
            return {
                tipo: "detonada",
                reveladas: [{ fila: filaInicial, columna: colInicial }]
            };
        }

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

        if (verificarVictoria(estado)) {
            estado.terminado = true;
            estado.victoria = true;
            return { tipo: "victoria", reveladas: reveladas };
        }

        return { tipo: "nada", reveladas: reveladas };
    }

    /* Coloca o quita una bandera sobre una celda tapada */
    function alternarBandera(estado, f, c) {
        var celda = estado.celdas[f][c];
        if (estado.terminado || celda.revelada) {
            return null;
        }
        celda.marcada = !celda.marcada;
        estado.banderas += celda.marcada ? 1 : -1;
        return { marcada: celda.marcada };
    }

    /* Revela los vecinos de un numero si las banderas coinciden (chording) */
    function revelarVecinos(estado, f, c) {
        var celda;
        var alrededor;
        var banderas;
        var i;
        var resultado;
        var acumuladas;

        celda = estado.celdas[f][c];
        acumuladas = [];
        if (estado.terminado || !celda.revelada || celda.adyacentes === 0) {
            return { tipo: "nada", reveladas: acumuladas };
        }

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

        return { tipo: "nada", reveladas: acumuladas };
    }

    return {
        crearEstado: crearEstado,
        vecinos: vecinos,
        revelar: revelar,
        alternarBandera: alternarBandera,
        revelarVecinos: revelarVecinos
    };
})();
