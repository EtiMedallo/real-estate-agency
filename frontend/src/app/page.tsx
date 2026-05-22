"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic import to prevent SSR compilation errors in Next.js
const ReelPlayer = dynamic(() => import("../components/ReelPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[9/16] max-w-[360px] mx-auto bg-[#080808] border border-[#1a1a1a] rounded-xl flex items-center justify-center font-mono text-xs text-neutral-500">
      Cargando reproductor...
    </div>
  ),
});

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  progress: number;
  completed: boolean;
}

interface GeneratedContent {
  meta_ads?: {
    headline: string;
    primary_text: string;
    description: string;
    cta: string;
    angle: string;
  };
  reels?: {
    concept: string;
    hook: {
      visual: string;
      verbal: string;
      overlay: string;
    };
    scenes: {
      time: string;
      visual: string;
      audio: string;
      text: string;
    }[];
  };
  captions?: {
    hook: string;
    body: string;
    cta: string;
  };
  hooks?: {
    option1: string;
    option2: string;
    option3: string;
  };
  storyboard?: any;
}

export default function Home() {
  // Form State
  const [projectName, setProjectName] = useState("");
  const [price, setPrice] = useState("");
  const [sqm, setSqm] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  
  // Amenities List
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration State
  const [selectedTone, setSelectedTone] = useState("luxury_minimal");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "meta_ads",
    "reels",
    "captions",
    "hooks"
  ]);

  // UI Engine State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedContent>({});
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // Loading Steps for visual premium effect
  const loadingSteps = [
    "Analyzing property architectural details...",
    "Injecting SHADOWPR0's Beautiful Prose specifications...",
    "Blending Corey Haines' direct-response templates...",
    "Compiling tone-specific brand voice rules...",
    "Synthesizing premium copy & storyboard JSON..."
  ];

  // Tone definitions for UI display
  const toneOptions = [
    { id: "luxury_minimal", name: "Luxury Minimal", desc: "Severe, concrete, visual silence" },
    { id: "luxury_emotional", name: "Luxury Emotional", desc: "Sanctuary, tactile, warm, light" },
    { id: "investment_focused", name: "Investment Focused", desc: "Yields, IRR, CAP rate, defensiveness" },
    { id: "airbnb_high_cashflow", name: "Airbnb / High Cashflow", desc: "Instant flow, tourist occupancies" },
    { id: "family_oriented", name: "Family Oriented", desc: "Heritage, safety, community" },
    { id: "modern_architecture", name: "Modern Architecture", desc: "Volumetrics, geometry, structure" }
  ];

  // Add Amenity
  const handleAddAmenity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = amenitiesText.trim().replace(/,$/, "");
      if (val && !amenities.includes(val)) {
        setAmenities([...amenities, val]);
        setAmenitiesText("");
      }
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  // Drag and Drop Upload logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 0,
      completed: false
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        setUploadedFiles((prev) =>
          prev.map((pf) =>
            pf.name === file.name
              ? { ...pf, progress: currentProgress, completed: currentProgress >= 100 }
              : pf
          )
        );
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    });
  };

  const removeFile = (name: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.name !== name));
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Generate Mock Results according to Selected Tone and Form Inputs
  const generateMockContent = (tone: string): GeneratedContent => {
    const nameStr = projectName || "Casa del Bosque";
    const locStr = location || "Las Colinas, Santa Catarina";
    const priceStr = price ? `$${parseFloat(price.replace(/[^\d.]/g, "")).toLocaleString()}` : "$1,850,000";
    const sqmStr = sqm ? `${sqm} m²` : "450 m²";
    const amList = amenities.length > 0 ? amenities.join(", ") : "piscina infinita, muros portantes de hormigón, pinar natural";

    // Unsplash assets pools to render in Remotion player
    const isLoft = nameStr.toLowerCase().includes("loft") || nameStr.toLowerCase().includes("industrial");
    const images = isLoft
      ? [
          "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1200", // Loft facade
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200", // Large windows
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200"  // Mezzanine bedroom
        ]
      : [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200", // Forest facade
          "https://images.unsplash.com/photo-1507090960745-b32f65d3113a?q=80&w=1200", // Pines
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200"  // Double height concrete interior
        ];

    const contentMap: { [key: string]: GeneratedContent } = {
      luxury_minimal: {
        meta_ads: {
          angle: "Architectural Silence",
          headline: `Silencio en ${nameStr}`,
          primary_text: `Muros de hormigón visto y silencio visual absoluto. En ${locStr}, ${sqmStr} construidos frente al pinar. Sin ornamentos superfluos.`,
          description: `Valorado en ${priceStr}. Sencillez constructiva.`,
          cta: "Learn More"
        },
        reels: {
          concept: "La severidad del material expuesto frente a la naturaleza.",
          hook: {
            visual: "Plano estático de un muro de hormigón visto con la sombra de los pinos.",
            verbal: "Esto no es decoración. Es silencio absoluto.",
            overlay: "LA BELLEZA DEL VACÍO"
          },
          scenes: [
            { time: "0:00 - 0:03.5", visual: "Enfoque en geometrías puras y textura de hormigón.", audio: "Hormigón visto. Geometrías puras. Líneas limpias.", text: "HONESTIDAD MATERIAL" },
            { time: "0:03.5 - 0:10.0", visual: "Piscina infinita reflejando la copa de los pinos.", audio: "Una arquitectura de la ausencia. Sin adornos superfluos.", text: "SIN ADORNOS" },
            { time: "0:10.0 - 0:15.0", visual: "Doble altura completamente despejada, luz natural cenital.", audio: "Para quienes buscan un refugio de absoluto orden mental. Comenta SILENCIO.", text: "COMENTA SILENCIO" }
          ]
        },
        captions: {
          hook: "El ruido satura. Buscamos la ausencia.",
          body: `${nameStr}. Geometrías puras de hormigón visto y piedra volcánica. Nada sobra. Una estructura severa de ${sqmStr} que enmarca el bosque. Luz filtrada sobre madera de roble recuperado. Líneas limpias. Silencio visual absoluto. Ubicado en ${locStr}.`,
          cta: "Comenta SILENCIO y te enviamos la ficha técnica."
        },
        hooks: {
          option1: "Esto no es lujo. Es silencio visual.",
          option2: "Donde la estructura portante termina, comienza el bosque.",
          option3: "Geometría sin adornos. ¿Soportas el vacío?"
        },
        storyboard: {
          property_id: nameStr,
          tone_profile: "luxury_minimal",
          duration_seconds: 15.0,
          audio: {
            background_track: "ambient_nordic_silence.mp3",
            voiceover_prompt: "Atmósfera fría, severa, silenciosa. Voz masculina pausada."
          },
          scenes: [
            {
              id: "scene_01",
              start_time: 0.0,
              end_time: 3.5,
              asset: {
                source_type: "original_photo",
                file_path: images[0],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "SILENCIO VISUAL",
                position: "center"
              },
              voiceover_script: "Esto no es lujo. Es silencio visual."
            },
            {
              id: "scene_02",
              start_time: 3.5,
              end_time: 10.0,
              asset: {
                source_type: "original_photo",
                file_path: images[1],
                motion_effect: "ken_burns_pan"
              },
              overlay_text: {
                text: "GEOMETRÍAS PURAS",
                position: "bottom"
              },
              voiceover_script: "Estructuras severas de hormigón visto y piedra volcánica. Nada sobra."
            },
            {
              id: "scene_03",
              start_time: 10.0,
              end_time: 15.0,
              asset: {
                source_type: "original_photo",
                file_path: images[2],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "ESCRIBE SILENCIO",
                position: "center"
              },
              voiceover_script: "Para quienes buscan un refugio de absoluto orden mental. Comenta SILENCIO."
            }
          ]
        }
      },
      luxury_emotional: {
        meta_ads: {
          angle: "Sanctuary of Light",
          headline: `El Refugio en ${nameStr}`,
          primary_text: `Recupera el sentido del lugar. ${nameStr} es un santuario tallado en piedra volcánica y madera viva de roble. Piscina infinita rodeada de pinos en ${locStr}.`,
          description: `Vivir en calma absoluta. ${priceStr}.`,
          cta: "Book Now"
        },
        reels: {
          concept: "El reencuentro con los materiales naturales y el paso del tiempo.",
          hook: {
            visual: "Pies descalzos caminando lentamente sobre tablones de roble recuperado.",
            verbal: "Hay espacios donde el tiempo se detiene por completo.",
            overlay: "HABITAR EL TIEMPO"
          },
          scenes: [
            { time: "0:00 - 0:03.5", visual: "Una mano tocando la textura rugosa de la piedra volcánica.", audio: "Este no es solo un diseño premium. Es un refugio.", text: "TU REFUGIO" },
            { time: "0:03.5 - 0:10.0", visual: "Vapor subiendo de la piscina templada al atardecer.", audio: "Un santuario tallado en piedra y madera viva.", text: "CALMA ABSOLUTA" },
            { time: "0:10.0 - 0:15.0", visual: "Copas de árboles meciéndose suavemente en el crepúsculo.", audio: "Comenta REFUGIO y coordinemos un recorrido privado.", text: "COMENTA REFUGIO" }
          ]
        },
        captions: {
          hook: "Hay lugares donde el tiempo parece detenerse.",
          body: `${nameStr} es un refugio diseñado para habitar el silencio. Muros de piedra volcánica que absorben la luz dorada del atardecer. Madera que invita al tacto y despierta la memoria de los materiales vivos. Una atmósfera de absoluta paz en ${locStr}, equipada con ${amList}.`,
          cta: "Comenta REFUGIO para coordinar tu recorrido privado."
        },
        hooks: {
          option1: "Hay espacios donde el tiempo se detiene por completo.",
          option2: "Siente el crujir del roble bajo tus pies descalzos.",
          option3: "Tu santuario personal tiene muros de piedra y aroma a pino."
        },
        storyboard: {
          property_id: nameStr,
          tone_profile: "luxury_emotional",
          duration_seconds: 15.0,
          audio: {
            background_track: "ambient_nordic_silence.mp3",
            voiceover_prompt: "Cálido, evocador de sensaciones. Voz suave, poética."
          },
          scenes: [
            {
              id: "scene_01",
              start_time: 0.0,
              end_time: 3.5,
              asset: {
                source_type: "original_photo",
                file_path: images[0],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "HABITAR EL TIEMPO",
                position: "center"
              },
              voiceover_script: "Hay espacios donde el tiempo se detiene por completo."
            },
            {
              id: "scene_02",
              start_time: 3.5,
              end_time: 10.0,
              asset: {
                source_type: "original_photo",
                file_path: images[1],
                motion_effect: "ken_burns_pan"
              },
              overlay_text: {
                text: "SANTUARIO DE LUZ",
                position: "bottom"
              },
              voiceover_script: "Un refugio tallado en piedra volcánica y madera viva de roble."
            },
            {
              id: "scene_03",
              start_time: 10.0,
              end_time: 15.0,
              asset: {
                source_type: "original_photo",
                file_path: images[2],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "COMENTA REFUGIO",
                position: "center"
              },
              voiceover_script: "Comenta REFUGIO y coordinemos una experiencia sensorial privada."
            }
          ]
        }
      },
      modern_architecture: {
        meta_ads: {
          angle: "Structural Honesty",
          headline: `Geometría Portante en ${locStr}`,
          primary_text: `Una declaración constructiva sin concesiones. Estructura portante de hormigón visto y acero negro integrada en la ladera forestal de ${locStr}.`,
          description: `Distribución libre de ${sqmStr}. ${priceStr}.`,
          cta: "Learn More"
        },
        reels: {
          concept: "La estructura portante expuesta como elemento de diseño.",
          hook: {
            visual: "Plano cenital que desciende por la escalera metálica negra.",
            verbal: "Esto no es decoración. Esto es honestidad material.",
            overlay: "HONESTIDAD MATERIAL"
          },
          scenes: [
            { time: "0:00 - 0:03.5", visual: "Detalle del encofrado del hormigón visto.", audio: "Una volumetría rigurosa. La estructura queda expuesta.", text: "VOLUMETRÍA PURA" },
            { time: "0:03.5 - 0:10.0", visual: "La luz cenital ingresando por una claraboya.", audio: "Planta libre y transición de planos perfecta.", text: "PLANTA LIBRE" },
            { time: "0:10.0 - 0:15.0", visual: "Plano de los planos constructivos de la casa.", audio: "Escribe BREGMA y te enviamos los planos constructivos.", text: "ESCRIBE BREGMA" }
          ]
        },
        captions: {
          hook: "Una declaración constructiva sin concesiones.",
          body: `${nameStr} destaca por su honestidad material en ${locStr}. La estructura portante de hormigón visto y acero negro se expone con orgullo, definiendo una volumetría audaz que se incrusta en la ladera forestal. La planta libre elimina toda barrera, permitiendo que la transición de planos entre el interior y la terraza sea imperceptible.`,
          cta: "Escribe BREGMA y te enviamos los planos de distribución."
        },
        hooks: {
          option1: "Arquitectura para quienes entienden el espacio como una disciplina de precisión física.",
          option2: "Transición de planos: cómo conectar el hormigón visto con el bosque.",
          option3: "La honestidad del acero y el hormigón expuestos sin concesiones decorativas."
        },
        storyboard: {
          property_id: nameStr,
          tone_profile: "modern_architecture",
          duration_seconds: 15.0,
          audio: {
            background_track: "ambient_nordic_silence.mp3",
            voiceover_prompt: "Preciso, físico, enfocado en materiales. Voz analítica."
          },
          scenes: [
            {
              id: "scene_01",
              start_time: 0.0,
              end_time: 3.5,
              asset: {
                source_type: "original_photo",
                file_path: images[0],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "HONESTIDAD MATERIAL",
                position: "center"
              },
              voiceover_script: "Esto no es decoración. Esto es honestidad material."
            },
            {
              id: "scene_02",
              start_time: 3.5,
              end_time: 10.0,
              asset: {
                source_type: "original_photo",
                file_path: images[1],
                motion_effect: "ken_burns_pan"
              },
              overlay_text: {
                text: "TRANSICIÓN DE PLANOS",
                position: "bottom"
              },
              voiceover_script: "Volumetrías expuestas. Planta libre y transiciones hacia la topografía natural."
            },
            {
              id: "scene_03",
              start_time: 10.0,
              end_time: 15.0,
              asset: {
                source_type: "original_photo",
                file_path: images[2],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "ESCRIBE BREGMA",
                position: "center"
              },
              voiceover_script: "Escribe BREGMA y te enviamos los planos constructivos de la obra."
            }
          ]
        }
      },
      investment_focused: {
        meta_ads: {
          angle: "Financial Defense",
          headline: `Activo Defensivo en ${locStr}`,
          primary_text: `Preservación patrimonial a través del diseño de alta demanda. ${nameStr} ofrece plusvalía histórica sobresaliente y acabados de nulo mantenimiento.`,
          description: `Retorno optimizado. Precio: ${priceStr}.`,
          cta: "Learn More"
        },
        reels: {
          concept: "El análisis racional del valor inmobiliario frente a la inflación.",
          hook: {
            visual: "Un gráfico financiero sobre una mesa de hormigón.",
            verbal: "Los números no mienten. Esto es un activo de resguardo.",
            overlay: "ACTIVO PATRIMONIAL"
          },
          scenes: [
            { time: "0:00 - 0:03.5", visual: "Enfoque detallado en acabados de alta durabilidad.", audio: "Ubicado en la zona de mayor absorción.", text: "RETORNO SEGURO" },
            { time: "0:03.5 - 0:10.0", visual: "Paso de luz cenital que optimiza el consumo.", audio: "Costos de mantenimiento reducidos a su mínima expresión.", text: "0% MANTENIMIENTO" },
            { time: "0:10.0 - 0:15.0", visual: "Escalera flotante de acero y vista hacia la ciudad.", audio: "Escribe ANALISIS para recibir la corrida financiera.", text: "ESCRIBE ANALISIS" }
          ]
        },
        captions: {
          hook: "Preservación patrimonial a través de activos tangibles.",
          body: `El Astillero Loft representa un activo defensivo excepcional en ${locStr}. Un dúplex de ${sqmStr} diseñado bajo principios de durabilidad extrema: hormigón pulido, ladrillo y acero expuesto. Equipado con ${amList}.`,
          cta: "Escribe ANALISIS para recibir la corrida financiera completa."
        },
        hooks: {
          option1: "Por qué el hormigón y el ladrillo son los mejores escudos contra la inflación.",
          option2: "El activo inmobiliario que no requiere remodelaciones en los próximos 15 años.",
          option3: "Analicemos la corrida financiera de un duplex de ${sqmStr} en zona premium."
        },
        storyboard: {
          property_id: nameStr,
          tone_profile: "investment_focused",
          duration_seconds: 15.0,
          audio: {
            background_track: "ambient_nordic_silence.mp3",
            voiceover_prompt: "Pragmático, seguro, financiero. Voz clara e institucional."
          },
          scenes: [
            {
              id: "scene_01",
              start_time: 0.0,
              end_time: 3.5,
              asset: {
                source_type: "original_photo",
                file_path: images[0],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "ACTIVO DEFENSIVO",
                position: "center"
              },
              voiceover_script: "Preservación patrimonial a través del diseño de alta durabilidad."
            },
            {
              id: "scene_02",
              start_time: 3.5,
              end_time: 10.0,
              asset: {
                source_type: "original_photo",
                file_path: images[1],
                motion_effect: "ken_burns_pan"
              },
              overlay_text: {
                text: "PLUSVALÍA HISTÓRICA",
                position: "bottom"
              },
              voiceover_script: "Un dúplex industrial con nulo mantenimiento y alta tasa de capitalización."
            },
            {
              id: "scene_03",
              start_time: 10.0,
              end_time: 15.0,
              asset: {
                source_type: "original_photo",
                file_path: images[2],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "ESCRIBE ANALISIS",
                position: "center"
              },
              voiceover_script: "Escribe ANALISIS y recibe la corrida financiera completa y proyecciones."
            }
          ]
        }
      },
      airbnb_high_cashflow: {
        meta_ads: {
          angle: "Yield Optimization",
          headline: `Rendimiento Dolarizado en ${locStr}`,
          primary_text: `Genera flujo de caja constante. Loft con diseño instagrameable de doble altura y balcón fabril. Optimizado para rentas vacacionales cortas.`,
          description: `Alta ocupación proyectada. ${priceStr}.`,
          cta: "Learn More"
        },
        reels: {
          concept: "El atractivo visual que detiene el scroll en plataformas de renta.",
          hook: {
            visual: "Transición rápida de fotos estéticas en Airbnb.",
            verbal: "Este diseño está configurado para no pasar desapercibido.",
            overlay: "ALTO FLUJO DE CAJA"
          },
          scenes: [
            { time: "0:00 - 0:03.5", visual: "Doble altura con ventanales de 6 metros.", audio: "Los huéspedes pagan por el espacio y la experiencia visual.", text: "DISEÑO ICONICO" },
            { time: "0:03.5 - 0:10.0", visual: "Vista nocturna de la terraza y el distrito.", audio: "Ubicado a pasos de restaurantes. Alta ocupación constante.", text: "ALTA OCUPACIÓN" },
            { time: "0:10.0 - 0:15.0", visual: "Huésped disfrutando un café en el mezzanine.", audio: "Escribe CASHFLOW para recibir el dossier de proyección turística.", text: "ESCRIBE CASHFLOW" }
          ]
        },
        captions: {
          hook: "Rendimiento y cashflow pasivo inmediato en la zona de mayor tracción.",
          body: `Un loft duplex con diseño instagrameable de doble altura, ideal para rentas cortas. Ubicado en ${locStr}. Cuenta con detalles icónicos (escalera flotante, ladrillo original y balcón fabril) que maximizan la tarifa por noche y aseguran ocupación alta en plataformas. Incluye ${amList}.`,
          cta: "Escribe CASHFLOW para recibir el dossier de proyección turística."
        },
        hooks: {
          option1: "El loft que se renta solo gracias a su doble altura y diseño industrial.",
          option2: "Cómo optimizar tu portafolio con rentas cortas dolarizadas.",
          option3: "El secreto de la ocupación al 85% está en la honestidad de sus materiales."
        },
        storyboard: {
          property_id: nameStr,
          tone_profile: "airbnb_high_cashflow",
          duration_seconds: 15.0,
          audio: {
            background_track: "ambient_nordic_silence.mp3",
            voiceover_prompt: "Dinámico, entusiasta, enfocado en rentabilidad. Voz ágil."
          },
          scenes: [
            {
              id: "scene_01",
              start_time: 0.0,
              end_time: 3.5,
              asset: {
                source_type: "original_photo",
                file_path: images[0],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "DISEÑO ICONICO",
                position: "center"
              },
              voiceover_script: "Un loft de doble altura configurado para rentabilidad inmediata."
            },
            {
              id: "scene_02",
              start_time: 3.5,
              end_time: 10.0,
              asset: {
                source_type: "original_photo",
                file_path: images[1],
                motion_effect: "ken_burns_pan"
              },
              overlay_text: {
                text: "ALTA OCUPACIÓN",
                position: "bottom"
              },
              voiceover_script: "Detalles instagrameables que maximizan el precio por noche en plataformas."
            },
            {
              id: "scene_03",
              start_time: 10.0,
              end_time: 15.0,
              asset: {
                source_type: "original_photo",
                file_path: images[2],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "ESCRIBE CASHFLOW",
                position: "center"
              },
              voiceover_script: "Escribe CASHFLOW y recibe el dossier de proyección turística completo."
            }
          ]
        }
      },
      family_oriented: {
        meta_ads: {
          angle: "Generational Legacy",
          headline: `El Hogar de tu Familia en ${locStr}`,
          primary_text: `Un legado construido en piedra y madera natural. Espacios seguros, áreas verdes y comunidad para ver crecer a tus hijos. Descubre ${nameStr}.`,
          description: `Seguridad y tranquilidad. ${priceStr}.`,
          cta: "Book Now"
        },
        reels: {
          concept: "La calidez del hogar y la seguridad del entorno natural.",
          hook: {
            visual: "Luz de la mañana iluminando una mesa de comedor familiar.",
            verbal: "Hay decisiones que se toman pensando en el mañana.",
            overlay: "UN LEGADO FAMILIAR"
          },
          scenes: [
            { time: "0:00 - 0:03.5", visual: "Niños jugando en la terraza exterior protegida.", audio: "Espacios amplios integrados en un entorno boscoso.", text: "ENTORNO SEGURO" },
            { time: "0:03.5 - 0:10.0", visual: "Cocina abierta conectada con el salón principal.", audio: "Materiales naturales y resistentes, pensados para crear historias.", text: "ESPACIOS COMPARTIDOS" },
            { time: "0:10.0 - 0:15.0", visual: "Caminata al atardecer por los senderos del pinar.", audio: "Comenta FAMILIA y coordinemos un recorrido privado.", text: "COMENTA FAMILIA" }
          ]
        },
        captions: {
          hook: "Un espacio pensado para perdurar. Un legado familiar.",
          body: `${nameStr} en ${locStr} ofrece el equilibrio perfecto entre seguridad urbana y naturaleza. Un diseño de ${sqmStr} enfocado en la vida compartida, con estancias amplias que integran cocina, salón y terraza. Equipada con ${amList}.`,
          cta: "Comenta FAMILIA para agendar una visita privada con tu familia."
        },
        hooks: {
          option1: "El espacio donde tus hijos crecerán rodeados de naturaleza y seguridad.",
          option2: "Arquitectura que une a la familia. Descubre la planta libre.",
          option3: "Invierte en tranquilidad. Un entorno forestal cerrado para tu tranquilidad familiar."
        },
        storyboard: {
          property_id: nameStr,
          tone_profile: "family_oriented",
          duration_seconds: 15.0,
          audio: {
            background_track: "ambient_nordic_silence.mp3",
            voiceover_prompt: "Cálido, familiar, seguro. Voz con cadencia suave y cercana."
          },
          scenes: [
            {
              id: "scene_01",
              start_time: 0.0,
              end_time: 3.5,
              asset: {
                source_type: "original_photo",
                file_path: images[0],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "UN LEGADO FAMILIAR",
                position: "center"
              },
              voiceover_script: "Hay decisiones que se toman pensando en el mañana."
            },
            {
              id: "scene_02",
              start_time: 3.5,
              end_time: 10.0,
              asset: {
                source_type: "original_photo",
                file_path: images[1],
                motion_effect: "ken_burns_pan"
              },
              overlay_text: {
                text: "ENTORNO SEGURO",
                position: "bottom"
              },
              voiceover_script: "Espacios integrados, áreas boscosas privadas y seguridad absoluta."
            },
            {
              id: "scene_03",
              start_time: 10.0,
              end_time: 15.0,
              asset: {
                source_type: "original_photo",
                file_path: images[2],
                motion_effect: "ken_burns_zoom"
              },
              overlay_text: {
                text: "COMENTA FAMILIA",
                position: "center"
              },
              voiceover_script: "Comenta FAMILIA y hablemos de tu próximo hogar."
            }
          ]
        }
      }
    };

    return contentMap[tone] || contentMap.luxury_minimal;
  };

  // Run generation loop
  const handleGenerate = () => {
    if (!projectName.trim()) {
      alert("Por favor introduce el nombre del proyecto.");
      return;
    }
    if (selectedTypes.length === 0) {
      alert("Por favor selecciona al menos un tipo de contenido.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setHasGenerated(false);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < loadingSteps.length) {
        setLoadingStep(currentStep);
      } else {
        clearInterval(interval);
        setGeneratedResults(generateMockContent(selectedTone));
        setIsLoading(false);
        setHasGenerated(true);
      }
    }, 900);
  };

  // Regenerate single section mock logic
  const handleRegenerateSection = (section: string) => {
    setRegeneratingSection(section);
    setTimeout(() => {
      const fullMock = generateMockContent(selectedTone);
      setGeneratedResults((prev) => {
        const updated = { ...prev };
        if (section === "meta_ads" && fullMock.meta_ads) {
          updated.meta_ads = {
            ...fullMock.meta_ads,
            headline: fullMock.meta_ads.headline + " (Alternativo)",
            primary_text: "Variación: " + fullMock.meta_ads.primary_text
          };
        } else if (section === "reels" && fullMock.reels) {
          updated.reels = {
            ...fullMock.reels,
            concept: fullMock.reels.concept + " [Versión Alternativa]",
            hook: {
              ...fullMock.reels.hook,
              verbal: '"Nueva perspectiva: ' + fullMock.reels.hook.verbal.replace(/"/g, "") + '"'
            }
          };
        } else if (section === "captions" && fullMock.captions) {
          updated.captions = {
            ...fullMock.captions,
            hook: "★ " + fullMock.captions.hook,
            body: fullMock.captions.body + " (Optimizada para conversiones)."
          };
        } else if (section === "hooks" && fullMock.hooks) {
          updated.hooks = {
            option1: "Variación 1: " + fullMock.hooks.option1,
            option2: "Variación 2: " + fullMock.hooks.option2,
            option3: "Variación 3: " + fullMock.hooks.option3
          };
        }
        return updated;
      });
      setRegeneratingSection(null);
    }, 1200);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="border-b border-[#222222] pb-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">
            Antigravity <span className="font-light text-neutral-400">/ Engine</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Plataforma interna de generación de contenido inmobiliario premium
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-neutral-400 tracking-wider uppercase font-mono">
            Corey Haines + Beautiful Prose Enabled
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Panel: Inputs & Configurations (7 columns) */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION 1: Nuevo Proyecto */}
          <section className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase font-mono">
                01. Ficha del Proyecto
              </h2>
              <span className="text-[10px] text-neutral-500 font-mono">CAMPOS DE ALTA DENSIDAD</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Casa del Bosque"
                  className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  Precio (USD)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1850000"
                  className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  Metros Cuadrados
                </label>
                <input
                  type="text"
                  placeholder="Ej. 450"
                  className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors"
                  value={sqm}
                  onChange={(e) => setSqm(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Las Colinas, Santa Catarina"
                  className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Descripción Libre / Narrativa Espacial
              </label>
              <textarea
                rows={4}
                placeholder="Describe la materialidad, las transiciones de planos, la volumetría o las sensaciones de luz..."
                className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Amenities Tag Input */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block">
                Amenidades / Puntos Clave
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#0c0c0c] border border-[#222222] rounded min-h-[40px]">
                {amenities.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-[#1a1a1a] text-neutral-300 text-xs px-2 py-0.5 rounded border border-[#2c2c2c]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      className="text-neutral-500 hover:text-white font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Añade y presiona Enter..."
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[120px] py-0.5"
                  value={amenitiesText}
                  onChange={(e) => setAmenitiesText(e.target.value)}
                  onKeyDown={handleAddAmenity}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                URL del Proyecto (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://ejemplo.com/proyecto"
                className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
              />
            </div>

            {/* Drag & Drop File Upload */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block">
                Dossier del Inmueble (PDFs / Planos / Imágenes)
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-white bg-[#0e0e0e]"
                    : "border-[#222222] bg-[#0c0c0c] hover:border-neutral-500"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="application/pdf,image/*"
                  onChange={handleFileSelect}
                />
                <div className="space-y-1">
                  <p className="text-xs text-neutral-300">
                    Arrastra archivos o <span className="underline text-white font-medium">haz clic para buscar</span>
                  </p>
                  <p className="text-[10px] text-neutral-500">PDF, JPG o PNG de alta resolución</p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#0c0c0c] border border-[#222222] rounded p-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-neutral-500">📄</span>
                        <span className="text-neutral-300 truncate font-mono">{file.name}</span>
                        <span className="text-[10px] text-neutral-600">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {!file.completed ? (
                          <div className="w-16 bg-neutral-800 h-1 rounded overflow-hidden">
                            <div
                              className="bg-white h-full transition-all duration-200"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-mono uppercase">Completado</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.name);
                          }}
                          className="text-neutral-500 hover:text-white"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Form Panel: Configuration & Generation (5 columns) */}
        <div className="lg:col-span-5 space-y-8">
          {/* SECTION 2: Configuración de Contenido */}
          <section className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <h2 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase font-mono">
                02. Configuración de Tono
              </h2>
              <span className="text-[10px] text-neutral-500 font-mono">POSICIONAMIENTO</span>
            </div>

            {/* Dropdown Tono */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Perfil de Tono de Marca
              </label>
              <select
                className="w-full bg-[#0c0c0c] border border-[#222222] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f5f5f5] transition-colors"
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
              >
                {toneOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono italic">
                {toneOptions.find((t) => t.id === selectedTone)?.desc}
              </p>
            </div>

            {/* Checkboxes Tipo de Contenido */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block">
                Canales y Tipos de Contenido
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "meta_ads", name: "Meta Ads Copy" },
                  { id: "reels", name: "Reel Script" },
                  { id: "captions", name: "Caption Instagram" },
                  { id: "hooks", name: "Hooks" }
                ].map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-3 rounded border text-xs cursor-pointer select-none transition-all ${
                      selectedTypes.includes(type.id)
                        ? "border-white bg-[#0e0e0e] text-white"
                        : "border-[#222222] bg-[#0c0c0c] text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedTypes.includes(type.id)}
                      onChange={() => toggleType(type.id)}
                    />
                    <div
                      className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        selectedTypes.includes(type.id)
                          ? "border-white bg-white"
                          : "border-neutral-600 bg-transparent"
                      }`}
                    >
                      {selectedTypes.includes(type.id) && (
                        <div className="h-1 w-1 bg-black rounded-full"></div>
                      )}
                    </div>
                    <span>{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`w-full py-3 rounded text-xs font-mono uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 ${
                isLoading
                  ? "bg-[#111] text-neutral-500 border border-[#222] cursor-not-allowed"
                  : "bg-white text-black hover:bg-[#eaeaea]"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-neutral-500 animate-ping"></span>
                  <span>Procesando...</span>
                </>
              ) : (
                "Generar Copys Premium"
              )}
            </button>

            {/* Loading indicator bar */}
            {isLoading && (
              <div className="space-y-2 mt-4 p-3 bg-[#0c0c0c] border border-[#222222] rounded">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <span>PROCESANDO SISTEMA</span>
                  <span>{loadingStep + 1} / 5</span>
                </div>
                <div className="w-full bg-neutral-900 h-0.5 rounded overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-500"
                    style={{ width: `${((loadingStep + 1) / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-neutral-300 font-mono animate-pulse">
                  &gt; {loadingSteps[loadingStep]}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* SECTION 3: Resultados */}
      {hasGenerated && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <h2 className="text-md font-semibold tracking-wider text-white uppercase font-mono">
              03. Copys e Ideas Generadas
            </h2>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-neutral-400">
                Tono: <span className="text-white font-medium capitalize">{selectedTone.replace("_", " ")}</span>
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Reel Script split full-width card */}
            {selectedTypes.includes("reels") && generatedResults.reels && (
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-[#111] pb-4">
                  <div>
                    <span className="text-[10px] font-mono bg-neutral-900 border border-[#222222] text-neutral-300 px-2 py-0.5 rounded uppercase">
                      Reel Script & Composition
                    </span>
                    <p className="text-[10px] text-neutral-500 font-mono mt-1">
                      Concepto: {generatedResults.reels.concept}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `HOOK:\nVisual: ${generatedResults.reels?.hook.visual}\nVerbal: ${generatedResults.reels?.hook.verbal}\nOverlay: ${generatedResults.reels?.hook.overlay}`,
                          "reels"
                        )
                      }
                      className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                    >
                      {copiedStates["reels"] ? "Copiado" : "Copiar"}
                    </button>
                    <button
                      onClick={() => handleRegenerateSection("reels")}
                      disabled={regeneratingSection === "reels"}
                      className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                    >
                      {regeneratingSection === "reels" ? "Generando..." : "Regenerar"}
                    </button>
                  </div>
                </div>

                {/* Split layout: text flow on left (7 cols), interactive Remotion video player on right (5 cols) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-7 space-y-6">
                    <div>
                      <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                        3-Sec Visual-Verbal Hook
                      </p>
                      <div className="bg-[#0c0c0c] border border-[#222222] rounded p-4 mt-2 space-y-2 text-xs">
                        <p>
                          <span className="text-neutral-500 font-mono">Visual B-roll:</span>{" "}
                          <span className="text-neutral-200">{generatedResults.reels.hook.visual}</span>
                        </p>
                        <p>
                          <span className="text-neutral-500 font-mono">Verbal Script:</span>{" "}
                          <span className="text-white italic">"{generatedResults.reels.hook.verbal}"</span>
                        </p>
                        <p>
                          <span className="text-neutral-500 font-mono">Overlay Title:</span>{" "}
                          <span className="text-white font-bold">{generatedResults.reels.hook.overlay}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                        Time-Cued Storyboard
                      </p>
                      <div className="space-y-3 mt-2">
                        {generatedResults.reels.scenes.map((scene, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-3 text-xs border-b border-[#161616] pb-3 last:border-0"
                          >
                            <span className="col-span-3 text-neutral-400 font-mono font-semibold">
                              {scene.time}
                            </span>
                            <div className="col-span-9 space-y-1.5">
                              <p className="text-neutral-300">
                                <span className="text-neutral-600 font-mono">Visual:</span> {scene.visual}
                              </p>
                              <p className="text-white italic">
                                <span className="text-neutral-600 font-mono">V.O.:</span> {scene.audio}
                              </p>
                              <p className="text-neutral-400">
                                <span className="text-neutral-600 font-mono">Overlay:</span> {scene.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Remotion Player */}
                  <div className="md:col-span-5 flex justify-center">
                    {generatedResults.storyboard && (
                      <ReelPlayer storyboard={generatedResults.storyboard} />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meta Ads copy card */}
              {selectedTypes.includes("meta_ads") && generatedResults.meta_ads && (
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono bg-neutral-900 border border-[#222222] text-neutral-300 px-2 py-0.5 rounded uppercase">
                          Meta Ads Copy
                        </span>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">
                          Ángulo: {generatedResults.meta_ads.angle}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `HEADLINE: ${generatedResults.meta_ads?.headline}\nPRIMARY TEXT: ${generatedResults.meta_ads?.primary_text}\nDESCRIPTION: ${generatedResults.meta_ads?.description}`,
                              "meta_ads"
                            )
                          }
                          className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                        >
                          {copiedStates["meta_ads"] ? "Copiado" : "Copiar"}
                        </button>
                        <button
                          onClick={() => handleRegenerateSection("meta_ads")}
                          disabled={regeneratingSection === "meta_ads"}
                          className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                        >
                          {regeneratingSection === "meta_ads" ? "Generando..." : "Regenerar"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-[#161616]">
                      <div>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                          Primary Text
                        </p>
                        <p className="text-sm text-neutral-200 mt-1 whitespace-pre-wrap font-sans">
                          {generatedResults.meta_ads.primary_text}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Headline</p>
                        <p className="text-sm text-white font-medium mt-1 font-sans">
                          {generatedResults.meta_ads.headline}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                            Description
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {generatedResults.meta_ads.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">CTA Button</p>
                          <p className="text-xs text-neutral-400 mt-1">{generatedResults.meta_ads.cta}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instagram Caption card */}
              {selectedTypes.includes("captions") && generatedResults.captions && (
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono bg-neutral-900 border border-[#222222] text-neutral-300 px-2 py-0.5 rounded uppercase">
                          Instagram Caption
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${generatedResults.captions?.hook}\n\n${generatedResults.captions?.body}\n\n${generatedResults.captions?.cta}`,
                              "captions"
                            )
                          }
                          className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                        >
                          {copiedStates["captions"] ? "Copiado" : "Copiar"}
                        </button>
                        <button
                          onClick={() => handleRegenerateSection("captions")}
                          disabled={regeneratingSection === "captions"}
                          className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                        >
                          {regeneratingSection === "captions" ? "Generando..." : "Regenerar"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-[#161616] text-sm">
                      <div>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                          Instagram Post Text
                        </p>
                        <div className="bg-[#0c0c0c] border border-[#222222] rounded p-4 mt-2 space-y-3 font-serif leading-relaxed text-neutral-200">
                          <p className="font-sans font-bold text-white text-base">
                            {generatedResults.captions.hook}
                          </p>
                          <p className="text-sm">{generatedResults.captions.body}</p>
                          <p className="font-sans font-medium text-neutral-300 border-t border-[#222222] pt-2 mt-2">
                            {generatedResults.captions.cta}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hooks card */}
              {selectedTypes.includes("hooks") && generatedResults.hooks && (
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 space-y-4 flex flex-col justify-between lg:col-span-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono bg-neutral-900 border border-[#222222] text-neutral-300 px-2 py-0.5 rounded uppercase">
                          Alternative Hooks
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `Hook 1: ${generatedResults.hooks?.option1}\nHook 2: ${generatedResults.hooks?.option2}\nHook 3: ${generatedResults.hooks?.option3}`,
                              "hooks"
                            )
                          }
                          className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                        >
                          {copiedStates["hooks"] ? "Copiado" : "Copiar"}
                        </button>
                        <button
                          onClick={() => handleRegenerateSection("hooks")}
                          disabled={regeneratingSection === "hooks"}
                          className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase px-2 py-1 bg-[#0c0c0c] border border-[#222222] rounded transition-colors"
                        >
                          {regeneratingSection === "hooks" ? "Generando..." : "Regenerar"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-[#161616] text-sm text-neutral-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-[#0c0c0c] border border-[#222222] rounded hover:border-neutral-600 transition-colors">
                          <span className="text-[9px] uppercase font-mono text-neutral-500 block mb-1">
                            Hook 01
                          </span>
                          <p className="font-semibold text-white">{generatedResults.hooks.option1}</p>
                        </div>
                        <div className="p-3 bg-[#0c0c0c] border border-[#222222] rounded hover:border-neutral-600 transition-colors">
                          <span className="text-[9px] uppercase font-mono text-neutral-500 block mb-1">
                            Hook 02
                          </span>
                          <p className="font-semibold text-white">{generatedResults.hooks.option2}</p>
                        </div>
                        <div className="p-3 bg-[#0c0c0c] border border-[#222222] rounded hover:border-neutral-600 transition-colors">
                          <span className="text-[9px] uppercase font-mono text-neutral-500 block mb-1">
                            Hook 03
                          </span>
                          <p className="font-semibold text-white">{generatedResults.hooks.option3}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
