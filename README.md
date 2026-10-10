# Catálogo con notas

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

Hay **cinco ajustes**:

| Ajuste | Qué hace |
| --- | --- |
| **Servidor de imágenes** | Déjalo **vacío** para RatingPosterDB, o pega `https://openposterdb.com` para el servicio gratuito. |
| **Clave del servidor** | Tu clave de ese servidor. **Opcional**: sin ella el catálogo usa las imágenes de TMDB. |
| **Tipo de póster** | `poster-default`, o el tipo con nota que incluya tu plan (por ejemplo `poster-imdb-rated`). |
| **En la tele: qué notas** | `Solo IMDb (estricto)`, `IMDb y TMDB si no hay`, o `Automático (varias notas)`. |
| **En la tele: tamaño** | `Grandes` (recomendado), `Muy grandes (imagen 4K)` o `Medianas`. |

### Por qué esos dos son solo para la tele

Los ajustes de un plugin viajan con tu cuenta, así que lo que elijas para el televisor **también lo
vería el celular** — y no quieres lo mismo en los dos: en la tele las tarjetas son horizontales y el
fondo se encoge a unos 470 píxeles, mientras que en el celular el póster se ve grande y las tarjetas son
estrechas. Por eso el plugin **mira en qué aparato está** y solo aplica estos dos ajustes en la tele. En
el celular deja la vista de siempre, con varias notas.

Y en la tele, dos razones para subir el tamaño y bajar el número de notas:

| | Qué se veía |
| --- | --- |
| Por defecto | **5-6 notas diminutas**, ilegibles a tamaño de tarjeta |
| **Una sola nota, más grande** | **legible** |

Medido de verdad: se descargó el mismo fondo con cada tamaño de nota, se redujo a ancho real de tarjeta y
se comparó.

### Sobre "Solo IMDb"

Hay un detalle que conviene saber, porque no es culpa del plugin. El servidor recorre sus fuentes en
orden y **cae a la siguiente cuando la primera no tiene dato**, así que pedir "solo IMDb" por orden no
basta: hay que **excluir** las demás fuentes. Eso es lo que hace **Solo IMDb (estricto)**.

La consecuencia, con datos reales de *Linternas* (la serie que probaste):

| Capítulo | IMDb | Con "Solo IMDb (estricto)" |
| --- | --- | --- |
| S1E1 | tiene nota | muestra la nota |
| S1E2 a S1E6 | **no tiene nota** | **se quedan sin ninguna nota** |

O sea: en esa serie, cinco de seis capítulos se quedan sin nota. Es exactamente lo que significa "solo
IMDb". Si prefieres que **siempre haya una nota** aunque a veces sea de TMDB, pon:

- **IMDb y TMDB si no hay** — una nota siempre, IMDb cuando existe.
- **Automático (varias notas)** — lo que decida el servidor, como al principio.

**Los dos ajustes solo se aplican con un servidor propio** (OpenPosterDB). Con RatingPosterDB la
dirección se queda exactamente como está y no se le manda ningún parámetro que no conozca: es una
precaución deliberada, porque un parámetro rechazado dejaría todas las imágenes rotas.

### Si el fondo se ve suave

El fondo que sirve OpenPosterDB es de **1920×1081**: perfecto para una tele 1080p y para las tarjetas. Si
tu televisor es **4K** y lo notas blando a pantalla completa, pon **En la tele: tamaño ▸ Muy grandes**:
además de notas mayores, pide la imagen a 3840×2160. Ojo, esas imágenes pesan **1,25 MB** cada una en vez
de 172 KB, así que solo vale la pena si de verdad tienes 4K.

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
