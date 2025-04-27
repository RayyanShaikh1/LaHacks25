import React, { useMemo, useCallback } from "react";
import ReactFlow, { Controls, Background, useReactFlow, ReactFlowProvider } from "react-flow-renderer";

// Add these helper functions at the top
const getDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const isOverlapping = (x, y, nodeSize, existingNodes, minDistance) => {
  for (const node of existingNodes) {
    const distance = getDistance(x, y, node.position.x, node.position.y);
    const combinedSize = (nodeSize + parseFloat(node.style?.width || 0)) / 2;
    if (distance < combinedSize + minDistance) {
      return true;
    }
  }
  return false;
};

function buildTreeNodesEdges(courseData, x, y, parentId = null, nodes = [], edges = [], depth = 0) {
  const SPACING = 40; // Reduced minimum space between nodes
  const moduleRadius = 300; // Reduced base radius for closer nodes
  
  // Course node (unchanged)
  const courseId = "root";
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
      width: 250,
      height: 250,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontWeight: 600,
      fontSize: 24, // Increased font size
      border: '2px solid rgba(139, 92, 246, 0.5)',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
    },
  });

  // Module nodes with collision detection
  courseData.modules.forEach((module, i) => {
    const moduleId = `module-${i}`;
    let moduleX, moduleY;
    let attempts = 0;
    const maxAttempts = 50;

    // Try to find a position without overlap
    do {
      const angle = (i * 2 * Math.PI / courseData.modules.length) + (Math.random() * 0.5 - 0.25);
      const radius = moduleRadius + (Math.random() * 100); // Reduced random radius
      moduleX = x + radius * Math.cos(angle);
      moduleY = y + radius * Math.sin(angle);
      attempts++;
    } while (isOverlapping(moduleX, moduleY, 180, nodes, SPACING) && attempts < maxAttempts);

    nodes.push({
      id: moduleId,
      data: { 
        label: module.module,
        type: "module"
      },
      position: { x: moduleX, y: moduleY },
      style: {
        background: 'radial-gradient(circle at center, #4c1d95 0%, #312e81 100%)',
        color: 'white',
        borderRadius: '40%',
        padding: 8,
        width: 180, // Increased width
        height: 180, // Increased height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 20, // Increased font size
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

    // Lesson nodes with collision detection
    module.lessons.forEach((lesson, j) => {
      const lessonId = `lesson-${i}-${j}`;
      let lessonX, lessonY;
      let lessonAttempts = 0;

      do {
        const baseAngle = Math.atan2(moduleY - y, moduleX - x);
        const spreadAngle = baseAngle + (Math.random() * Math.PI/2 - Math.PI/4);
        const lessonRadius = 200 + (Math.random() * 150); // Reduced radius
        lessonX = moduleX + lessonRadius * Math.cos(spreadAngle);
        lessonY = moduleY + lessonRadius * Math.sin(spreadAngle);
        lessonAttempts++;
      } while (isOverlapping(lessonX, lessonY, 140, nodes, SPACING) && lessonAttempts < maxAttempts);

      nodes.push({
        id: lessonId,
        data: { 
          label: lesson,
          type: "lesson"
        },
        position: { x: lessonX, y: lessonY },
        style: {
          background: 'radial-gradient(circle at center, #312e81 0%, #1e1b4b 100%)',
          color: 'white',
          borderRadius: '30%',
          padding: 6,
          width: 140, // Increased width
          height: 140, // Increased height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontWeight: 400,
          fontSize: 16, // Increased font size
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
      <div className="flex-1 relative bg-neutral-800/80">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
          defaultZoom={0.7}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background color="#4a044e" gap={16} size={1} />
        </ReactFlow>
      </div>
      <div className="flex gap-1 bg-neutral-800/80 p-1 rounded-lg mt-2">
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