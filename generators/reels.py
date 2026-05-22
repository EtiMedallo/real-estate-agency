from core.llm_client import LLMClient
from core.prompter import Prompter

class ReelsGenerator:
    def __init__(self, provider=None, model=None, workspace_root=None):
        self.prompter = Prompter(workspace_root)
        self.llm = LLMClient(provider=provider, model=model, config_loader=self.prompter.loader)

    def generate(self, property_id, custom_instructions=None, tone_profile=None):
        """Generates premium vertical video scripts (Reels) using the video direct-response framework."""
        # Determine active tone
        prop_data = self.prompter.loader.get_property(property_id)
        active_tone = tone_profile or prop_data.get("default_tone", "luxury_minimal")

        # Compile system instructions using the 'video' marketing skill and active tone
        system_instruction = self.prompter.compile_system_instruction(
            marketing_skill_name="video",
            tone_profile=active_tone
        )
        
        # Build user prompt
        script_instructions = """
You are requested to generate a premium short vertical script (Reels/TikTok, 9:16 format, 30 seconds max) for this property.

Your output must contain these exact sections:
1. **Vertical Video Concept**: A one-line summary of the creative direction.
2. **The 3-Second Hook Protocol**:
   - **Visual Hook**: Action starting in frame 1 (e.g. hands turning black key, doors sliding open).
   - **Verbal Hook**: The spoken first sentence (must stop the scroll, direct, no clichés).
   - **Text Overlay**: Bold, punchy capitalization on screen.
3. **Structured Script Table (Time-Cued)**:
   Provide a flow of scenes, ensuring every scene specifies:
   - **Visuals / B-roll**: Extremely specific, camera direction, lighting, materials, and concrete nouns.
   - **Voiceover Text**: Exactly what is spoken. Keep it sparse and forceful.
   - **On-Screen Text**: Quick subtitle phrases.
4. **AI Video Prompt Cues (for B-roll generation)**:
   Provide 2 exact text-to-video prompts (e.g. for Runway or Sora) to generate the custom B-roll, specifying subject, camera angle, speed, lighting, and cinematic mood.

Apply the Beautiful Prose skill strictly. No generic descriptions. No robotic voice.
"""
        if custom_instructions:
            script_instructions += f"\nAdditional guidelines: {custom_instructions}"
            
        user_prompt = self.prompter.compile_user_prompt(property_id, script_instructions, tone_profile=active_tone)
        
        print(f"Generating Reels Script for '{property_id}' [{active_tone}] using {self.llm.provider} ({self.llm.model})...")
        raw_output = self.llm.generate(user_prompt, system_instruction)
        return raw_output

