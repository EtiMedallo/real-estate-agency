import json
import os
from core.llm_client import LLMClient
from core.prompter import Prompter

class StoryboardGenerator:
    def __init__(self, provider=None, model=None, workspace_root=None):
        self.prompter = Prompter(workspace_root)
        self.llm = LLMClient(provider=provider, model=model, config_loader=self.prompter.loader)
        self.workspace_root = workspace_root or self.prompter.loader.workspace_root

    def generate(self, property_id, tone_profile=None):
        """Generates a structured reels storyboard JSON for video rendering."""
        prop_data = self.prompter.loader.get_property(property_id)
        active_tone = tone_profile or prop_data.get("default_tone", "luxury_minimal")

        # Compile instructions with video skill and active brand voice
        system_instruction = self.prompter.compile_system_instruction(
            marketing_skill_name="video",
            tone_profile=active_tone
        )

        user_prompt = f"""
You are a creative director for a premium real estate agency.
Generate a structured Reels Storyboard JSON for the property '{property_id}' under the tone profile '{active_tone}'.
The output MUST be a valid JSON object matching this exact schema:

{{
  "property_id": "string",
  "tone_profile": "string",
  "duration_seconds": 15.0,
  "audio": {{
    "voiceover_prompt": "string describing background VO mood",
    "background_track": "ambient_nordic_silence.mp3",
    "voice_id": "string"
  }},
  "scenes": [
    {{
      "id": "scene_01",
      "start_time": 0.0,
      "end_time": 3.0,
      "asset": {{
        "source_type": "original_photo",
        "file_path": "URL of a relevant architecture photo on Unsplash (must be a valid unsplash URL)",
        "motion_effect": "image_to_video",
        "runway_prompt": "string describing the animated motion prompt"
      }},
      "overlay_text": {{
        "text": "Subheadline / overlay capitalized text in Spanish (max 25 chars)",
        "position": "center | bottom"
      }},
      "voiceover_script": "Short sentence to be read in Spanish matching this scene"
    }}
  ]
}}

Ensure all visual descriptions and voiceover scripts strictly respect the active brand voice profile '{active_tone}' and the 'beautiful_prose' writing rules (sensory, concrete nouns, no clichés).
Return ONLY the raw JSON object inside triple backticks (```json ... ```).
"""

        print(f"Generating Reels Storyboard for '{property_id}' [{active_tone}] using {self.llm.provider} ({self.llm.model})...")
        
        # If API key is missing, return high-fidelity mock storyboard
        if not self.llm.api_key:
            print("[Warning] API key not found. Compiling local mock storyboard JSON.")
            storyboard = self._get_mock_storyboard(property_id, active_tone)
        else:
            try:
                raw_output = self.llm.generate(user_prompt, system_instruction)
                # Parse JSON out of markdown block if present
                clean_json = raw_output
                if "```json" in raw_output:
                    clean_json = raw_output.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_output:
                    clean_json = raw_output.split("```")[1].split("```")[0].strip()
                storyboard = json.loads(clean_json.strip())
            except Exception as e:
                print(f"[Error] Failed to parse generated JSON: {e}. Falling back to mock storyboard.")
                storyboard = self._get_mock_storyboard(property_id, active_tone)

        # Save to output folder
        output_dir = os.path.join(self.workspace_root, "output")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{property_id}_storyboard.json")
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(storyboard, f, indent=2, ensure_ascii=False)
            
        print(f"Storyboard JSON written successfully to: {output_path}")
        return storyboard

    def _get_mock_storyboard(self, property_id, tone):
        """Compiles a highly-detailed local mock storyboard matching the property and active tone."""
        
        # Default Unsplash asset pools
        assets_casa_bosque = [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200", # Concrete minimal forest house
            "https://images.unsplash.com/photo-1507090960745-b32f65d3113a?q=80&w=1200", # Misty forest pinar
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200"  # Double height concrete/wood living room
        ]
        assets_loft = [
            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1200", # Loft industrial brick/stairs
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200", # Double height industrial windows
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200"  # Mezzanine bedroom
        ]

        is_cb = property_id == "casa_bosque"
        images = assets_casa_bosque if is_cb else assets_loft

        tone_content = {
            "luxury_minimal": {
                "voiceover_prompt": "Atmósfera fría, severa, silenciosa. Voz masculina pausada.",
                "scenes": [
                  {
                    "id": "scene_01",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[0],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Slow forward tilt revealing concrete walls and surrounding forest."
                    },
                    "overlay_text": {
                      "text": "SILENCIO VISUAL",
                      "position": "center"
                    },
                    "voiceover_script": "Esto no es lujo. Es silencio visual."
                  },
                  {
                    "id": "scene_02",
                    "start_time": 3.5,
                    "end_time": 10.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[1],
                      "motion_effect": "ken_burns_pan",
                      "runway_prompt": "Slow pan over the dark pine trees and water reflection."
                    },
                    "overlay_text": {
                      "text": "GEOMETRÍAS PURAS",
                      "position": "bottom"
                    },
                    "voiceover_script": "Estructuras severas de hormigón visto y piedra volcánica. Nada sobra."
                  },
                  {
                    "id": "scene_03",
                    "start_time": 10.0,
                    "end_time": 15.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[2],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Slow push forward inside the double height concrete space."
                    },
                    "overlay_text": {
                      "text": "ESCRIBE SILENCIO",
                      "position": "center"
                    },
                    "voiceover_script": "Para quienes buscan un refugio de absoluto orden mental. Comenta SILENCIO."
                  }
                ]
            },
            "luxury_emotional": {
                "voiceover_prompt": "Cálido, evocador de sensaciones. Voz suave, poética.",
                "scenes": [
                  {
                    "id": "scene_01",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[0],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Golden light shining through windows of concrete home."
                    },
                    "overlay_text": {
                      "text": "HABITAR EL TIEMPO",
                      "position": "center"
                    },
                    "voiceover_script": "Hay espacios donde el tiempo se detiene por completo."
                  },
                  {
                    "id": "scene_02",
                    "start_time": 3.5,
                    "end_time": 10.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[1],
                      "motion_effect": "ken_burns_pan",
                      "runway_prompt": "Sunlight rays piercing through morning pine trees."
                    },
                    "overlay_text": {
                      "text": "SANTUARIO DE LUZ",
                      "position": "bottom"
                    },
                    "voiceover_script": "Un refugio tallado en piedra volcánica y madera viva de roble."
                  },
                  {
                    "id": "scene_03",
                    "start_time": 10.0,
                    "end_time": 15.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[2],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Warm ambient interior pan highlighting textures of stone and timber."
                    },
                    "overlay_text": {
                      "text": "COMENTA REFUGIO",
                      "position": "center"
                    },
                    "voiceover_script": "Comenta REFUGIO y coordinemos una experiencia sensorial privada."
                  }
                ]
            },
            "modern_architecture": {
                "voiceover_prompt": "Preciso, físico, enfocado en materiales. Voz analítica.",
                "scenes": [
                  {
                    "id": "scene_01",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[0],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Structural overview focusing on structural columns and joints."
                    },
                    "overlay_text": {
                      "text": "HONESTIDAD MATERIAL",
                      "position": "center"
                    },
                    "voiceover_script": "Esto no es decoración. Esto es honestidad material."
                  },
                  {
                    "id": "scene_02",
                    "start_time": 3.5,
                    "end_time": 10.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[1],
                      "motion_effect": "ken_burns_pan",
                      "runway_prompt": "Geometric perspective line movement along steel structure."
                    },
                    "overlay_text": {
                      "text": "TRANSICIÓN DE PLANOS",
                      "position": "bottom"
                    },
                    "voiceover_script": "Volumetrías expuestas. Planta libre y transiciones hacia la topografía natural."
                  },
                  {
                    "id": "scene_03",
                    "start_time": 10.0,
                    "end_time": 15.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[2],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Slow camera drift upwards highlighting industrial skylight."
                    },
                    "overlay_text": {
                      "text": "ESCRIBE BREGMA",
                      "position": "center"
                    },
                    "voiceover_script": "Escribe BREGMA y te enviamos los planos constructivos de la obra."
                  }
                ]
            },
            "investment_focused": {
                "voiceover_prompt": "Pragmático, seguro, financiero. Voz clara e institucional.",
                "scenes": [
                  {
                    "id": "scene_01",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[0],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "High-end urban street view panning to industrial loft facade."
                    },
                    "overlay_text": {
                      "text": "ACTIVO DEFENSIVO",
                      "position": "center"
                    },
                    "voiceover_script": "Preservación patrimonial a través del diseño de alta durabilidad."
                  },
                  {
                    "id": "scene_02",
                    "start_time": 3.5,
                    "end_time": 10.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[1],
                      "motion_effect": "ken_burns_pan",
                      "runway_prompt": "Interior sweep highlighting low maintenance steel and brick details."
                    },
                    "overlay_text": {
                      "text": "PLUSVALÍA ZONA 4",
                      "position": "bottom"
                    },
                    "voiceover_script": "Un dúplex industrial con nulo mantenimiento y alta tasa de capitalización."
                  },
                  {
                    "id": "scene_03",
                    "start_time": 10.0,
                    "end_time": 15.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[2],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "View from mezzanine focusing on study space."
                    },
                    "overlay_text": {
                      "text": "ESCRIBE ANALISIS",
                      "position": "center"
                    },
                    "voiceover_script": "Escribe ANALISIS y recibe la corrida financiera completa y proyecciones."
                  }
                ]
            },
            "airbnb_high_cashflow": {
                "voiceover_prompt": "Dinámico, entusiasta, enfocado en rentabilidad. Voz ágil.",
                "scenes": [
                  {
                    "id": "scene_01",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[0],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Dynamic push through the front door into industrial loft."
                    },
                    "overlay_text": {
                      "text": "DISEÑO ICONICO",
                      "position": "center"
                    },
                    "voiceover_script": "Un loft de doble altura configurado para rentabilidad inmediata."
                  },
                  {
                    "id": "scene_02",
                    "start_time": 3.5,
                    "end_time": 10.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[1],
                      "motion_effect": "ken_burns_pan",
                      "runway_prompt": "Slow pan over the aesthetic brick walls and balcony details."
                    },
                    "overlay_text": {
                      "text": "ALTA OCUPACIÓN",
                      "position": "bottom"
                    },
                    "voiceover_script": "Detalles instagrameables que maximizan el precio por noche en plataformas."
                  },
                  {
                    "id": "scene_03",
                    "start_time": 10.0,
                    "end_time": 15.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[2],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Cinematic tilt showing modern mezzanine bedroom styling."
                    },
                    "overlay_text": {
                      "text": "ESCRIBE CASHFLOW",
                      "position": "center"
                    },
                    "voiceover_script": "Escribe CASHFLOW y recibe el dossier de proyección turística completo."
                  }
                ]
            },
            "family_oriented": {
                "voiceover_prompt": "Cálido, familiar, seguro. Voz con cadencia suave y cercana.",
                "scenes": [
                  {
                    "id": "scene_01",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[0],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Slow slide across the main facade showing cozy lighting."
                    },
                    "overlay_text": {
                      "text": "UN LEGADO FAMILIAR",
                      "position": "center"
                    },
                    "voiceover_script": "Hay decisiones que se toman pensando en el mañana."
                  },
                  {
                    "id": "scene_02",
                    "start_time": 3.5,
                    "end_time": 10.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[1],
                      "motion_effect": "ken_burns_pan",
                      "runway_prompt": "Slow pan over the integrated kitchen and social areas."
                    },
                    "overlay_text": {
                      "text": "ENTORNO SEGURO",
                      "position": "bottom"
                    },
                    "voiceover_script": "Espacios integrados, áreas boscosas privadas y seguridad absoluta."
                  },
                  {
                    "id": "scene_03",
                    "start_time": 10.0,
                    "end_time": 15.0,
                    "asset": {
                      "source_type": "original_photo",
                      "file_path": images[2],
                      "motion_effect": "ken_burns_zoom",
                      "runway_prompt": "Cozy living room close up focusing on fire flames."
                    },
                    "overlay_text": {
                      "text": "COMENTA FAMILIA",
                      "position": "center"
                    },
                    "voiceover_script": "Comenta FAMILIA y hablemos de tu próximo hogar."
                  }
                ]
            }
        }

        active_content = tone_content.get(tone, tone_content["luxury_minimal"])
        
        return {
            "property_id": property_id,
            "tone_profile": tone,
            "duration_seconds": 15.0,
            "audio": {
                "voiceover_prompt": active_content["voiceover_prompt"],
                "background_track": "ambient_nordic_silence.mp3",
                "voice_id": "architect_male_es_01"
            },
            "scenes": active_content["scenes"]
        }
