import os
import json
import urllib.request
import urllib.error
from .config_loader import ConfigLoader

class LLMClient:
    def __init__(self, provider=None, model=None, config_loader=None):
        self.loader = config_loader or ConfigLoader()
        self.settings = self.loader.load_settings()

        # Extract config values
        llm_config = self.settings.get("llm", {})
        self.provider = provider or llm_config.get("provider", "gemini")
        
        # Load provider specific settings
        provider_settings = self.settings.get("providers", {}).get(self.provider, {})
        self.model = model or llm_config.get("model") or provider_settings.get("default_model")
        
        self.temperature = llm_config.get("temperature", 0.7)
        self.max_tokens = llm_config.get("max_tokens", 2048)

        # Retrieve the API key from environment variables
        self.api_key_env = provider_settings.get("api_key_env", "")
        self.api_key = os.environ.get(self.api_key_env)

    def generate(self, prompt, system_instruction=None):
        """Generates text from the chosen LLM provider, falling back to mock mode if key is missing."""
        if not self.api_key:
            print(f"\n[Warning] API key for env '{self.api_key_env}' is not set. Using local mock generator.")
            return self._mock_generate(prompt, system_instruction)

        try:
            if self.provider == "gemini":
                return self._call_gemini(prompt, system_instruction)
            elif self.provider == "openai":
                return self._call_openai(prompt, system_instruction)
            elif self.provider == "anthropic":
                return self._call_anthropic(prompt, system_instruction)
            else:
                raise ValueError(f"Unsupported LLM provider: {self.provider}")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print(f"\n[Error] HTTP Error from {self.provider} API: {e.code} - {e.reason}")
            print(f"Response: {error_body}")
            print("Falling back to local mock generator.")
            return self._mock_generate(prompt, system_instruction)
        except Exception as e:
            print(f"\n[Error] Connection error while calling {self.provider} API: {str(e)}")
            print("Falling back to local mock generator.")
            return self._mock_generate(prompt, system_instruction)

    def _call_gemini(self, prompt, system_instruction):
        # Gemini uses API key in the URL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens
            }
        }
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["candidates"][0]["content"]["parts"][0]["text"]

    def _call_openai(self, prompt, system_instruction):
        url = "https://api.openai.com/v1/chat/completions"
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"]

    def _call_anthropic(self, prompt, system_instruction):
        url = "https://api.anthropic.com/v1/messages"
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        
        if system_instruction:
            payload["system"] = system_instruction

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["content"][0]["text"]

    def _mock_generate(self, prompt, system_instruction):
        """Generates rich, context-aware mock content to simulate premium generation without API calls."""
        prompt_lower = prompt.lower()
        
        # 1. Determine requested asset type
        if "vertical script" in prompt_lower or "reels/tiktok" in prompt_lower or "short vertical script" in prompt_lower:
            asset_type = "reel"
        elif "meta ad" in prompt_lower or "ad-creative" in prompt_lower:
            asset_type = "meta_ad"
        else:
            asset_type = "caption"
            
        # 2. Determine property ID
        property_id = "casa_bosque"
        if "loft_industrial" in prompt_lower or "astillero" in prompt_lower or "loft" in prompt_lower:
            property_id = "loft_industrial"
            
        # 3. Determine active tone profile
        active_tone = "luxury_minimal"
        if system_instruction:
            sys_lower = system_instruction.lower()
            for tone in ["luxury_minimal", "luxury_emotional", "investment_focused", "airbnb_high_cashflow", "family_oriented", "modern_architecture"]:
                if tone.replace("_", " ") in sys_lower or tone in sys_lower:
                    active_tone = tone
                    break

        # 4. Route to specific mock builders
        if asset_type == "meta_ad":
            return self._mock_meta_ads(property_id, active_tone)
        elif asset_type == "reel":
            return self._mock_reels(property_id, active_tone)
        else:
            return self._mock_captions(property_id, active_tone)

    def _mock_meta_ads(self, property_id, active_tone):
        if property_id == "casa_bosque":
            if active_tone == "luxury_minimal":
                return """# PERFORMANCE META ADS - LUXURY MINIMAL [MOCK MODE]
REGISTER: cold_steel | DENSITY: dense | HEAT: cool

## Angle 1: Architectural Silence (Pain Point)
* **Primary Text:** Muros de hormigón visto y silencio visual absoluto. A 25 minutos de tu oficina. Un salón a doble altura frente al pinar.
👉 Más detalles: antigravity.realestate/casa_bosque
* **Headline:** Silencio en Hormigón & Pinos
* **Description:** Las Colinas. Exclusividad pura.
* **CTA:** Learn More
* **Annotation:** Ataca la saturación mental urbana posicionando la severidad estructural como el antídoto definitivo.

## Angle 2: Pure Geometries (Curiosity)
* **Primary Text:** Sin ornamentos. Sin adorno superfluo. Piedra volcánica local y madera de roble recuperado en su estado más honesto.
👉 Reserva visita privada: antigravity.realestate/casa_bosque
* **Headline:** Geometrías Puras en el Bosque
* **Description:** Vista de diseño disponible.
* **CTA:** Book Now
* **Annotation:** Apela a una audiencia de alto perfil intelectual que valora la ausencia de decoración como máximo lujo.
"""
            elif active_tone == "luxury_emotional":
                return """# PERFORMANCE META ADS - LUXURY EMOTIONAL [MOCK MODE]
REGISTER: literary_modern | DENSITY: standard | HEAT: warm

## Angle 1: Sanctuary of Light (Pain Point)
* **Primary Text:** Recupera el sentido del lugar. Casa del Bosque es un refugio de luz dorada donde la piscina infinita se funde con los pinos.
👉 Tu santuario privado: antigravity.realestate/casa_bosque
* **Headline:** El Refugio que Detiene el Tiempo
* **Description:** Siente la calma absoluta.
* **CTA:** Learn More
* **Annotation:** Utiliza disparadores de paz mental y refugio emocional frente al agotamiento de la gran ciudad.

## Angle 2: Visceral Connection (Curiosity)
* **Primary Text:** La calidez del roble recuperado bajo los pies descalzos. La brisa del bosque entrando por ventanales que se deslizan por completo.
👉 Agenda tu recorrido privado: antigravity.realestate/casa_bosque
* **Headline:** Una Atmósfera de Calma Absoluta
* **Description:** Un recorrido para los sentidos.
* **CTA:** Book Now
* **Annotation:** Enfocado en descripciones táctiles y espaciales para despertar el deseo físico de habitar el espacio.
"""
            else: # modern_architecture
                return """# PERFORMANCE META ADS - MODERN ARCHITECTURE [MOCK MODE]
REGISTER: cold_steel | DENSITY: dense | HEAT: cool

## Angle 1: Structural Honesty (Pain Point)
* **Primary Text:** Una volumetría rigurosa integrada en el bosque. Muros portantes de hormigón visto que desafían la topografía de Las Colinas.
👉 Descubre la estructura: antigravity.realestate/casa_bosque
* **Headline:** Honestidad Material & Volumetría
* **Description:** Arquitectura sin concesiones.
* **CTA:** Learn More
* **Annotation:** Apela al aprecio estético radical a través de la honestidad de la estructura portante.

## Angle 2: The Transition (Curiosity)
* **Primary Text:** Una planta libre que integra el salón doble altura con 150 m² de terraza flotante. Transición de planos imperceptible.
👉 Planos y especificaciones: antigravity.realestate/casa_bosque
* **Headline:** Planta Libre & Luz Cenital
* **Description:** Dossier de distribución.
* **CTA:** Learn More
* **Annotation:** Enfatiza la técnica constructiva y la geometría funcional del espacio.
"""
        else: # loft_industrial
            if active_tone == "modern_architecture":
                return """# PERFORMANCE META ADS - MODERN ARCHITECTURE [MOCK MODE]
REGISTER: cold_steel | DENSITY: dense | HEAT: cool

## Angle 1: Industrial Heritage (Curiosity)
* **Primary Text:** Volumetría de doble altura y ventanales industriales en arco. El Astillero: honestidad material en ladrillo y acero visto.
👉 Ver planos: antigravity.realestate/loft_industrial
* **Headline:** Ladrillo Visto & Planta Libre
* **Description:** Estructura portante de 135 m²
* **CTA:** Learn More
* **Annotation:** Resalta la herencia industrial y la geometría funcional de un loft auténtico.
"""
            elif active_tone == "investment_focused":
                return """# PERFORMANCE META ADS - INVESTMENT FOCUSED [MOCK MODE]
REGISTER: journalistic | DENSITY: standard | HEAT: cool

## Angle 1: Wealth Preservation (Rational)
* **Primary Text:** Un activo defensivo de 135 m² en el Distrito de Diseño. Plusvalía histórica respaldada por alta ocupación y rendimiento constante.
👉 Corrida financiera: antigravity.realestate/loft_industrial
* **Headline:** Tasa de Capitalización Defensiva
* **Description:** Zona 4. Crecimiento patrimonial.
* **CTA:** Learn More
* **Annotation:** Apela puramente al rendimiento financiero, datos de mercado y protección patrimonial contra inflación.
"""
            else: # airbnb_high_cashflow
                return """# PERFORMANCE META ADS - AIRBNB HIGH CASHFLOW [MOCK MODE]
REGISTER: journalistic | DENSITY: lean | HEAT: warm

## Angle 1: Yield Maximization (Opportunity)
* **Primary Text:** Optimizado para rentas cortas. Diseño instagrameable de doble altura en la zona de mayor demanda turística de la ciudad.
👉 Dossier de rendimiento: antigravity.realestate/loft_industrial
* **Headline:** Cashflow Inmediato en Zona 4
* **Description:** Alta tasa de ocupación.
* **CTA:** Learn More
* **Annotation:** Atrae a inversores buscando libertad financiera con retornos anualizados optimizados por plataformas.
"""

    def _mock_reels(self, property_id, active_tone):
        if property_id == "casa_bosque":
            if active_tone == "luxury_minimal":
                return """# REELS SCRIPT - LUXURY MINIMAL [MOCK MODE]
**Concept:** La severidad del hormigón y el silencio del bosque.

### Hook (3 seconds)
* **Visual Hook:** Plano detalle de un muro de hormigón visto texturizado. La cámara se desliza lentamente hacia la ventana revelando el pinar.
* **Verbal Hook:** "Esto no es lujo. Es silencio visual."
* **Text Overlay:** LA BELLEZA DEL VACÍO

### Time-Cued Script

| Time | Visual / B-Roll | Audio Voiceover | On-Screen Text |
|---|---|---|---|
| **0:00 - 0:10** | Geometrías puras de hormigón. Luz filtrada sobre roble recuperado. | "Hormigón visto. Geometrías puras. Líneas limpias. Espacio reducido a su esencia constructiva." | HORMIGÓN & PIEDRA |
| **0:10 - 0:20** | Piscina infinita reflejando la copa de los pinos en un día gris. | "Una arquitectura de la ausencia. Sin adornos. Sencillez severa integrada en Las Colinas." | SIN ADORNOS |
| **0:20 - 0:30** | Plano fijo de la doble altura vacía de mobiliario. | "Para quienes buscan un refugio de orden mental. Comenta SILENCIO." | COMENTA SILENCIO |
"""
            elif active_tone == "luxury_emotional":
                return """# REELS SCRIPT - LUXURY EMOTIONAL [MOCK MODE]
**Concept:** El santuario de luz donde se detiene el tiempo.

### Hook (3 seconds)
* **Visual Hook:** Pies descalzos caminando lentamente por tablones de roble recuperado bañados en luz dorada.
* **Verbal Hook:** "Hay espacios donde el tiempo se detiene por completo."
* **Text Overlay:** HABITAR EL TIEMPO

### Time-Cued Script

| Time | Visual / B-Roll | Audio Voiceover | On-Screen Text |
|---|---|---|---|
| **0:00 - 0:10** | Primer plano de una mano rozando la textura rugosa de la piedra volcánica. | "Este no es solo un diseño premium. Es un refugio. Un santuario tallado en piedra volcánica y madera viva." | TU REFUGIO |
| **0:10 - 0:20** | Vapor subiendo de la piscina infinita mientras cae el sol en el pinar. | "Creado para recuperar el tacto de las cosas naturales y restaurar la calma. Sentido del lugar." | CALMA ABSOLUTA |
| **0:20 - 0:30** | Vista de las copas de los árboles meciéndose suavemente en el crepúsculo. | "Comenta REFUGIO y coordinemos un recorrido privado para que experimentes la atmósfera." | COMENTA REFUGIO |
"""
            else: # modern_architecture
                return """# REELS SCRIPT - MODERN ARCHITECTURE [MOCK MODE]
**Concept:** La estructura portante expuesta como obra de arte.

### Hook (3 seconds)
* **Visual Hook:** Un plano cenital que desciende por la escalera metálica negra, revelando la doble altura estructural.
* **Verbal Hook:** "Esto no es decoración. Esto es honestidad material."
* **Text Overlay:** HONESTIDAD MATERIAL

### Time-Cued Script

| Time | Visual / B-Roll | Audio Voiceover | On-Screen Text |
|---|---|---|---|
| **0:00 - 0:10** | Detalle del encofrado del hormigón visto y las vigas de hierro negro expuestas. | "Una volumetría rigurosa. La estructura portante queda expuesta para definir el espacio." | VOLUMETRÍA PURA |
| **0:10 - 0:20** | La luz cenital ingresando por una claraboya, cortando diagonalmente el salón. | "Planta libre. Transición de planos perfecta hacia el pinar. Geometría funcional." | PLANTA LIBRE |
| **0:20 - 0:30** | Plano de los planos constructivos de la casa sobre la mesa de hormigón. | "Escribe BREGMA y te enviamos los planos de distribución y detalles arquitectónicos." | ESCRIBE BREGMA |
"""
        else: # loft_industrial
            return f"""# REELS SCRIPT - {active_tone.upper().replace('_', ' ')} [MOCK MODE]
**Concept:** Loft industrial genuino en el Distrito de Diseño.
**Active Tone:** {active_tone}
**CTA:** {active_tone} -> Escribe tu consulta.
"""

    def _mock_captions(self, property_id, active_tone):
        if property_id == "casa_bosque":
            if active_tone == "luxury_minimal":
                return """# SOCIAL CAPTION - LUXURY MINIMAL [MOCK MODE]
El ruido satura. Buscamos la ausencia.

Casa del Bosque. Geometrías puras de hormigón visto y piedra volcánica. Nada sobra. 

Una estructura severa que enmarca el pinar. Luz filtrada sobre madera de roble recuperado. Líneas limpias. Silencio visual absoluto.

Para quienes entienden que el espacio no necesita decoración, sino vacío.

Ubicación: Las Colinas, Santa Catarina.
Precio: $1,850,000.

Comenta SILENCIO y te enviamos la ficha técnica.
"""
            elif active_tone == "luxury_emotional":
                return """# SOCIAL CAPTION - LUXURY EMOTIONAL [MOCK MODE]
Hay lugares donde el tiempo parece detenerse.

Casa del Bosque es un refugio diseñado para habitar el silencio. Muros de piedra volcánica que absorben la luz dorada del atardecer. Madera que invita al tacto y despierta la memoria de los materiales vivos.

Una atmósfera de absoluta paz, donde la piscina infinity se funde con la copa de los pinos. El verdadero sentido del lugar. Tu santuario personal.

Una experiencia que no se puede describir con números, sino sintiendo el crujir del roble bajo los pies descalzos.

Ubicación: Las Colinas, Santa Catarina.
Precio: $1,850,000.

Comenta REFUGIO para coordinar tu recorrido privado.
"""
            else: # modern_architecture
                return """# SOCIAL CAPTION - MODERN ARCHITECTURE [MOCK MODE]
Una declaración constructiva sin concesiones.

Casa del Bosque destaca por su honestidad material. La estructura portante de hormigón visto y acero negro se expone con orgullo, definiendo una volumetría audaz que se incrusta en la ladera forestal.

La planta libre del área social elimina toda barrera, permitiendo que la transición de planos entre el interior y la terraza exterior sea imperceptible. La luz cenital baña las texturas de la piedra volcánica y la madera, revelando la pureza de su geometría funcional.

Arquitectura para quienes entienden el espacio como una disciplina de precisión física.

Ubicación: Las Colinas, Santa Catarina.
Precio: $1,850,000.

Escribe BREGMA y te enviamos los planos de distribución.
"""
        else: # loft_industrial
            if active_tone == "modern_architecture":
                return """# SOCIAL CAPTION - MODERN ARCHITECTURE [MOCK MODE]
Herencia industrial en el corazón del Distrito de Diseño.

El Astillero Loft expone una volumetría de doble altura y arcos de ladrillo visto original de la antigua fábrica. La honestidad material del hormigón pulido y el acero se conjuga con una planta libre de 135 m² sumamente versátil.

Una escalera flotante de hierro negro actúa como transición de planos hacia el dormitorio en mezzanine. Geometría funcional que optimiza el espacio y baña el interior con luz natural proveniente de ventanales fabriles de 6 metros.

Escribe BREGMA y te enviamos los planos de distribución.
"""
            elif active_tone == "investment_focused":
                return """# SOCIAL CAPTION - INVESTMENT FOCUSED [MOCK MODE]
Preservación patrimonial a través del diseño de alta demanda.

El Astillero Loft representa un activo defensivo excepcional en Zona 4. Un duplex de 135 m² respaldado por una plusvalía histórica sobresaliente y una demanda constante en el Distrito de Diseño.

Con acabados de nulo mantenimiento (microcemento y ladrillo expuesto) y un rendimiento y tasa de capitalización de primer nivel, este inmueble optimiza el retorno anualizado del capital invertido.

Escribe ANALISIS para recibir la corrida financiera completa.
"""
            else: # airbnb_high_cashflow
                return """# SOCIAL CAPTION - AIRBNB HIGH CASHFLOW [MOCK MODE]
Rendimiento y cashflow pasivo inmediato en la zona de mayor tracción.

Un loft duplex con diseño instagrameable de doble altura, ideal para rentas cortas. El Astillero Loft cuenta con detalles icónicos (escalera flotante, ladrillo original y balcón fabril) que maximizan el precio por noche y aseguran una alta tasa de ocupación en plataformas turísticas.

El activo idóneo para inversores que buscan flujo de caja constante y retornos dolarizados óptimos.

Escribe CASHFLOW para recibir el dossier de proyección turística.
"""

