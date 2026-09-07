import { mailto, serviceAreas, site } from "../site";
import type { Copy } from "./en";

/**
 * The Spanish site. Typed as `Copy`, so it must carry every string `en.ts`
 * does. Register: "usted" throughout, Mexican-leaning vocabulary (alberca,
 * pasto sintético, andador), since that is who calls from the Valley.
 */
export const es: Copy = {
  skipToContent: "Saltar al contenido",
  description:
    "Patios de adoquín, entradas, decks de alberca, pasto sintético y vida al aire libre en Phoenix, construidos desde la base para el desierto de Arizona.",

  nav: {
    home: "Inicio",
    services: "Servicios",
    gallery: "Galería de fotos",
  },

  header: {
    primaryNav: "Principal",
    language: "Idioma",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    logo: "Marino Pavers — inicio",
  },

  home: {
    title: "Marino Pavers — Adoquín, entradas y pasto sintético en Phoenix",
    hero: {
      eyebrow: "Adoquines · Pasto sintético · Vida al aire libre",
      titleStart: "Espacios exteriores",
      titleAccent: "hechos para durar",
      titleEnd: "más que el desierto.",
      lead: "Marino Pavers diseña e instala patios, entradas para autos, decks de alberca y pasto sintético a la medida en todo el Valle, construidos desde la base para aguantar el calor de Arizona, el monzón y el paso del tiempo.",
      cta: "Ver galería de fotos",
      since: `Desde ${site.foundedYear}`,
      calloutEyebrow: "Patrón espiga",
      callout: "Entrada · Scottsdale",
    },
    stats: [
      { value: `Desde ${site.foundedYear}`, label: "Construyendo en el Valle" },
      { value: site.projectsInstalled, label: "Proyectos instalados" },
      {
        value: `${serviceAreas.length}`,
        label: "Ciudades del Valle atendidas",
      },
    ],
    services: {
      eyebrow: "Lo que construimos",
      title: "Seis formas de vivir mejor afuera.",
      lead: "Cada superficie diseñada para el desierto y colocada por nuestras propias cuadrillas, nunca subcontratada al postor más barato.",
    },
    process: {
      eyebrow: "Cómo funciona",
      title: "Del primer recorrido a la garantía.",
      lead: "Cinco pasos, una cuadrilla, sin misterios. Siempre sabrá qué está pasando en su patio y qué sigue.",
    },
    featured: {
      eyebrow: "Trabajos recientes",
      title: "Construido en todo el Valle.",
      lead: "Algunos patios, entradas y decks de alberca que terminamos hace poco.",
      link: "Ver galería de fotos",
    },
    testimonials: {
      eyebrow: "Desde el Valle",
      title: "Propietarios que dejaron de posponerlo.",
    },
    area: {
      eyebrow: "Dónde trabajamos",
      title: "Construyendo en toda el área de Phoenix.",
      lead: "Desde Cave Creek hasta Queen Creek, cubrimos el Valle. ¿No ve su ciudad? Pregunte: viajamos por el proyecto adecuado.",
    },
  },

  servicesPage: {
    title:
      "Servicios — Adoquín, entradas, pasto sintético y más | Marino Pavers",
    description:
      "Patios de adoquín, entradas, decks de alberca, pasto sintético, andadores y vida al aire libre en el área de Phoenix. Una cuadrilla, base bien hecha, garantía.",
    hero: {
      eyebrow: "Servicios",
      title: "Todo lo que convierte un terreno vacío en un destino.",
      lead: "Seis especialidades, una cuadrilla. Ya sea un solo andador o un patio trasero completo, el trabajo de base y el detalle del acabado son los mismos: bien hechos.",
    },
    seeBuilt: "Ver proyectos de {service} →",
    faq: {
      eyebrow: "Buenas preguntas",
      title: "Respuestas antes de que pregunte.",
      lead: "Lo que los propietarios del Valle quieren saber antes de decidirse.",
    },
  },

  galleryPage: {
    title: "Galería — Adoquín y pasto sintético en Phoenix | Marino Pavers",
    description:
      "Fotos de patios de adoquín, entradas, decks de alberca, pasto sintético y vida al aire libre que Marino Pavers ha instalado en el área de Phoenix.",
    hero: {
      eyebrow: "Galería de fotos",
      title: "Colocado en todo el Valle, un patio a la vez.",
      lead: "Patios, entradas, decks de alberca y pasto sintético, de Cave Creek a Queen Creek. Filtre por lo que tiene en mente.",
    },
    cta: {
      eyebrow: "Su patio es el siguiente",
      title: "¿Vio algo que quiere en su propio patio?",
      lead: "Envíenos una foto de su espacio y una nota de lo que busca. Le responderemos con ideas y una cotización honesta.",
    },
  },

  gallery: {
    filterLabel: "Filtrar proyectos por categoría",
    all: "Todos",
    categories: {
      patios: "Patios",
      driveways: "Entradas",
      "pool-decks": "Decks de alberca",
      turf: "Pasto sintético",
      walkways: "Andadores",
      "outdoor-living": "Vida al aire libre",
    },
    empty: "Las fotos de proyectos vienen en camino.",
    showing:
      "Mostrando {shown} de {total} proyectos recientes. ¿Quiere ver algo en específico: una línea de adoquín, un patrón, un patio completo? Pregunte y le enviamos fotos de trabajos como el suyo.",
    close: "Cerrar",
    previous: "Foto anterior",
    next: "Foto siguiente",
    project: "Proyecto de {category}",
    viewLarger: "Ver más grande: {alt}",
  },

  cta: {
    eyebrow: "Contáctenos",
    title: "Construyamos algo que de verdad use afuera.",
    lead: "Cuéntenos de su espacio y lo recorremos con usted, llevamos muestras y le dejamos una cotización honesta y detallada, sin presión.",
    call: "Llamar ahora",
    preferTalk: "¿Prefiere hablar?",
    serving: "Servimos en {region}.",
    preferWrite: "¿Prefiere escribir?",
  },

  contact: {
    region: "Área metropolitana de Phoenix, Arizona",
    emailHref: mailto(
      "Consulta de proyecto",
      "Nombre:\nTeléfono:\nCiudad:\n\nLo que tengo en mente:\n",
    ),
    emailNotePhone:
      "Incluya su número de teléfono para poder devolverle la llamada.",
    emailNoteReplies:
      "Valeria, nuestra administradora de oficina, se comunicará con usted, normalmente el mismo día, aunque le pedimos un día hábil. Su respuesta llega desde su cuenta personal de @icloud.com y no desde este buzón, así que revise su carpeta de spam si no la ve.",
  },

  notFound: {
    title: "Página no encontrada — Marino Pavers",
    description: "Esa página se la llevó la lluvia.",
    eyebrow: "Error 404",
    titleStart: "Este camino no lleva",
    titleAccent: "a ningún lado.",
    lead: "Parece que este se lo llevó la lluvia. Los demás caminos del sitio están en tierra firme: regrese y elija uno.",
    back: "Volver al inicio",
    pages: "Páginas del sitio",
  },

  footer: {
    blurb:
      "Patios de adoquín, entradas para autos, decks de alberca, pasto sintético y vida al aire libre a la medida, construidos desde la base para el desierto de Arizona.",
    services: "Servicios",
    explore: "Explorar",
    contact: "Contacto",
    instagram: "Marino Pavers en Instagram",
    facebook: "Marino Pavers en Facebook",
    serving: "Servimos en {areas} y {last}.",
    rights: "Todos los derechos reservados.",
  },
};
