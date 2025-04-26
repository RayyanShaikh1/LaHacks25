import React, { useMemo } from "react";
import ReactFlow from "react-flow-renderer";

// Recursively build nodes and edges from hierarchical JSON
function buildTreeNodesEdges(node, x, y, parentId = null, nodes = [], edges = [], depth = 0) {
  const nodeId = parentId === null ? "root" : `${parentId}-${nodes.length}`;
  nodes.push({
    id: nodeId,
    data: { label: node.topic },
    position: { x, y },
    style: {
      background: depth === 0 ? '#4747d1' : '#23234a',
      color: 'white',
      borderRadius: 6,
      padding: 6,
      minWidth: depth === 0 ? 220 : 150,
      textAlign: 'center',
      fontWeight: depth === 0 ? 600 : 500,
      fontSize: depth === 0 ? 18 : 14,
      border: 'none',
    },
  });
  if (parentId !== null) {
    edges.push({
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      style: { stroke: '#b3b3ff', strokeWidth: 2 },
      animated: false,
    });
  }
  if (node.subtopics && node.subtopics.length > 0) {
    const childYStart = y + 100;
    const childXStart = x - ((node.subtopics.length - 1) * 120) / 2;
    node.subtopics.forEach((sub, i) => {
      buildTreeNodesEdges(
        sub,
        childXStart + i * 120,
        childYStart,
        nodeId,
        nodes,
        edges,
        depth + 1
      );
    });
  }
  return { nodes, edges };
}

const LessonTree = ({ lessonJson }) => {
  const { nodes, edges } = useMemo(() => {
    if (!lessonJson || !lessonJson.topic) return { nodes: [], edges: [] };
    return buildTreeNodesEdges(lessonJson, 0, 0);
  }, [lessonJson]);
  return (
    <div style={{ width: '100%', height: 600 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll
      />
    </div>
  );
};

export default LessonTree; 