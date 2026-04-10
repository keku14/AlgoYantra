const COLORS = {
  RED: "red",
  BLACK: "black",
};

const TREE_TYPES = {
  BINARY: "binary-tree",
  BST: "bst",
  AVL: "avl",
  RB: "red-black",
};

const TREE_TYPE_META = [
  {
    id: TREE_TYPES.BINARY,
    label: "Binary Tree",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    id: TREE_TYPES.BST,
    label: "Binary Search Tree",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: TREE_TYPES.AVL,
    label: "AVL Tree",
    accent: "from-amber-500 to-orange-500",
  },
  {
    id: TREE_TYPES.RB,
    label: "Red-Black Tree",
    accent: "from-rose-500 to-fuchsia-500",
  },
];

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function isFilledNodeValue(value) {
  if (value == null) {
    return false;
  }

  if (typeof value === "string" && value.trim() === "") {
    return false;
  }

  return Number.isFinite(Number(value));
}

export function normalizeTreeType(treeType) {
  const normalized = String(treeType || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (["binary", "binary-tree", "binary_tree"].includes(normalized)) {
    return TREE_TYPES.BINARY;
  }

  if (["bst", "binary-search-tree", "binary_search_tree"].includes(normalized)) {
    return TREE_TYPES.BST;
  }

  if (["avl", "avl-tree", "avl_tree"].includes(normalized)) {
    return TREE_TYPES.AVL;
  }

  if (["red-black", "red-black-tree", "red_black_tree", "rb", "rbt"].includes(normalized)) {
    return TREE_TYPES.RB;
  }

  return normalized || TREE_TYPES.BST;
}

export function createNode(value, options = {}) {
  return {
    id: options.id || createId(),
    value: isFilledNodeValue(value) ? Number(value) : null,
    color: options.color || COLORS.BLACK,
    height: options.height || 1,
    left: options.left ? cloneTree(options.left) : null,
    right: options.right ? cloneTree(options.right) : null,
  };
}

export function cloneTree(tree) {
  return tree ? JSON.parse(JSON.stringify(tree)) : null;
}

export function countNodes(tree) {
  if (!tree) {
    return 0;
  }

  return 1 + countNodes(tree.left) + countNodes(tree.right);
}

export function treeHeight(tree) {
  if (!tree) {
    return 0;
  }

  return 1 + Math.max(treeHeight(tree.left), treeHeight(tree.right));
}

export function collectValues(tree) {
  if (!tree) {
    return [];
  }

  const currentValue = isFilledNodeValue(tree.value) ? [Number(tree.value)] : [];
  return [...currentValue, ...collectValues(tree.left), ...collectValues(tree.right)];
}

export function traverseTree(tree, order = "inorder") {
  const values = [];

  function visitPreorder(node) {
    if (!node) {
      return;
    }

    if (isFilledNodeValue(node.value)) {
      values.push(Number(node.value));
    }

    visitPreorder(node.left);
    visitPreorder(node.right);
  }

  function visitInorder(node) {
    if (!node) {
      return;
    }

    visitInorder(node.left);

    if (isFilledNodeValue(node.value)) {
      values.push(Number(node.value));
    }

    visitInorder(node.right);
  }

  function visitPostorder(node) {
    if (!node) {
      return;
    }

    visitPostorder(node.left);
    visitPostorder(node.right);

    if (isFilledNodeValue(node.value)) {
      values.push(Number(node.value));
    }
  }

  function visitLevelOrder(node) {
    const queue = [];

    if (node) {
      queue.push(node);
    }

    while (queue.length) {
      const current = queue.shift();

      if (isFilledNodeValue(current?.value)) {
        values.push(Number(current.value));
      }

      if (current?.left) {
        queue.push(current.left);
      }

      if (current?.right) {
        queue.push(current.right);
      }
    }
  }

  switch (order) {
    case "preorder":
      visitPreorder(tree);
      break;
    case "postorder":
      visitPostorder(tree);
      break;
    case "levelorder":
      visitLevelOrder(tree);
      break;
    case "inorder":
    default:
      visitInorder(tree);
      break;
  }

  return values;
}

function buildTraversalPlayback(tree, order, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const traversal = [];
  const visitedPathIds = [];

  function childLabel(node) {
    return node ? String(node.value) : "empty";
  }

  function recordTraversalStep(description, node, extraMeta = {}, highlightIds = []) {
    const activeHighlights = highlightIds.length ? highlightIds : node?.id ? [node.id] : [];
    recorder.record(description, tree, {
      action: "traverse",
      highlights: activeHighlights,
      traversal: [...traversal],
      meta: {
        kind: "tree-traverse",
        order,
        pathIds: dedupe([...visitedPathIds, ...activeHighlights]),
        currentNodeId: node?.id || null,
        currentValue: node?.value ?? null,
        traversal: [...traversal],
        ...extraMeta,
      },
    });
  }

  function recordVisit(node, reason, extraMeta = {}) {
    if (!node || !isFilledNodeValue(node.value)) {
      return;
    }

    traversal.push(Number(node.value));
    visitedPathIds.push(node.id);
    recordTraversalStep(
      `${reason} Visit ${node.value}. Traversal so far: ${traversal.join(" -> ")}.`,
      node,
      {
        decision: "visit",
        phase: "visit",
        ...extraMeta,
      },
    );
  }

  function visitPreorder(node) {
    if (!node) {
      return;
    }

    recordVisit(node, `Preorder uses Node -> Left -> Right, so the first action at ${node.value} is to record the node itself.`, {
      strategy: "preorder",
    });

    if (node.left) {
      recordTraversalStep(
        `After visiting ${node.value}, preorder explores the left subtree next. Move to left child ${childLabel(node.left)}.`,
        node.left,
        { decision: "go-left", phase: "left", strategy: "preorder" },
        [node.id, node.left.id],
      );
    } else {
      recordTraversalStep(
        `${node.value} has no left child, so preorder skips the left subtree and checks the right side.`,
        node,
        { decision: "skip-left", phase: "left", strategy: "preorder" },
      );
    }

    visitPreorder(node.left);

    if (node.right) {
      recordTraversalStep(
        `The left subtree of ${node.value} is done. Preorder now moves to right child ${childLabel(node.right)}.`,
        node.right,
        { decision: "go-right", phase: "right", strategy: "preorder" },
        [node.id, node.right.id],
      );
    } else {
      recordTraversalStep(
        `${node.value} has no right child. The preorder work for this subtree is complete.`,
        node,
        { decision: "skip-right", phase: "right", strategy: "preorder" },
      );
    }

    visitPreorder(node.right);
  }

  function visitInorder(node) {
    if (!node) {
      return;
    }

    if (node.left) {
      recordTraversalStep(
        `At ${node.value}, inorder uses Left -> Node -> Right. Because left child ${childLabel(node.left)} exists, go left before visiting ${node.value}.`,
        node.left,
        { decision: "go-left", phase: "left", strategy: "inorder" },
        [node.id, node.left.id],
      );
    } else {
      recordTraversalStep(
        `At ${node.value}, inorder first checks the left subtree. There is no left child, so ${node.value} is ready to visit.`,
        node,
        { decision: "left-empty", phase: "left", strategy: "inorder" },
      );
    }

    visitInorder(node.left);
    recordVisit(node, `The left subtree of ${node.value} is finished, so inorder now records the node in the middle.`, {
      strategy: "inorder",
    });

    if (node.right) {
      recordTraversalStep(
        `After visiting ${node.value}, inorder finishes with the right subtree. Move to right child ${childLabel(node.right)}.`,
        node.right,
        { decision: "go-right", phase: "right", strategy: "inorder" },
        [node.id, node.right.id],
      );
    } else {
      recordTraversalStep(
        `${node.value} has no right child. The inorder work for this subtree is complete.`,
        node,
        { decision: "right-empty", phase: "right", strategy: "inorder" },
      );
    }

    visitInorder(node.right);
  }

  function visitPostorder(node) {
    if (!node) {
      return;
    }

    if (node.left) {
      recordTraversalStep(
        `At ${node.value}, postorder uses Left -> Right -> Node. Start with left child ${childLabel(node.left)} and delay visiting ${node.value}.`,
        node.left,
        { decision: "go-left", phase: "left", strategy: "postorder" },
        [node.id, node.left.id],
      );
    } else {
      recordTraversalStep(
        `${node.value} has no left child, so postorder checks the right subtree before visiting ${node.value}.`,
        node,
        { decision: "skip-left", phase: "left", strategy: "postorder" },
      );
    }

    visitPostorder(node.left);

    if (node.right) {
      recordTraversalStep(
        `The left subtree of ${node.value} is done. Postorder now moves to right child ${childLabel(node.right)} before visiting ${node.value}.`,
        node.right,
        { decision: "go-right", phase: "right", strategy: "postorder" },
        [node.id, node.right.id],
      );
    } else {
      recordTraversalStep(
        `${node.value} has no right child, so both child checks are complete for this node.`,
        node,
        { decision: "skip-right", phase: "right", strategy: "postorder" },
      );
    }

    visitPostorder(node.right);
    recordVisit(node, `Both subtrees of ${node.value} have been handled, so postorder can finally record the node.`, {
      strategy: "postorder",
    });
  }

  if (order === "levelorder") {
    const queue = [];

    if (tree) {
      queue.push(tree);
      recordTraversalStep(
        `Level order uses a queue. Start by putting the root ${tree.value} into the queue.`,
        tree,
        { decision: "queue-start", phase: "queue", strategy: "levelorder", queueValues: [tree.value] },
      );
    }

    while (queue.length) {
      const queueBefore = queue.map((node) => node.value);
      const current = queue.shift();

      if (isFilledNodeValue(current?.value)) {
        recordVisit(
          current,
          `Queue before removing the front: ${queueBefore.join(" -> ")}. Level order visits the front node first.`,
          {
            strategy: "levelorder",
            queueValues: queueBefore,
          },
        );
      }

      if (current?.left) {
        queue.push(current.left);
      }

      if (current?.right) {
        queue.push(current.right);
      }

      if (current) {
        const addedChildren = [current.left, current.right]
          .filter(Boolean)
          .map((node) => node.value);
        const queueAfter = queue.map((node) => node.value);
        recordTraversalStep(
          addedChildren.length
            ? `After visiting ${current.value}, add its children ${addedChildren.join(" and ")} to the back of the queue. Queue is now ${queueAfter.join(" -> ")}.`
            : `After visiting ${current.value}, it has no children to add. Queue is now ${queueAfter.join(" -> ") || "empty"}.`,
          current,
          {
            decision: "enqueue-children",
            phase: "queue",
            strategy: "levelorder",
            queueValues: queueAfter,
          },
          [current.id, current.left?.id, current.right?.id].filter(Boolean),
        );
      }
    }

    if (!traversal.length) {
      recorder.record("Traversal found an empty tree.", tree, {
        action: "traverse",
        traversal: [],
        meta: {
          kind: "tree-traverse",
          order,
          pathIds: [],
          traversal: [],
        },
      });
    }

    return {
      traversal,
      steps: recorder.steps,
    };
  }

  switch (order) {
    case "preorder":
      visitPreorder(tree);
      break;
    case "postorder":
      visitPostorder(tree);
      break;
    case "inorder":
    default:
      visitInorder(tree);
      break;
  }

  if (!traversal.length) {
    recorder.record("Traversal found an empty tree.", tree, {
      action: "traverse",
      traversal: [],
      meta: {
        kind: "tree-traverse",
        order,
        pathIds: [],
        traversal: [],
        decision: "empty",
      },
    });
  }

  return {
    traversal,
    steps: recorder.steps,
  };
}

export function findNodeById(tree, nodeId) {
  if (!tree) {
    return null;
  }

  if (tree.id === nodeId) {
    return tree;
  }

  return findNodeById(tree.left, nodeId) || findNodeById(tree.right, nodeId);
}

export function replaceNodeValue(tree, nodeId, nextValue) {
  const workingTree = cloneTree(tree);
  const target = findNodeById(workingTree, nodeId);

  if (!target) {
    return workingTree;
  }

  target.value = toNumber(nextValue);
  return workingTree;
}

export function setNodeValue(tree, nodeId, nextValue) {
  const workingTree = cloneTree(tree);
  const target = findNodeById(workingTree, nodeId);

  if (!target) {
    return workingTree;
  }

  target.value = isFilledNodeValue(nextValue) ? Number(nextValue) : null;
  return workingTree;
}

export function setNodeColor(tree, nodeId, nextColor) {
  const workingTree = cloneTree(tree);
  const target = findNodeById(workingTree, nodeId);

  if (!target) {
    return workingTree;
  }

  target.color = nextColor === COLORS.RED ? COLORS.RED : COLORS.BLACK;
  return workingTree;
}

export function createBlankTreeFromTemplate(tree) {
  if (!tree) {
    return null;
  }

  return {
    ...cloneTree(tree),
    value: null,
    left: createBlankTreeFromTemplate(tree.left),
    right: createBlankTreeFromTemplate(tree.right),
  };
}

export function addRootNode(tree, value = null, options = {}) {
  if (tree) {
    return cloneTree(tree);
  }

  return createNode(value, options);
}

export function addChildNode(tree, parentId, side, value = null, options = {}) {
  if (!tree || !parentId || !["left", "right"].includes(side)) {
    return cloneTree(tree);
  }

  const workingTree = cloneTree(tree);
  const parent = findNodeById(workingTree, parentId);

  if (!parent || parent[side]) {
    return workingTree;
  }

  parent[side] = createNode(value, options);
  return workingTree;
}

export function removeNodeById(tree, nodeId) {
  if (!tree || !nodeId) {
    return cloneTree(tree);
  }

  if (tree.id === nodeId) {
    return null;
  }

  const workingTree = cloneTree(tree);

  function detach(node) {
    if (!node) {
      return false;
    }

    if (node.left?.id === nodeId) {
      node.left = null;
      return true;
    }

    if (node.right?.id === nodeId) {
      node.right = null;
      return true;
    }

    return detach(node.left) || detach(node.right);
  }

  detach(workingTree);
  return workingTree;
}

function createRecorder(enabled) {
  const steps = [];

  return {
    steps,
    record(description, tree, details = {}) {
      if (!enabled) {
        return;
      }

      steps.push({
        id: createId(),
        description,
        tree: cloneTree(tree),
        action: details.action || "update",
        highlights: details.highlights || [],
        traversal: details.traversal || [],
        operation: details.operation || null,
        meta: details.meta || null,
      });
    },
  };
}

function findNodeByValue(node, value) {
  if (!node) {
    return null;
  }

  if (node.value === value) {
    return node;
  }

  return findNodeByValue(node.left, value) || findNodeByValue(node.right, value);
}

function findNodeIdsForValues(tree, values = []) {
  return dedupe(
    values
      .map((value) => findNodeByValue(tree, value)?.id || null)
      .filter(Boolean),
  );
}

function buildOrderedSearchPlayback({
  recorder,
  tree,
  targetValue,
  metaKind,
  mode,
}) {
  const pathIds = [];
  let current = tree;

  if (!tree) {
    recorder.record(
      `${metaKind.includes("delete") ? "Tree is empty." : "Tree is empty. Ready to place the root."}`,
      null,
      {
        action: metaKind.includes("delete") ? "noop" : "compare",
        meta: {
          kind: metaKind,
          targetValue,
          incomingValue: targetValue,
          pathIds: [],
          decision: "empty",
        },
      },
    );
    return {
      pathIds,
      found: false,
      parent: null,
    };
  }

  let parent = null;

  while (current) {
    parent = current;
    pathIds.push(current.id);
    recorder.record(`Compare ${targetValue} with ${current.value}.`, tree, {
      action: "compare",
      highlights: [current.id],
      meta: {
        kind: metaKind,
        targetValue,
        incomingValue: targetValue,
        pathIds: [...pathIds],
        currentNodeId: current.id,
        comparedValue: current.value,
        decision: "compare",
      },
    });

    if (targetValue === current.value) {
      recorder.record(
        mode === "delete"
          ? `Found ${targetValue}. Prepare the ${metaKind.split("-")[0].toUpperCase()} delete step.`
          : `Value ${targetValue} already exists here.`,
        tree,
        {
          action: mode === "delete" ? "compare" : "noop",
          highlights: [current.id],
          meta: {
            kind: metaKind,
            targetValue,
            incomingValue: targetValue,
            pathIds: [...pathIds],
            currentNodeId: current.id,
            comparedValue: current.value,
            decision: mode === "delete" ? "found" : "duplicate",
          },
        },
      );

      return {
        pathIds,
        found: true,
        parent,
      };
    }

    const nextDirection = targetValue < current.value ? "left" : "right";
    const nextNode = nextDirection === "left" ? current.left : current.right;

    recorder.record(
      nextNode
        ? `${targetValue} is ${nextDirection === "left" ? "smaller" : "greater"} than ${current.value}, so move ${nextDirection} to ${nextNode.value}.`
        : `${targetValue} should continue ${nextDirection} from ${current.value}, and that slot is open.`,
      tree,
      {
        action: "compare",
        highlights: nextNode ? [current.id, nextNode.id] : [current.id],
        meta: {
          kind: metaKind,
          targetValue,
          incomingValue: targetValue,
          pathIds: [...pathIds],
          currentNodeId: current.id,
          comparedValue: current.value,
          decision: nextDirection,
          nextNodeId: nextNode?.id || null,
          nextComparedValue: nextNode?.value ?? null,
        },
      },
    );

    current = nextNode;
  }

  return {
    pathIds,
    found: false,
    parent,
  };
}

function parseAVLNotes(notes = []) {
  return notes.flatMap((note) => {
    let match = note.match(/^Right rotation at (-?\d+) for LL imbalance\.$/);
    if (match) {
      return [{ type: "rotation", rotation: "right", atValue: Number(match[1]), caseType: "LL", label: "LL rebalance" }];
    }

    match = note.match(/^Left rotation at (-?\d+), then right rotation at (-?\d+) for LR imbalance\.$/);
    if (match) {
      return [
        { type: "rotation", rotation: "left", atValue: Number(match[1]), rootValue: Number(match[2]), caseType: "LR", label: "LR rebalance" },
        { type: "rotation", rotation: "right", atValue: Number(match[2]), rootValue: Number(match[2]), caseType: "LR", label: "LR rebalance" },
      ];
    }

    match = note.match(/^Left rotation at (-?\d+) for RR imbalance\.$/);
    if (match) {
      return [{ type: "rotation", rotation: "left", atValue: Number(match[1]), caseType: "RR", label: "RR rebalance" }];
    }

    match = note.match(/^Right rotation at (-?\d+), then left rotation at (-?\d+) for RL imbalance\.$/);
    if (match) {
      return [
        { type: "rotation", rotation: "right", atValue: Number(match[1]), rootValue: Number(match[2]), caseType: "RL", label: "RL rebalance" },
        { type: "rotation", rotation: "left", atValue: Number(match[2]), rootValue: Number(match[2]), caseType: "RL", label: "RL rebalance" },
      ];
    }

    match = note.match(/^Replaced AVL node (-?\d+) with inorder successor (-?\d+)\.$/);
    if (match) {
      return [{ type: "successor", fromValue: Number(match[1]), toValue: Number(match[2]) }];
    }

    return [];
  });
}

function parseRBNotes(notes = []) {
  return notes.flatMap((note) => {
    let match = note.match(/^Performed left rotation at (-?\d+)\.$/);
    if (match) {
      return [{ type: "rotation", rotation: "left", atValue: Number(match[1]) }];
    }

    match = note.match(/^Performed right rotation at (-?\d+)\.$/);
    if (match) {
      return [{ type: "rotation", rotation: "right", atValue: Number(match[1]) }];
    }

    match = note.match(/^Flipped colors at (-?\d+)\.$/);
    if (match) {
      return [{ type: "color-flip", atValue: Number(match[1]) }];
    }

    match = note.match(/^Moved a red link left from (-?\d+)\.$/);
    if (match) {
      return [{ type: "move-red-left", atValue: Number(match[1]) }];
    }

    match = note.match(/^Moved a red link right from (-?\d+)\.$/);
    if (match) {
      return [{ type: "move-red-right", atValue: Number(match[1]) }];
    }

    match = note.match(/^Rotated right at (-?\d+) to normalize a leaning red link\.$/);
    if (match) {
      return [{ type: "rotation", rotation: "right", atValue: Number(match[1]), label: "normalize red link" }];
    }

    match = note.match(/^Replaced (-?\d+) with inorder successor (-?\d+)\.$/);
    if (match) {
      return [{ type: "successor", fromValue: Number(match[1]), toValue: Number(match[2]) }];
    }

    return [];
  });
}

function getHeight(node) {
  return node?.height || 0;
}

function updateHeight(node) {
  if (!node) {
    return node;
  }

  node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1;
  return node;
}

function balanceFactor(node) {
  return node ? getHeight(node.left) - getHeight(node.right) : 0;
}

function rotateRight(node) {
  const pivot = node.left;
  const transfer = pivot.right;
  pivot.right = node;
  node.left = transfer;
  updateHeight(node);
  updateHeight(pivot);
  return pivot;
}

function collectAVLRotationValues(tree, event) {
  const root = findNodeByValue(tree, event.rootValue ?? event.atValue);

  if (!root) {
    return [event.atValue];
  }

  if (event.caseType === "LL") {
    return [root.value, root.left?.value, root.left?.left?.value].filter((value) => value != null);
  }

  if (event.caseType === "RR") {
    return [root.value, root.right?.value, root.right?.right?.value].filter((value) => value != null);
  }

  if (event.caseType === "LR") {
    const inner = event.rotation === "right" ? root.left?.left : root.left?.right;
    return [root.value, root.left?.value, inner?.value].filter((value) => value != null);
  }

  if (event.caseType === "RL") {
    const inner = event.rotation === "left" ? root.right?.right : root.right?.left;
    return [root.value, root.right?.value, inner?.value].filter((value) => value != null);
  }

  const rotationRoot = findNodeByValue(tree, event.atValue);
  const pivot = event.rotation === "left" ? rotationRoot?.right : rotationRoot?.left;
  const transfer = event.rotation === "left" ? pivot?.left : pivot?.right;
  return [rotationRoot?.value, pivot?.value, transfer?.value].filter((value) => value != null);
}

function applyAVLRotationAtValue(tree, event) {
  const workingTree = cloneTree(tree);

  function rotateAt(node) {
    if (!node) {
      return null;
    }

    if (node.value === event.atValue) {
      return event.rotation === "left" ? rotateLeft(node) : rotateRight(node);
    }

    node.left = rotateAt(node.left);
    node.right = rotateAt(node.right);
    return updateHeight(node);
  }

  return rotateAt(workingTree);
}

function rotateLeft(node) {
  const pivot = node.right;
  const transfer = pivot.left;
  pivot.left = node;
  node.right = transfer;
  updateHeight(node);
  updateHeight(pivot);
  return pivot;
}

function isRed(node) {
  return Boolean(node) && node.color === COLORS.RED;
}

function rotateLeftRB(node) {
  const pivot = node.right;
  node.right = pivot.left;
  pivot.left = node;
  pivot.color = node.color;
  node.color = COLORS.RED;
  return pivot;
}

function rotateRightRB(node) {
  const pivot = node.left;
  node.left = pivot.right;
  pivot.right = node;
  pivot.color = node.color;
  node.color = COLORS.RED;
  return pivot;
}

function collectRBRotationValues(tree, event) {
  const rotationRoot = findNodeByValue(tree, event.atValue);
  const pivot = event.rotation === "left" ? rotationRoot?.right : rotationRoot?.left;
  const transfer = event.rotation === "left" ? pivot?.left : pivot?.right;
  return [rotationRoot?.value, pivot?.value, transfer?.value].filter((value) => value != null);
}

function applyRBRotationAtValue(tree, event) {
  const workingTree = cloneTree(tree);

  function rotateAt(node) {
    if (!node) {
      return null;
    }

    if (node.value === event.atValue) {
      return event.rotation === "left" ? rotateLeftRB(node) : rotateRightRB(node);
    }

    node.left = rotateAt(node.left);
    node.right = rotateAt(node.right);
    return node;
  }

  return rotateAt(workingTree);
}

function flipColors(node) {
  node.color = node.color === COLORS.RED ? COLORS.BLACK : COLORS.RED;

  if (node.left) {
    node.left.color = node.left.color === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  }

  if (node.right) {
    node.right.color = node.right.color === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  }
}

function applyRBColorFlipAtValue(tree, atValue) {
  const workingTree = cloneTree(tree);
  const target = findNodeByValue(workingTree, atValue);

  if (target) {
    flipColors(target);
  }

  return workingTree;
}

function moveRedLeft(node) {
  flipColors(node);

  if (isRed(node.right?.left)) {
    node.right = rotateRightRB(node.right);
    node = rotateLeftRB(node);
    flipColors(node);
  }

  return node;
}

function moveRedRight(node) {
  flipColors(node);

  if (isRed(node.left?.left)) {
    node = rotateRightRB(node);
    flipColors(node);
  }

  return node;
}

function fixUp(node) {
  if (isRed(node.right)) {
    node = rotateLeftRB(node);
  }

  if (isRed(node.left) && isRed(node.left.left)) {
    node = rotateRightRB(node);
  }

  if (isRed(node.left) && isRed(node.right)) {
    flipColors(node);
  }

  return node;
}

function minNode(node) {
  let current = node;

  while (current?.left) {
    current = current.left;
  }

  return current;
}

function deleteMin(node) {
  if (!node.left) {
    return null;
  }

  if (!isRed(node.left) && !isRed(node.left.left)) {
    node = moveRedLeft(node);
  }

  node.left = deleteMin(node.left);
  return fixUp(node);
}

function sameMultiset(leftValues, rightValues) {
  const left = [...leftValues].sort((a, b) => a - b);
  const right = [...rightValues].sort((a, b) => a - b);

  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function serializeTreeWithNulls(tree) {
  if (!tree) {
    return null;
  }

  return {
    value: isFilledNodeValue(tree.value) ? Number(tree.value) : null,
    left: serializeTreeWithNulls(tree.left),
    right: serializeTreeWithNulls(tree.right),
  };
}

function dedupe(values) {
  return [...new Set(values)];
}

function makeValidationResult(isValid, issues = [], extras = {}) {
  return {
    isValid,
    issues,
    ...extras,
  };
}

export function validateBinaryTree(tree) {
  const issues = [];
  const visited = new Set();

  function visit(node) {
    if (!node) {
      return;
    }

    if (visited.has(node.id)) {
      issues.push("Cycle detected in binary tree.");
      return;
    }

    visited.add(node.id);

    if (!isFilledNodeValue(node.value)) {
      issues.push(`Node ${node.id} does not have a numeric value.`);
    }

    visit(node.left);
    visit(node.right);
  }

  visit(tree);
  return makeValidationResult(issues.length === 0, dedupe(issues), {
    nodeCount: visited.size,
  });
}

export function validateBST(tree, min = -Infinity, max = Infinity) {
  const issues = [];

  function walk(node, lower, upper) {
    if (!node) {
      return;
    }

    if (!isFilledNodeValue(node.value)) {
      issues.push(`BST node ${node.id} is missing a value.`);
      walk(node.left, lower, upper);
      walk(node.right, lower, upper);
      return;
    }

    const nodeValue = Number(node.value);

    if (!(nodeValue > lower && nodeValue < upper)) {
      issues.push(
        `BST violation at ${nodeValue}. Expected the node to be within (${lower}, ${upper}).`,
      );
    }

    walk(node.left, lower, Math.min(upper, nodeValue));
    walk(node.right, Math.max(lower, nodeValue), upper);
  }

  walk(tree, min, max);

  return makeValidationResult(issues.length === 0, dedupe(issues), {
    inOrder: traverseTree(tree, "inorder"),
  });
}

export function validateAVL(tree) {
  const bstValidation = validateBST(tree);
  const issues = [...bstValidation.issues];

  function walk(node) {
    if (!node) {
      return 0;
    }

    const leftHeight = walk(node.left);
    const rightHeight = walk(node.right);

    if (Math.abs(leftHeight - rightHeight) > 1) {
      issues.push(`AVL imbalance at ${node.value}. Balance factor is ${leftHeight - rightHeight}.`);
    }

    return Math.max(leftHeight, rightHeight) + 1;
  }

  const height = walk(tree);

  return makeValidationResult(issues.length === 0, dedupe(issues), {
    height,
    inOrder: bstValidation.inOrder,
  });
}

export function validateRBTree(tree) {
  const issues = [];
  const bstValidation = validateBST(tree);

  if (!tree) {
    return makeValidationResult(true, []);
  }

  if (tree.color !== COLORS.BLACK) {
    issues.push("Red-Black Tree root must be black.");
  }

  function blackHeight(node) {
    if (!node) {
      return 1;
    }

    if (isRed(node) && (isRed(node.left) || isRed(node.right))) {
      issues.push(`Red node ${node.value} cannot have a red child.`);
    }

    const leftHeight = blackHeight(node.left);
    const rightHeight = blackHeight(node.right);

    if (leftHeight !== rightHeight) {
      issues.push(`Black-height mismatch detected below node ${node.value}.`);
    }

    return leftHeight + (node.color === COLORS.BLACK ? 1 : 0);
  }

  blackHeight(tree);

  return makeValidationResult(
    issues.length === 0 && bstValidation.isValid,
    dedupe([...bstValidation.issues, ...issues]),
    {
      inOrder: bstValidation.inOrder,
    },
  );
}

export function binaryInsert(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const workingTree = cloneTree(tree);
  const node = createNode(value);

  if (!workingTree) {
    recorder.record(`Inserted ${node.value} as the root node.`, node, {
      action: "insert",
      highlights: [node.id],
      meta: {
        kind: "binary-insert",
        incomingValue: node.value,
        currentNodeId: node.id,
        insertedNodeId: node.id,
        pathIds: [node.id],
        decision: "root",
      },
    });

    return {
      tree: node,
      steps: recorder.steps,
      notes: [`Root created with value ${node.value}.`],
    };
  }

  const queue = [workingTree];
  const pathIds = [];

  while (queue.length) {
    const current = queue.shift();
    pathIds.push(current.id);
    recorder.record(`Check node ${current.value} for the next open child position.`, workingTree, {
      action: "compare",
      highlights: [current.id],
      meta: {
        kind: "binary-insert",
        incomingValue: node.value,
        pathIds: [...pathIds],
        currentNodeId: current.id,
        comparedValue: current.value,
        decision: "compare",
      },
    });

    if (!current.left) {
      current.left = node;
      recorder.record(`Inserted ${node.value} as the left child of ${current.value}.`, workingTree, {
        action: "insert",
        highlights: [current.id, node.id],
        meta: {
          kind: "binary-insert",
          incomingValue: node.value,
          pathIds: [...pathIds, node.id],
          currentNodeId: node.id,
          comparedValue: current.value,
          insertedNodeId: node.id,
          decision: "placed-left",
        },
      });
      break;
    }

    if (!current.right) {
      current.right = node;
      recorder.record(
        `Inserted ${node.value} as the right child of ${current.value}.`,
        workingTree,
        {
          action: "insert",
          highlights: [current.id, node.id],
          meta: {
            kind: "binary-insert",
            incomingValue: node.value,
            pathIds: [...pathIds, node.id],
            currentNodeId: node.id,
            comparedValue: current.value,
            insertedNodeId: node.id,
            decision: "placed-right",
          },
        },
      );
      break;
    }

    queue.push(current.left, current.right);
  }

  return {
    tree: workingTree,
    steps: recorder.steps,
    notes: [`Level-order insertion completed for ${node.value}.`],
  };
}

export function binaryDelete(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const workingTree = cloneTree(tree);

  if (!workingTree) {
    return {
      tree: null,
      steps: recorder.steps,
      notes: [`Binary tree is empty. Nothing to delete for ${value}.`],
    };
  }

  let targetNode = null;
  let lastNode = null;
  let lastParent = null;
  const queue = [{ node: workingTree, parent: null }];
  const visitedIds = [];

  while (queue.length) {
    const current = queue.shift();
    visitedIds.push(current.node.id);
    recorder.record(`Check node ${current.node.value} while searching level-order for ${value}.`, workingTree, {
      action: "compare",
      highlights: [current.node.id],
      meta: {
        kind: "binary-delete",
        targetValue: toNumber(value),
        pathIds: [...visitedIds],
        currentNodeId: current.node.id,
        comparedValue: current.node.value,
        decision: "compare",
      },
    });
    lastNode = current.node;
    lastParent = current.parent;

    if (current.node.value === toNumber(value)) {
      targetNode = current.node;
      recorder.record(`Found ${value}. Keep scanning to identify the deepest replacement node.`, workingTree, {
        action: "compare",
        highlights: [current.node.id],
        meta: {
          kind: "binary-delete",
          targetValue: toNumber(value),
          pathIds: [...visitedIds],
          currentNodeId: current.node.id,
          comparedValue: current.node.value,
          decision: "found",
        },
      });
    }

    if (current.node.left) {
      queue.push({ node: current.node.left, parent: current.node });
    }

    if (current.node.right) {
      queue.push({ node: current.node.right, parent: current.node });
    }
  }

  if (!targetNode) {
    recorder.record(`Value ${value} was not found in the binary tree.`, workingTree, {
      action: "noop",
      meta: {
        kind: "binary-delete",
        targetValue: toNumber(value),
        pathIds: [...visitedIds],
        decision: "not-found",
      },
    });

    return {
      tree: workingTree,
      steps: recorder.steps,
      notes: [`Value ${value} does not exist in the current binary tree.`],
    };
  }

  if (targetNode === workingTree && !workingTree.left && !workingTree.right) {
    recorder.record(`Deleted the only node ${value} from the binary tree.`, null, {
      action: "delete",
      meta: {
        kind: "binary-delete",
        targetValue: toNumber(value),
        decision: "delete-root",
      },
    });

    return {
      tree: null,
      steps: recorder.steps,
      notes: [`Binary tree became empty after deleting ${value}.`],
    };
  }

  targetNode.value = lastNode.value;
  targetNode.color = lastNode.color || COLORS.BLACK;

  if (lastParent?.left?.id === lastNode.id) {
    lastParent.left = null;
  } else if (lastParent?.right?.id === lastNode.id) {
    lastParent.right = null;
  }

  recorder.record(
    `Deleted ${value} by replacing it with the deepest node ${lastNode.value}.`,
    workingTree,
    {
      action: "delete",
      highlights: [targetNode.id],
      meta: {
        kind: "binary-delete",
        targetValue: toNumber(value),
        pathIds: [...visitedIds],
        currentNodeId: targetNode.id,
        comparedValue: lastNode.value,
        decision: "replaced-with-deepest",
      },
    },
  );

  return {
    tree: workingTree,
    steps: recorder.steps,
    notes: [`Binary tree deletion completed for ${value}.`],
  };
}

export function bstInsert(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const workingTree = cloneTree(tree);
  const numericValue = toNumber(value);
  const comparedPathIds = [];

  if (!workingTree) {
    const root = createNode(numericValue);
    recorder.record(`Inserted ${numericValue} as the BST root.`, root, {
      action: "insert",
      highlights: [root.id],
      meta: {
        kind: "bst-insert",
        incomingValue: numericValue,
        pathIds: [root.id],
        currentNodeId: root.id,
        decision: "root",
      },
    });

    return {
      tree: root,
      steps: recorder.steps,
      notes: [`BST root created with value ${numericValue}.`],
    };
  }

  let current = workingTree;
  let parent = null;

  while (current) {
    parent = current;
    comparedPathIds.push(current.id);
    recorder.record(`Compare ${numericValue} with ${current.value}.`, workingTree, {
      action: "compare",
      highlights: [current.id],
      meta: {
        kind: "bst-insert",
        incomingValue: numericValue,
        pathIds: [...comparedPathIds],
        currentNodeId: current.id,
        comparedValue: current.value,
        decision: "compare",
      },
    });

    if (numericValue === current.value) {
      recorder.record(`Skipped ${numericValue} because BST nodes must remain unique.`, workingTree, {
        action: "noop",
        highlights: [current.id],
        meta: {
          kind: "bst-insert",
          incomingValue: numericValue,
          pathIds: [...comparedPathIds],
          currentNodeId: current.id,
          comparedValue: current.value,
          decision: "duplicate",
        },
      });

      return {
        tree: workingTree,
        steps: recorder.steps,
        notes: [`Duplicate value ${numericValue} was ignored.`],
      };
    }

    const nextDirection = numericValue < current.value ? "left" : "right";
    const nextNode = nextDirection === "left" ? current.left : current.right;

    recorder.record(
      nextNode
        ? `${numericValue} is ${nextDirection === "left" ? "smaller" : "greater"} than ${current.value}, so move ${nextDirection} to ${nextNode.value}.`
        : `${numericValue} is ${nextDirection === "left" ? "smaller" : "greater"} than ${current.value}, so ${nextDirection} is the correct open position.`,
      workingTree,
      {
        action: "compare",
        highlights: nextNode ? [current.id, nextNode.id] : [current.id],
        meta: {
          kind: "bst-insert",
          incomingValue: numericValue,
          pathIds: [...comparedPathIds],
          currentNodeId: current.id,
          comparedValue: current.value,
          decision: nextDirection,
          nextNodeId: nextNode?.id || null,
          nextComparedValue: nextNode?.value ?? null,
        },
      },
    );

    current = nextNode;
  }

  const node = createNode(numericValue);

  if (numericValue < parent.value) {
    parent.left = node;
  } else {
    parent.right = node;
  }

  recorder.record(`Inserted ${numericValue} into its valid BST range.`, workingTree, {
    action: "insert",
    highlights: [parent.id, node.id],
    meta: {
      kind: "bst-insert",
      incomingValue: numericValue,
      pathIds: [...comparedPathIds, node.id],
      currentNodeId: node.id,
      comparedValue: parent.value,
      decision: numericValue < parent.value ? "placed-left" : "placed-right",
      parentId: parent.id,
      insertedNodeId: node.id,
    },
  });

  return {
    tree: workingTree,
    steps: recorder.steps,
    notes: [`BST insertion completed for ${numericValue}.`],
  };
}

function bstDeleteRecursive(node, value) {
  if (!node) {
    return null;
  }

  if (value < node.value) {
    node.left = bstDeleteRecursive(node.left, value);
    return node;
  }

  if (value > node.value) {
    node.right = bstDeleteRecursive(node.right, value);
    return node;
  }

  if (!node.left) {
    return node.right;
  }

  if (!node.right) {
    return node.left;
  }

  const successor = minNode(node.right);
  node.value = successor.value;
  node.id = node.id || createId();
  node.right = bstDeleteRecursive(node.right, successor.value);
  return node;
}

function findBSTNode(node, value) {
  let current = node;

  while (current) {
    if (value === current.value) {
      return current;
    }

    current = value < current.value ? current.left : current.right;
  }

  return null;
}

export function bstDelete(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const workingTree = cloneTree(tree);
  const numericValue = toNumber(value);
  const comparedPathIds = [];

  if (!workingTree) {
    recorder.record(`BST is empty. Nothing to delete for ${numericValue}.`, null, {
      action: "noop",
      meta: {
        kind: "bst-delete",
        targetValue: numericValue,
        pathIds: [],
        decision: "empty",
      },
    });

    return {
      tree: null,
      steps: recorder.steps,
      notes: [`BST is empty. Nothing to delete for ${numericValue}.`],
    };
  }

  let current = workingTree;

  while (current) {
    comparedPathIds.push(current.id);
    recorder.record(`Compare ${numericValue} with ${current.value}.`, workingTree, {
      action: "compare",
      highlights: [current.id],
      meta: {
        kind: "bst-delete",
        targetValue: numericValue,
        pathIds: [...comparedPathIds],
        currentNodeId: current.id,
        comparedValue: current.value,
        decision: "compare",
      },
    });

    if (numericValue === current.value) {
      recorder.record(`Found ${numericValue}. Prepare to remove this BST node.`, workingTree, {
        action: "compare",
        highlights: [current.id],
        meta: {
          kind: "bst-delete",
          targetValue: numericValue,
          pathIds: [...comparedPathIds],
          currentNodeId: current.id,
          comparedValue: current.value,
          decision: "found",
        },
      });
      break;
    }

    const nextDirection = numericValue < current.value ? "left" : "right";
    const nextNode = nextDirection === "left" ? current.left : current.right;

    recorder.record(
      nextNode
        ? `${numericValue} is ${nextDirection === "left" ? "smaller" : "greater"} than ${current.value}, so continue ${nextDirection} to ${nextNode.value}.`
        : `${numericValue} should go ${nextDirection} from ${current.value}, but that branch is empty.`,
      workingTree,
      {
        action: "compare",
        highlights: nextNode ? [current.id, nextNode.id] : [current.id],
        meta: {
          kind: "bst-delete",
          targetValue: numericValue,
          pathIds: [...comparedPathIds],
          currentNodeId: current.id,
          comparedValue: current.value,
          decision: nextDirection,
          nextNodeId: nextNode?.id || null,
          nextComparedValue: nextNode?.value ?? null,
        },
      },
    );

    current = nextNode;
  }

  const targetNode = findBSTNode(workingTree, numericValue);

  if (targetNode?.left && targetNode?.right) {
    recorder.record(
      `Node ${numericValue} has two children. Find the inorder successor in the right subtree.`,
      workingTree,
      {
        action: "compare",
        highlights: [targetNode.id, targetNode.right.id],
        meta: {
          kind: "bst-delete",
          targetValue: numericValue,
          pathIds: [...comparedPathIds, targetNode.right.id],
          currentNodeId: targetNode.id,
          comparedValue: targetNode.value,
          decision: "find-successor",
          successorNodeId: targetNode.right.id,
        },
      },
    );

    let successorCursor = targetNode.right;
    const successorPathIds = [...comparedPathIds, successorCursor.id];

    recorder.record(`Start successor search at ${successorCursor.value}.`, workingTree, {
      action: "compare",
      highlights: [successorCursor.id],
      meta: {
        kind: "bst-delete",
        targetValue: numericValue,
        pathIds: [...successorPathIds],
        currentNodeId: successorCursor.id,
        comparedValue: successorCursor.value,
        decision: "successor-start",
        successorNodeId: successorCursor.id,
      },
    });

    while (successorCursor.left) {
      successorPathIds.push(successorCursor.left.id);
      recorder.record(
        `Move left from ${successorCursor.value} to ${successorCursor.left.value} to find the smallest larger value.`,
        workingTree,
        {
          action: "compare",
          highlights: [successorCursor.id, successorCursor.left.id],
          meta: {
            kind: "bst-delete",
            targetValue: numericValue,
            pathIds: [...successorPathIds],
            currentNodeId: successorCursor.left.id,
            comparedValue: successorCursor.left.value,
            decision: "successor-left",
            successorNodeId: successorCursor.left.id,
          },
        },
      );
      successorCursor = successorCursor.left;
    }

    recorder.record(
      `Successor found: ${successorCursor.value}. It will replace ${numericValue}.`,
      workingTree,
      {
        action: "compare",
        highlights: [targetNode.id, successorCursor.id],
        meta: {
          kind: "bst-delete",
          targetValue: numericValue,
          pathIds: [...successorPathIds],
          currentNodeId: successorCursor.id,
          comparedValue: successorCursor.value,
          decision: "successor-found",
          successorNodeId: successorCursor.id,
          replacedNodeId: targetNode.id,
        },
      },
    );
  } else if (targetNode) {
    recorder.record(
      targetNode.left || targetNode.right
        ? `Node ${numericValue} has one child, so promote that child after deletion.`
        : `Node ${numericValue} is a leaf, so it can be removed directly.`,
      workingTree,
      {
        action: "compare",
        highlights: [targetNode.id],
        meta: {
          kind: "bst-delete",
          targetValue: numericValue,
          pathIds: [...comparedPathIds],
          currentNodeId: targetNode.id,
          comparedValue: targetNode.value,
          decision: targetNode.left || targetNode.right ? "promote-child" : "delete-leaf",
        },
      },
    );
  }

  const beforeValues = collectValues(workingTree);
  const nextTree = bstDeleteRecursive(workingTree, numericValue);
  const afterValues = collectValues(nextTree);

  if (beforeValues.length === afterValues.length) {
    recorder.record(`Value ${numericValue} was not found in the BST.`, nextTree, {
      action: "noop",
      meta: {
        kind: "bst-delete",
        targetValue: numericValue,
        pathIds: [...comparedPathIds],
        decision: "not-found",
      },
    });
  } else {
    const replacementNode = findBSTNode(nextTree, numericValue);
    recorder.record(`Deleted ${numericValue} from the BST using successor replacement when needed.`, nextTree, {
      action: "delete",
      highlights: replacementNode?.id ? [replacementNode.id] : [],
      meta: {
        kind: "bst-delete",
        targetValue: numericValue,
        pathIds: [...comparedPathIds],
        currentNodeId: replacementNode?.id || null,
        comparedValue: replacementNode?.value ?? null,
        decision: "deleted",
      },
    });
  }

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes: [`BST deletion completed for ${numericValue}.`],
  };
}

function rebalanceAVL(node, notes) {
  updateHeight(node);
  const balance = balanceFactor(node);

  if (balance > 1 && balanceFactor(node.left) >= 0) {
    notes.push(`Right rotation at ${node.value} for LL imbalance.`);
    return rotateRight(node);
  }

  if (balance > 1 && balanceFactor(node.left) < 0) {
    notes.push(`Left rotation at ${node.left.value}, then right rotation at ${node.value} for LR imbalance.`);
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }

  if (balance < -1 && balanceFactor(node.right) <= 0) {
    notes.push(`Left rotation at ${node.value} for RR imbalance.`);
    return rotateLeft(node);
  }

  if (balance < -1 && balanceFactor(node.right) > 0) {
    notes.push(`Right rotation at ${node.right.value}, then left rotation at ${node.value} for RL imbalance.`);
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }

  return node;
}

function avlInsertWithoutRebalance(node, value, notes, insertedNodeId) {
  if (!node) {
    notes.push(`Inserted ${value} as a new AVL node.`);
    return createNode(value, { id: insertedNodeId });
  }

  if (value < node.value) {
    node.left = avlInsertWithoutRebalance(node.left, value, notes, insertedNodeId);
  } else if (value > node.value) {
    node.right = avlInsertWithoutRebalance(node.right, value, notes, insertedNodeId);
  } else {
    notes.push(`Skipped duplicate AVL value ${value}.`);
    return node;
  }

  return updateHeight(node);
}

function rebalanceAVLTree(node, notes) {
  if (!node) {
    return null;
  }

  node.left = rebalanceAVLTree(node.left, notes);
  node.right = rebalanceAVLTree(node.right, notes);
  return rebalanceAVL(node, notes);
}

export function avlInsert(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const numericValue = toNumber(value);
  const workingTree = cloneTree(tree);
  const searchMeta = buildOrderedSearchPlayback({
    recorder,
    tree: workingTree,
    targetValue: numericValue,
    metaKind: "avl-insert",
    mode: "insert",
  });

  if (searchMeta.found) {
    return {
      tree: cloneTree(tree),
      steps: recorder.steps,
      notes: [`Skipped duplicate AVL value ${numericValue}.`],
    };
  }

  const insertedNodeId = createId();
  const placementNotes = [];
  const unbalancedTree = avlInsertWithoutRebalance(cloneTree(tree), numericValue, placementNotes, insertedNodeId);
  const notes = [];
  const nextTree = rebalanceAVLTree(cloneTree(unbalancedTree), notes);
  const insertedNode = findNodeByValue(unbalancedTree, numericValue);
  recorder.record(
    `Inserted ${numericValue} at its normal BST position first. Now check AVL balance on the way back up.`,
    unbalancedTree,
    {
      action: "insert",
      highlights: insertedNode?.id ? [insertedNode.id] : [],
      meta: {
        kind: "avl-insert",
        incomingValue: numericValue,
        pathIds: insertedNode?.id ? [...searchMeta.pathIds, insertedNode.id] : [...searchMeta.pathIds],
        currentNodeId: insertedNode?.id || null,
        insertedNodeId: insertedNode?.id || null,
        decision: insertedNode ? "placed" : "duplicate",
      },
    },
  );

  let rotationPlaybackTree = cloneTree(unbalancedTree);
  parseAVLNotes(notes).forEach((event) => {
    if (event.type === "rotation") {
      const rotationValues = collectAVLRotationValues(rotationPlaybackTree, event);
      const afterRotationTree = applyAVLRotationAtValue(rotationPlaybackTree, event);
      const beforeHighlightIds = findNodeIdsForValues(rotationPlaybackTree, rotationValues);
      const afterHighlightIds = findNodeIdsForValues(afterRotationTree, rotationValues);
      recorder.record(
        `${event.label || "AVL rebalance"} marks ${rotationValues.join(", ")} for a ${event.rotation} rotation at ${event.atValue}.`,
        rotationPlaybackTree,
        {
          action: "compare",
          highlights: beforeHighlightIds,
          meta: {
            kind: "avl-insert",
            incomingValue: numericValue,
            pathIds: beforeHighlightIds,
            currentNodeId: beforeHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationCase: event.caseType || null,
            rotationLabel: event.label || "rebalance",
            rotationValues,
          },
        },
      );
      recorder.record(
        `${event.label || "AVL rebalance"} completed. The same values keep their sorted order after the ${event.rotation} rotation.`,
        afterRotationTree,
        {
          action: "compare",
          highlights: afterHighlightIds,
          meta: {
            kind: "avl-insert",
            incomingValue: numericValue,
            pathIds: afterHighlightIds,
            currentNodeId: afterHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationCase: event.caseType || null,
            rotationLabel: event.label || "rebalance",
            rotationValues,
          },
        },
      );
      rotationPlaybackTree = afterRotationTree;
    }
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes: [...placementNotes, ...notes],
  };
}

function avlDeleteWithoutRebalance(node, value, notes) {
  if (!node) {
    notes.push(`Value ${value} was not found in the AVL tree.`);
    return null;
  }

  if (value < node.value) {
    node.left = avlDeleteWithoutRebalance(node.left, value, notes);
  } else if (value > node.value) {
    node.right = avlDeleteWithoutRebalance(node.right, value, notes);
  } else if (!node.left || !node.right) {
    notes.push(`Deleted AVL node ${value} with at most one child.`);
    return node.left || node.right || null;
  } else {
    const successor = minNode(node.right);
    node.value = successor.value;
    notes.push(`Replaced AVL node ${value} with inorder successor ${successor.value}.`);
    node.right = avlDeleteWithoutRebalance(node.right, successor.value, notes);
  }

  return updateHeight(node);
}

export function avlDelete(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const numericValue = toNumber(value);
  const workingTree = cloneTree(tree);
  buildOrderedSearchPlayback({
    recorder,
    tree: workingTree,
    targetValue: numericValue,
    metaKind: "avl-delete",
    mode: "delete",
  });
  const deleteNotes = [];
  const unbalancedTree = avlDeleteWithoutRebalance(cloneTree(tree), numericValue, deleteNotes);
  const rotationNotes = [];
  const nextTree = rebalanceAVLTree(cloneTree(unbalancedTree), rotationNotes);
  const notes = [...deleteNotes, ...rotationNotes];
  const parsedEvents = parseAVLNotes(notes);
  const successorEvent = parsedEvents.find((event) => event.type === "successor");

  if (successorEvent) {
    const successorIds = findNodeIdsForValues(nextTree, [successorEvent.toValue]);
    recorder.record(
      `AVL delete replaced ${successorEvent.fromValue} with successor ${successorEvent.toValue}.`,
      nextTree,
      {
        action: "compare",
        highlights: successorIds,
        meta: {
          kind: "avl-delete",
          targetValue: numericValue,
          pathIds: successorIds,
          currentNodeId: successorIds[0] || null,
          comparedValue: successorEvent.toValue,
          decision: "successor-found",
        },
      },
    );
  }

  recorder.record(deleteNotes.join(" "), unbalancedTree, {
    action: "delete",
    meta: {
      kind: "avl-delete",
      targetValue: numericValue,
      decision: "deleted",
    },
  });

  let rotationPlaybackTree = cloneTree(unbalancedTree);
  parsedEvents.forEach((event) => {
    if (event.type === "rotation") {
      const rotationValues = collectAVLRotationValues(rotationPlaybackTree, event);
      const afterRotationTree = applyAVLRotationAtValue(rotationPlaybackTree, event);
      const beforeHighlightIds = findNodeIdsForValues(rotationPlaybackTree, rotationValues);
      const afterHighlightIds = findNodeIdsForValues(afterRotationTree, rotationValues);
      recorder.record(
        `${event.label || "AVL rebalance"} marks ${rotationValues.join(", ")} for a ${event.rotation} rotation at ${event.atValue}.`,
        rotationPlaybackTree,
        {
          action: "compare",
          highlights: beforeHighlightIds,
          meta: {
            kind: "avl-delete",
            targetValue: numericValue,
            pathIds: beforeHighlightIds,
            currentNodeId: beforeHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationCase: event.caseType || null,
            rotationLabel: event.label || "rebalance",
            rotationValues,
          },
        },
      );
      recorder.record(
        `${event.label || "AVL rebalance"} completed. The same values keep their sorted order after the ${event.rotation} rotation.`,
        afterRotationTree,
        {
          action: "compare",
          highlights: afterHighlightIds,
          meta: {
            kind: "avl-delete",
            targetValue: numericValue,
            pathIds: afterHighlightIds,
            currentNodeId: afterHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationCase: event.caseType || null,
            rotationLabel: event.label || "rebalance",
            rotationValues,
          },
        },
      );
      rotationPlaybackTree = afterRotationTree;
    }
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes,
  };
}

function rbInsertRecursive(node, value, notes, insertedNodeId = null) {
  if (!node) {
    notes.push(`Inserted ${value} as a red node.`);
    return createNode(value, { color: COLORS.RED, id: insertedNodeId || undefined });
  }

  if (value < node.value) {
    node.left = rbInsertRecursive(node.left, value, notes, insertedNodeId);
  } else if (value > node.value) {
    node.right = rbInsertRecursive(node.right, value, notes, insertedNodeId);
  } else {
    notes.push(`Skipped duplicate Red-Black value ${value}.`);
  }

  if (isRed(node.right) && !isRed(node.left)) {
    notes.push(`Performed left rotation at ${node.value}.`);
    node = rotateLeftRB(node);
  }

  if (isRed(node.left) && isRed(node.left.left)) {
    notes.push(`Performed right rotation at ${node.value}.`);
    node = rotateRightRB(node);
  }

  if (isRed(node.left) && isRed(node.right)) {
    notes.push(`Flipped colors at ${node.value}.`);
    flipColors(node);
  }

  return node;
}

function rbInsertWithoutRepair(node, value, notes, insertedNodeId) {
  if (!node) {
    notes.push(`Inserted ${value} as a red node.`);
    return createNode(value, { color: COLORS.RED, id: insertedNodeId });
  }

  if (value < node.value) {
    node.left = rbInsertWithoutRepair(node.left, value, notes, insertedNodeId);
  } else if (value > node.value) {
    node.right = rbInsertWithoutRepair(node.right, value, notes, insertedNodeId);
  } else {
    notes.push(`Skipped duplicate Red-Black value ${value}.`);
  }

  return node;
}

export function rbInsert(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const numericValue = toNumber(value);
  const workingTree = cloneTree(tree);
  const searchMeta = buildOrderedSearchPlayback({
    recorder,
    tree: workingTree,
    targetValue: numericValue,
    metaKind: "rb-insert",
    mode: "insert",
  });
  if (searchMeta.found) {
    return {
      tree: cloneTree(tree),
      steps: recorder.steps,
      notes: [`Skipped duplicate Red-Black value ${numericValue}.`],
    };
  }

  const insertedNodeId = createId();
  const placementNotes = [];
  const unbalancedTree = rbInsertWithoutRepair(cloneTree(tree), numericValue, placementNotes, insertedNodeId);
  const notes = [];
  const nextTree = rbInsertRecursive(cloneTree(tree), numericValue, notes, insertedNodeId);

  if (nextTree) {
    nextTree.color = COLORS.BLACK;
  }

  const insertedNode = findNodeByValue(unbalancedTree, numericValue);
  recorder.record(`Inserted ${numericValue} as a red node at its BST position before Red-Black repair.`, unbalancedTree, {
    action: "insert",
    highlights: insertedNode?.id ? [insertedNode.id] : [],
    meta: {
      kind: "rb-insert",
      incomingValue: numericValue,
      pathIds: insertedNode?.id ? [...searchMeta.pathIds, insertedNode.id] : [...searchMeta.pathIds],
      currentNodeId: insertedNode?.id || null,
      insertedNodeId: insertedNode?.id || null,
      decision: "placed",
    },
  });

  let repairPlaybackTree = cloneTree(unbalancedTree);
  parseRBNotes(notes).forEach((event) => {
    if (event.type === "rotation") {
      const rotationValues = collectRBRotationValues(repairPlaybackTree, event);
      const beforeHighlightIds = findNodeIdsForValues(repairPlaybackTree, rotationValues);
      const afterRotationTree = applyRBRotationAtValue(repairPlaybackTree, event);
      const afterHighlightIds = findNodeIdsForValues(afterRotationTree, rotationValues);
      recorder.record(
        `Red-Black repair marks ${rotationValues.join(", ")} for a ${event.rotation} rotation at ${event.atValue}.`,
        repairPlaybackTree,
        {
          action: "compare",
          highlights: beforeHighlightIds,
          meta: {
            kind: "rb-insert",
            incomingValue: numericValue,
            pathIds: beforeHighlightIds,
            currentNodeId: beforeHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationLabel: event.label || "repair",
            rotationValues,
          },
        },
      );
      recorder.record(
        `Red-Black repair completed the ${event.rotation} rotation. The same values keep their sorted order.`,
        afterRotationTree,
        {
          action: "compare",
          highlights: afterHighlightIds,
          meta: {
            kind: "rb-insert",
            incomingValue: numericValue,
            pathIds: afterHighlightIds,
            currentNodeId: afterHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationLabel: event.label || "repair",
            rotationValues,
          },
        },
      );
      repairPlaybackTree = afterRotationTree;
    }

    if (event.type === "color-flip") {
      const highlightIds = findNodeIdsForValues(repairPlaybackTree, [event.atValue]);
      const afterColorFlipTree = applyRBColorFlipAtValue(repairPlaybackTree, event.atValue);
      recorder.record(`Red-Black repair flipped colors at ${event.atValue}.`, afterColorFlipTree, {
        action: "compare",
        highlights: highlightIds,
        meta: {
          kind: "rb-insert",
          incomingValue: numericValue,
          pathIds: highlightIds,
          currentNodeId: highlightIds[0] || null,
          decision: "color-flip",
        },
      });
      repairPlaybackTree = afterColorFlipTree;
    }
  });

  recorder.record(`Red-Black insert complete. Nodes now show their final red and black colors.`, nextTree, {
    action: "compare",
    highlights: [],
    meta: {
      kind: "rb-insert",
      incomingValue: numericValue,
      pathIds: [],
      currentNodeId: null,
      decision: "colors-restored",
    },
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes: [...placementNotes, ...notes],
  };
}

function rbDeleteRecursive(node, value, notes) {
  if (value < node.value) {
    if (node.left) {
      if (!isRed(node.left) && !isRed(node.left.left)) {
        notes.push(`Moved a red link left from ${node.value}.`);
        node = moveRedLeft(node);
      }

      node.left = rbDeleteRecursive(node.left, value, notes);
    }
  } else {
    if (isRed(node.left)) {
      notes.push(`Rotated right at ${node.value} to normalize a leaning red link.`);
      node = rotateRightRB(node);
    }

    if (value === node.value && !node.right) {
      notes.push(`Deleted leaf node ${value} from the Red-Black Tree.`);
      return null;
    }

    if (node.right) {
      if (!isRed(node.right) && !isRed(node.right.left)) {
        notes.push(`Moved a red link right from ${node.value}.`);
        node = moveRedRight(node);
      }

      if (value === node.value) {
        const successor = minNode(node.right);
        notes.push(`Replaced ${value} with inorder successor ${successor.value}.`);
        node.value = successor.value;
        node.right = deleteMin(node.right);
      } else {
        node.right = rbDeleteRecursive(node.right, value, notes);
      }
    }
  }

  return fixUp(node);
}

export function rbDelete(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const notes = [];
  const workingTree = cloneTree(tree);
  const numericValue = toNumber(value);

  if (!workingTree) {
    return {
      tree: null,
      steps: [],
      notes: [`Red-Black Tree is empty. Nothing to delete for ${value}.`],
    };
  }

  buildOrderedSearchPlayback({
    recorder,
    tree: workingTree,
    targetValue: numericValue,
    metaKind: "rb-delete",
    mode: "delete",
  });

  let nextTree = workingTree;

  if (!isRed(nextTree.left) && !isRed(nextTree.right)) {
    nextTree.color = COLORS.RED;
  }

  let deletePlaybackTree = cloneTree(nextTree);
  nextTree = rbDeleteRecursive(nextTree, numericValue, notes);

  if (nextTree) {
    nextTree.color = COLORS.BLACK;
  }

  recorder.record(notes.join(" "), nextTree, {
    action: "delete",
    meta: {
      kind: "rb-delete",
      targetValue: numericValue,
      decision: "deleted",
    },
  });

  parseRBNotes(notes).forEach((event) => {
    if (event.type === "rotation") {
      const rotationValues = collectRBRotationValues(deletePlaybackTree, event);
      const beforeHighlightIds = findNodeIdsForValues(deletePlaybackTree, rotationValues);
      const afterRotationTree = applyRBRotationAtValue(deletePlaybackTree, event);
      const afterHighlightIds = findNodeIdsForValues(afterRotationTree, rotationValues);
      recorder.record(
        `Red-Black delete marks ${rotationValues.join(", ")} for a ${event.rotation} rotation at ${event.atValue}.`,
        deletePlaybackTree,
        {
          action: "compare",
          highlights: beforeHighlightIds,
          meta: {
            kind: "rb-delete",
            targetValue: numericValue,
            pathIds: beforeHighlightIds,
            currentNodeId: beforeHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationLabel: event.label || "repair",
            rotationValues,
          },
        },
      );
      recorder.record(
        `Red-Black delete completed the ${event.rotation} rotation. The same values keep their sorted order.`,
        afterRotationTree,
        {
          action: "compare",
          highlights: afterHighlightIds,
          meta: {
            kind: "rb-delete",
            targetValue: numericValue,
            pathIds: afterHighlightIds,
            currentNodeId: afterHighlightIds[0] || null,
            decision: `rotate-${event.rotation}`,
            rotation: event.rotation,
            rotationLabel: event.label || "repair",
            rotationValues,
          },
        },
      );
      deletePlaybackTree = afterRotationTree;
    }

    if (event.type === "color-flip") {
      const highlightIds = findNodeIdsForValues(nextTree, [event.atValue, event.toValue].filter((entry) => entry != null));
      recorder.record(`Red-Black delete flipped colors at ${event.atValue}.`, nextTree, {
        action: "compare",
        highlights: highlightIds,
        meta: {
          kind: "rb-delete",
          targetValue: numericValue,
          pathIds: highlightIds,
          currentNodeId: highlightIds[0] || null,
          decision: "color-flip",
        },
      });
    }

    if (event.type === "move-red-left" || event.type === "move-red-right") {
      const highlightIds = findNodeIdsForValues(nextTree, [event.atValue, event.toValue].filter((entry) => entry != null));
      recorder.record(
        `Red-Black delete ${event.type === "move-red-left" ? "moved a red link left" : "moved a red link right"} from ${event.atValue}.`,
        nextTree,
        {
          action: "compare",
          highlights: highlightIds,
          meta: {
            kind: "rb-delete",
            targetValue: numericValue,
            pathIds: highlightIds,
            currentNodeId: highlightIds[0] || null,
            decision: event.type,
          },
        },
      );
    }

    if (event.type === "successor") {
      const highlightIds = findNodeIdsForValues(nextTree, [event.atValue, event.toValue].filter((entry) => entry != null));
      recorder.record(
        `Red-Black delete replaced ${event.fromValue} with successor ${event.toValue}.`,
        nextTree,
        {
          action: "compare",
          highlights: highlightIds,
          meta: {
            kind: "rb-delete",
            targetValue: numericValue,
            pathIds: highlightIds,
            currentNodeId: highlightIds[0] || null,
            comparedValue: event.toValue,
            decision: "successor-found",
          },
        },
      );
    }
  });

  recorder.record(`Red-Black delete complete. Nodes now show their final red and black colors.`, nextTree, {
    action: "compare",
    highlights: [],
    meta: {
      kind: "rb-delete",
      targetValue: numericValue,
      pathIds: [],
      currentNodeId: null,
      decision: "colors-restored",
    },
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes,
  };
}

export function validateConstraints(tree, constraints = {}) {
  const issues = [];
  const values = collectValues(tree);
  const uniqueValues = new Set(values);
  const minValue = constraints.minValue ?? -Infinity;
  const maxValue = constraints.maxValue ?? Infinity;

  values.forEach((value) => {
    if (value < minValue || value > maxValue) {
      issues.push(`Node value ${value} falls outside the allowed range ${minValue} to ${maxValue}.`);
    }
  });

  if (constraints.allowDuplicates === false && uniqueValues.size !== values.length) {
    issues.push("Duplicate values are not allowed for this assignment.");
  }

  if (constraints.minNodes && values.length < constraints.minNodes) {
    issues.push(`At least ${constraints.minNodes} nodes are required.`);
  }

  if (constraints.maxNodes && values.length > constraints.maxNodes) {
    issues.push(`No more than ${constraints.maxNodes} nodes are allowed.`);
  }

  if (Array.isArray(constraints.placeholderRules)) {
    constraints.placeholderRules.forEach((rule) => {
      const path = String(rule.path || "")
        .split(".")
        .filter(Boolean);
      let current = tree;

      path.forEach((segment) => {
        current = current?.[segment] || null;
      });

      if (!current) {
        issues.push(`Expected a node at path ${rule.path}.`);
        return;
      }

      if (rule.minValue != null && current.value < rule.minValue) {
        issues.push(`Node at ${rule.path} must be at least ${rule.minValue}.`);
      }

      if (rule.maxValue != null && current.value > rule.maxValue) {
        issues.push(`Node at ${rule.path} must be at most ${rule.maxValue}.`);
      }
    });
  }

  return makeValidationResult(issues.length === 0, dedupe(issues), {
    values,
  });
}

export function applyTreeOperation(treeType, tree, operation, options = {}) {
  const normalizedTreeType = normalizeTreeType(treeType);
  const action = operation.action || operation.type;

  if (action === "traverse") {
    const order = operation.order || "inorder";
    const playback = buildTraversalPlayback(tree, order, options);
    const traversal = playback.traversal;
    const cleanTree = cloneTree(tree);
    const steps = [...playback.steps];

    if (options.recordSteps) {
      steps.push({
        id: createId(),
        description: "Traversal complete. Showing the final tree without highlights.",
        tree: cleanTree,
        action: "update",
        highlights: [],
        traversal,
        operation,
        meta: {
          kind: "tree-traverse",
          order,
          pathIds: [],
          currentNodeId: null,
          currentValue: null,
          traversal,
          decision: "complete",
        },
      });
    }

    return {
      tree: cleanTree,
      steps,
      traversal,
      notes: [`${order} traversal: ${traversal.join(" -> ") || "empty tree"}.`],
    };
  }

  const handlerMap = {
    [TREE_TYPES.BINARY]: {
      insert: binaryInsert,
      delete: binaryDelete,
    },
    [TREE_TYPES.BST]: {
      insert: bstInsert,
      delete: bstDelete,
    },
    [TREE_TYPES.AVL]: {
      insert: avlInsert,
      delete: avlDelete,
    },
    [TREE_TYPES.RB]: {
      insert: rbInsert,
      delete: rbDelete,
    },
  };

  const handler = handlerMap[normalizedTreeType]?.[action];

  if (!handler) {
    return {
      tree: cloneTree(tree),
      steps: [],
      notes: [`Unsupported ${action} operation for ${normalizedTreeType}.`],
    };
  }

  const result = handler(tree, operation.value, options);

  if (options.recordSteps && ["insert", "delete"].includes(action)) {
    result.steps = [
      ...(result.steps || []),
      {
        id: createId(),
        description: "Operation complete. Showing the final tree without highlights.",
        tree: cloneTree(result.tree),
        action: "update",
        highlights: [],
        traversal: [],
        operation,
        meta: {
          kind: `${normalizedTreeType}-${action}`,
          incomingValue: action === "insert" ? operation.value : undefined,
          targetValue: action === "delete" ? operation.value : undefined,
          pathIds: [],
          currentNodeId: null,
          decision: "complete",
        },
      },
    ];
  }

  return result;
}

export function simulateOperations({
  treeType,
  initialTree = null,
  operations = [],
  recordSteps = true,
}) {
  let workingTree = cloneTree(initialTree);
  const steps = [];
  const notes = [];
  const traversals = [];

  operations.forEach((operation, index) => {
    const result = applyTreeOperation(treeType, workingTree, operation, {
      recordSteps,
    });

    workingTree = cloneTree(result.tree);
    notes.push(...(result.notes || []));

    result.steps.forEach((step) => {
      steps.push({
        ...step,
        operationIndex: index,
      });
    });

    if (result.traversal) {
      traversals.push({
        order: operation.order,
        values: result.traversal,
      });
    }
  });

  return {
    tree: workingTree,
    steps,
    notes,
    traversals,
  };
}

function validatorForTreeType(treeType) {
  switch (normalizeTreeType(treeType)) {
    case TREE_TYPES.BINARY:
      return validateBinaryTree;
    case TREE_TYPES.BST:
      return validateBST;
    case TREE_TYPES.AVL:
      return validateAVL;
    case TREE_TYPES.RB:
      return validateRBTree;
    default:
      return validateBST;
  }
}

export function evaluateSubmission({
  treeType,
  assignment = {},
  submissionTree,
  submittedTraversals = [],
}) {
  const normalizedTreeType = normalizeTreeType(treeType || assignment.treeType);
  const validator = validatorForTreeType(normalizedTreeType);
  const expectedTree = assignment.solutionTree
    ? cloneTree(assignment.solutionTree)
    : simulateOperations({
        treeType: normalizedTreeType,
        initialTree: assignment.initialTree || null,
        operations: assignment.operations || [],
        recordSteps: false,
      }).tree;

  const expected = {
    tree: expectedTree,
  };

  const scoringWeights = {
    validity: 40,
    values: 30,
    constraints: 20,
    traversal: 10,
    ...(assignment.expectedRules?.scoringWeights || {}),
  };

  const mistakes = [];
  let score = 0;

  const validation = validator(submissionTree);
  if (validation.isValid) {
    score += scoringWeights.validity;
  } else {
    mistakes.push(...validation.issues);
  }

  const expectedValues = collectValues(expected.tree);
  const submittedValues = collectValues(submissionTree);
  const expectedInOrder = traverseTree(expected.tree, "inorder");
  const submittedInOrder = traverseTree(submissionTree, "inorder");

  const valuesMatch = assignment.solutionTree
    ? JSON.stringify(serializeTreeWithNulls(submissionTree))
      === JSON.stringify(serializeTreeWithNulls(expected.tree))
    : normalizedTreeType === TREE_TYPES.BINARY
      ? sameMultiset(expectedValues, submittedValues)
      : sameMultiset(expectedInOrder, submittedInOrder);

  if (valuesMatch) {
    score += scoringWeights.values;
  } else {
    mistakes.push(
      assignment.solutionTree
        ? "The submitted tree does not match the teacher's expected node placement."
        : "The submitted tree does not contain the correct set of node values after applying the required operations.",
    );
  }

  const constraintValidation = validateConstraints(submissionTree, assignment.constraints || {});
  if (constraintValidation.isValid) {
    score += scoringWeights.constraints;
  } else {
    mistakes.push(...constraintValidation.issues);
  }

  const expectedTraversalTargets = (assignment.operations || [])
    .filter((operation) => operation.action === "traverse")
    .map((operation) => ({
      order: operation.order,
      values: traverseTree(expected.tree, operation.order),
    }));

  if (!expectedTraversalTargets.length) {
    score += scoringWeights.traversal;
  } else {
    const traversalMatch = expectedTraversalTargets.every((target) =>
      submittedTraversals.some(
        (submission) =>
          submission.order === target.order &&
          JSON.stringify(submission.values || []) === JSON.stringify(target.values || []),
      ),
    );

    if (traversalMatch) {
      score += scoringWeights.traversal;
    } else {
      mistakes.push("Traversal output does not match the expected algorithm result.");
    }
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const suggestions = dedupe(
    mistakes.map((mistake) => {
      if (mistake.toLowerCase().includes("balance")) {
        return "Recheck subtree heights and apply the required AVL rotations.";
      }

      if (mistake.toLowerCase().includes("red")) {
        return "Inspect node colors and ensure no red node has a red child.";
      }

      if (mistake.toLowerCase().includes("range")) {
        return "Place each node within the valid numeric range imposed by its ancestors.";
      }

      if (mistake.toLowerCase().includes("traversal")) {
        return "Replay the operations and compare your traversal sequence step by step.";
      }

      return "Replay the operations from the root and check each decision point carefully.";
    }),
  );

  return {
    score: normalizedScore,
    mistakes: dedupe(mistakes),
    suggestions,
    correctTree: expected.tree,
    expectedTraversals: expectedTraversalTargets,
    evaluationMeta: {
      expectedValues,
      submittedValues,
      treeType: normalizedTreeType,
    },
  };
}

export function createTreeFromValues(treeType, values = []) {
  return values.reduce((tree, value) => {
    const result = applyTreeOperation(treeType, tree, {
      action: "insert",
      value,
    });

    return result.tree;
  }, null);
}

export function getTreeTypeMeta() {
  return TREE_TYPE_META;
}

export function getTreePalette() {
  return {
    defaultNode: "#0f172a",
    text: "#e2e8f0",
    accent: "#22d3ee",
    redNode: "#ef4444",
    blackNode: "#111827",
    edge: "#64748b",
  };
}

export function treeToD3Data(tree) {
  if (!tree) {
    return null;
  }

  return {
    name: isFilledNodeValue(tree.value) ? String(tree.value) : "+",
    attributes: {
      color: tree.color,
      height: tree.height,
      isEmpty: !isFilledNodeValue(tree.value),
      hasLeftChild: Boolean(tree.left),
      hasRightChild: Boolean(tree.right),
    },
    nodeId: tree.id,
    children: [tree.left, tree.right].filter(Boolean).map((child) => treeToD3Data(child)),
  };
}

export {
  COLORS,
  TREE_TYPES,
};
