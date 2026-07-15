"use strict";

var App = App || {};

/* Controlador del juego: conecta la interfaz (DOM) con las mecanicas. */
App.Juego = (function () {
    var DIFICULTADES = {
        facil: { filas: 9, columnas: 9, minas: 10 },
        medio: { filas: 16, columnas: 16, minas: 40 },
        dificil: { filas: 16, columnas: 30, minas: 99 }
    };
    var CLAVE_JUGADOR = "buscaminas_jugador";
    var CLAVE_DIFICULTAD = "buscaminas_dificultad";
    var CLAVE_RANKING = "buscaminas_ranking";
    var CLASE_OCULTA = "pantalla--oculta";
    var GLIFO_MINA = "✷";
    var GLIFO_BANDERA = "⚑";

    /* Estado de la aplicacion */
    var estado = null;
    var elementos = [];
    var jugador = "";
    var dificultadActual = "facil";
    var rankingActual = "facil";
    var tiempo = 0;
    var intervalo = null;
    var pausado = false;
    var cursorFila = 0;
    var cursorCol = 0;
    var celdaDetonada = null;

    /* Referencias del DOM */
    var pantallaMenu = null;
    var pantallaJuego = null;
    var entradaNombre = null;
    var errorNombre = null;
    var opcionesDificultad = null;
    var tableroElemento = null;
    var panelPausa = null;
    var marcadorMinas = null;
    var marcadorTiempo = null;
    var chipEstado = null;
    var etiquetaJugador = null;
    var botonPausa = null;

    /* ---------------------------------------------------------------------- */
    /* Inicio                                                                  */
    /* ---------------------------------------------------------------------- */
    function iniciar() {
        App.Modal.iniciar();
        App.Tema.iniciar();
        obtenerReferencias();
        cargarPreferencias();
        conectarEventos();
    }

    /* Guarda las referencias del DOM usadas por el controlador */
    function obtenerReferencias() {
        pantallaMenu = App.Utils.seleccionar("#pantalla-menu");
        pantallaJuego = App.Utils.seleccionar("#pantalla-juego");
        entradaNombre = App.Utils.seleccionar("#entrada-nombre");
        errorNombre = App.Utils.seleccionar("#error-nombre");
        opcionesDificultad = App.Utils.seleccionar("#opciones-dificultad");
        tableroElemento = App.Utils.seleccionar("#tablero");
        panelPausa = App.Utils.seleccionar("#panel-pausa");
        marcadorMinas = App.Utils.seleccionar("#marcador-minas");
        marcadorTiempo = App.Utils.seleccionar("#marcador-tiempo");
        chipEstado = App.Utils.seleccionar("#chip-estado");
        etiquetaJugador = App.Utils.seleccionar("#etiqueta-jugador");
        botonPausa = App.Utils.seleccionar("#boton-pausa");
    }

    /* Recupera el ultimo nombre y dificultad guardados */
    function cargarPreferencias() {
        var nombreGuardado = App.Utils.leer(CLAVE_JUGADOR, "");
        var dificultadGuardada = App.Utils.leer(CLAVE_DIFICULTAD, "facil");
        entradaNombre.value = nombreGuardado;
        if (DIFICULTADES[dificultadGuardada]) {
            dificultadActual = dificultadGuardada;
            marcarChipDificultad(dificultadActual);
        }
    }

    /* Conecta todos los eventos de la interfaz */
    function conectarEventos() {
        App.Utils.seleccionar("#boton-iniciar").addEventListener("click", iniciarPartida);
        App.Utils.seleccionar("#boton-reiniciar").addEventListener("click", reiniciar);
        App.Utils.seleccionar("#boton-menu").addEventListener("click", volverAlMenu);
        botonPausa.addEventListener("click", alternarPausa);
        App.Utils.seleccionar("#boton-como-jugar").addEventListener("click", abrirComoJugar);
        App.Utils.seleccionar("#boton-cerrar-como-jugar").addEventListener("click", cerrarComoJugar);
        App.Utils.seleccionar("#boton-ranking-menu").addEventListener("click", abrirRanking);
        App.Utils.seleccionar("#boton-cerrar-ranking").addEventListener("click", cerrarRanking);
        App.Utils.seleccionar("#boton-borrar-ranking").addEventListener("click", borrarRanking);

        opcionesDificultad.addEventListener("click", alElegirDificultad);
        App.Utils.seleccionar("#ranking-tabs").addEventListener("click", alCambiarPestanaRanking);

        entradaNombre.addEventListener("input", function () {
            errorNombre.textContent = "";
        });
        entradaNombre.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter") {
                iniciarPartida();
            }
        });

        tableroElemento.addEventListener("click", alClickTablero);
        tableroElemento.addEventListener("dblclick", alDobleClickTablero);
        tableroElemento.addEventListener("contextmenu", alClickDerechoTablero);

        document.addEventListener("keydown", alPresionarTecla);
    }

    /* ---------------------------------------------------------------------- */
    /* Menu y seleccion de dificultad                                          */
    /* ---------------------------------------------------------------------- */
    function alElegirDificultad(evento) {
        var boton = evento.target.closest(".chip");
        if (!boton) {
            return;
        }
        dificultadActual = boton.getAttribute("data-dificultad");
        marcarChipDificultad(dificultadActual);
    }

    /* Resalta el chip de dificultad seleccionado */
    function marcarChipDificultad(dificultad) {
        var chips = App.Utils.seleccionarTodos("#opciones-dificultad .chip");
        var i;
        for (i = 0; i < chips.length; i += 1) {
            if (chips[i].getAttribute("data-dificultad") === dificultad) {
                chips[i].classList.add("chip--activo");
            } else {
                chips[i].classList.remove("chip--activo");
            }
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Ciclo de la partida                                                     */
    /* ---------------------------------------------------------------------- */
    function iniciarPartida() {
        var mensajeError = App.Utils.validarNombreJugador(entradaNombre.value);
        var config;

        if (mensajeError !== "") {
            errorNombre.textContent = mensajeError;
            return;
        }

        jugador = entradaNombre.value.trim();
        App.Utils.guardar(CLAVE_JUGADOR, jugador);
        App.Utils.guardar(CLAVE_DIFICULTAD, dificultadActual);

        config = DIFICULTADES[dificultadActual];
        estado = App.Tablero.crearEstado(config.filas, config.columnas, config.minas);
        tiempo = 0;
        pausado = false;
        cursorFila = 0;
        cursorCol = 0;
        celdaDetonada = null;

        etiquetaJugador.textContent = jugador;
        construirTablero();
        actualizarEstadoChip("En juego", "activo");
        actualizarHud();
        mostrarPantallaJuego();
        panelPausa.classList.add(CLASE_OCULTA);
        tableroElemento.classList.remove(CLASE_OCULTA);
        botonPausa.textContent = "Pausar";
    }

    /* Reinicia con el mismo jugador y dificultad, sin recargar la pagina */
    function reiniciar() {
        App.Modal.cerrar();
        iniciarPartida();
    }

    /* Vuelve al menu inicial deteniendo el temporizador */
    function volverAlMenu() {
        detenerTemporizador();
        App.Modal.cerrar();
        mostrarPantallaMenu();
    }

    function mostrarPantallaJuego() {
        pantallaMenu.classList.add(CLASE_OCULTA);
        pantallaJuego.classList.remove(CLASE_OCULTA);
    }

    function mostrarPantallaMenu() {
        pantallaJuego.classList.add(CLASE_OCULTA);
        pantallaMenu.classList.remove(CLASE_OCULTA);
    }

    /* ---------------------------------------------------------------------- */
    /* Construccion y pintado del tablero                                      */
    /* ---------------------------------------------------------------------- */
    function construirTablero() {
        var fragmento;
        var f;
        var c;
        var filaElemento;
        var celdaElemento;

        tableroElemento.textContent = "";
        detenerTemporizador();
        elementos = [];
        fragmento = document.createDocumentFragment();

        for (f = 0; f < estado.filas; f += 1) {
            filaElemento = App.Utils.crear("div", "tablero__fila");
            elementos.push([]);
            for (c = 0; c < estado.columnas; c += 1) {
                celdaElemento = App.Utils.crear("div", "celda");
                celdaElemento.setAttribute("data-fila", f);
                celdaElemento.setAttribute("data-columna", c);
                filaElemento.appendChild(celdaElemento);
                elementos[f].push(celdaElemento);
            }
            fragmento.appendChild(filaElemento);
        }
        tableroElemento.appendChild(fragmento);
        pintarCelda(cursorFila, cursorCol);
    }

    /* Actualiza la apariencia de una celda segun su estado logico */
    function pintarCelda(f, c) {
        var celda = estado.celdas[f][c];
        var elemento = elementos[f][c];

        elemento.className = "celda";
        elemento.textContent = "";

        if (celda.revelada && celda.mina) {
            elemento.classList.add("celda--mina");
            elemento.textContent = GLIFO_MINA;
        } else if (celda.revelada) {
            elemento.classList.add("celda--abierta");
            if (celda.adyacentes > 0) {
                elemento.classList.add("n" + celda.adyacentes);
                elemento.textContent = String(celda.adyacentes);
            }
        } else if (celda.marcada) {
            elemento.classList.add("celda--marcada");
            elemento.textContent = GLIFO_BANDERA;
        }

        if (f === cursorFila && c === cursorCol && !estado.terminado) {
            elemento.classList.add("celda--foco");
        }
    }

    /* Repinta una lista de celdas reveladas */
    function pintarReveladas(lista) {
        var i;
        for (i = 0; i < lista.length; i += 1) {
            pintarCelda(lista[i].fila, lista[i].columna);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Interacciones sobre el tablero                                          */
    /* ---------------------------------------------------------------------- */
    function obtenerCoordenadas(objetivo) {
        var celda = objetivo.closest ? objetivo.closest(".celda") : null;
        if (!celda) {
            return null;
        }
        return {
            fila: parseInt(celda.getAttribute("data-fila"), 10),
            columna: parseInt(celda.getAttribute("data-columna"), 10)
        };
    }

    function alClickTablero(evento) {
        var coordenadas = obtenerCoordenadas(evento.target);
        if (!coordenadas || !partidaJugable()) {
            return;
        }
        moverCursor(coordenadas.fila, coordenadas.columna);
        ejecutarRevelar(coordenadas.fila, coordenadas.columna);
    }

    function alDobleClickTablero(evento) {
        var coordenadas = obtenerCoordenadas(evento.target);
        var resultado;
        if (!coordenadas || !partidaJugable()) {
            return;
        }
        resultado = App.Tablero.revelarVecinos(estado, coordenadas.fila, coordenadas.columna);
        aplicarResultado(resultado);
    }

    function alClickDerechoTablero(evento) {
        var coordenadas = obtenerCoordenadas(evento.target);
        evento.preventDefault();
        if (!coordenadas || !partidaJugable()) {
            return;
        }
        ejecutarBandera(coordenadas.fila, coordenadas.columna);
    }

    /* Indica si la partida acepta interacciones */
    function partidaJugable() {
        return estado !== null && !estado.terminado && !pausado;
    }

    /* Revela una celda y aplica el resultado */
    function ejecutarRevelar(f, c) {
        var resultado;
        if (!estado.minasColocadas) {
            iniciarTemporizador();
        }
        resultado = App.Tablero.revelar(estado, f, c);
        aplicarResultado(resultado);
    }

    /* Coloca o quita una bandera y actualiza el marcador */
    function ejecutarBandera(f, c) {
        var cambio = App.Tablero.alternarBandera(estado, f, c);
        if (cambio) {
            pintarCelda(f, c);
            actualizarHud();
        }
    }

    /* Aplica el resultado devuelto por las mecanicas */
    function aplicarResultado(resultado) {
        pintarReveladas(resultado.reveladas);
        actualizarHud();
        if (resultado.tipo === "detonada") {
            celdaDetonada = resultado.reveladas[resultado.reveladas.length - 1];
            finPartida(false);
        } else if (resultado.tipo === "victoria") {
            finPartida(true);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Fin de partida                                                          */
    /* ---------------------------------------------------------------------- */
    function finPartida(victoria) {
        detenerTemporizador();
        if (victoria) {
            marcarMinasRestantes();
            actualizarEstadoChip("Campo limpio", "ganado");
            guardarTiempo(dificultadActual, jugador, tiempo);
            App.Modal.dialogo({
                titulo: "¡Campo despejado!",
                texto: jugador + ", ganaste en " + tiempo + " segundos.",
                textoPrimario: "Jugar de nuevo",
                textoSecundario: "Ir al menu",
                alAceptar: reiniciar,
                alCancelar: volverAlMenu
            });
        } else {
            revelarTodasLasMinas();
            actualizarEstadoChip("Mina detonada", "perdido");
            App.Modal.dialogo({
                titulo: "Boom",
                texto: "Pisaste una mina. Suerte en la proxima, " + jugador + ".",
                textoPrimario: "Reintentar",
                textoSecundario: "Ir al menu",
                alAceptar: reiniciar,
                alCancelar: volverAlMenu
            });
        }
    }

    /* Revela todas las minas al perder */
    function revelarTodasLasMinas() {
        var f;
        var c;
        for (f = 0; f < estado.filas; f += 1) {
            for (c = 0; c < estado.columnas; c += 1) {
                if (estado.celdas[f][c].mina) {
                    estado.celdas[f][c].revelada = true;
                    pintarCelda(f, c);
                }
            }
        }
        if (celdaDetonada) {
            elementos[celdaDetonada.fila][celdaDetonada.columna].classList.add("celda--detonada");
        }
    }

    /* Marca con bandera las minas que quedaban al ganar */
    function marcarMinasRestantes() {
        var f;
        var c;
        for (f = 0; f < estado.filas; f += 1) {
            for (c = 0; c < estado.columnas; c += 1) {
                if (estado.celdas[f][c].mina && !estado.celdas[f][c].marcada) {
                    estado.celdas[f][c].marcada = true;
                    estado.banderas += 1;
                    pintarCelda(f, c);
                }
            }
        }
        actualizarHud();
    }

    /* ---------------------------------------------------------------------- */
    /* HUD y temporizador                                                      */
    /* ---------------------------------------------------------------------- */
    function actualizarHud() {
        var restantes = estado.totalMinas - estado.banderas;
        marcadorMinas.textContent = App.Utils.formatearTresDigitos(restantes);
        marcadorTiempo.textContent = App.Utils.formatearTresDigitos(tiempo);
    }

    function actualizarEstadoChip(texto, tipo) {
        chipEstado.textContent = texto;
        chipEstado.className = "estado-juego__chip estado-juego__chip--" + tipo;
    }

    function iniciarTemporizador() {
        detenerTemporizador();
        intervalo = window.setInterval(function () {
            if (tiempo < 999) {
                tiempo += 1;
                marcadorTiempo.textContent = App.Utils.formatearTresDigitos(tiempo);
            }
        }, 1000);
    }

    function detenerTemporizador() {
        if (intervalo !== null) {
            window.clearInterval(intervalo);
            intervalo = null;
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Pausa                                                                   */
    /* ---------------------------------------------------------------------- */
    function alternarPausa() {
        if (estado === null || estado.terminado || !estado.minasColocadas) {
            return;
        }
        pausado = !pausado;
        if (pausado) {
            detenerTemporizador();
            tableroElemento.classList.add(CLASE_OCULTA);
            panelPausa.classList.remove(CLASE_OCULTA);
            botonPausa.textContent = "Reanudar";
        } else {
            iniciarTemporizador();
            tableroElemento.classList.remove(CLASE_OCULTA);
            panelPausa.classList.add(CLASE_OCULTA);
            botonPausa.textContent = "Pausar";
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Teclado                                                                 */
    /* ---------------------------------------------------------------------- */
    function alPresionarTecla(evento) {
        var tecla;
        if (!partidaJugable() || pantallaJuego.classList.contains(CLASE_OCULTA)) {
            return;
        }
        tecla = evento.key;
        if (tecla === "ArrowUp") {
            moverCursor(cursorFila - 1, cursorCol);
            evento.preventDefault();
        } else if (tecla === "ArrowDown") {
            moverCursor(cursorFila + 1, cursorCol);
            evento.preventDefault();
        } else if (tecla === "ArrowLeft") {
            moverCursor(cursorFila, cursorCol - 1);
            evento.preventDefault();
        } else if (tecla === "ArrowRight") {
            moverCursor(cursorFila, cursorCol + 1);
            evento.preventDefault();
        } else if (tecla === "Enter" || tecla === " ") {
            ejecutarRevelar(cursorFila, cursorCol);
            evento.preventDefault();
        } else if (tecla === "f" || tecla === "F") {
            ejecutarBandera(cursorFila, cursorCol);
            evento.preventDefault();
        }
    }

    /* Mueve el cursor de teclado dentro de los limites y repinta */
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

    /* ---------------------------------------------------------------------- */
    /* Modal: como jugar                                                       */
    /* ---------------------------------------------------------------------- */
    function abrirComoJugar() {
        App.Utils.seleccionar("#modal-como-jugar").classList.remove("modal--oculto");
    }

    function cerrarComoJugar() {
        App.Utils.seleccionar("#modal-como-jugar").classList.add("modal--oculto");
    }

    /* ---------------------------------------------------------------------- */
    /* Ranking (persistencia de mejores tiempos en LocalStorage)               */
    /* ---------------------------------------------------------------------- */
    function rankingVacio() {
        return { facil: [], medio: [], dificil: [] };
    }

    /* Guarda un tiempo en el ranking de la dificultad y ordena el top 5 */
    function guardarTiempo(dificultad, nombre, segundos) {
        var ranking = App.Utils.leer(CLAVE_RANKING, rankingVacio());
        if (!ranking[dificultad]) {
            ranking[dificultad] = [];
        }
        ranking[dificultad].push({ nombre: nombre, tiempo: segundos });
        ranking[dificultad].sort(function (a, b) {
            return a.tiempo - b.tiempo;
        });
        ranking[dificultad] = ranking[dificultad].slice(0, 5);
        App.Utils.guardar(CLAVE_RANKING, ranking);
    }

    function abrirRanking() {
        rankingActual = dificultadActual;
        marcarPestanaRanking(rankingActual);
        dibujarRanking(rankingActual);
        App.Utils.seleccionar("#modal-ranking").classList.remove("modal--oculto");
    }

    function cerrarRanking() {
        App.Utils.seleccionar("#modal-ranking").classList.add("modal--oculto");
    }

    function alCambiarPestanaRanking(evento) {
        var boton = evento.target.closest(".chip");
        if (!boton) {
            return;
        }
        rankingActual = boton.getAttribute("data-dificultad");
        marcarPestanaRanking(rankingActual);
        dibujarRanking(rankingActual);
    }

    function marcarPestanaRanking(dificultad) {
        var chips = App.Utils.seleccionarTodos("#ranking-tabs .chip");
        var i;
        for (i = 0; i < chips.length; i += 1) {
            if (chips[i].getAttribute("data-dificultad") === dificultad) {
                chips[i].classList.add("chip--activo");
            } else {
                chips[i].classList.remove("chip--activo");
            }
        }
    }

    /* Dibuja la lista de mejores tiempos de una dificultad */
    function dibujarRanking(dificultad) {
        var ranking = App.Utils.leer(CLAVE_RANKING, rankingVacio());
        var lista = ranking[dificultad] || [];
        var contenedor = App.Utils.seleccionar("#ranking-lista");
        var i;
        var item;
        var nombre;
        var tiempoTexto;

        contenedor.textContent = "";

        if (lista.length === 0) {
            contenedor.appendChild(App.Utils.crear("div", "modal__vacio", "Todavia no hay tiempos registrados."));
            return;
        }

        for (i = 0; i < lista.length; i += 1) {
            item = App.Utils.crear("div", "modal__item");
            nombre = App.Utils.crear("span", null, (i + 1) + ". " + lista[i].nombre);
            tiempoTexto = App.Utils.crear("span", null, lista[i].tiempo + "s");
            item.appendChild(nombre);
            item.appendChild(tiempoTexto);
            contenedor.appendChild(item);
        }
    }

    /* Borra todo el ranking previa confirmacion */
    function borrarRanking() {
        App.Modal.confirmar("Borrar ranking", "Se eliminaran todos los tiempos guardados.", function () {
            App.Utils.guardar(CLAVE_RANKING, rankingVacio());
            dibujarRanking(rankingActual);
        });
    }

    return {
        iniciar: iniciar
    };
})();

/* Arranque cuando el DOM esta listo */
document.addEventListener("DOMContentLoaded", function () {
    App.Juego.iniciar();
});
