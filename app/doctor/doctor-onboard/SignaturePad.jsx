// app/doctor/doctor-onboard/SignaturePad.jsx
//
// Touch- and mouse-friendly canvas signature pad. The parent passes a `ref`
// (created with useRef) that the pad attaches helpers to:
//
//   const sigRef = useRef();
//   <SignaturePad refHandle={sigRef} />
//   const dataUrl = sigRef.current.getDataUrl();
//   const isEmpty  = sigRef.current.isEmpty();
//   sigRef.current.clear();
//
// Output is a PNG data URL, sized to the canvas's logical resolution.

"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

export default function SignaturePad({
  refHandle,
  width = 600,
  height = 180,
  onChange,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const dirtyRef = useRef(false);
  const [empty, setEmpty] = useState(true);

  // Expose imperative helpers up to the parent.
  useImperativeHandle(
    refHandle,
    () => ({
      getDataUrl: () => {
        if (!canvasRef.current || dirtyRef.current === false) return "";
        return canvasRef.current.toDataURL("image/png");
      },
      isEmpty: () => !dirtyRef.current,
      clear: () => {
        clearCanvas();
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
    // White background so the PNG isn't transparent.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = canvas.width / width;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
    dirtyRef.current = false;
    setEmpty(true);
    onChange?.();
  }

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function onPointerDown(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = getPos(e);
    // Draw a starting dot so a quick tap still leaves a mark.
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(lastRef.current.x, lastRef.current.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    dirtyRef.current = true;
    if (empty) {
      setEmpty(false);
      onChange?.();
    }
  }

  function onPointerMove(e) {
    if (!drawingRef.current) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
  }

  function onPointerUp() {
    drawingRef.current = false;
  }

  return (
    <div className="sigPad">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height,
          touchAction: "none",
          background: "white",
          borderRadius: 10,
          border: "1px solid var(--color-border)",
          cursor: "crosshair",
          display: "block",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label="Signature drawing pad"
      />
      <div style={padFooter}>
        <span style={padHint}>
          {empty ? "Sign above with your mouse or finger" : "Looks good."}
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          style={padBtn}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

const padFooter = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 6,
  fontSize: 12,
  color: "var(--color-text-soft, #8a9a9e)",
};

const padHint = { flex: 1 };

const padBtn = {
  background: "transparent",
  border: "1px solid var(--color-border, #e5e0d8)",
  borderRadius: 8,
  padding: "5px 10px",
  cursor: "pointer",
  font: "inherit",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-muted, #5c6b73)",
};
