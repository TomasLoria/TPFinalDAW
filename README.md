# Buscaminas — Consola de desminado

Videojuego web desarrollado como proyecto final de **Desarrollo y Arquitecturas Web 2026** (UAI).
Implementa el clásico Buscaminas con HTML5, CSS3 y JavaScript ES5, sin librerías externas.

## Cómo ejecutar

No requiere instalación ni compilación. Se puede abrir directamente en el navegador:

1. Cloná el repositorio.
2. Abrí `index.html` en un navegador moderno.

Para desarrollo se recomienda un servidor estático (por ejemplo la extensión *Live Server* de VS Code)
para evitar restricciones de rutas relativas.

## Cómo jugar

- **Click izquierdo:** revela una celda.
- **Click derecho:** coloca o quita una bandera.
- **Doble click** sobre un número: revela los vecinos si las banderas coinciden.
- **Teclado:** flechas para mover el cursor, `Enter` o `Espacio` para revelar, `F` para bandera.
- **Objetivo:** revelar todas las celdas sin minas. Si revelás una mina, perdés.

## Características

**Requerimientos obligatorios**

- Menú inicial con validación de nombre (mínimo 3 letras).
- Tres dificultades (fácil, medio, difícil).
- Condición clara de victoria y derrota con mensajes visuales.
- Marcadores de minas restantes y tiempo (actualizados dinámicamente).
- Reinicio de la partida sin recargar la página.
- Modales en lugar de `alert` (sin código bloqueante).
- Interfaz responsive maquetada con Flexbox.
- Interacción por mouse y teclado.
- Persistencia con LocalStorage (ranking, último jugador y dificultad).
- Página de Contacto con formulario validado y envío por `mailto`.

**Requerimientos deseados incluidos**

- Modo claro y modo oscuro (persistente).
- Niveles de dificultad.
- Pantalla de pausa.
- Ranking de mejores tiempos por dificultad.
- Pantalla de instrucciones.
- Modales personalizados de victoria y derrota.
- Primer click siempre seguro.

## Estructura del proyecto

```
buscaminas/
├── index.html          Menú y pantalla de juego
├── contacto.html       Página de contacto
├── css/
│   ├── reset.css       Reset base
│   └── styles.css      Estilos y temas
├── js/
│   ├── utils.js        Helpers de DOM, storage y validaciones
│   ├── modal.js        Sistema de modales (reemplaza alert)
│   ├── tema.js         Modo claro / oscuro
│   ├── tablero.js      Mecánicas puras del juego (sin DOM)
│   ├── juego.js        Controlador de interfaz del juego
│   └── contacto.js     Validación y envío del formulario
├── img/
│   └── favicon.svg
├── .gitignore
├── README.md
└── PROMPTS-IA.md
```

La lógica se separa de la interfaz: `tablero.js` contiene solo reglas y estructuras de datos,
mientras que `juego.js` se encarga del DOM y la experiencia de usuario.

## Tecnologías

- HTML5 semántico
- CSS3 con Flexbox y variables para el sistema de temas
- JavaScript ES5 (`"use strict"`, sin `let`/`const`/arrow, sin librerías)
- LocalStorage para persistencia

## Convenciones de código

- Identificadores y comentarios en español, consistentes en todo el proyecto.
- `camelCase` para variables y funciones, `kebab-case` para clases CSS e ids.
- Variables declaradas al inicio de cada función.
- Eventos manejados con `addEventListener`.

## Uso de IA

Durante el desarrollo se utilizó asistencia de IA. El detalle de los prompts y su uso
está documentado en `PROMPTS-IA.md`.

- Herramienta: Claude (Anthropic)
- Modelo: Claude Opus 4.8

## Autor

Reemplazá estos datos por los tuyos y actualizá los enlaces a GitHub en `index.html`,
`contacto.html` y este README.
