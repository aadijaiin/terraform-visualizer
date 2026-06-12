/**
 * Custom recursive layout engine for compound/nested graphs.
 * No external dependencies — computes positions bottom-up, then assigns top-down.
 *
 * Why not ELK?  ELK's cross-hierarchy edge routing causes crashes with
 * React Flow's compound node model. A bespoke recursive layout is simpler
 * and gives us full control over padding, spacing, and expansion direction.
 */

const LEAF_W = 250;
const LEAF_H = 80;
const PAD_TOP = 55;   // extra room for the group label
const PAD_SIDE = 25;
const PAD_BOTTOM = 25;
const GAP = 30;       // gap between sibling nodes

/**
 * Build a tree structure from the flat node list produced by the parser.
 */
function buildTree(nodes) {
  const nodeMap = new Map();
  const childrenMap = new Map();  // parentId -> [nodeIds]
  const rootIds = [];

  nodes.forEach(n => {
    nodeMap.set(n.id, { ...n });
  });

  nodes.forEach(n => {
    if (n.parentNode && nodeMap.has(n.parentNode)) {
      if (!childrenMap.has(n.parentNode)) childrenMap.set(n.parentNode, []);
      childrenMap.get(n.parentNode).push(n.id);
    } else {
      rootIds.push(n.id);
    }
  });

  return { nodeMap, childrenMap, rootIds };
}

/**
 * STEP 1: Bottom-up measurement.
 * Returns { w, h } for each node and computes local offsets for children.
 */
function measure(id, nodeMap, childrenMap, sizes) {
  const children = childrenMap.get(id) || [];

  // Leaf node — fixed size
  if (children.length === 0) {
    sizes.set(id, { w: LEAF_W, h: LEAF_H, childOffsets: [] });
    return sizes.get(id);
  }

  // Measure all children first (recursion)
  const childSizes = children.map(cid => ({
    id: cid,
    ...measure(cid, nodeMap, childrenMap, sizes),
  }));

  // Lay children out left-to-right inside this container
  let cursorX = PAD_SIDE;
  const offsets = [];

  childSizes.forEach(cs => {
    offsets.push({ id: cs.id, x: cursorX, y: PAD_TOP });
    cursorX += cs.w + GAP;
  });

  const innerW = cursorX - GAP + PAD_SIDE;  // total width
  const maxChildH = Math.max(...childSizes.map(cs => cs.h));
  const innerH = PAD_TOP + maxChildH + PAD_BOTTOM;

  sizes.set(id, { w: innerW, h: innerH, childOffsets: offsets });
  return sizes.get(id);
}

/**
 * STEP 2: Top-down flattening.
 * Walk the tree, assigning each child its position relative to its parent.
 * React Flow expects positions relative to the direct parent.
 */
function flattenToRFNodes(rootIds, nodeMap, childrenMap, sizes) {
  const result = [];

  function visit(id) {
    const node = nodeMap.get(id);
    const size = sizes.get(id);
    const children = childrenMap.get(id) || [];
    const hasChildren = children.length > 0;

    // For root nodes, use a simple left-to-right layout
    // (handled in the caller below)

    // Push this node
    result.push({
      id: node.id,
      type: node.type,
      data: node.data,
      parentNode: node.parentNode,
      extent: node.parentNode ? 'parent' : undefined,
      position: node._position || { x: 0, y: 0 },
      width: size.w,
      height: size.h,
      style: {
        width: size.w,
        height: size.h,
      },
    });

    // Visit children (they must appear AFTER their parent in the array)
    if (hasChildren) {
      size.childOffsets.forEach(offset => {
        const childNode = nodeMap.get(offset.id);
        childNode._position = { x: offset.x, y: offset.y };
      });
      children.forEach(cid => visit(cid));
    }
  }

  // Lay out root-level nodes top-to-bottom, centered horizontally
  const maxRootW = Math.max(...rootIds.map(rid => sizes.get(rid).w));
  let rootY = 0;
  rootIds.forEach(rid => {
    const size = sizes.get(rid);
    const node = nodeMap.get(rid);
    const centeredX = (maxRootW - size.w) / 2;
    node._position = { x: centeredX, y: rootY };
    rootY += size.h + GAP * 2;
  });

  // Visit in order: each root, then its full subtree
  rootIds.forEach(rid => visit(rid));

  return result;
}

/**
 * Main entry: takes flat nodes + edges from the parser and returns
 * positioned React Flow nodes + untouched edges.
 */
export async function computeLayout(nodes, edges) {
  if (!nodes.length) return { nodes: [], edges: [] };

  const { nodeMap, childrenMap, rootIds } = buildTree(nodes);

  // Step 1: measure
  const sizes = new Map();
  rootIds.forEach(rid => measure(rid, nodeMap, childrenMap, sizes));

  // Step 2: flatten
  const positionedNodes = flattenToRFNodes(rootIds, nodeMap, childrenMap, sizes);

  return { nodes: positionedNodes, edges };
}
