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
| **Servidor de pósters** | Déjalo **vacío** para usar RatingPosterDB, o pega la dirección de otro servidor compatible (por ejemplo `https://openposterdb.com`, gratis). |
| **Clave del servidor** | Tu clave de ese servidor. **Opcional**: sin ella el catálogo funciona con los pósters originales de TMDB. |
| **Fuente del póster** | `Con nota` (el servidor) o `TMDB` (los originales). |
| **Tipo de póster** | `poster-default`, o el tipo con nota que incluya tu plan (por ejemplo `poster-imdb-rated`). |
| **Póster sin nota si no hay con nota** | Déjalo encendido: evita que un título se quede sin imagen. |
| **Usar fondos con nota** | Apagado. Los fondos con nota son del plan de 3 $/mes **en RPDB**; en OpenPosterDB son gratis. |
| **Llave de TMDB** | Solo la necesitan versiones de Kino anteriores a la 0.9.53. Si tu Kino es nuevo, déjala vacía. |

**No necesitas llave de TMDB.** En Kino 0.9.53 o superior, Kino pone la suya a través de su propia
puerta a TMDB, con su caché y sus límites.

### De dónde salen los pósters

| Servidor | Precio | Fondos con nota |
| --- | --- | --- |
| [**RatingPosterDB**](https://ratingposterdb.com/api-key/) (por defecto) | De pago, desde 2 $/mes. Los **fondos** con nota son del plan de 7 $/mes. | Solo en el plan de 7 $/mes |
| [**OpenPosterDB**](https://openposterdb.com) | **Gratis**, con clave gratuita que sacas en su web. | **Sí, gratis** |

OpenPosterDB es un reemplazo del mismo tipo (usa exactamente las mismas direcciones), así que el plugin
funciona con él sin cambiar nada más que el ajuste **Servidor de pósters**. Agrega notas de nueve
fuentes: IMDb, Rotten Tomatoes (crítica y audiencia), Metacritic, Trakt, Letterboxd, MyAnimeList, Roger
Ebert y MDBList.

También puedes montarlo **en tu casa** con Docker ([instrucciones](https://github.com/PNRxA/openposterdb))
y pegar ahí la dirección de tu equipo; Kino admite imágenes de un servidor que escribas tú en los ajustes,
incluso en la red local y por `http`.

Cada persona usa **su propia** clave, porque va dentro de la dirección de cada imagen: por eso este
plugin te la pide a ti y no la trae incluida. Y si te equivocas al escribirla, el plugin lo detecta y
**vuelve a los pósters de TMDB** en vez de dejarte cientos de imágenes rotas.

## Lo que este plugin NO hace

Conviene saberlo antes de instalarlo:

- **No cambia los pósters de tus otras fuentes.** Aporta su propio catálogo. Los títulos de otro plugin
  siguen con su arte (eso sí: si un título ajeno no trae póster ninguno, este plugin se lo rellena).
- **No reproduce.** Sus títulos van a "Buscar dónde verlo", en tus otras fuentes.
- **No trae la clave.** Es tuya.
- **No añade canales en vivo.**

## Si algo no va

| Lo que ves | Qué hacer |
| --- | --- |
| *Este plugin necesita una versión más nueva de Kino* | Tu Kino es anterior a la 0.9.50. Actualízalo. |
| Los pósters salen sin nota | Falta la clave del servidor, o el tipo de póster no incluye nota: revisa **Configurar**. |
| No aparecen las filas en Inicio | Ajustes ▸ Plugins ▸ **Actualizar**. Si siguen sin salir, activa **Modo debug** en la pestaña del plugin y revisa el **Registro**. |
| Un póster sale en blanco o no es el de ese título | TMDB usa listas de ids distintas para películas y series, y pueden coincidir en el mismo número. El plugin ya le dice al servidor de cuál de las dos se trata. Si aun así vieras alguno mal, ve a **Configurar** y pon **Tipo de medio en el id ▸ No incluirlo**, o **Fuente del póster ▸ TMDB**. |
| El plugin desaparece de la lista | Tienes que haberlo desactivado o desinstalado; vuelve a agregarlo con la dirección de arriba. |

## Créditos

Sin afiliación con RatingPosterDB, TMDB ni Kino.

- Las fichas y las imágenes base son de **TMDB**, a través de Kino.
- Los pósters con nota son de **RPDB**, con tu clave.
- La app es **Kino**.

Respeta los términos de cada servicio y no compartas tu clave con nadie.
