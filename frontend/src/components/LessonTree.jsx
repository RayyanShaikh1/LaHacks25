import React, { useMemo, useCallback } from "react";
import ReactFlow, { Controls, Background, useReactFlow, ReactFlowProvider } from "react-flow-renderer";

// Recursively build nodes and edges from hierarchical JSON
function buildTreeNodesEdges(courseData, x, y, parentId = null, nodes = [], edges = [], depth = 0) {
  // Add course node
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

  // Add module nodes
  const moduleY = y + 100;
  const moduleXStart = x - ((courseData.modules.length - 1) * 200) / 2;
  
  courseData.modules.forEach((module, i) => {
    const moduleId = `module-${i}`;
    const moduleX = moduleXStart + i * 200;
    
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
      style: { stroke: '#b3b3ff', strokeWidth: 2 },
      animated: false,
    });

    // Add lesson nodes
    const lessonY = moduleY + 100;
    const lessonXStart = moduleX - ((module.lessons.length - 1) * 160) / 2;
    
    module.lessons.forEach((lesson, j) => {
      const lessonId = `lesson-${i}-${j}`;
      const lessonX = lessonXStart + j * 160;
      
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