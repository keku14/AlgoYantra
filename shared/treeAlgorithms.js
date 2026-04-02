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
    value: toNumber(value),
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

  return [tree.value, ...collectValues(tree.left), ...collectValues(tree.right)];
}

export function traverseTree(tree, order = "inorder") {
  const values = [];

  function visit(node) {
    if (!node) {
      return;
    }

    if (order === "preorder") {
      values.push(node.value);
    }

    visit(node.left);

    if (order === "inorder") {
      values.push(node.value);
    }

    visit(node.right);

    if (order === "postorder") {
      values.push(node.value);
    }
  }

  if (order === "levelorder") {
    const queue = [];

    if (tree) {
      queue.push(tree);
    }

    while (queue.length) {
      const current = queue.shift();
      values.push(current.value);

      if (current.left) {
        queue.push(current.left);
      }

      if (current.right) {
        queue.push(current.right);
      }
    }

    return values;
  }

  visit(tree);
  return values;
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
      });
    },
  };
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

function flipColors(node) {
  node.color = node.color === COLORS.RED ? COLORS.BLACK : COLORS.RED;

  if (node.left) {
    node.left.color = node.left.color === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  }

  if (node.right) {
    node.right.color = node.right.color === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  }
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

    if (!Number.isFinite(Number(node.value))) {
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

    if (!(node.value > lower && node.value < upper)) {
      issues.push(
        `BST violation at ${node.value}. Expected the node to be within (${lower}, ${upper}).`,
      );
    }

    walk(node.left, lower, Math.min(upper, node.value));
    walk(node.right, Math.max(lower, node.value), upper);
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
    });

    return {
      tree: node,
      steps: recorder.steps,
      notes: [`Root created with value ${node.value}.`],
    };
  }

  const queue = [workingTree];

  while (queue.length) {
    const current = queue.shift();

    if (!current.left) {
      current.left = node;
      recorder.record(`Inserted ${node.value} as the left child of ${current.value}.`, workingTree, {
        action: "insert",
        highlights: [current.id, node.id],
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

  while (queue.length) {
    const current = queue.shift();
    lastNode = current.node;
    lastParent = current.parent;

    if (current.node.value === toNumber(value)) {
      targetNode = current.node;
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

  if (!workingTree) {
    const root = createNode(numericValue);
    recorder.record(`Inserted ${numericValue} as the BST root.`, root, {
      action: "insert",
      highlights: [root.id],
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

    if (numericValue === current.value) {
      recorder.record(`Skipped ${numericValue} because BST nodes must remain unique.`, workingTree, {
        action: "noop",
        highlights: [current.id],
      });

      return {
        tree: workingTree,
        steps: recorder.steps,
        notes: [`Duplicate value ${numericValue} was ignored.`],
      };
    }

    current = numericValue < current.value ? current.left : current.right;
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

export function bstDelete(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const workingTree = cloneTree(tree);
  const numericValue = toNumber(value);
  const beforeValues = collectValues(workingTree);
  const nextTree = bstDeleteRecursive(workingTree, numericValue);
  const afterValues = collectValues(nextTree);

  if (beforeValues.length === afterValues.length) {
    recorder.record(`Value ${numericValue} was not found in the BST.`, nextTree, {
      action: "noop",
    });
  } else {
    recorder.record(`Deleted ${numericValue} from the BST using successor replacement when needed.`, nextTree, {
      action: "delete",
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

function avlInsertRecursive(node, value, notes) {
  if (!node) {
    notes.push(`Inserted ${value} as a new AVL node.`);
    return createNode(value);
  }

  if (value < node.value) {
    node.left = avlInsertRecursive(node.left, value, notes);
  } else if (value > node.value) {
    node.right = avlInsertRecursive(node.right, value, notes);
  } else {
    notes.push(`Skipped duplicate AVL value ${value}.`);
    return node;
  }

  return rebalanceAVL(node, notes);
}

export function avlInsert(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const notes = [];
  const nextTree = avlInsertRecursive(cloneTree(tree), toNumber(value), notes);
  recorder.record(notes.join(" "), nextTree, {
    action: "insert",
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes,
  };
}

function avlDeleteRecursive(node, value, notes) {
  if (!node) {
    notes.push(`Value ${value} was not found in the AVL tree.`);
    return null;
  }

  if (value < node.value) {
    node.left = avlDeleteRecursive(node.left, value, notes);
  } else if (value > node.value) {
    node.right = avlDeleteRecursive(node.right, value, notes);
  } else if (!node.left || !node.right) {
    notes.push(`Deleted AVL node ${value} with at most one child.`);
    return node.left || node.right || null;
  } else {
    const successor = minNode(node.right);
    node.value = successor.value;
    notes.push(`Replaced AVL node ${value} with inorder successor ${successor.value}.`);
    node.right = avlDeleteRecursive(node.right, successor.value, notes);
  }

  return rebalanceAVL(node, notes);
}

export function avlDelete(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const notes = [];
  const nextTree = avlDeleteRecursive(cloneTree(tree), toNumber(value), notes);
  recorder.record(notes.join(" "), nextTree, {
    action: "delete",
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes,
  };
}

function rbInsertRecursive(node, value, notes) {
  if (!node) {
    notes.push(`Inserted ${value} as a red node.`);
    return createNode(value, { color: COLORS.RED });
  }

  if (value < node.value) {
    node.left = rbInsertRecursive(node.left, value, notes);
  } else if (value > node.value) {
    node.right = rbInsertRecursive(node.right, value, notes);
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

export function rbInsert(tree, value, options = {}) {
  const recorder = createRecorder(options.recordSteps);
  const notes = [];
  const nextTree = rbInsertRecursive(cloneTree(tree), toNumber(value), notes);

  if (nextTree) {
    nextTree.color = COLORS.BLACK;
  }

  recorder.record(notes.join(" "), nextTree, {
    action: "insert",
  });

  return {
    tree: nextTree,
    steps: recorder.steps,
    notes,
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

  if (!workingTree) {
    return {
      tree: null,
      steps: [],
      notes: [`Red-Black Tree is empty. Nothing to delete for ${value}.`],
    };
  }

  let nextTree = workingTree;

  if (!isRed(nextTree.left) && !isRed(nextTree.right)) {
    nextTree.color = COLORS.RED;
  }

  nextTree = rbDeleteRecursive(nextTree, toNumber(value), notes);

  if (nextTree) {
    nextTree.color = COLORS.BLACK;
  }

  recorder.record(notes.join(" "), nextTree, {
    action: "delete",
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
    const traversal = traverseTree(tree, order);
    const recorder = createRecorder(options.recordSteps);
    recorder.record(`Traversed the tree in ${order} order.`, tree, {
      action: "traverse",
      traversal,
      operation,
    });

    return {
      tree: cloneTree(tree),
      steps: recorder.steps,
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

  return handler(tree, operation.value, options);
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
  const expected = simulateOperations({
    treeType: normalizedTreeType,
    initialTree: assignment.initialTree || null,
    operations: assignment.operations || [],
    recordSteps: false,
  });

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

  const valuesMatch =
    normalizedTreeType === TREE_TYPES.BINARY
      ? sameMultiset(expectedValues, submittedValues)
      : sameMultiset(expectedInOrder, submittedInOrder);

  if (valuesMatch) {
    score += scoringWeights.values;
  } else {
    mistakes.push("The submitted tree does not contain the correct set of node values after applying the required operations.");
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
    name: String(tree.value),
    attributes: {
      color: tree.color,
      height: tree.height,
    },
    nodeId: tree.id,
    children: [tree.left, tree.right].filter(Boolean).map((child) => treeToD3Data(child)),
  };
}

export {
  COLORS,
  TREE_TYPES,
};
