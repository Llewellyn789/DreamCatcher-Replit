
import React from "react";

export default function OGPreview() {
  return (
    <div
      id="og-card"
      style={{
        width: "1200px",
        height: "630px",
        background: "linear-gradient(135deg, #0B1426 0%, #1A2332 50%, #2D3748 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#FFD700",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Stars background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 40% 70%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)`
      }} />
      
      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center"
      }}>
        <h1 style={{ 
          fontSize: "72px", 
          fontWeight: "bold", 
          marginBottom: "20px",
          background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          DreamCatcher
        </h1>
        
        {/* Dreamcatcher symbol */}
        <div style={{
          width: "120px",
          height: "120px",
          border: "3px solid #FFD700",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "30px",
          background: "rgba(255, 215, 0, 0.1)",
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: "conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "#0B1426",
              borderRadius: "50%"
            }} />
          </div>
        </div>
        
        <p style={{ 
          fontSize: "24px", 
          color: "#E2E8F0",
          fontWeight: "500",
          marginBottom: "10px"
        }}>
          Record & Explore Your Dreams
        </p>
        
        <p style={{ 
          fontSize: "18px", 
          color: "#94A3B8",
          fontWeight: "400"
        }}>
          A private, AI-powered dream journal that helps you uncover insights and archetypes.
        </p>
      </div>
    </div>
  );
}
