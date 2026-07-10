import React, { useEffect, useRef } from "react";

export default function BackgroundShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Sync WebGL size with layout
    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    window.addEventListener("resize", syncSize);
    syncSize();

    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Dark theme background #050508 base
        vec3 color1 = vec3(0.0196, 0.0196, 0.0314); 
        vec3 color2 = vec3(0.0314, 0.0314, 0.0588); 
        
        float pulse = sin(u_time * 0.3) * 0.5 + 0.5;
        vec3 finalColor = mix(color1, color2, uv.y + pulse * 0.15);
        
        // Define theme colors: Indigo, Orange, Blue
        vec3 glowColors[3];
        glowColors[0] = vec3(0.388, 0.4, 0.945); // Indigo (#6366f1)
        glowColors[1] = vec3(0.984, 0.573, 0.235); // Orange (#fb923c)
        glowColors[2] = vec3(0.235, 0.565, 0.984); // Blue (#3b82f6)
        
        // Floating subtle glow spots
        for(int i = 0; i < 3; i++) {
          vec2 pos = vec2(
            sin(u_time * 0.2 + float(i) * 2.1) * 0.3 + 0.5,
            cos(u_time * 0.25 + float(i) * 1.7) * 0.25 + 0.5
          );
          float dist = length(uv - pos);
          finalColor += glowColors[i] * (0.018 / (dist + 0.4)) * 0.25;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const cs = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram();
    if (!program) return;

    const compiledVs = cs(gl.VERTEX_SHADER, vs);
    const compiledFs = cs(gl.FRAGMENT_SHADER, fs);

    if (!compiledVs || !compiledFs) return;
    gl.attachShader(program, compiledVs);
    gl.attachShader(program, compiledFs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");

    let animationFrameId: number;
    const render = (t: number) => {
      if (!canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(0);

    if (prefersReducedMotion) {
      const interval = window.setInterval(
        () => render(performance.now()),
        1000,
      );
      return () => {
        window.removeEventListener("resize", syncSize);
        window.clearInterval(interval);
      };
    }

    return () => {
      window.removeEventListener("resize", syncSize);
      if (!prefersReducedMotion) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#050508] pointer-events-none">
      {/* Mesh Gradient Background from Frosted Glass theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>
      <canvas ref={canvasRef} className="block w-full h-full opacity-65" />
    </div>
  );
}
