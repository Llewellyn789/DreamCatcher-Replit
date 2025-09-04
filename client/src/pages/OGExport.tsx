
import React, { useRef } from "react";
import { toPng } from "html-to-image";
import OGPreview from "../components/OGPreview";
import { Button } from "@/components/ui/button";

export default function OGExport() {
  const ref = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (ref.current) {
      try {
        const dataUrl = await toPng(ref.current, {
          quality: 1.0,
          pixelRatio: 1,
          width: 1200,
          height: 630
        });
        
        const link = document.createElement("a");
        link.download = "dreamcatcher-og.png";
        link.href = dataUrl;
        link.click();
        
        console.log("OG image exported successfully");
      } catch (error) {
        console.error("Failed to export OG image:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">OG Image Export</h1>
        
        <div className="mb-8 flex justify-center">
          <Button onClick={handleExport} size="lg">
            Export OG Image (1200×630px)
          </Button>
        </div>
        
        <div className="flex justify-center">
          <div 
            ref={ref}
            style={{
              transform: "scale(0.5)",
              transformOrigin: "center",
              border: "2px solid #ccc",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <OGPreview />
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Preview is scaled to 50% for display. Exported image will be full 1200×630px.</p>
        </div>
      </div>
    </div>
  );
}
