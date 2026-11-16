# El Impostor

Juego del impostor para jugar en grupo con un solo celular. No tiene publicidad.

**Abrir el juego:** https://tenehuini.github.io/impostor/

## Instalar la aplicación en el celular

El juego se instala desde el navegador y queda con su ícono en la pantalla de inicio, como cualquier otra app. No hace falta pasar por Google Play ni por la App Store.

### Android

1. Abrí **Chrome** y entrá a https://tenehuini.github.io/impostor/
2. Tocá el menú **⋮** (arriba a la derecha).
3. Elegí **Instalar app**. Si no aparece, elegí **Agregar a pantalla principal**.
4. Confirmá tocando **Instalar** (o **Agregar**).

El ícono de los detectives aparece en la pantalla de inicio. Para abrir el juego, tocá ese ícono.

> También funciona con otros navegadores, como Samsung Internet o Edge. La opción se encuentra en el menú del navegador y suele llamarse "Agregar a pantalla de inicio".

### iPhone

1. Abrí **Safari** y entrá a https://tenehuini.github.io/impostor/
   (tiene que ser Safari: desde Chrome u otros navegadores no siempre aparece la opción)
2. Tocá el botón **Compartir**, el cuadrado con una flecha hacia arriba, en la barra de abajo.
3. Deslizá hacia abajo y elegí **Agregar a inicio**.
4. Tocá **Agregar**, arriba a la derecha.

El ícono aparece en la pantalla de inicio. Para abrir el juego, tocá ese ícono.

## Preguntas frecuentes

**¿Necesito internet para jugar?**
Solo la primera vez. Una vez que la abriste con conexión, la app funciona sin internet.

**¿Cómo recibo las actualizaciones?**
Solas: al abrir la app con internet, se descarga la versión nueva. A veces hay que cerrarla y volver a abrirla una vez para ver los cambios.

**¿Dónde se guardan los jugadores?**
Solo en tu celular. La app no envía datos a ningún servidor.

**¿Cómo la desinstalo?**
Igual que cualquier app: mantené apretado el ícono y elegí **Desinstalar** (Android) o **Eliminar app** (iPhone).

**¿De dónde salen las imágenes de las palabras?**
De Wikipedia y Wikimedia Commons. Se ven solo con internet, y no todas las palabras tienen. Para quitar una imagen equivocada, borrá su línea en `images.js`.

**En el iPhone no suena la alarma del temporizador.**
Revisá que el interruptor lateral no esté en modo silencio.

## Para quien mantiene el juego

Cada vez que se publica un cambio, agregá una entrada **al principio** de `changelog.js` con un número de `version` mayor al anterior. Al abrir la app, cada persona ve una sola vez un cartel con las novedades que todavía no vio. Además, en `sw.js` subí el número de `CACHE` (por ejemplo, de `impostor-v17` a `impostor-v18`) para que los celulares descarguen los archivos nuevos.
