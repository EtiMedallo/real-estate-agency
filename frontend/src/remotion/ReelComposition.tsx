import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Audio,
} from "remotion";

export interface SceneAsset {
  source_type: string;
  file_path: string;
  motion_effect: string;
  runway_prompt?: string;
}

export interface Scene {
  id: string;
  start_time: number;
  end_time: number;
  asset: SceneAsset;
  overlay_text?: {
    text: string;
    position: string;
  };
  voiceover_script?: string;
}

export interface StoryboardData {
  property_id: string;
  tone_profile: string;
  duration_seconds: number;
  audio?: {
    background_track?: string;
    voiceover_prompt?: string;
  };
  scenes: Scene[];
  settings?: {
    fontSize: "small" | "medium" | "large";
    fontFamily: "modern" | "elegant" | "bold" | "minimalist";
  };
}

// Scene rendering component with Ken Burns effect and text animations
const ReelScene: React.FC<{
  scene: Scene;
  fps: number;
  settings?: StoryboardData["settings"];
}> = ({ scene, fps, settings }) => {
  const frame = useCurrentFrame();
  const durationFrames = (scene.end_time - scene.start_time) * fps;

  // 1. Calculate Ken Burns zoom/pan effect based on scene settings
  let transformStyle = "";
  if (scene.asset.motion_effect === "ken_burns_pan") {
    const translateX = interpolate(frame, [0, durationFrames], [-20, 20], {
      extrapolateRight: "clamp",
    });
    const scale = interpolate(frame, [0, durationFrames], [1.15, 1.15], {
      extrapolateRight: "clamp",
    });
    transformStyle = `scale(${scale}) translateX(${translateX}px)`;
  } else {
    // Default: Ken Burns Zoom In
    const scale = interpolate(frame, [0, durationFrames], [1.0, 1.15], {
      extrapolateRight: "clamp",
    });
    transformStyle = `scale(${scale})`;
  }

  // 2. Text fade-in / fade-out animations (fade in over 12 frames, fade out over 12 frames)
  const textOpacity = interpolate(
    frame,
    [0, 12, durationFrames - 12, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill className="bg-black overflow-hidden">
      {/* Background Visual Asset */}
      <div
        className="w-full h-full bg-cover bg-center transition-transform duration-75"
        style={{
          backgroundImage: `url(${scene.asset.file_path})`,
          transform: transformStyle,
        }}
      />

      {/* Aesthetic dark vignetting overlay for cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

      {/* Kinetic Typography Overlays */}
      {scene.overlay_text && (
        <div
          className="absolute inset-0 flex flex-col px-8 pointer-events-none select-none"
          style={{ opacity: textOpacity }}
        >
          {(() => {
            const activeSettings = {
              fontSize: "medium" as const,
              fontFamily: "modern" as const,
              ...settings
            };

            const sizeMap = {
              small: "scale-75",
              medium: "scale-100",
              large: "scale-125",
            };

            const fontMap = {
              modern: "font-sans font-light tracking-[0.2em]",
              elegant: "font-serif italic tracking-normal",
              bold: "font-sans font-black tracking-tight",
              minimalist: "font-sans font-extralight tracking-[0.4em]",
            };

            const sizeClass = sizeMap[activeSettings.fontSize] || "scale-100";
            const fontClass = fontMap[activeSettings.fontFamily] || fontMap.modern;

            return scene.overlay_text.position === "center" ? (
              <div className={`m-auto text-center space-y-2 origin-center ${sizeClass}`}>
                <h2 className={`text-2xl md:text-3xl text-white uppercase drop-shadow-md lg:text-5xl ${fontClass}`}>
                  {scene.overlay_text.text}
                </h2>
                <div className="h-[1px] w-12 bg-white/40 mx-auto mt-4" />
              </div>
            ) : (
              <div className={`mt-auto mb-32 text-left origin-left ${sizeClass}`}>
                <span className="text-[10px] tracking-[0.3em] font-mono text-neutral-400 uppercase block mb-2">
                  // SPATIAL DETAILS
                </span>
                <h2 className={`text-xl md:text-2xl text-white uppercase drop-shadow-md lg:text-4xl ${fontClass}`}>
                  {scene.overlay_text.text}
                </h2>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tiny cinematic frame border */}
      <div className="absolute inset-4 border border-white/5 pointer-events-none" />
    </AbsoluteFill>
  );
};

export const ReelComposition: React.FC<{ storyboard: StoryboardData }> = ({
  storyboard,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="bg-black">
      {/* Background Music Loop */}
      {storyboard.audio?.background_track && (
        <Audio
          src={`/audio/${storyboard.audio.background_track}`}
          volume={0.15} // Ambient volume level
        />
      )}

      {/* Render Scenes in Sequence */}
      {storyboard.scenes.map((scene) => {
        const startFrame = Math.round(scene.start_time * fps);
        const durationFrames = Math.round((scene.end_time - scene.start_time) * fps);

        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <ReelScene scene={scene} fps={fps} settings={storyboard.settings} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
