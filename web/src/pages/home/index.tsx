import { Button } from "antd";
import React, { useEffect, useRef, useState } from "react";

export const Home: React.FC = () => {
  type Point = { x: number; y: number };
  type Rectangle = {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startPointRef = useRef<Point | null>(null);
  const [rect, setRect] = useState<Rectangle | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState<keyof Rectangle | null>(
    null
  );
  const [undoStack, setUndoStack] = useState<Rectangle[]>([]);
  const [redoStack, setRedoStack] = useState<Rectangle[]>([]);
  const pointRadius = 6;

  const draw = (ctx: CanvasRenderingContext2D) => {
    if (rect) {
      ctx.beginPath();
      ctx.moveTo(rect.topLeft.x, rect.topLeft.y);
      ctx.lineTo(rect.topRight.x, rect.topRight.y);
      ctx.lineTo(rect.bottomRight.x, rect.bottomRight.y);
      ctx.lineTo(rect.bottomLeft.x, rect.bottomLeft.y);
      ctx.closePath();
      ctx.strokeStyle = "#00FFA1";
      ctx.lineWidth = 4;
      ctx.stroke();

      Object.values(rect).forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#2853E3";
        ctx.fill();
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      const { offsetX, offsetY } = e;

      if (!rect) {
        const initialRect: Rectangle = {
          topLeft: { x: offsetX, y: offsetY },
          topRight: { x: offsetX, y: offsetY },
          bottomLeft: { x: offsetX, y: offsetY },
          bottomRight: { x: offsetX, y: offsetY },
        };
        setRect(initialRect);
        setRedoStack([]);
        setIsDrawing(true);

        startPointRef.current = { x: offsetX, y: offsetY };
      } else {
        const dragging = getDraggingPoint(offsetX, offsetY);
        if (dragging) {
          setDraggingPoint(dragging[0]);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { offsetX, offsetY } = e;

      if (!canvasRef.current) return;

      if (isDrawing && rect) {
        setRect((prevRect) => {
          if (!prevRect) return null;
          return {
            topLeft: prevRect.topLeft,
            topRight: { x: offsetX, y: prevRect.topLeft.y },
            bottomLeft: { x: prevRect.topLeft.x, y: offsetY },
            bottomRight: { x: offsetX, y: offsetY },
          };
        });
      } else if (draggingPoint && rect) {
        setRect((prevRect) => {
          if (!prevRect) return null;
          const updatedRect = {
            ...prevRect,
            [draggingPoint]: { x: offsetX, y: offsetY },
          };
          return updatedRect;
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDrawing(false);

      setDraggingPoint(null);

      if (startPointRef.current && rect) {
        const { offsetX, offsetY } = e;

        const dx = offsetX - startPointRef.current.x;
        const dy = offsetY - startPointRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          setRect(null);
        } else {
          setUndoStack((prev) => [...prev, rect]);
          setRedoStack([]);
        }
      }
    };

    const getDraggingPoint = (
      x: number,
      y: number
    ): [keyof Rectangle, Point] | null => {
      if (!rect) return null;
      for (const [key, point] of Object.entries(rect) as [
        keyof Rectangle,
        Point
      ][]) {
        const dx = x - point.x;
        const dy = y - point.y;
        if (Math.sqrt(dx * dx + dy * dy) <= pointRadius) {
          return [key, point];
        }
      }
      return null;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src =
      "https://smartiestest.oss-cn-hongkong.aliyuncs.com/20250114/94988da1-a263-4606-ba86-1ef741ccf9ba.png";

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      draw(ctx);
    };

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [rect, isDrawing, draggingPoint]);

  const handleUndo = () => {
    setUndoStack((prev) => {
      if (prev.length >= 1) {
        const newStack = [...prev];
        const last = newStack.pop();
        if (last) setRedoStack((redo) => [last, ...redo]);
        setRect(newStack[newStack.length - 1]);
        return newStack;
      }
      return prev;
    });
  };

  const handleRedo = () => {
    setRedoStack((prev) => {
      if (prev.length > 0) {
        const newRedo = [...prev];
        const next = newRedo.shift();
        if (next) {
          setUndoStack((undo) => [...undo, next]);
          setRect(next);
        }
        return newRedo;
      }
      return prev;
    });
  };

  const handleClear = () => {
    setRect(null);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "canvas_image.png";

      link.click();
    }
  };

  return (
    <div className="w-screen h-screen">
      <canvas ref={canvasRef} id="drawingCanvas" width="800" height="600" />
      <div>
        <Button
          type="primary"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
        >
          撤销
        </Button>
        <Button
          type="primary"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
        >
          重做
        </Button>
        <Button danger onClick={handleClear}>
          重新绘制
        </Button>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  );
};
