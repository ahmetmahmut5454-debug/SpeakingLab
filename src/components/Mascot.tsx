import React from "react";
import { motion } from "motion/react";

interface MascotProps {
  outfit?: string;
  className?: string;
}

export const Mascot = ({
  outfit = "outfit_default",
  className = "",
}: MascotProps) => {
  // Using a nice 3D/clay look avatar API or specific 3D Unsplash image
  const baseImg =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256&h=256";

  return (
    <div className={`relative \${className}`}>
      <img
        src={baseImg}
        alt="Mascot"
        className="w-full h-full object-cover rounded-full shadow-inner"
      />

      {/* Overlay Outfits Using CSS Emoji/Icons as "3D" props with drop shadows */}
      {outfit === "outfit_glasses" && (
        <span
          className="absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl drop-shadow-xl"
          style={{ filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.5))" }}
        >
          🕶️
        </span>
      )}
      {outfit === "outfit_cap" && (
        <span
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl drop-shadow-xl"
          style={{ filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.5))" }}
        >
          🧢
        </span>
      )}
      {outfit === "outfit_crown" && (
        <span
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl drop-shadow-xl"
          style={{ filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.5))" }}
        >
          👑
        </span>
      )}
    </div>
  );
};
