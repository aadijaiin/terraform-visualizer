import { useState, useEffect, useCallback, useRef } from "react";
import { useNodesState, useEdgesState, useReactFlow } from "reactflow";
import { parseTerraform } from "../utils/parser";
import { computeLayout } from "../utils/layout";

export function useTerraformGraph(initialCode) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fitView } = useReactFlow();

  const debounceTimerRef = useRef(null);

  const updateGraph = useCallback(async (terraformCode) => {
    try {
      setLoading(true);
      setError(null);
      const { nodes: parsedNodes, edges: parsedEdges } = parseTerraform(terraformCode);
      const { nodes: layoutedNodes, edges: layoutedEdges } = await computeLayout(parsedNodes, parsedEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Wait a tick for React Flow to process the new nodes, then fit view
      setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50);
    } catch (err) {
      console.error(err);
      setError("Failed to parse or layout graph.");
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, fitView]);

  // Handle debounced updates
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateGraph(code);
    }, 500);

    return () => clearTimeout(debounceTimerRef.current);
  }, [code, updateGraph]);

  return {
    nodes,
    edges,
    code,
    setCode,
    error,
    loading,
    onNodesChange,
    onEdgesChange
  };
}
