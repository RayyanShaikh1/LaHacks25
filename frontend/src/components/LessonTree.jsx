import React, { useMemo, useCallback } from "react";
import ReactFlow, { Controls, useReactFlow, ReactFlowProvider } from "react-flow-renderer";

// Enhanced distance and overlap detection
const getDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Improved overlap detection that accounts for actual node dimensions
const isOverlapping = (x, y, nodeWidth, nodeHeight, existingNodes, minDistance) => {
  // Convert to actual dimensions rather than radius
  const nodeHalfWidth = nodeWidth / 2;
  const nodeHalfHeight = nodeHeight / 2;
  
  for (const node of existingNodes) {
    // Get the dimensions from node style or use default values
    const existingWidth = parseFloat(node.style?.width || 100);
    const existingHeight = parseFloat(node.style?.height || 100);
    const existingHalfWidth = existingWidth / 2;
    const existingHalfHeight = existingHeight / 2;
    
    // Calculate center-to-center distance
    const distance = getDistance(x, y, node.position.x, node.position.y);
    
    // Calculate minimum non-overlapping distance based on actual dimensions
    // Add minDistance as padding between nodes
    const minNonOverlapDistance = nodeHalfWidth + existingHalfWidth + minDistance;
    
    // Check for overlap
    if (distance < minNonOverlapDistance) {
      return true;
    }
  }
  return false;
};

// Find a valid position with spiral search if initial position causes overlap
const findNonOverlappingPosition = (baseX, baseY, nodeWidth, nodeHeight, existingNodes, minDistance) => {
  // Try original position first
  if (!isOverlapping(baseX, baseY, nodeWidth, nodeHeight, existingNodes, minDistance)) {
    return { x: baseX, y: baseY };
  }
  
  // If original position overlaps, try spiral search pattern
  // This is more systematic than random attempts
  const spiralFactor = Math.max(nodeWidth, nodeHeight) + minDistance;
  const spiralStep = 0.15; // Smaller step for tighter spiral (was 0.2 implicitly)
  const maxIterations = 100; // Prevent infinite loops
  
  for (let i = 0; i < maxIterations; i++) {
    // Spiral outward with tighter increments
    const angle = 0.5 * i;
    const radius = spiralFactor * (1 + spiralStep * i);
    
    const newX = baseX + radius * Math.cos(angle);
    const newY = baseY + radius * Math.sin(angle);
    
    if (!isOverlapping(newX, newY, nodeWidth, nodeHeight, existingNodes, minDistance)) {
      return { x: newX, y: newY };
    }
  }
  
  // If we couldn't find a non-overlapping position after maxIterations,
  // place it far away from center as a fallback
  const fallbackDistance = spiralFactor * maxIterations;
  const fallbackAngle = Math.random() * 2 * Math.PI;
  return {
    x: baseX + fallbackDistance * Math.cos(fallbackAngle),
    y: baseY + fallbackDistance * Math.sin(fallbackAngle)
  };
};

