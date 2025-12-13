import { useCallback, useRef, useState } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseCanvasHistoryProps {
  nodes: Node[];
  edges: Edge[];
  onRestore: (nodes: Node[], edges: Edge[]) => void;
}

export function useCanvasHistory({ nodes, edges, onRestore }: UseCanvasHistoryProps) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);

  const saveState = useCallback(() => {
    // Remove any states after current index (when making new changes after undo)
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    
    // Limit history to 50 states
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
    
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(false);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const state = historyRef.current[currentIndexRef.current];
      onRestore(state.nodes, state.edges);
      setCanUndo(currentIndexRef.current > 0);
      setCanRedo(true);
    }
  }, [onRestore]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const state = historyRef.current[currentIndexRef.current];
      onRestore(state.nodes, state.edges);
      setCanUndo(true);
      setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    }
  }, [onRestore]);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
