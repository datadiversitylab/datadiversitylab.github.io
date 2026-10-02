---
layout: blog-post.html
title: Haz el mapa de tu barrio con BarrioMap
date: 2026-10-02
author: Cristian Román
description: >
  No necesitas ser cartógrafx. No tienes que instalar nada. Solo necesitas un
  navegador y un lugar que te interese.
image: /assets/images/blog/screenshot-2026-10-01-at-10.23.25 pm.png
tags:
  - blog
  - Español
  - Tutorial
---
BarrioMap es una herramienta gratuita y de código abierto que convierte los datos de OpenStreetMap en un mapa real, imprimible, del tipo que puedes tener en la mano, marcar con un lapicero y llevar a una reunión. Acá te contamos cómo funciona.

- - -

## Paso 1: Ábrelo

Entra a [datadiversitylab.github.io/barriomap](https://datadiversitylab.github.io/barriomap).

El mapa abre de una vez, centrado en Tucson, AZ. Vas a ver una barra lateral a la izquierda y el mapa interactivo a la derecha. ¿Ese rectángulo verde punteado en el mapa? Eso es lo que va a quedar en tu PDF. Todo lo que esté adentro es lo que se va a imprimir.

![Pantalla de inicio en BarrioMap](/assets/images/blog/screenshot-2026-10-01-at-10.15.53 pm.png "Pantalla de inicio en BarrioMap")

- - -

## Paso 2: Ponle nombre a tu mapa

Al principio de la barra lateral hay una sección que dice **Map Info**. Escríbele un nombre. Algo como "Nuestro barrio" o "El parque del colegio." Ese nombre aparece en la portada del PDF, así sabes de qué mapa se trata cuando lo abras después. La descripción es opcional.



- - -

## Paso 3: Encuentra tu lugar

En la sección **Location**, escribe un barrio, una calle o una ciudad en el buscador. Dale Enter o haz clic en la lupa. El mapa se mueve solo. 

Si sabes las coordenadas, también las puedes escribir directamente. Y si ya encontraste el lugar exacto y no quieres que el mapa se mueva mientras ajustas otras cosas, marca la casilla **Lock frame to current view**.
Eso lo congela donde está.



- - -

## Paso 4: Escoge el tamaño y la escala

En la sección **Page & Scale**, selecciona el tamaño de hoja. A4 sirve para la mayoría de impresoras caseras. A3 te da más espacio si tienes acceso a una impresora más grande.

Luego escoge una escala. La escala controla cuánto terreno te cabe en la hoja.

* **1:5.840** muestra una vista general del barrio. En una hoja A4 te cabe aproximadamente una milla de área.
* **1:600** es un plano de sitio. Ideal para una cuadra o un colegio.
* **1:384** es un detalle de diseño. Para un edificio específico o una esquina.

El rectángulo verde en el mapa se actualiza cada vez que cambias la escala, así puedes ver exactamente qué área estás cubriendo.



- - -

## Paso 5: Escoge las capas

En **Map Layers**, marca las casillas de lo que quieres ver en tu mapa. Las vías y edificios vienen activados por defecto. También puedes agregar parques, cuerpos de agua, paradas de transporte, colegios, centros de salud, y más.

En **Print Settings**, puedes cambiar el color de cada capa. Haz clic en la casilla de color al lado de la capa y escribe un código hex, o entra a [g.co/colorpicker](https://g.co/colorpicker) para escoger uno visualmente.



- - -

## Paso 6: Agrega tus propios datos (opcional)

En la sección **Your Data**, puedes dibujar directamente sobre el mapa. Usa la barra de herramientas que aparece en el mapa. Vas a ver íconos para dibujar un polígono, un rectángulo o un punto. Haz clic sobre lo que dibujaste para agregarle una etiqueta.

También puedes subir datos:

* Un **archivo CSV** con columnas de latitud y longitud para puntos (¿dónde están los huecos en la vía? ¿dónde se inunda cuando llueve?)
* Un **shapefile** comprimido en ZIP para polígonos
* Un **GeoTIFF** para imágenes raster como datos satelitales

Todo lo que agregues puede imprimirse en tu PDF. Marca o desmarca las casillas en Print Settings para incluir o excluir cada tipo.

![Nuevo marcador](/assets/images/blog/screenshot-2026-10-01-at-10.23.25 pm.png "Nuevo marcador")

- - -

## Paso 7: Genera tu mapa

Cuando estés list@, haz clic en **Generate map**. La aplicación empieza a construir tu PDF en el servidor. Vas a ver una barra de progreso.

Esto tarda un momento, especialmente la primera vez. Eso es porque la aplicación está descargando datos frescos de OpenStreetMap justo para tu área. Después de esa primera vez, los datos quedan guardados y los
siguientes mapas de la misma región salen (potencialmente) más rápido.

![Generando mapa](/assets/images/blog/screenshot-2026-10-01-at-10.24.25 pm.png "Generando mapa")

- - -

## Paso 8: Descarga

Cuando el mapa esté listo, aparece un botón de **Download** debajo del botón de generar. Hazle clic para guardar tu archivo.

Si no agregaste datos propios, recibes un PDF. Si dibujaste o subiste datos, recibes un ZIP con el PDF y archivos GeoJSON de tus datos. Esos GeoJSON los puedes abrir en QGIS, ArcGIS o cualquier herramienta GIS.

También aparece una ventana con un código de seis caracteres. Ese es tu **código de mapa**. Guárdalo. Puedes escribirlo en la sección Map Code en cualquier momento durante los próximos 30 días para recuperar tu mapa exacto, con todos los ajustes y colores tal como los dejaste. También aparece impreso en la portada de tu PDF.



- - -

## Lo que obtienes al final

Un mapa vectorial, no una captura de pantalla. Lo puedes abrir en Adobe Illustrator, Inkscape o cualquier visor de PDF. Lo puedes imprimir a cualquier tamaño sin perder calidad. Lo puedes llevar a una reunión, pegarlo en una pared, marcarlo con un lapicero y fotografiarlo para volver a un flujo de trabajo digital. Es un mapa que parece salido de una oficina de planeación.



- - -

## Preguntas frecuentes

**¿Por qué es lento la primera vez?** La aplicación descarga datos de OpenStreetMap para tu región. Después de una primera exportación, los datos quedan en caché y los siguientes mapas salen mucho más rápido.

**¿Puedo compartir mi mapa con alguien?** Sí, solo pásale tu código de mapa. Si antes de generar marcaste la casilla "Share to community gallery", tu mapa también aparece en la página Community para que otras personas le encuentren.

**¿Funciona en el celular?** Sí. La interfaz se adapta a pantallas pequeñas. Generar un PDF desde el celular es un poco lento, pero debe funcionar.

**¿Qué tan precisos son los datos?** El mapa viene de OpenStreetMap, una base de datos geográfica mantenida por una comunidad global de contribuidores. En la mayoría de ciudades es muy precisa. En algunas áreas rurales puede estar bastante incompleta.

- - -

BarrioMap es gratuito. El código es abierto en [github.com/datadiversitylab/BarrioMap](https://github.com/datadiversitylab/BarrioMap). No guardo ninguno de tus datos. Si algo no funciona, o si tienes una idea para mejorarlo, abre un issue o escríbeme.
