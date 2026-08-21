import React, { useState, useEffect } from "react";
import { COMPANIONS_DATA, getCompanionById } from "../data/companions";

export type NarratorSize = "floating" | "speech" | "achievement" | "celebration" | "icon" | "custom";
export type NarratorAnimation = "float" | "bounce" | "wave" | "blink" | "fade" | "slide" | "jump" | "none";

interface NarratorProps {
  size?: NarratorSize;
  animation?: NarratorAnimation;
  className?: string;
  style?: React.CSSProperties;
  companionId?: string; // Optional override to force-render a specific companion
}

export function Narrator({
  size = "floating",
  animation = "float",
  className = "",
  style = {},
  companionId,
}: NarratorProps) {
  const [activeCompanion, setActiveCompanion] = useState("waguri");
  const [customImg, setCustomImg] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Refresh setting from localStorage
  const refresh = () => {
    if (companionId) {
      setActiveCompanion(companionId);
    } else {
      const stored = localStorage.getItem("cashtrack_selected_companion") || "waguri";
      setActiveCompanion(stored);
    }
    const img = localStorage.getItem("cashtrack_custom_companion_img");
    setCustomImg(img);
    setHasError(false); // Reset error state on settings change
  };

  useEffect(() => {
    refresh();
    window.addEventListener("cashtrack_companion_updated", refresh);
    window.addEventListener("cashtrack_companion_settings_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cashtrack_companion_updated", refresh);
      window.removeEventListener("cashtrack_companion_settings_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [companionId]);

  // Handle companion fallback if image loading fails
  const handleError = () => {
    setHasError(true);
  };

  // Determine correct image URL
  const targetId = companionId || activeCompanion;
  let imgSrc = "/assets/narrator/waguri.png";

  if (!hasError) {
    if (targetId === "custom" && customImg) {
      imgSrc = customImg;
    } else {
      const comp = getCompanionById(targetId);
      if (comp && comp.image) {
        imgSrc = comp.image;
      }
    }
  }

  // Size mapping
  let sizeStyle: React.CSSProperties = {};
  switch (size) {
    case "icon":
      sizeStyle = { height: "40px", width: "40px" };
      break;
    case "floating":
      sizeStyle = { height: "85px", width: "85px" };
      break;
    case "speech":
      sizeStyle = { height: "120px", width: "120px" };
      break;
    case "achievement":
      sizeStyle = { height: "180px", width: "180px" };
      break;
    case "celebration":
      sizeStyle = { height: "260px", width: "260px" };
      break;
    case "custom":
    default:
      sizeStyle = {};
      break;
  }

  // Animation mapping using CSS class
  let animClass = "";
  switch (animation) {
    case "float":
      animClass = "animate-narrator-float";
      break;
    case "bounce":
      animClass = "animate-narrator-bounce";
      break;
    case "wave":
      animClass = "animate-narrator-wave";
      break;
    case "blink":
      animClass = "animate-narrator-blink";
      break;
    case "fade":
      animClass = "animate-narrator-fade";
      break;
    case "slide":
      animClass = "animate-narrator-slide";
      break;
    case "jump":
      animClass = "animate-narrator-jump";
      break;
    case "none":
    default:
      animClass = "";
      break;
  }

  return (
    <>
      <style>{`
        @keyframes narrFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes narrBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes narrWave {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes narrBlink {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.035); }
        }
        @keyframes narrFade {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        @keyframes narrSlide {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes narrJump {
          0%, 100% { transform: translateY(0) scaleY(1); }
          40% { transform: translateY(-24px) scaleY(1.08); }
          65% { transform: translateY(0) scaleY(0.92); }
        }
        .animate-narrator-float { animation: narrFloat 3s ease-in-out infinite; }
        .animate-narrator-bounce { animation: narrBounce 1.6s ease-in-out infinite; }
        .animate-narrator-wave { animation: narrWave 1.2s ease-in-out infinite; }
        .animate-narrator-blink { animation: narrBlink 2.2s ease-in-out infinite; }
        .animate-narrator-fade { animation: narrFade 1.8s ease-in-out infinite; }
        .animate-narrator-slide { animation: narrSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-narrator-jump { animation: narrJump 0.8s ease-in-out infinite; }

        body.is-scrolling .animate-narrator-float,
        body.is-scrolling .animate-narrator-bounce,
        body.is-scrolling .animate-narrator-wave,
        body.is-scrolling .animate-narrator-blink,
        body.is-scrolling .animate-narrator-fade,
        body.is-scrolling .animate-narrator-slide,
        body.is-scrolling .animate-narrator-jump {
          animation-play-state: paused !important;
        }
      `}</style>

      <img
        src={imgSrc}
        alt="Companion Narrator"
        loading="lazy"
        onError={handleError}
        className={`${animClass} ${className} object-contain transition-colors duration-300 select-none`}
        style={{
          ...sizeStyle,
          ...style,
        }}
        referrerPolicy="no-referrer"
      />
    </>
  );
}

export default React.memo(Narrator);
