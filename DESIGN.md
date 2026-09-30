---
name: Alabanza IBG
description: Plataforma de gestión para el ministerio de alabanza de IBG - Dirección El Índice del Cuarto Oscuro
colors:
  surface-dark-base: "#0a0a0a"
  surface-dark-page: "#111111"
  surface-dark-card: "#1a1a1a"
  surface-dark-hover: "#242424"
  surface-dark-active: "#2e2e2e"
  border-subtle: "#1f1f1f"
  border-normal: "#2e2e2e"
  border-strong: "#3d3d3d"
  text-primary: "#f5f5f5"
  text-secondary: "#9ca3af"
  text-tertiary: "#848b98"
  text-pure-white: "#ffffff"
  success: "#22c55e"
  warning: "#eab308"
  error: "#ef4444"
  info: "#3b82f6"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  body-mobile-input:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
motion:
  engine: "GSAP"
  preset: "sober: short fade-rise list entry, faster exits, sliding indicators, transposition step"
  durations: "150ms feedback · 240ms routine · 320ms overlays"
  easing: "arrive cubic-bezier(0.16, 1, 0.3, 1) · leave cubic-bezier(0.4, 0, 1, 1)"
  tokens: "src/lib/motion.ts"
---

# Design System: Alabanza IBG — El Índice del Cuarto Oscuro

## Overview

**Creative North Star: "El Índice del Cuarto Oscuro"**

Alabanza IBG ha sido completamente rediseñado bajo una estética de escala de grises pura, inspirada en lectores de microfiche de biblioteca y la disciplina del diseño suizo (Swiss International Style). Cada elemento emerge del negro profundo con bordes hairline precisos y revelados fluidos impulsados por **GSAP**.

**Características Clave:**
- **Grayscale Absoluto:** Fondo `#0a0a0a`, superficies `#111111` y `#1a1a1a`, texto `#f5f5f5`. Sin acentos de color decorativos.
- **Movimiento sobrio (GSAP + CSS):** la interfaz no debe llamar la atención sobre sí misma.
  - *Momento principal:* al cambiar de tono, solo las líneas de acordes dan un paso en la dirección del cambio (arriba al subir, abajo al bajar); la letra no se mueve.
  - *Continuidad:* listas que entran en cascada corta (máx. 0,3 s en total), filas que se deslizan al reordenar (Flip), indicadores que se deslizan en pestañas y menú inferior, modales y avisos que salen animados.
  - *Salidas* más rápidas que las entradas; transición entre páginas solo con fundido (sin desplazamiento).
  - *Carga:* siluetas (skeletons) con la forma del contenido, no spinners; el spinner queda solo para la sesión inicial.
  - *Movimiento reducido:* todo aparece sin desplazamiento; nada queda oculto si el JS no corre.
- **Tipografía Crisp:** Geist Sans con tracking ajustado en cabezales.
- **Bordes Hairline:** Líneas finas `#1f1f1f` y `#2e2e2e` para delimitar estructura sin peso ni sombra.
- **Colores Semánticos puros:** Los tonos verde, amarillo, rojo y azul existen únicamente en badges de estado para asignaciones y listas.
