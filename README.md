# Catálogo con pósters RPDB

Un catálogo de películas y series para **Kino** cuyos pósters llevan la **nota incrustada** (IMDb,
Rotten Tomatoes, Metacritic, Trakt, Letterboxd…), gracias a
[RatingPosterDB](https://ratingposterdb.com/).

![Ícono](icon.png)

## Qué añade a Kino

- **Filas en Inicio**: películas y series en tendencia, mejor valoradas, en cines y al aire.
- **Búsqueda propia**: busca en todo el catálogo de TMDB, con "Ver más" para seguir mirando.
- **Fichas completas**: sinopsis, nota, año, temporadas y capítulos.
- **Pósters con nota**: el póster que ves en las cuadrículas y en la ficha es el de RPDB.

Este plugin **no reproduce nada**. Es un catálogo para descubrir qué ver: cuando abres uno de sus
títulos, Kino te ofrece **"Buscar dónde verlo"** y lo busca en tus otras fuentes.

## Instalarlo

1. Abre Kino.
2. Ve a **Ajustes ▸ Plugins** (en el televisor: menú ☰ → **Plugins**).
3. Toca el botón **+**.
4. Escribe:

   ```
   gregorysteventt-source/kino-rpdb-catalog
   ```

5. **Agregar** → lee la hoja → **Instalar**.

En la hoja de consentimiento Kino dirá que el plugin **usa tu usuario y contraseña**: es la clave de
RPDB, que se guarda cifrada en tu aparato y nunca sale de él.

## Configurarlo

Solo hay **dos ajustes**:

| Ajuste | Qué hace |
| --- | --- |
| **Clave de RPDB** | Tu clave. **Opcional**: sin ella el catálogo funciona con los pósters originales de TMDB. |
| **Tipo de póster** | `poster-default`, o el tipo con nota que incluya tu plan (por ejemplo `poster-imdb-rated`). |

**No necesitas llave de TMDB.** En Kino 0.9.53 o superior, Kino pone la suya a través de su propia
puerta a TMDB, con su caché y sus límites. Las fichas, las sinopsis y los **fondos** vienen de ahí.

### Pósters y fondos

- **Pósters**: los de RPDB, con la nota incrustada.
- **Fondos**: los de **TMDB**, sin nota. No es un olvido: los fondos con nota son uno de los planes de
  pago de RPDB, y pedirlos con una clave que no los incluye deja **todas las tarjetas vacías en un
  televisor**, porque ahí Kino dibuja las tarjetas con el fondo. Como el plugin no puede saber qué plan
  tienes, los fondos van siempre por la vía gratuita y segura.

Cada persona usa **su propia** clave, porque va dentro de la dirección de cada imagen: por eso este
plugin te la pide a ti y no la trae incluida. Si te equivocas al escribirla, el plugin lo detecta y
**vuelve a los pósters de TMDB** en vez de dejarte cientos de imágenes rotas.

## Lo que este plugin NO hace

Conviene saberlo antes de instalarlo:

- **No cambia los pósters de tus otras fuentes.** Aporta su propio catálogo. Los títulos de otro plugin
  siguen con su arte (eso sí: si un título ajeno no trae póster ninguno, este plugin se lo rellena).
- **No reproduce.** Sus títulos van a "Buscar dónde verlo", en tus otras fuentes.
- **No trae la clave.** Es tuya.
- **No pone fondos con nota.** Ver arriba.
- **No añade canales en vivo.**

## Si algo no va

| Lo que ves | Qué hacer |
| --- | --- |
| *Este plugin necesita una versión más nueva de Kino* | Tu Kino es anterior a la 0.9.50. Actualízalo. |
| Los pósters salen sin nota | Falta la clave, o el tipo de póster no incluye nota: revisa **Configurar**. |
| No aparecen las filas en Inicio | Ajustes ▸ Plugins ▸ **Actualizar**. Si siguen sin salir, activa **Modo debug** en la pestaña del plugin y revisa el **Registro**. |
| Un póster sale en blanco o no es el de ese título | TMDB usa listas de ids distintas para películas y series, y pueden coincidir en el mismo número. El plugin ya le dice a RPDB de cuál de las dos se trata. Si vieras alguno mal, avísale a quien mantiene el plugin. |
| **En el televisor** las tarjetas salen vacías | Mira que en **Configurar** no haya quedado ningún ajuste raro de una versión anterior. Desinstalar y volver a instalar deja los ajustes limpios. |
| El plugin desaparece de la lista | Tienes que haberlo desactivado o desinstalado; vuelve a agregarlo con la dirección de arriba. |

## Créditos

Sin afiliación con RatingPosterDB, TMDB ni Kino.

- Las fichas, las sinopsis y los fondos son de **TMDB**, a través de Kino.
- Los pósters con nota son de **RPDB**, con tu clave.
- La app es **Kino**.

Respeta los términos de cada servicio y no compartas tu clave con nadie.
