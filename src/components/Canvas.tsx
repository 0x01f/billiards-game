import React, { useEffect, useRef, useState } from "react";

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const balls: {
    x: number;
    y: number;
    radius: number;
    color: string;
    dx: number;
    dy: number;
  }[] = [
    { x: 100, y: 120, radius: 20, color: "red", dx: 0, dy: 0 },
    { x: 230, y: 190, radius: 25, color: "blue", dx: 0, dy: 0 },
    { x: 464, y: 260, radius: 30, color: "yellow", dx: 0, dy: 0 },
  ];
  let selectedBallIndex: number = -1;
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

  const onMouseDown = (e: MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedBallIndex = balls.findIndex((ball) => {
      const dx = ball.x - mouseX;
      const dy = ball.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= ball.radius;
    });

    if (selectedBallIndex !== -1) {
      isDragging = true;
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      // Обнуляем скорость выбранного шара
      balls[selectedBallIndex].dx = 0;
      balls[selectedBallIndex].dy = 0;
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging && selectedBallIndex !== -1) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;

      balls[selectedBallIndex].dx = dx / 10; // Установка начальной скорости по x
      balls[selectedBallIndex].dy = dy / 10; // Установка начальной скорости по y

      prevMouseX = mouseX;
      prevMouseY = mouseY;

      redrawCanvas();
    }
  };

  const onMouseUp = () => {
    isDragging = false;
    selectedBallIndex = -1;
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
        ball.dx *= -0.8; // Уменьшение скорости по x и отражение от края
      }
    }

    if (ball.dy !== undefined) {
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -0.8; // Уменьшение скорости по y и отражение от края
      }
    }

    // Перемещение шара обратно в границы канваса, если он вышел за них
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
        // Проверка столкновений со стенками
        handleBoundaryCollision(canvasRef.current!, ball);

        // Проверка столкновений между шарами
        handleBallCollisions(balls, index);

        // Обновление координат и скорости
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Постепенное замедление
        ball.dx *= 0.99; // Уменьшение скорости по x
        ball.dy *= 0.99; // Уменьшение скорости по y
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

  const handleColorChange = (color: string) => {
    if (selectedBallIndex !== -1) {
      balls[selectedBallIndex].color = color;
      setSelectedColor(color); // Добавляем это
      redrawCanvas();
    }
  };


  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={800} height={400}></canvas>
      {selectedBallIndex !== -1 && (
        <div
          style={{
            position: "absolute",
            top: balls[selectedBallIndex].y,
            left: balls[selectedBallIndex].x,
          }}
        >
          {/* Заменяем кнопки выпадающим меню */}
          <select value={selectedColor} onChange={(e) => handleColorChange(e.target.value)}>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
          </select>
        </div>
      )}
    </div>
  );
};


export default Canvas;
