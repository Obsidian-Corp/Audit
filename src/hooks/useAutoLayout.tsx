import { useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

export type LayoutType = 'hierarchical' | 'force-directed' | 'grid';

interface UseAutoLayoutProps {
  nodes: Node[];
  edges: Edge[];
  onLayout: (nodes: Node[]) => void;
}

export function useAutoLayout({ nodes, edges, onLayout }: UseAutoLayoutProps) {
  const applyHierarchicalLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 200, height: 100 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 100,
          y: nodeWithPosition.y - 50,
        },
      };
    });

    onLayout(layoutedNodes);
  }, [nodes, edges, onLayout]);

  const applyGridLayout = useCallback(() => {
    const columns = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 300;

    const layoutedNodes = nodes.map((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      return {
        ...node,
        position: {
          x: col * spacing + 100,
          y: row * spacing + 100,
        },
      };
    });

    onLayout(layoutedNodes);
  }, [nodes, onLayout]);

  const applyForceDirectedLayout = useCallback(() => {
    // Simple force-directed layout simulation
    const layoutedNodes = [...nodes];
    const iterations = 100;
    const repulsionStrength = 50000;
    const attractionStrength = 0.01;
    const damping = 0.9;

    // Initialize velocities
    const velocities = nodes.map(() => ({ x: 0, y: 0 }));

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate repulsion between all nodes
      for (let i = 0; i < layoutedNodes.length; i++) {
        for (let j = i + 1; j < layoutedNodes.length; j++) {
          const dx = layoutedNodes[j].position.x - layoutedNodes[i].position.x;
          const dy = layoutedNodes[j].position.y - layoutedNodes[i].position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsionStrength / (distance * distance);

          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          velocities[i].x -= fx;
          velocities[i].y -= fy;
          velocities[j].x += fx;
          velocities[j].y += fy;
        }
      }

      // Calculate attraction along edges
      edges.forEach((edge) => {
        const sourceIdx = layoutedNodes.findIndex((n) => n.id === edge.source);
        const targetIdx = layoutedNodes.findIndex((n) => n.id === edge.target);

        if (sourceIdx === -1 || targetIdx === -1) return;

        const dx = layoutedNodes[targetIdx].position.x - layoutedNodes[sourceIdx].position.x;
        const dy = layoutedNodes[targetIdx].position.y - layoutedNodes[sourceIdx].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const fx = dx * attractionStrength;
        const fy = dy * attractionStrength;

        velocities[sourceIdx].x += fx;
        velocities[sourceIdx].y += fy;
        velocities[targetIdx].x -= fx;
        velocities[targetIdx].y -= fy;
      });

      // Update positions with damping
      layoutedNodes.forEach((node, i) => {
        node.position.x += velocities[i].x;
        node.position.y += velocities[i].y;
        velocities[i].x *= damping;
        velocities[i].y *= damping;
      });
    }

    onLayout(layoutedNodes);
  }, [nodes, edges, onLayout]);

  const applyLayout = useCallback(
    (type: LayoutType) => {
      switch (type) {
        case 'hierarchical':
          applyHierarchicalLayout();
          break;
        case 'grid':
          applyGridLayout();
          break;
        case 'force-directed':
          applyForceDirectedLayout();
          break;
      }
    },
    [applyHierarchicalLayout, applyGridLayout, applyForceDirectedLayout]
  );

  return { applyLayout };
}
