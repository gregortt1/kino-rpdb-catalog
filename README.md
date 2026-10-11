# Catálogo con notas

Un catálogo de películas y series para **Kino** cuyas imágenes llevan la **nota incrustada** (IMDb,
Rotten Tomatoes, Metacritic, Trakt, Letterboxd…), gracias a
[RatingPosterDB](https://ratingposterdb.com/) o a [OpenPosterDB](https://openposterdb.com).

![Ícono](icon.png)

## Qué añade a Kino

- **Su propia sección**: en la tele, una entrada en el menú lateral; en el celular, un chip arriba en
  Inicio. Con **seis pestañas**: *Películas*, *Series*, *Tendencias de hoy*, *Populares*, *Mejor valoradas*
  y *Géneros*, cada una con sus filas y un destacado.
- **Mosaicos en Categorías**: doce géneros (Acción, Comedia, Drama, Terror, Ciencia ficción, Animación,
  Documentales…) que se abren como una lista paginada, con el arte de cada mosaico también con nota.
- **Anime de verdad**: la fila de Anime pide animación **con idioma original japonés**, no cualquier
  dibujo animado — sin ese filtro entrarían también los dibujos occidentales.
- **Filas en Inicio**: **Anime**, **Documentales**, **Infantil** y **Doramas**, más películas y series en
  tendencia, mejor valoradas, en cines, al aire y próximos estrenos, **sin repetir títulos entre filas**
  (las listas de TMDB se solapan, y el mismo título salía varias veces en el mismo Inicio).
- **Búsqueda propia**: busca en todo el catálogo de TMDB, con "Ver más" para seguir mirando.
- **Fichas completas**: sinopsis, nota, año, temporadas y capítulos.
- **Imágenes con nota**: el póster, el fondo y los fotogramas de capítulo.
- **Sus categorías en el Inicio**: sus títulos aparecen en las filas de categoría de Kino —**Anime**,
  **Documentales**, **Infantil**, **Doramas** y todas las de género (Acción, Comedia, Drama, Terror,
  Suspenso…)—, junto a los de tus otras fuentes.

### El Home por categorías

Kino tiene un **Home por categorías** (se activa en *Ajustes ▸ App*): en vez de pestañas por tipo, es una
sola lista con **una fila por categoría** —Acción, Comedia, Drama, Terror, Anime, Infantil…— y una tarjeta
por título. Se arma **solo con lo que las filas del Inicio dejaron guardado**, así que lo que el plugin
declare decide dónde cae cada cosa.

Este plugin lo aprovecha al máximo:

| Qué | Cómo |
| --- | --- |
| **Las filas de género se llenan** | Cada título lleva sus **géneros** (`Acción`, `Ciencia ficción`, `Drama`…), traducidos de TMDB a los nombres que Kino entiende. Sin esto, un título solo caería en la fila genérica «Películas» y **nunca** en Acción o Comedia. |
| **Las categorías temáticas** | Las filas de **Anime**, **Documentales**, **Infantil** y **Doramas** van marcadas como tales, así que sus títulos aparecen en esas filas **completas** (con género o sin él). |
| **Una tarjeta por título** | Cada ítem lleva su **id de TMDB** y su **año**, que es lo que Kino usa para juntar el mismo título cuando lo tienen varias fuentes y mostrar una sola tarjeta. |

**Por qué las filas temáticas van primero.** Kino decide el tipo de un título (anime, infantil,
documentales, doramas…) por **la primera fila en que aparece**. Si *Tendencias* fuera antes que *Anime*, un
anime que también es tendencia se quedaría como película y no llegaría nunca a la fila Anime. Por eso el
plugin pone Anime, Documentales, Infantil y Doramas al principio: en el Home por categorías el orden de las
filas lo pone Kino, así que no se pierde nada.

> **Un aviso honesto.** Hasta hace poco el `genre` de una fila solo aceptaba **diez** categorías
> (`peliculas`, `series`, `anime`, `infantil`, `documentales`, `deportes`, `noticias`, `musica`,
> `entretenimiento`, `otros`), y **`Doramas` es nueva**: en un Kino anterior a esa versión, esa fila
> simplemente no se agrupa (no se rompe nada). Las de género, en cambio, funcionan siempre, porque van por
> los `genres` de cada título y ahí el vocabulario es mucho más amplio: Acción, Aventura, Animación,
> Ciencia ficción, Comedia, Crimen, Drama, Familia, Fantasía, Historia, Misterio, Musical, Romance,
> Suspenso, Terror, Bélica, Western, Reality, Biografía, Deportivo…

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

La configuración está en **cuatro bloques**, y **ya viene puesta para funcionar**: no tienes que escribir
nada.

> **¿Por qué bloques y no pestañas?** Porque Kino no las admite: los tipos de ajuste que acepta son
> campos, interruptores, listas, encabezados (`section`), líneas de estado y botones — y **no hay un tipo
> de pestañas**. El encabezado es la única forma de agrupar, así que se usa a fondo: los cuatro bloques
> son lo más cerca que se puede estar de unas pestañas.

**Servidor** — de dónde salen las imágenes:

| Ajuste | Qué hace |
| --- | --- |
| **Servidor de imágenes** | Una lista con dos: **OpenPosterDB (gratis)** y **RatingPosterDB**. Nada de escribir direcciones. |
| **Clave del servidor** | Viene puesta `t0-free-rpdb`, la clave pública gratuita de OpenPosterDB. Cámbiala si usas otro servidor o sacas la tuya. |

**Póster (solo en la tele)** — el póster es **vertical**, y por eso tiene sus propios ajustes:

| Ajuste | Qué hace |
| --- | --- |
| **Qué notas** | `Solo IMDb (estricto)`, `IMDb y Rotten Tomatoes`, `IMDb, RT y Metacritic` (por defecto), `IMDb y si no hay, TMDB` o `Automático (hasta 3)`. |
| **Tamaño de la nota** | `Grandes` (recomendado), `Muy grandes` o `Medianas`. Con tres notas se encoge solo, para que quepan en una fila. |
| **Tipo de póster** | `poster-default`, o el tipo con nota que incluya tu plan (por ejemplo `poster-imdb-rated`). |

**Fondo y capítulos (solo en la tele)** — son **apaisados**, y aguantan más que un póster:

| Ajuste | Qué hace |
| --- | --- |
| **Qué notas** | Las mismas opciones, y **pueden ser distintas de las del póster**. Incluye `Todas las que haya (hasta 8)`. |
| **Tamaño de la nota** | `Grandes` (recomendado), `Muy grandes (imagen 4K, pesada)` o `Medianas`. |
| **Dónde va la nota** | Nueve sitios: centrada abajo o arriba, a un lado, o en una esquina. |

**Diagnóstico** — una línea con **qué está funcionando** y un botón **"Probar el servidor"**.

### Todas las notas en el fondo

El fondo es apaisado y **aguanta muchas más notas que un póster**: medido contra el servicio, caben
**ocho en una sola fila** sin solaparse (a partir de ahí el servidor no da más). Por eso la opción
`Todas las que haya (hasta 8)` **solo está en el bloque del fondo**: en un póster vertical ocho notas se
envuelven y acaban tapando el título.

Y el póster tiene la opción que faltaba: **`Póster sin el título`**. Quita el texto del arte, y como las
notas van justo abajo, **dejan de pelearse con el título impreso**. Viene **apagado**, porque cambia el
arte de todos los pósters (y a veces el servidor tiene una versión sin texto que es otra imagen, no la
misma sin letras). Pruébalo: es la diferencia entre tres notas encima de "GAME OF THRONES" y las mismas
tres sobre el arte limpio.

### Por qué el póster y el fondo van por separado

Porque **no tienen la misma forma**. El póster es vertical y estrecho: tres notas grandes no caben y el
servidor las parte en dos líneas, justo encima del título. El fondo es apaisado y las aguanta de sobra.
Con un solo ajuste para los dos, elegir para el póster significaba elegir también para el fondo — y no
tiene por qué ser lo mismo.

Los **capítulos de episodio** van con el grupo del fondo, porque también son apaisados. Su posición, eso
sí, es fija: arriba a la derecha.

Y nada de esto toca el **celular**: en el celular el plugin no manda ningún ajuste y se ve tal como lo
sirve el servidor. Es lo que pediste, y sigue igual.

### Dónde va la nota

Cada imagen tiene su sitio, y **no se mezclan**:

| Imagen | Dónde va la nota | ¿Se elige? |
| --- | --- | --- |
| **Póster** (vertical) | Abajo, centrada | No, fija |
| **Fotograma** de capítulo | Arriba a la derecha | No, fija |
| **Fondo** (las tarjetas de la tele) | Donde tú digas | **Sí** |

Tiene sentido que solo el fondo se elija: es el único que Kino recorta a lo ancho en una tele, y el póster
y el fotograma ya tienen su encuadre natural. Antes un solo ajuste movía las tres cosas a la vez, que no
es lo que quiere nadie.

### Cuántas notas, y que quepan en una fila

El póster es **vertical y estrecho**, así que las notas no caben de cualquier manera. Medido contra el
servicio real, a ancho de póster:

| | **1 nota** | **2 notas** | **3 notas** |
| --- | --- | --- | --- |
| **tamaño muy grande** | una fila | una fila | **se parte en dos** |
| **tamaño grande** | una fila | una fila | **se parte en dos** |
| **tamaño mediano** | una fila | una fila | **una fila** |

Cuando se parten en dos, la segunda línea cae **encima del título del póster**, y eso es exactamente lo
que se veía mal. Por eso el plugin **baja el tamaño a mediano cuando son tres notas**: es el único en el
que las tres caben en una fila. Con una o dos notas se respeta el tamaño que hayas elegido.

En el **fondo** no hace falta: es ancho, y las tres caben en una fila en tamaño grande. Por eso los dos
tienen su propio ajuste de tamaño y de notas.

### Qué notas salen

En *Qué notas*, dentro de cada bloque (**Póster** y **Fondo y capítulos**), eliges **cuáles** y, de paso,
**cuántas**:

| Opción | Notas | Cuántas |
| --- | --- | --- |
| `Solo IMDb (estricto)` | IMDb | 1 |
| `IMDb y Rotten Tomatoes` | IMDb, RT | 2 |
| `IMDb, RT y Metacritic` | IMDb, RT, MC | 3 |
| `IMDb y si no hay, TMDB` | IMDb o TMDB | 1 |
| `Automático (hasta 3)` | Las que tenga el servidor | hasta 3 |

Merece la pena saber por qué existe esta lista. El servidor tiene su **propio orden de prioridad**, que
empieza por **MyAnimeList y Letterboxd**: en "automático" una película normal sale con IMDb, Letterboxd y
Rotten Tomatoes — con la nota de Letterboxd sobre 5, que no pega con las demás. Eligiendo la opción, las
notas son las que tú quieres y ninguna más.

### El diagnóstico: por qué no se ven las notas

Al final de la configuración hay una línea que te lo dice sin rodeos, y se actualiza sola cada vez que
abres esa pantalla:

> `clave ✓ · fondos con nota ✓ · fotogramas ✓ · ajuste de notas ✓`

Si algo falla, lo dice con sus palabras: *"El servidor rechazó la clave: revisa que sea la de ese
servidor"*, *"fondos: los pone TMDB"*, *"ajuste de notas: no lo acepta"*… Y si no has puesto clave:
*"Sin clave: se usan las imágenes de TMDB"*.

El botón **"Probar el servidor"** hace la misma comprobación **de cero**, en el momento, y te responde
con el resultado. Sirve justo después de cambiar la clave o el servidor, para no tener que adivinar si
quedó bien. Las dos cosas usan **las mismas comprobaciones que usan las imágenes**, así que lo que dicen
es lo que de verdad va a pasar.

Instalas, y ya está: póster, fondo y fotogramas con nota, gratis, sin registrarte en ningún sitio y sin
tocar la configuración. Los dos servidores que ofrece la lista van declarados en el plugin, así que Kino
los muestra en la hoja de consentimiento y los apruebas una vez al instalar.

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
| **En la lista de ajustes** | `RatingPosterDB` | `OpenPosterDB (gratis)` — **viene elegido** |

**El plugin ya viene configurado con el gratis**: el servidor elegido es OpenPosterDB y la clave pública
`t0-free-rpdb` viene puesta. Instalas y funciona, sin registrarte y sin escribir nada.

**Con OpenPosterDB no hace falta registrarse ni pagar nada.** Su clave pública gratuita sirve las tres
clases de imagen. Si algún día quieres la tuya propia (porque la pública va compartida y puede ir más
lenta), la sacas en su web y cambias solo el campo de la clave.

**Si prefieres RatingPosterDB**: elige `RatingPosterDB` en la lista y pega tu clave personal. Los dos
servidores usan exactamente las mismas direcciones, así que cambiar de uno a otro son dos toques.

OpenPosterDB agrega notas de nueve fuentes: IMDb, Rotten Tomatoes (crítica y audiencia), Metacritic,
Trakt, Letterboxd, MyAnimeList, Roger Ebert y MDBList. Y los tamaños que sirve son los correctos para
Kino: póster de 580×870, **fondo de 1920×1081** (exacto para una tele 1080p) y fotograma de 780×439.

Si te equivocas al escribir una clave, el plugin lo detecta y **vuelve a las imágenes de TMDB** en vez de
dejarte cientos de imágenes rotas.

> **¿Y si quiero montar OpenPosterDB en mi casa?** La lista solo trae los dos servidores públicos, que son
> los que van declarados en el plugin. Un servidor propio en la red de casa necesitaría un ajuste de tipo
> `url` para que Kino lo permita, y eso es justo lo que quitamos para no tener que escribir direcciones.
> Si algún día lo montas, dímelo y te lo añado.

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
