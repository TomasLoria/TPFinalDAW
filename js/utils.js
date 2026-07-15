"use strict";

/* Espacio de nombres global de la aplicacion */
var App = App || {};

App.Utils = (function () {
    /* Busca un unico elemento por selector CSS */
    function seleccionar(selector) {
        return document.querySelector(selector);
    }

    /* Busca todos los elementos y devuelve un arreglo real */
    function seleccionarTodos(selector) {
        var lista = document.querySelectorAll(selector);
        return Array.prototype.slice.call(lista);
    }

    /* Crea un elemento con clase y texto opcionales */
    function crear(etiqueta, clase, texto) {
        var elemento = document.createElement(etiqueta);
        if (clase) {
            elemento.className = clase;
        }
        if (texto !== undefined && texto !== null) {
            elemento.textContent = texto;
        }
        return elemento;
    }

    /* Guarda un valor en LocalStorage como JSON */
    function guardar(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch (error) {
            return false;
        }
        return true;
    }

    /* Lee un valor de LocalStorage; devuelve porDefecto ante error o ausencia */
    function leer(clave, porDefecto) {
        var crudo;
        try {
            crudo = localStorage.getItem(clave);
            if (crudo === null) {
                return porDefecto;
            }
            return JSON.parse(crudo);
        } catch (error) {
            return porDefecto;
        }
    }

    /* Valida el nombre del jugador: minimo 3 letras */
    function validarNombreJugador(valor) {
        var limpio = (valor || "").trim();
        var letras = limpio.replace(/[^a-zA-ZaeiouAEIOUnN]/g, "");
        if (limpio.length === 0) {
            return "Ingresa un nombre.";
        }
        if (letras.length < 3) {
            return "El nombre debe tener al menos 3 letras.";
        }
        return "";
    }

    /* Valida un nombre alfanumerico (formulario de contacto) */
    function validarNombreAlfanumerico(valor) {
        var limpio = (valor || "").trim();
        var patron = /^[a-zA-Z0-9aeiouAEIOUnN\s]+$/;
        if (limpio.length === 0) {
            return "Ingresa un nombre.";
        }
        if (!patron.test(limpio)) {
            return "El nombre solo admite letras y numeros.";
        }
        return "";
    }

    /* Valida un correo electronico */
    function validarMail(valor) {
        var limpio = (valor || "").trim();
        var patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (limpio.length === 0) {
            return "Ingresa un mail.";
        }
        if (!patron.test(limpio)) {
            return "El mail no es valido.";
        }
        return "";
    }

    /* Valida un mensaje: mas de 5 caracteres */
    function validarMensaje(valor) {
        var limpio = (valor || "").trim();
        if (limpio.length <= 5) {
            return "El mensaje debe tener mas de 5 caracteres.";
        }
        return "";
    }

    /* Formatea un numero a texto de 3 digitos con ceros a la izquierda */
    function formatearTresDigitos(numero) {
        var valor = Math.max(0, Math.min(999, numero));
        var texto = String(valor);
        while (texto.length < 3) {
            texto = "0" + texto;
        }
        return texto;
    }

    return {
        seleccionar: seleccionar,
        seleccionarTodos: seleccionarTodos,
        crear: crear,
        guardar: guardar,
        leer: leer,
        validarNombreJugador: validarNombreJugador,
        validarNombreAlfanumerico: validarNombreAlfanumerico,
        validarMail: validarMail,
        validarMensaje: validarMensaje,
        formatearTresDigitos: formatearTresDigitos
    };
})();
