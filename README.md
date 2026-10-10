# Catálogo con pósters RPDB

Un catálogo de películas y series para **Kino** cuyas imágenes llevan la **nota incrustada** (IMDb,
Rotten Tomatoes, Metacritic, Trakt, Letterboxd…), gracias a
[RatingPosterDB](https://ratingposterdb.com/) o a [OpenPosterDB](https://openposterdb.com).

![Ícono](icon.png)

## Qué añade a Kino

- **Filas en Inicio**: películas y series en tendencia, mejor valoradas, en cines y al aire.
- **Búsqueda propia**: busca en todo el catálogo de TMDB, con "Ver más" para seguir mirando.
- **Fichas completas**: sinopsis, nota, año, temporadas y capítulos.
- **Imágenes con nota**: el póster, el fondo y los fotogramas de capítulo.

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

En la hoja de consentimiento Kino dirá que el plugin **usa tu usuario y contraseña**: es la clave del
servidor de imágenes, que se guarda cifrada en tu aparato y nunca sale de él.

## Configurarlo

Solo hay **tres ajustes**:

| Ajuste | Qué hace |
| --- | --- |
| **Servidor de imágenes** | Déjalo **vacío** para RatingPosterDB, o pega `https://openposterdb.com` para el servicio gratuito. |
| **Clave del servidor** | Tu clave de ese servidor. **Opcional**: sin ella el catálogo usa las imágenes de TMDB. |
| **Tipo de póster** | `poster-default`, o el tipo con nota que incluya tu plan (por ejemplo `poster-imdb-rated`). |

**No necesitas llave de TMDB.** En Kino 0.9.53 o superior, Kino pone la suya a través de su propia
puerta a TMDB, con su caché y sus límites: de ahí salen las fichas, las sinopsis y cualquier imagen que
el servidor no sirva.

## Qué imágenes pueden llevar nota

| Imagen de Kino | ¿Se puede? |
| --- | --- |
| **Póster** (vertical, el del móvil y las fichas) | **Sí** |
| **Fondo** (horizontal: el de las tarjetas de un televisor) | **Sí**, si tu servidor los sirve |
| **Fotograma** de capítulo | **Sí**, si tu servidor los sirve |
| **Logo** | **No.** Kino no tiene ningún campo para logos en un título: solo los admite como imagen de un canal en vivo. No hay dónde ponerlos. |

### Fondos y fotogramas: el plugin lo comprueba antes

En RatingPosterDB los **fondos** con nota son de un **plan de pago**. Si se le piden con una clave que no
los incluye, RPDB no devuelve la imagen — y como en un televisor Kino dibuja las tarjetas **con el
fondo**, la pantalla entera se queda en blanco aunque en el móvil se vea todo bien (ahí manda el póster).

Para que eso no vuelva a pasar, el plugin **pregunta primero**: antes de usar una sola imagen de ese
tipo, comprueba con una petición si tu servidor la sirve. Si no la sirve, esa imagen la pone TMDB —gratis
y siempre disponible— y el resto sigue igual. Es una comprobación por sesión, no por título, y la
decisión es **conservadora**: solo usa la imagen del servidor si la ha visto funcionar.

Así que no hay nada que ajustar: enchufa el servidor que quieras y el plugin se apaña.

### Qué servidor elegir

| | [RatingPosterDB](https://ratingposterdb.com/api-key/) | [OpenPosterDB](https://openposterdb.com) |
| --- | --- | --- |
| **Pósters** con nota | Sí | Sí |
| **Fondos** con nota | Solo en su plan de pago | **Sí, gratis** |
| **Fotogramas** con nota | Solo en su plan de pago | **Sí, gratis** |
| **Clave** | La tuya, desde su web | **`t0-free-rpdb`**, una clave pública gratuita |
| **Cómo se usa** | Deja el servidor **vacío** | Servidor `https://openposterdb.com` + esa clave |

**Con OpenPosterDB no hace falta registrarse ni pagar nada.** Su clave pública gratuita es
`t0-free-rpdb` y sirve las tres clases de imagen. Para dejarlo funcionando:

| Ajuste | Valor |
| --- | --- |
| **Servidor de imágenes** | `https://openposterdb.com` |
| **Clave del servidor** | `t0-free-rpdb` |

Y ya está: póster, fondo y fotogramas con nota, gratis. Los dos servicios usan exactamente las mismas
direcciones, así que cambiar de uno a otro es rellenar esos dos campos. OpenPosterDB agrega notas de
nueve fuentes: IMDb, Rotten Tomatoes (crítica y audiencia), Metacritic, Trakt, Letterboxd, MyAnimeList,
Roger Ebert y MDBList.

Los tamaños que sirve son los correctos para Kino: póster de 580×870, **fondo de 1920×1081** (exacto
para una tele 1080p) y fotograma de 780×439.

También puedes montar OpenPosterDB **en tu casa** con Docker
([instrucciones](https://github.com/PNRxA/openposterdb)) y pegar ahí la dirección de tu equipo: Kino
admite imágenes de un servidor que escribas tú en los ajustes, incluso en la red local y por `http`.

Si usas RatingPosterDB, tu clave es personal y va dentro de la dirección de cada imagen. Si te equivocas
al escribirla, el plugin lo detecta y **vuelve a las imágenes de TMDB** en vez de dejarte cientos de
imágenes rotas.

## Lo que este plugin NO hace

- **No cambia las imágenes de tus otras fuentes.** Aporta su propio catálogo. Los títulos de otro plugin
  siguen con su arte (eso sí: si un título ajeno no trae póster ninguno, este plugin se lo rellena).
- **No reproduce.** Sus títulos van a "Buscar dónde verlo", en tus otras fuentes.
- **No pone logos.** Kino no tiene ese campo para un título.
- **No trae la clave.** Es tuya.
- **No añade canales en vivo.**

## Si algo no va

| Lo que ves | Qué hacer |
| --- | --- |
| *Este plugin necesita una versión más nueva de Kino* | Tu Kino es anterior a la 0.9.50. Actualízalo. |
| Los pósters salen sin nota | Falta la clave, o el tipo de póster no incluye nota: revisa **Configurar**. |
| **En el televisor** las tarjetas salen vacías | Desinstala y vuelve a instalar: al cambiar los ajustes entre versiones, Kino puede conservar valores viejos. Con el plugin limpio, el fondo se comprueba solo. |
| No aparecen las filas en Inicio | Ajustes ▸ Plugins ▸ **Actualizar**. Si siguen sin salir, activa **Modo debug** en la pestaña del plugin y revisa el **Registro**: ahí dice qué imágenes usa y cuáles no. |
| Un póster sale en blanco o no es el de ese título | TMDB usa listas de ids distintas para películas y series, y pueden coincidir en el mismo número. El plugin ya le dice a RPDB de cuál de las dos se trata. Si vieras alguno mal, avísale a quien mantiene el plugin. |
| El plugin desaparece de la lista | Tienes que haberlo desactivado o desinstalado; vuelve a agregarlo con la dirección de arriba. |

## Créditos

Sin afiliación con RatingPosterDB, OpenPosterDB, TMDB ni Kino.

- Las fichas, las sinopsis y las imágenes que el servidor no sirva son de **TMDB**, a través de Kino.
- Las imágenes con nota son de **RPDB** o de **OpenPosterDB**, con tu clave.
- La app es **Kino**.

Respeta los términos de cada servicio y no compartas tu clave con nadie.
