from core.llm_client import LLMClient
from core.prompter import Prompter

class CaptionsGenerator:
    def __init__(self, provider=None, model=None, workspace_root=None):
        self.prompter = Prompter(workspace_root)
        self.llm = LLMClient(provider=provider, model=model, config_loader=self.prompter.loader)

    def generate(self, property_id, custom_instructions=None, tone_profile=None):
        """Generates premium organic captions and scroll-stopping hooks."""
        # Determine active tone
        prop_data = self.prompter.loader.get_property(property_id)
        active_tone = tone_profile or prop_data.get("default_tone", "luxury_minimal")

        # Compile system instructions using the 'social' marketing skill and active tone
        system_instruction = self.prompter.compile_system_instruction(
            marketing_skill_name="social",
            tone_profile=active_tone
        )
        
        # Build user prompt
        caption_instructions = """
You are requested to generate organic social captions and hooks for this premium listing.

Your output must contain these exact sections:
1. **Three Scroll-Stopping Hooks**:
   - **Hook 1 (Curiosity-based)**: Focuses on an architectural mystery or hidden detail.
   - **Hook 2 (Contrarian/Opinion-based)**: Attacks a common real estate belief or cliché.
   - **Hook 3 (Direct Value-based)**: Highlights the specific transformation of the property.
2. **Organic Social Caption**:
   - Written in a premium, clean style.
   - No generic descriptions. Describe the concrete physical reality (materials, light, atmosphere).
   - Structured into clean paragraphs with ample white space.
   - Incorporates a direct message (DM) call-to-action (use the exact organic DM trigger specified in the brand positioning profile).
3. **Direct CTA & Meta Metadata**:
   - Actionable direct link/contact details.
   - 3-5 clean, high-value, highly specific hashtags (no generic ones like #luxury).

Apply the Beautiful Prose skill strictly. Make it feel elite, calm, and highly authoritative.
"""
        if custom_instructions:
            caption_instructions += f"\nAdditional guidelines: {custom_instructions}"
            
        user_prompt = self.prompter.compile_user_prompt(property_id, caption_instructions, tone_profile=active_tone)
        
        print(f"Generating Social Captions for '{property_id}' [{active_tone}] using {self.llm.provider} ({self.llm.model})...")
        raw_output = self.llm.generate(user_prompt, system_instruction)
        return raw_output

