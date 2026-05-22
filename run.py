#!/usr/bin/env python3
import os
import sys
import argparse
from core.config_loader import ConfigLoader
from generators.meta_ads import MetaAdsGenerator
from generators.reels import ReelsGenerator
from generators.captions import CaptionsGenerator
from generators.storyboard import StoryboardGenerator


def main():
    parser = argparse.ArgumentParser(description="Antigravity Premium Real Estate Content Generator")
    parser.add_argument(
        "--property", 
        choices=["casa_bosque", "loft_industrial"], 
        default="casa_bosque",
        help="Select property ID to generate content for"
    )
    parser.add_argument(
        "--provider", 
        help="Override LLM provider (gemini, openai, anthropic)"
    )
    parser.add_argument(
        "--model", 
        help="Override specific LLM model"
    )
    parser.add_argument(
        "--tone",
        choices=[
            "luxury_minimal", 
            "luxury_emotional", 
            "investment_focused", 
            "airbnb_high_cashflow", 
            "family_oriented", 
            "modern_architecture"
        ],
        help="Explicitly choose or override the target brand tone profile"
    )
    parser.add_argument(
        "--compare",
        action="store_true",
        help="Generate comparative outputs under multiple tones for the same property"
    )
    
    args = parser.parse_args()
    
    # 1. Initialize config loader & load property details
    loader = ConfigLoader()
    try:
        property_data = loader.get_property(args.property)
    except Exception as e:
        print(f"[Error] Failed to load property: {e}")
        sys.exit(1)
        
    print("=" * 60)
    print(f"ANTIGRAVITY PREMIUM CONTENT GENERATION ENGINE")
    print(f"Target Property: {property_data.get('title')} ({property_data.get('location')})")
    print(f"Price: {property_data.get('price')}")
    print("=" * 60)
    
    # 2. Instantiate generators
    meta_gen = MetaAdsGenerator(provider=args.provider, model=args.model)
    reels_gen = ReelsGenerator(provider=args.provider, model=args.model)
    captions_gen = CaptionsGenerator(provider=args.provider, model=args.model)
    storyboard_gen = StoryboardGenerator(provider=args.provider, model=args.model)

    
    output_dir = os.path.join(loader.workspace_root, "output")
    os.makedirs(output_dir, exist_ok=True)

    # 3. Handle Comparative Generation Mode
    if args.compare:
        # Determine 3 tone profiles to compare based on property type
        if args.property == "casa_bosque":
            compare_tones = ["luxury_minimal", "luxury_emotional", "modern_architecture"]
        else:
            compare_tones = ["modern_architecture", "investment_focused", "airbnb_high_cashflow"]
            
        print(f"COMPARATIVE MODE ACTIVE: Generating content under 3 different tones:")
        print(f"  Tones: {', '.join(compare_tones)}")
        print("=" * 60)
        
        comparison_blocks = []
        for t in compare_tones:
            print(f"\n--- Running Tone Profile: {t.upper().replace('_', ' ')} ---")
            
            # Generate Meta Ads
            m_out = meta_gen.generate(args.property, tone_profile=t)

            # Generate Reels
            r_out = reels_gen.generate(args.property, tone_profile=t)
            
            # Generate Captions
            c_out = captions_gen.generate(args.property, tone_profile=t)
            
            block = f"""## TONE PROFILE COMPARISON: {t.upper().replace('_', ' ')}
            
### 📢 PERFORMANCE META ADS
{m_out}

### 🎥 REELS / SHORT VIDEO SCRIPT
{r_out}

### ✍️ ORGANIC SOCIAL CAPTION
{c_out}

{"=" * 40}
"""
            comparison_blocks.append(block)

            
        # Compile comparison markdown file
        comparison_content = f"""# TONE POSITIONING SHOWCASE: {property_data.get('title').upper()}
**Property Type:** {property_data.get('type')}  
**Location:** {property_data.get('location')}  
**Price:** {property_data.get('price')}  

This showcase demonstrates how the *exact same property* changes its pacing, triggers, vocabulary, and calls-to-action under three completely different tone profiles.

---

{chr(10).join(comparison_blocks)}
"""
        output_path = os.path.join(output_dir, f"{args.property}_comparison.md")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(comparison_content)
            
        print("=" * 60)
        print(f"Comparison generation complete!")
        print(f"Showcase written successfully to:")
        print(f"  {output_path}")
        print("=" * 60)
        return

    # 4. Standard Single Tone Mode
    active_tone = args.tone or property_data.get("default_tone", "luxury_minimal")
    print(f"Active Tone Profile: {active_tone.upper().replace('_', ' ')}")
    print("=" * 60)

    # Generate all assets
    meta_ads_output = meta_gen.generate(args.property, tone_profile=active_tone)
    print("✓ Meta Ads generated successfully.")
    
    reels_output = reels_gen.generate(args.property, tone_profile=active_tone)
    print("✓ Reels Script generated successfully.")
    
    captions_output = captions_gen.generate(args.property, tone_profile=active_tone)
    print("✓ Social Captions generated successfully.")

    storyboard_gen.generate(args.property, tone_profile=active_tone)
    print("✓ Storyboard JSON generated successfully.")

    
    # Compile final markdown file
    output_content = f"""# PREMIUM MARKETING SUITE: {property_data.get('title').upper()}
**Location:** {property_data.get('location')}  
**Price:** {property_data.get('price')}  
**Active Tone Profile:** `{active_tone}`
**Generated using:** Provider: `{meta_gen.llm.provider}`, Model: `{meta_gen.llm.model}`  

---

# SECTION 1: PERFORMANCE META ADS
{meta_ads_output}

---

# SECTION 2: VERTICAL VIDEO & REELS SCRIPT
{reels_output}

---

# SECTION 3: ORGANIC SOCIAL CAPTIONS & SCROLL-STOPPERS
{captions_output}
"""

    output_path = os.path.join(output_dir, f"{args.property}_{active_tone}_content.md")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output_content)
        
    print("=" * 60)
    print(f"Generation Complete!")
    print(f"All premium assets written successfully to:")
    print(f"  {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()