function buildTreeNodesEdges(courseData, x, y, parentId = null, nodes = [], edges = [], depth = 0) {
  const SPACING = 30; // Reduced spacing between nodes for tighter clustering
  const moduleRadius = 300; // Reduced radius for module placement
  
  // Course node (root)
  const courseId = "root";
  const courseNodeWidth = 250;
  const courseNodeHeight = 250;
  
  nodes.push({
    id: courseId,
    data: { 
      label: courseData.course,
      type: "course"
    },
    position: { x, y },
    style: {
      background: 'radial-gradient(circle at center, #6b46c1 0%, #4c1d95 100%)',
      color: 'white',
      borderRadius: '50%',
      padding: 10,
      width: courseNodeWidth,
      height: courseNodeHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontWeight: 600,
      fontSize: 24,
      border: '2px solid rgba(139, 92, 246, 0.5)',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
    },
  });

  // Module nodes with improved collision avoidance
  courseData.modules.forEach((module, i) => {
    const moduleId = `module-${i}`;
    const moduleWidth = 180;
    const moduleHeight = 180;
    
    // Calculate initial position in a circle around the course
    const angle = (i * 2 * Math.PI / courseData.modules.length);
    const baseModuleX = x + moduleRadius * Math.cos(angle);
    const baseModuleY = y + moduleRadius * Math.sin(angle);
    
    // Find a non-overlapping position
    const modulePosition = findNonOverlappingPosition(
      baseModuleX,
      baseModuleY,
      moduleWidth,
      moduleHeight,
      nodes,
      SPACING
    );
    
    nodes.push({
      id: moduleId,
      data: { 
        label: module.module,
        type: "module"
      },
      position: modulePosition,
      style: {
        background: 'radial-gradient(circle at center, #4c1d95 0%, #312e81 100%)',
        color: 'white',
        borderRadius: '40%',
        padding: 8,
        width: moduleWidth,
        height: moduleHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 20,
        border: '2px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
      },
    });

    // Add edges
    edges.push({
      id: `e-${courseId}-${moduleId}`,
      source: courseId,
      target: moduleId,
      type: 'smoothstep',
      style: { 
        stroke: '#8b5cf6',
        strokeWidth: 3,
        opacity: 0.6,
        strokeDasharray: '5,5',
        animation: 'electric 1s linear infinite',
      },
      animated: true,
      animationSpeed: 0.5,
    });

    // Lesson nodes with improved collision avoidance
    module.lessons.forEach((lesson, j) => {
      const lessonId = `lesson-${i}-${j}`;
      const lessonWidth = 140;
      const lessonHeight = 140;
      
      // Calculate base angle relative to module position
      const baseAngle = Math.atan2(modulePosition.y - y, modulePosition.x - x);
      // Add some variance to make it visually interesting, but not too much
      const lessonAngle = baseAngle + ((j / module.lessons.length) - 0.5) * Math.PI/2;
      const lessonRadius = 180; // Reduced radius for closer lesson clustering
      
      const baseLessonX = modulePosition.x + lessonRadius * Math.cos(lessonAngle);
      const baseLessonY = modulePosition.y + lessonRadius * Math.sin(lessonAngle);
      
      // Find non-overlapping position
      const lessonPosition = findNonOverlappingPosition(
        baseLessonX,
        baseLessonY,
        lessonWidth,
        lessonHeight,
        nodes,
        SPACING
      );

      nodes.push({
        id: lessonId,
        data: { 
          label: lesson,
          type: "lesson"
        },
        position: lessonPosition,
        style: {
          background: 'radial-gradient(circle at center, #312e81 0%, #1e1b4b 100%)',
          color: 'white',
          borderRadius: '30%',
          padding: 6,
          width: lessonWidth,
          height: lessonHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontWeight: 400,
          fontSize: 16,
          border: '2px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
        },
      });

      edges.push({
        id: `e-${moduleId}-${lessonId}`,
        source: moduleId,
        target: lessonId,
        type: 'smoothstep',
        style: { 
          stroke: '#8b5cf6',
          strokeWidth: 2,
          opacity: 0.4,
          strokeDasharray: '5,5',
          animation: 'electric 1s linear infinite',
        },
        animated: true,
        animationSpeed: 0.3,
      });
    });
  });

  return { nodes, edges };
}

// Dots overlay background component
const DotsOverlay = () => {
  React.useEffect(() => {
    const canvas = document.getElementById("lesson-tree-dots-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const drawDots = () => {
      const gridSize = 60; // Size of each grid cell
      const dotRadius = 1.5; // Fixed radius for all dots
      const dotOpacity = 0.15; // Fixed opacity for all dots
      
      // Calculate number of dots needed to cover the canvas
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw dots in a grid pattern
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = col * gridSize;
          const y = row * gridSize;
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 200, 255, ${dotOpacity})`;
          ctx.fill();
        }
      }
    };

    const animate = () => {
      drawDots();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas id="lesson-tree-dots-canvas" className="absolute inset-0 z-0" />;
};

const LessonTreeInner = ({ lessonJson, onNodeClick }) => {
  const { nodes, edges } = useMemo(() => {
    if (!lessonJson || !lessonJson.course) return { nodes: [], edges: [] };
    return buildTreeNodesEdges(lessonJson, 0, 0);
  }, [lessonJson]);

  // Add keyframes for electric animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes electric {
        0% {
          stroke-dashoffset: 0;
          filter: drop-shadow(0 0 2px #8b5cf6);
        }
        50% {
          filter: drop-shadow(0 0 8px #8b5cf6);
        }
        100% {
          stroke-dashoffset: -10;
          filter: drop-shadow(0 0 2px #8b5cf6);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 300, padding: 0.2 });
  }, [fitView]);

  const handleNodeClick = (event, node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  return (
    <div className="w-full h-[600px] flex flex-col">
      <div className="flex-1 relative bg-[#171717]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
          defaultZoom={0.7}
          minZoom={0.1}
          maxZoom={2}
          className="[&_.react-flow__attribution]:!hidden"
        >
          <DotsOverlay />
        </ReactFlow>
      </div>
      <div className="flex gap-1 bg-[#171717] p-1 rounded-lg mt-2">
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={handleFitView}
          className="px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
          title="Fit View"
        >
          Fit
        </button>
      </div>
    </div>
  );
};

const LessonTree = ({ lessonJson, onNodeClick }) => {
  return (
    <ReactFlowProvider>
      <LessonTreeInner lessonJson={lessonJson} onNodeClick={onNodeClick} />
    </ReactFlowProvider>
  );
};

export default LessonTree;