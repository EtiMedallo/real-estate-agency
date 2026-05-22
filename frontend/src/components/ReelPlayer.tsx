"use client";

import React from "react";
import { Player } from "@remotion/player";
import { ReelComposition, StoryboardData } from "../remotion/ReelComposition";

export interface ReelPlayerProps {
  storyboard: StoryboardData;
}

export const ReelPlayer: React.FC<ReelPlayerProps> = ({ storyboard }) => {
  const durationInFrames = Math.round(storyboard.duration_seconds * 30); // 30 FPS default

  return (
    <div className="w-full max-w-[360px] mx-auto bg-[#080808] border border-[#1a1a1a] rounded-xl p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#161616] pb-2 text-[10px] text-neutral-400 font-mono">
        <span>PREVIEW EDITORIAL (9:16)</span>
        <span className="text-white bg-[#161616] px-1.5 py-0.5 rounded font-bold">1080x1920</span>
      </div>

      <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden border border-[#222222] bg-black shadow-2xl">
        <Player
          component={ReelComposition}
          inputProps={{ storyboard }}
          durationInFrames={durationInFrames}
          fps={30}
          compositionWidth={1080}
          compositionHeight={1920}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls
          loop
        />
      </div>
      <div className="text-[10px] text-neutral-500 font-mono text-center leading-relaxed">
        Pista: {storyboard.audio?.background_track || "Ninguna"} | Tono: {storyboard.tone_profile}
      </div>
    </div>
  );
};

export default ReelPlayer;
