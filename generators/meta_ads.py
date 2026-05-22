from core.llm_client import LLMClient
from core.prompter import Prompter

class MetaAdsGenerator:
    def __init__(self, provider=None, model=None, workspace_root=None):
        self.prompter = Prompter(workspace_root)
        self.llm = LLMClient(provider=provider, model=model, config_loader=self.prompter.loader)

    def generate(self, property_id, custom_instructions=None, tone_profile=None):
        """Generates premium Meta Ads variations focusing on distinct psychological angles and specs."""
        # Determine active tone
        prop_data = self.prompter.loader.get_property(property_id)
        active_tone = tone_profile or prop_data.get("default_tone", "luxury_minimal")

        # Compile system instructions using the 'ad-creative' marketing skill and active tone
        system_instruction = self.prompter.compile_system_instruction(
            marketing_skill_name="ad-creative",
            tone_profile=active_tone
        )
        
        # Build user prompt
        ad_instructions = """
You are requested to generate 3 distinct Meta Ads variations for this property. 
Each variation must focus on a completely different psychological angle (from the following list: Pain Point/Silence, Curiosity, or Contrarian/Educational).

For each variation, you must provide:
1. **Psychological Angle Name**
2. **Primary Text (125 characters visible hook, up to 1000 total)**: Ensure the key transformation or hook is fully visible before the "See More" cutoff at 125 characters. Include a link placeholder (e.g., `antigravity.realestate/property_id`).
3. **Headline (Max 40 characters)**: Positioned below the media, must be action-oriented or specific.
4. **Description (Max 30 characters)**: Supporting hook or proof point.
5. **CTA Button Recommendation** (e.g. Learn More, Book Now, Send Message).
6. **Annotation**: A one-line explanation of the direct-response psychology used.

Do not use emojis excessively (maximum 1 or 2 high-value ones). Do not use exclamation marks or empty hype words.
"""
        if custom_instructions:
            ad_instructions += f"\nAdditional guidelines: {custom_instructions}"
            
        user_prompt = self.prompter.compile_user_prompt(property_id, ad_instructions, tone_profile=active_tone)
        
        print(f"Generating Meta Ads for '{property_id}' [{active_tone}] using {self.llm.provider} ({self.llm.model})...")
        raw_output = self.llm.generate(user_prompt, system_instruction)
        return raw_output
