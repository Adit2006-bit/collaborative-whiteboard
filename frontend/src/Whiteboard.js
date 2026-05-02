import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";
import axios from "axios";
import jsPDF from "jspdf";
import socket from "./socket";

const API_URL = "https://collaborative-whiteboard-backend-3aio.onrender.com";

export default function Whiteboard({ boardId, permission, onBack }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const updateTimeout = useRef(null);

  useEffect(() => {
    if (fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight - 110,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    if (permission === "edit") {
      enableDrawingBrush(canvas, "#000000", 3);
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = false;
    }

    socket.emit("join-board", boardId);

    const loadBoard = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/boards/${boardId}`);

        if (res.data.canvasData && Object.keys(res.data.canvasData).length > 0) {
          isRemoteUpdate.current = true;

          canvas.loadFromJSON(res.data.canvasData, () => {
            canvas.requestRenderAll();
            setTimeout(() => {
              isRemoteUpdate.current = false;
            }, 200);
          });
        }
      } catch (error) {
        console.log("Board loading error:", error);
      }
    };

    const sendUpdate = () => {
      if (permission !== "edit") return;
      if (isRemoteUpdate.current) return;

      clearTimeout(updateTimeout.current);

      updateTimeout.current = setTimeout(() => {
        socket.emit("canvas-update", {
          boardId,
          canvasData: canvas.toJSON(),
        });
      }, 150);
    };

    const handleReceiveUpdate = (canvasData) => {
      if (!canvasData) return;

      isRemoteUpdate.current = true;

      canvas.loadFromJSON(canvasData, () => {
        canvas.requestRenderAll();
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 250);
      });
    };

    canvas.on("path:created", sendUpdate);
    canvas.on("object:modified", sendUpdate);
    canvas.on("object:removed", sendUpdate);
    canvas.on("text:changed", sendUpdate);

    socket.on("receive-update", handleReceiveUpdate);

    loadBoard();

    const autoSave = setInterval(async () => {
      try {
        await axios.post(`${API_URL}/api/boards/${boardId}/save`, {
          canvasData: canvas.toJSON(),
        });
        console.log("Board auto-saved");
      } catch (error) {
        console.log("Auto-save error:", error);
      }
    }, 30000);

    return () => {
      clearInterval(autoSave);
      clearTimeout(updateTimeout.current);

      socket.off("receive-update", handleReceiveUpdate);

      canvas.off("path:created", sendUpdate);
      canvas.off("object:modified", sendUpdate);
      canvas.off("object:removed", sendUpdate);
      canvas.off("text:changed", sendUpdate);

      try {
        canvas.dispose();
      } catch (error) {
        console.log("Canvas dispose ignored");
      }

      fabricCanvasRef.current = null;
    };
  }, [boardId, permission]);

  const enableDrawingBrush = (canvas, color, width) => {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = width;
  };

  const sendManualUpdate = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    socket.emit("canvas-update", {
      boardId,
      canvasData: canvas.toJSON(),
    });
  };

  const enablePen = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    enableDrawingBrush(canvas, "#000000", 3);
  };

  const enableEraser = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    // White brush works like eraser on white background
    enableDrawingBrush(canvas, "#ffffff", 18);
  };

  const addRectangle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    canvas.isDrawingMode = false;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 160,
      height: 100,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 2,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    sendManualUpdate();
  };

  const addCircle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    canvas.isDrawingMode = false;

    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 60,
      fill: "transparent",
      stroke: "black",
      strokeWidth: 2,
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
    sendManualUpdate();
  };

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    canvas.isDrawingMode = false;

    const text = new fabric.IText("Type here", {
      left: 200,
      top: 200,
      fontSize: 24,
      fill: "black",
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.requestRenderAll();
    sendManualUpdate();
  };

  const addStickyNote = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    canvas.isDrawingMode = false;

    const note = new fabric.Textbox("Write your note here...", {
      left: 250,
      top: 250,
      width: 220,
      fontSize: 18,
      fill: "#000000",
      backgroundColor: "#fff59d",
      padding: 15,
      editable: true,
    });

    canvas.add(note);
    canvas.setActiveObject(note);
    note.enterEditing();
    canvas.requestRenderAll();
    sendManualUpdate();
  };

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || permission !== "edit") return;

    canvas.getObjects().forEach((obj) => canvas.remove(obj));
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
    sendManualUpdate();
  };

  const saveBoard = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    await axios.post(`${API_URL}/api/boards/${boardId}/save`, {
      canvasData: canvas.toJSON(),
    });

    alert("Board saved successfully");
  };

  const exportPNG = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    const link = document.createElement("a");
    link.href = image;
    link.download = "whiteboard.png";
    link.click();
  };

  const exportPDF = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    const pdf = new jsPDF("landscape");
    pdf.addImage(image, "PNG", 10, 10, 280, 150);
    pdf.save("whiteboard.pdf");
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={onBack}>Home</button>

        <h3>Board ID: {boardId}</h3>

        <button onClick={enablePen} disabled={permission === "view"}>
          Pen
        </button>

        <button onClick={enableEraser} disabled={permission === "view"}>
          Eraser
        </button>

        <button onClick={addRectangle} disabled={permission === "view"}>
          Rectangle
        </button>

        <button onClick={addCircle} disabled={permission === "view"}>
          Circle
        </button>

        <button onClick={addText} disabled={permission === "view"}>
          Text
        </button>

        <button onClick={addStickyNote} disabled={permission === "view"}>
          Sticky Note
        </button>

        <button onClick={clearCanvas} disabled={permission === "view"}>
          Clear
        </button>

        <button onClick={saveBoard}>Save</button>
        <button onClick={exportPNG}>Export PNG</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>

      {permission === "view" && (
        <p className="view-mode">You are viewing this board in read-only mode.</p>
      )}

      <canvas ref={canvasRef}></canvas>
    </div>
  );
}