"use strict";

var App = App || {};

App.Modal = (function () {
    var CLASE_OCULTO = "modal--oculto";
    var overlay = null;
    var titulo = null;
    var texto = null;
    var botonPrimario = null;
    var botonSecundario = null;
    var accionPrimaria = null;
    var accionSecundaria = null;

    /* Guarda las referencias del DOM y conecta los eventos permanentes */
    function iniciar() {
        overlay = App.Utils.seleccionar("#modal-generico");
        titulo = App.Utils.seleccionar("#modal-titulo");
        texto = App.Utils.seleccionar("#modal-texto");
        botonPrimario = App.Utils.seleccionar("#modal-boton-primario");
        botonSecundario = App.Utils.seleccionar("#modal-boton-secundario");

        botonPrimario.addEventListener("click", function () {
            var accion = accionPrimaria;
            cerrar();
            if (typeof accion === "function") {
                accion();
            }
        });

        botonSecundario.addEventListener("click", function () {
            var accion = accionSecundaria;
            cerrar();
            if (typeof accion === "function") {
                accion();
            }
        });

        overlay.addEventListener("click", function (evento) {
            if (evento.target === overlay) {
                cerrar();
            }
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape") {
                cerrar();
            }
        });
    }

    /* Abre el modal con la configuracion indicada */
    function abrir(config) {
        titulo.textContent = config.titulo;
        texto.textContent = config.texto;
        botonPrimario.textContent = config.textoPrimario || "Aceptar";
        accionPrimaria = config.alAceptar || null;
        accionSecundaria = config.alCancelar || null;

        if (config.textoSecundario) {
            botonSecundario.textContent = config.textoSecundario;
            botonSecundario.classList.remove(CLASE_OCULTO);
        } else {
            botonSecundario.classList.add(CLASE_OCULTO);
        }

        overlay.classList.remove(CLASE_OCULTO);
    }

    /* Cierra el modal generico */
    function cerrar() {
        if (overlay) {
            overlay.classList.add(CLASE_OCULTO);
        }
    }

    /* Muestra un mensaje simple con un solo boton */
    function mensaje(tituloTexto, cuerpo, alAceptar) {
        abrir({
            titulo: tituloTexto,
            texto: cuerpo,
            textoPrimario: "Aceptar",
            alAceptar: alAceptar
        });
    }

    /* Muestra una confirmacion con dos botones */
    function confirmar(tituloTexto, cuerpo, alConfirmar) {
        abrir({
            titulo: tituloTexto,
            texto: cuerpo,
            textoPrimario: "Confirmar",
            textoSecundario: "Cancelar",
            alAceptar: alConfirmar
        });
    }

    return {
        iniciar: iniciar,
        mensaje: mensaje,
        confirmar: confirmar,
        dialogo: abrir,
        cerrar: cerrar
    };
})();
