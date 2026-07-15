"use strict";

var App = App || {};

App.Contacto = (function () {
    var DESTINO = "contacto@buscaminas.com";
    var campoNombre = null;
    var campoMail = null;
    var campoMensaje = null;
    var errorNombre = null;
    var errorMail = null;
    var errorMensaje = null;
    var mensajeEnvio = null;

    /* Inicia el modulo de contacto */
    function iniciar() {
        App.Tema.iniciar();
        obtenerReferencias();
        conectarEventos();
    }

    function obtenerReferencias() {
        campoNombre = App.Utils.seleccionar("#campo-nombre");
        campoMail = App.Utils.seleccionar("#campo-mail");
        campoMensaje = App.Utils.seleccionar("#campo-mensaje");
        errorNombre = App.Utils.seleccionar("#error-contacto-nombre");
        errorMail = App.Utils.seleccionar("#error-contacto-mail");
        errorMensaje = App.Utils.seleccionar("#error-contacto-mensaje");
        mensajeEnvio = App.Utils.seleccionar("#mensaje-envio");
    }

    function conectarEventos() {
        App.Utils.seleccionar("#boton-enviar").addEventListener("click", enviar);
        campoNombre.addEventListener("input", limpiarErrores);
        campoMail.addEventListener("input", limpiarErrores);
        campoMensaje.addEventListener("input", limpiarErrores);
    }

    function limpiarErrores() {
        errorNombre.textContent = "";
        errorMail.textContent = "";
        errorMensaje.textContent = "";
    }

    /* Valida el formulario y, si es correcto, abre el cliente de correo */
    function enviar() {
        var errorEnNombre = App.Utils.validarNombreAlfanumerico(campoNombre.value);
        var errorEnMail = App.Utils.validarMail(campoMail.value);
        var errorEnMensaje = App.Utils.validarMensaje(campoMensaje.value);
        var enlace;

        errorNombre.textContent = errorEnNombre;
        errorMail.textContent = errorEnMail;
        errorMensaje.textContent = errorEnMensaje;

        if (errorEnNombre !== "" || errorEnMail !== "" || errorEnMensaje !== "") {
            return;
        }

        enlace = construirMailto();
        mensajeEnvio.classList.remove("mensaje-envio--oculto");
        window.location.href = enlace;
    }

    /* Construye el enlace mailto con los datos del formulario */
    function construirMailto() {
        var asunto = "Consulta de " + campoNombre.value.trim();
        var cuerpo = "Nombre: " + campoNombre.value.trim() +
            "\nMail: " + campoMail.value.trim() +
            "\n\n" + campoMensaje.value.trim();
        return "mailto:" + DESTINO +
            "?subject=" + encodeURIComponent(asunto) +
            "&body=" + encodeURIComponent(cuerpo);
    }

    return {
        iniciar: iniciar
    };
})();

document.addEventListener("DOMContentLoaded", function () {
    App.Contacto.iniciar();
});
