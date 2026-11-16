'use strict';

// Novedades que se muestran una sola vez a cada persona al abrir la app.
// Al publicar cambios: agregar una entrada NUEVA AL PRINCIPIO con un número de
// versión mayor al anterior. Escribir para jugadores, no para programadores.
const CHANGELOG = [
  {
    version: 2,
    date: '2026-11-15',
    items: [
      'Nuevas palabras en la categoría Dante Alighieri.',
    ],
  },
  {
    version: 1,
    date: '2026-11-15',
    items: [
      'Las rondas de pistas se juegan completas: al terminar la vuelta, el que empezó elige votar o jugar otra.',
      'Votación en grupo o secreta, a elección en Configuración.',
      'Temporizador en la votación en grupo, con alarma: si llega a cero, ganan los impostores.',
      'A las jugadoras les aparece "IMPOSTORA".',
      'Más de 500 palabras por categoría y nuevas categorías: Comida, Dante Alighieri y Las Flores.',
      'Las categorías con más palabras salen más seguido.',
      'Este aviso de novedades, para que sepas qué cambió en cada versión.',
    ],
  },
];
