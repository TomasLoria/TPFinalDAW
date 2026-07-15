"use strict";

var App = App || {};

App.Tema = (function () {
    var CLAVE = "buscaminas_tema";
    var raiz = document.documentElement;
    var boton = null;

    /* Aplica el tema y actualiza el icono del boton */
    function aplicar(tema) {
        raiz.setAttribute("data-tema", tema);
        if (boton) {
            boton.textContent = tema === "oscuro" ? "☀" : "☾";
        }
        App.Utils.guardar(CLAVE, tema);
    }

    /* Alterna entre oscuro y claro */
    function alternar() {
        var actual = raiz.getAttribute("data-tema");
        aplicar(actual === "oscuro" ? "claro" : "oscuro");
    }

    /* Inicia el modulo de tema en la pagina */
    function iniciar() {
        var guardado = App.Utils.leer(CLAVE, "oscuro");
        boton = App.Utils.seleccionar("#boton-tema");
        aplicar(guardado);
        if (boton) {
            boton.addEventListener("click", alternar);
        }
    }

    return {
        iniciar: iniciar
    };
})();
