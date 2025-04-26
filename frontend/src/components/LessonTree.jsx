import React, { useMemo, useCallback } from "react";
import ReactFlow, { Controls, Background, useReactFlow, ReactFlowProvider } from "react-flow-renderer";

// Recursively build nodes and edges from hierarchical JSON
function buildTreeNodesEdges(courseData, x, y, parentId = null, nodes = [], edges = [], depth = 0) {
  // Add course node in the center
  const courseId = "root";
  nodes.push({
    id: courseId,
    data: { 
      label: courseData.course,
      type: "course"
    },
    position: { x, y },
    style: {
      background: '#4747d1',
      color: 'white',
      borderRadius: 6,
      padding: 6,
      minWidth: 220,
      textAlign: 'center',
      fontWeight: 600,
      fontSize: 18,
      border: 'none',
    },
  });

  // Calculate positions for module nodes in a circle around the center
  const moduleCount = courseData.modules.length;
  const moduleRadius = 300; // Increased distance from center to modules
  const angleStep = (2 * Math.PI) / moduleCount; // Angle between modules
  
  courseData.modules.forEach((module, i) => {
    const moduleId = `module-${i}`;
    // Calculate position using polar coordinates
    const angle = i * angleStep;
    const moduleX = x + moduleRadius * Math.cos(angle);
    const moduleY = y + moduleRadius * Math.sin(angle);
    
    nodes.push({
      id: moduleId,
      data: { 
        label: module.module,
        type: "module"
      },
      position: { x: moduleX, y: moduleY },
      style: {
        background: '#23234a',
        color: 'white',
        borderRadius: 6,
        padding: 6,
        minWidth: 180,
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 14,
        border: 'none',
      },
    });

    edges.push({
      id: `e-${courseId}-${moduleId}`,
      source: courseId,
      target: moduleId,
      type: 'straight',
      style: { stroke: '#b3b3ff', strokeWidth: 2 },
      animated: false,
    });

    // Calculate positions for lesson nodes in a semi-circle below each module
    const lessonCount = module.lessons.length;
    const lessonRadius = 200; // Distance from module to lessons
    const lessonAngleStep = Math.PI / (lessonCount + 1); // Angle between lessons
    const startAngle = angle - Math.PI / 2; // Start from the bottom of the module
    
    module.lessons.forEach((lesson, j) => {
      const lessonId = `lesson-${i}-${j}`;
      // Calculate position relative to the module
      const lessonAngle = startAngle + (j + 1) * lessonAngleStep;
      const lessonX = moduleX + lessonRadius * Math.cos(lessonAngle);
      const lessonY = moduleY + lessonRadius * Math.sin(lessonAngle);
      
      nodes.push({
        id: lessonId,
        data: { 
          label: lesson,
          type: "lesson"
        },
        position: { x: lessonX, y: lessonY },
        style: {
          background: '#1a1a3a',
          color: 'white',
          borderRadius: 6,
          padding: 6,
          minWidth: 140,
          textAlign: 'center',
          fontWeight: 400,
          fontSize: 12,
          border: 'none',
        },
      });

      edges.push({
        id: `e-${moduleId}-${lessonId}`,
        source: moduleId,
        target: lessonId,
        type: 'straight',
        style: { stroke: '#b3b3ff', strokeWidth: 2 },
        animated: false,
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
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
          defaultZoom={0.8}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background color="#404040" gap={16} />
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