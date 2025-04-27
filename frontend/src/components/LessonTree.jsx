import React, { useMemo, useCallback } from "react";
import ReactFlow, { Controls, Background, useReactFlow, ReactFlowProvider } from "react-flow-renderer";

function buildTreeNodesEdges(courseData, x, y, parentId = null, nodes = [], edges = [], depth = 0) {
  // Nucleus (course node) in the center
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
      fontSize: 20,
      border: '2px solid rgba(139, 92, 246, 0.5)',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
    },
  });

  // Dendrites (module nodes) arranged in a more organic pattern
  const moduleCount = courseData.modules.length;
  const moduleRadius = 450; // Increased radius for more spread
  const angleStep = (2 * Math.PI) / moduleCount;
  
  courseData.modules.forEach((module, i) => {
    const moduleId = `module-${i}`;
    // Add some randomness to position for organic feel
    const angle = i * angleStep + (Math.random() * 1 - 0.1);
    // Increase the radius variation for more random distances
    const radiusVariation = moduleRadius + (Math.random() * 200 - 30); // More variance in distance
    const moduleX = x + radiusVariation * Math.cos(angle);
    const moduleY = y + radiusVariation * Math.sin(angle);
    
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
        width: 160,
        height: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 16,
        border: '2px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
      },
    });

    // Synaptic connections (edges)
    edges.push({
      id: `e-${courseId}-${moduleId}`,
      source: courseId,
      target: moduleId,
      type: 'smoothstep',
      style: { 
        stroke: '#8b5cf6',
        strokeWidth: 3,
        opacity: 0.6,
      },
      animated: true,
      animationSpeed: 0.5,
    });

    // Axon terminals (lesson nodes)
    const lessonCount = module.lessons.length;
    const baseLessonRadius = 400;
    const lessonAngleSpread = Math.PI / 2; // 90-degree spread
    const startAngle = angle - lessonAngleSpread / 2;
    
    module.lessons.forEach((lesson, j) => {
      const lessonId = `lesson-${i}-${j}`;
      const lessonAngle = startAngle + (j * lessonAngleSpread / (lessonCount - 1 || 1));
      // Increase the radius variation for lessons
      const radiusVar = baseLessonRadius + (Math.random() * 150 - 75); // More variance in distance
      const lessonX = moduleX + radiusVar * Math.cos(lessonAngle);
      const lessonY = moduleY + radiusVar * Math.sin(lessonAngle);
      
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
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontWeight: 400,
          fontSize: 14,
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
          <Controls />
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