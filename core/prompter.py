import os
from .config_loader import ConfigLoader

class Prompter:
    def __init__(self, workspace_root=None, config_loader=None):
        self.loader = config_loader or ConfigLoader(workspace_root)
        self.workspace_root = self.loader.workspace_root
        
        # Paths to skills
        self.skills_dir = os.path.join(self.workspace_root, ".agent", "skills")
        self.beautiful_prose_path = os.path.join(self.skills_dir, "beautiful_prose", "SKILL.md")
        self.marketing_skills_dir = os.path.join(self.skills_dir, "marketingskills")

    def _read_skill_file(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required agent skill file not found at: {path}")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            # Strip YAML frontmatter if present
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    return parts[2].strip()
            return content.strip()

    def get_beautiful_prose_instructions(self, register=None, density=None, heat=None, length=None):
        """Compiles the beautiful prose instructions with optional control parameters."""
        raw_instructions = self._read_skill_file(self.beautiful_prose_path)
        
        # Load brand defaults from settings
        settings = self.loader.load_settings()
        prose_defaults = settings.get("brand", {}).get("default_beautiful_prose", {})
        
        reg = register or prose_defaults.get("register", "literary_modern")
        den = density or prose_defaults.get("density", "standard")
        ht = heat or prose_defaults.get("heat", "warm")
        lng = length or prose_defaults.get("length", "medium")

        style_headers = [
            "Apply the Beautiful Prose skill.",
            f"REGISTER: {reg}",
            f"DENSITY: {den}",
            f"HEAT: {ht}",
            f"LENGTH: {lng}",
            "\n"
        ]
        
        return "\n".join(style_headers) + raw_instructions

    def get_marketing_instructions(self, skill_name):
        """Loads a specific marketing skill (e.g. copywriting, social, video, ad-creative)."""
        skill_path = os.path.join(self.marketing_skills_dir, skill_name, "SKILL.md")
        return self._read_skill_file(skill_path)

    def compile_system_instruction(self, marketing_skill_name, tone_profile=None):
        """Blends direct-response marketing frameworks, beautiful prose, and tone profiles into system instructions."""
        settings = self.loader.load_settings()
        tone_config = {}
        
        # Load specific tone profile if provided
        if tone_profile and "tone_profiles" in settings and tone_profile in settings["tone_profiles"]:
            tone_config = settings["tone_profiles"][tone_profile]
        
        # Extract beautiful prose params from tone profile or defaults
        prose_params = tone_config.get("beautiful_prose", {})
        
        prose_rules = self.get_beautiful_prose_instructions(
            register=prose_params.get("register"),
            density=prose_params.get("density"),
            heat=prose_params.get("heat"),
            length=prose_params.get("length")
        )
        
        marketing_rules = self.get_marketing_instructions(marketing_skill_name)
        
        # Build System Instruction
        system_instruction = f"""# ROLE AND MISSION
You are a premium real estate content strategist and copywriter. Your goal is to produce elite marketing copy that resonates with design-conscious, high-intent buyers, completely avoiding typical "AI slop."

# SYSTEM CONTRACT 1: STYLE & WRITING PROTOCOL (BEAUTIFUL PROSE)
You must follow these strict writing rules. Any violation (such as therapeutic voice, symmetry padding, or banned transition phrases) is considered a failure.
{prose_rules}

# SYSTEM CONTRACT 2: CONVERSION & STRUCTURE PROTOCOLS ({marketing_skill_name.upper()})
To structure the content, apply these strategic direct-response and conversion frameworks:
{marketing_rules}
"""

        # Inject dynamic brand voice and positioning profile if active
        if tone_config:
            vocab_list = "\n".join([f"  - \"{w}\"" for w in tone_config.get("vocabulary", [])])
            system_instruction += f"""
# SYSTEM CONTRACT 3: BRAND TONE & POSITIONING PROFILE
You must write specifically under this positioning profile:
* **ACTIVE TONE:** {tone_profile.upper().replace('_', ' ')}
* **PSYCHOLOGICAL TRIGGERS:** {tone_config.get('triggers', '')}
* **PACING & CADENCE:** {tone_config.get('pacing', '')}
* **MANDATORY VOCABULARY FOCUS (Integrate these precise words organically into your prose, avoiding any generic synonyms):**
{vocab_list}
* **ORGANIC CALL TO ACTION / DM TRIGGER (Use exactly this CTA for your organic captions/hooks section):**
  "{tone_config.get('cta', '')}"
"""
        return system_instruction

    def compile_user_prompt(self, property_id, custom_instructions=None, tone_profile=None):
        """Formats the properties config into a clean structured prompt for the LLM."""
        prop_data = self.loader.get_property(property_id)
        
        # Determine target tone profile
        active_tone = tone_profile or prop_data.get("default_tone", "luxury_minimal")
        
        # Format the property specs into a clean structured markdown block
        prop_block = f"""# PROPERTY DATA SHEET
ID: {prop_data.get('id')}
Title: {prop_data.get('title')}
Type: {prop_data.get('type')}
Location: {prop_data.get('location')}
Price: {prop_data.get('price')}
Target Tone Profile: {active_tone}

## DIMENSIONS
Built: {prop_data.get('dimensions', {}).get('built', 'N/A')}
Lot/Levels: {prop_data.get('dimensions', {}).get('lot') or prop_data.get('dimensions', {}).get('levels', 'N/A')}

## SPECIFICATIONS
Bedrooms: {prop_data.get('specs', {}).get('bedrooms')}
Bathrooms: {prop_data.get('specs', {}).get('bathrooms')}
Parking: {prop_data.get('specs', {}).get('parking')}

## PREMIUM MATERIALS
{chr(10).join([f'- {m}' for m in prop_data.get('materials', [])])}

## UNIQUE FEATURES
{chr(10).join([f'- {f}' for f in prop_data.get('unique_features', [])])}

## BRAND NARRATIVE
Hook Angle: {prop_data.get('brand_narrative', {}).get('hook_angle')}
Target Audience: {prop_data.get('brand_narrative', {}).get('target_audience')}
Transformation: {prop_data.get('brand_narrative', {}).get('transformation')}
"""

        user_prompt = f"""{prop_block}

# GENERATION REQUEST
Using the property data above, generate premium, direct-response copy that adheres strictly to your active tone profile and system contracts.
"""
        
        if custom_instructions:
            user_prompt += f"\n## CUSTOM USER INSTRUCTIONS\n{custom_instructions}\n"
            
        return user_prompt

