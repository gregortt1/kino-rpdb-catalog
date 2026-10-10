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

En la hoja de consentimiento Kino dirá que el plugin **usa tu usuario y contraseña**: son las claves
que le des (la de RPDB y, si tu Kino fuera muy antiguo, la de TMDB), que se guardan cifradas en tu
aparato y nunca salen de él.

## Configurarlo

Toca **Configurar** en la pestaña del plugin:

| Ajuste | Qué hace |
| --- | --- |
| **Clave de RPDB** | Tu API key de RPDB. **Opcional**: sin ella el catálogo funciona con los pósters originales de TMDB. |
| **Fuente del póster** | `RatingPosterDB` (con nota) o `TMDB` (los originales). |
| **Tipo de póster** | `poster-default`, o el tipo con nota que incluya tu plan (por ejemplo `poster-imdb-rated`). |
| **Póster sin nota si no hay con nota** | Déjalo encendido: evita que un título se quede sin imagen. |
| **Usar fondos con nota** | Apagado. Los fondos con nota son del plan de 3 $/mes de RPDB. |
| **Llave de TMDB** | Solo la necesitan versiones de Kino anteriores a la 0.9.53. Si tu Kino es nuevo, déjala vacía. |

**No necesitas llave de TMDB.** En Kino 0.9.53 o superior, Kino pone la suya a través de su propia
puerta a TMDB, con su caché y sus límites.

### La clave de RPDB es tuya

RPDB es un servicio de pago (desde 2 $/mes): pide tu clave en
[ratingposterdb.com/api-key](https://ratingposterdb.com/api-key/). Cada persona usa **su propia** clave,
porque va dentro de la dirección de cada imagen: por eso este plugin te la pide a ti y no la trae
incluida.

Si te equivocas al escribirla, el plugin lo detecta y **vuelve a los pósters de TMDB** en vez de
dejarte cientos de imágenes rotas.

## Lo que este plugin NO hace

Conviene saberlo antes de instalarlo:

- **No cambia los pósters de tus otras fuentes.** Aporta su propio catálogo. Los títulos de otro plugin
  siguen con su arte (eso sí: si un título ajeno no trae póster ninguno, este plugin se lo rellena).
- **No reproduce.** Sus títulos van a "Buscar dónde verlo", en tus otras fuentes.
- **No trae la clave de RPDB.** Es tuya.
- **No añade canales en vivo.**

## Si algo no va

| Lo que ves | Qué hacer |
| --- | --- |
| *Este plugin necesita una versión más nueva de Kino* | Tu Kino es anterior a la 0.9.50. Actualízalo. |
| Los pósters salen sin nota | Falta la clave de RPDB, o el tipo de póster no incluye nota: revisa **Configurar**. |
| No aparecen las filas en Inicio | Ajustes ▸ Plugins ▸ **Actualizar**. Si siguen sin salir, activa **Modo debug** en la pestaña del plugin y revisa el **Registro**. |
| Un póster no es el de ese título | Muy raro, pero pasa: los ids de película y de serie de TMDB son listas distintas y pueden coincidir en el mismo número. Pon **Fuente del póster ▸ TMDB** y vuelves a los originales. |
| El plugin desaparece de la lista | Tienes que haberlo desactivado o desinstalado; vuelve a agregarlo con la dirección de arriba. |

## Créditos

Sin afiliación con RatingPosterDB, TMDB ni Kino.

- Las fichas y las imágenes base son de **TMDB**, a través de Kino.
- Los pósters con nota son de **RPDB**, con tu clave.
- La app es **Kino**.

Respeta los términos de cada servicio y no compartas tu clave con nadie.
