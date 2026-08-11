"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, type ComponentProps } from "react";
import { useSceneRuntime } from "./SceneRuntime";

type SceneCanvasProps = Omit<ComponentProps<typeof Canvas>, "dpr" | "frameloop">;

function RenderOnResume({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

/** Ortak R3F bütçesi: talep üzerine çiz, görünmezken dur, cihaza göre DPR seç. */
export function SceneCanvas({ children, ...props }: SceneCanvasProps) {
  const { active, dpr } = useSceneRuntime();

  return (
    <Canvas
      {...props}
      dpr={dpr}
      frameloop={active ? "demand" : "never"}
      data-scene-active={active ? "true" : "false"}
      data-scene-dpr={dpr}
    >
      <RenderOnResume active={active} />
      {children}
    </Canvas>
  );
}
