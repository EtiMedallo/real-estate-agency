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
}

// Scene rendering component with Ken Burns effect and text animations
const ReelScene: React.FC<{ scene: Scene; fps: number }> = ({ scene, fps }) => {
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
          {scene.overlay_text.position === "center" ? (
            <div className="m-auto text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.25em] text-white uppercase font-sans drop-shadow-md">
                {scene.overlay_text.text}
              </h2>
              <div className="h-[1px] w-12 bg-white/40 mx-auto mt-4" />
            </div>
          ) : (
            <div className="mt-auto mb-32 text-left">
              <span className="text-[10px] tracking-[0.3em] font-mono text-neutral-400 uppercase block mb-2">
                // SPATIAL DETAILS
              </span>
              <h2 className="text-xl md:text-2xl font-normal tracking-wide text-white uppercase font-sans drop-shadow-md">
                {scene.overlay_text.text}
              </h2>
            </div>
          )}
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
            <ReelScene scene={scene} fps={fps} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
