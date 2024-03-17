import React, { useEffect, useRef, useState } from "react";

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [balls, setBalls] = useState<{ x: number; y: number; radius: number; color: string; dx: number; dy: number; id: number }[]>([
    { id: 0, x: 100, y: 120, radius: 20, color: "red", dx: 0, dy: 0 },
    { id: 1, x: 230, y: 190, radius: 25, color: "blue", dx: 0, dy: 0 },
    { id: 2, x: 464, y: 260, radius: 30, color: "yellow", dx: 0, dy: 0 },
  ]);
  let moveSelectedBallIndex: number = -1; // Переменная была изменена здесь
  const [modeSelectedBallIndex, setModeSelectedBallIndex] = useState<number>(-1);
  let isDragging: boolean = false;
  let prevMouseX: number = 0;
  let prevMouseY: number = 0;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    drawCanvas(ctx);

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const drawCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#008000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    balls.forEach((ball) => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.closePath();
    });
  };

  const handleBallClick: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault(); // Отменяем стандартное действие браузера для клика
  
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
  
    const clickedBallIndex = balls.findIndex((ball) => {
      const dx = ball.x - mouseX;
      const dy = ball.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= ball.radius;
    });
  
    if (clickedBallIndex !== -1) {
      setModeSelectedBallIndex(clickedBallIndex);
      setSelectedColor(balls[clickedBallIndex].color)
      setMenuPosition({ x: mouseX, y: mouseY });
      setMenuVisible(true);
    } else {
      setMenuVisible(false);
    }
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
  };

  const handleColorChange = (color: string) => {
    if (modeSelectedBallIndex !== -1) {
      const updatedBalls = [...balls];
      updatedBalls[modeSelectedBallIndex].color = color;
      setBalls(updatedBalls);
      redrawCanvas();
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    moveSelectedBallIndex = balls.findIndex((ball) => {
      const dx = ball.x - mouseX;
      const dy = ball.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= ball.radius;
    });

    if (moveSelectedBallIndex !== -1) {
      isDragging = true;
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      balls[moveSelectedBallIndex].dx = 0;
      balls[moveSelectedBallIndex].dy = 0;
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging && moveSelectedBallIndex !== -1) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;

      balls[moveSelectedBallIndex].dx = dx / 10;
      balls[moveSelectedBallIndex].dy = dy / 10;

      prevMouseX = mouseX;
      prevMouseY = mouseY;

      redrawCanvas();
    }
  };

  const onMouseUp = () => {
    isDragging = false;
    moveSelectedBallIndex = -1;
  };

  const handleBoundaryCollision = (
    canvas: HTMLCanvasElement,
    ball: {
      x: number;
      y: number;
      radius: number;
      color: string;
      dx?: number;
      dy?: number;
    }
  ) => {
    if (ball.dx !== undefined) {
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx *= -0.8;
      }
    }

    if (ball.dy !== undefined) {
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -0.8;
      }
    }

    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
    } else if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
    }

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
    } else if (ball.y + ball.radius > canvas.height) {
      ball.y = canvas.height - ball.radius;
    }
  };

  const moveBalls = () => {
    balls.forEach((ball, index) => {
      if (ball.dx !== undefined && ball.dy !== undefined) {
        handleBoundaryCollision(canvasRef.current!, ball);
        handleBallCollisions(balls, index);
        ball.x += ball.dx;
        ball.y += ball.dy;
        ball.dx *= 0.99;
        ball.dy *= 0.99;
      }
    });
  };

  const handleBallCollisions = (balls: any[], index: number) => {
    const currentBall = balls[index];
    for (let i = 0; i < balls.length; i++) {
      if (i !== index) {
        const otherBall = balls[i];
        const dx = otherBall.x - currentBall.x;
        const dy = otherBall.y - currentBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < currentBall.radius + otherBall.radius) {
          const angle = Math.atan2(dy, dx);
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);

          const vx1 = currentBall.dx! * cosine + currentBall.dy! * sine;
          const vy1 = currentBall.dy! * cosine - currentBall.dx! * sine;
          const vx2 = otherBall.dx! * cosine + otherBall.dy! * sine;
          const vy2 = otherBall.dy! * cosine - otherBall.dx! * sine;

          const finalVx1 =
            ((currentBall.radius - otherBall.radius) * vx1 +
              (otherBall.radius + otherBall.radius) * vx2) /
            (currentBall.radius + otherBall.radius);
          const finalVx2 =
            ((currentBall.radius + currentBall.radius) * vx1 +
              (otherBall.radius - currentBall.radius) * vx2) /
            (currentBall.radius + otherBall.radius);
          const finalVy1 = vy1;
          const finalVy2 = vy2;

          currentBall.dx = finalVx1 * cosine - finalVy1 * sine;
          currentBall.dy = finalVy1 * cosine + finalVx1 * sine;
          otherBall.dx = finalVx2 * cosine - finalVy2 * sine;
          otherBall.dy = finalVy2 * cosine + finalVx2 * sine;
        }
      }
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    moveBalls();
    drawCanvas(ctx);
    requestAnimationFrame(redrawCanvas);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={800} height={400} onClick={handleBallClick}></canvas>
      {menuVisible && (
        <div
          style={{
            position: "absolute",
            top: menuPosition.y,
            left: menuPosition.x,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            padding: "10px",
          }}
        >
          <button style={{ backgroundColor: "red", marginRight: "5px" }} onClick={() => handleColorChange("red")}>Red</button>
          <button style={{ backgroundColor: "blue", marginRight: "5px" }} onClick={() => handleColorChange("blue")}>Blue</button>
          <button style={{ backgroundColor: "yellow", marginRight: "5px" }} onClick={() => handleColorChange("yellow")}>Yellow</button>
          <button onClick={handleCloseMenu}>Close</button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
