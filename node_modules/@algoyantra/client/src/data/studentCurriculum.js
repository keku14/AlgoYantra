function svgToDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function traversalImage(title, labels) {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">
      <rect width="720" height="420" rx="28" fill="#0f172a"/>
      <text x="40" y="56" fill="#e2e8f0" font-size="28" font-family="Segoe UI, Arial" font-weight="700">${title}</text>
      <line x1="360" y1="100" x2="220" y2="180" stroke="#475569" stroke-width="4" />
      <line x1="360" y1="100" x2="500" y2="180" stroke="#475569" stroke-width="4" />
      <line x1="220" y1="180" x2="150" y2="270" stroke="#475569" stroke-width="4" />
      <line x1="220" y1="180" x2="290" y2="270" stroke="#475569" stroke-width="4" />
      <circle cx="360" cy="100" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
      <circle cx="220" cy="180" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
      <circle cx="500" cy="180" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
      <circle cx="150" cy="270" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
      <circle cx="290" cy="270" r="34" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
      <text x="360" y="108" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial" text-anchor="middle">10</text>
      <text x="220" y="188" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial" text-anchor="middle">5</text>
      <text x="500" y="188" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial" text-anchor="middle">15</text>
      <text x="150" y="278" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial" text-anchor="middle">2</text>
      <text x="290" y="278" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial" text-anchor="middle">7</text>
      <rect x="36" y="326" width="648" height="58" rx="18" fill="#111827" stroke="#334155"/>
      <text x="56" y="362" fill="#67e8f9" font-size="22" font-family="Segoe UI, Arial">${labels}</text>
    </svg>
  `);
}

export const studentCurriculum = [
  {
    id: "binary-tree",
    type: "binary-tree",
    title: "Binary Tree",
    summary: "Start from structure, then understand traversal orders from simple to advanced.",
    sequence: [
      {
        id: "bt-intro",
        title: "Introduction to Binary Tree",
        level: "Beginner",
        summary: "A binary tree is a hierarchy where each node can have at most two children.",
        body: "Focus first on shape: root, parent, child, left subtree, right subtree, depth, and height. Binary trees do not require sorted values. They are the base structure behind many tree families.",
      },
      {
        id: "bt-inorder",
        title: "What Is Inorder Traversal",
        level: "Beginner",
        summary: "Visit left subtree, then current node, then right subtree.",
        body: "Inorder is useful because it gives a sorted result for BSTs. Here the image is the teaching aid, so the student reads the sequence directly instead of watching a live tree construction.",
        imageUrl: traversalImage("Binary Tree Inorder", "Traversal order: 2 -> 5 -> 7 -> 10 -> 15"),
      },
      {
        id: "bt-preorder",
        title: "Preorder Traversal",
        level: "Intermediate",
        summary: "Visit current node first, then left subtree, then right subtree.",
        body: "Preorder is great for capturing the shape of a tree from the top down. It is often used when serializing or reconstructing trees.",
        imageUrl: traversalImage("Binary Tree Preorder", "Traversal order: 10 -> 5 -> 2 -> 7 -> 15"),
      },
      {
        id: "bt-postorder",
        title: "Postorder Traversal",
        level: "Advanced",
        summary: "Visit left subtree, then right subtree, and the root last.",
        body: "Postorder is useful when children must be processed before the parent, like expression evaluation or cleanup tasks.",
        imageUrl: traversalImage("Binary Tree Postorder", "Traversal order: 2 -> 7 -> 5 -> 15 -> 10"),
      },
    ],
  },
  {
    id: "bst",
    type: "bst",
    title: "Binary Search Tree",
    summary: "Understand ordering rules first, then traversals and reasoning with ranges.",
    sequence: [
      {
        id: "bst-intro",
        title: "Introduction to BST",
        level: "Beginner",
        summary: "Every left child is smaller and every right child is larger than the current node.",
        body: "The real idea is range restriction. Each node inherits a valid interval from its ancestors, and that is what keeps search efficient.",
      },
      {
        id: "bst-inorder",
        title: "Why Inorder Matters in BST",
        level: "Beginner",
        summary: "Inorder traversal of a valid BST returns values in sorted order.",
        body: "This is one of the most important BST facts. It helps you verify correctness quickly.",
        imageUrl: traversalImage("BST Inorder", "Sorted output: 2 -> 5 -> 7 -> 10 -> 15"),
      },
      {
        id: "bst-preorder",
        title: "Preorder and Construction",
        level: "Intermediate",
        summary: "Preorder shows the root choice before subtree structure.",
        body: "When a problem gives preorder, reconstructing the BST depends on maintaining valid lower and upper bounds while consuming the values.",
      },
      {
        id: "bst-delete",
        title: "BST Deletion with Successor",
        level: "Advanced",
        summary: "When deleting a node with two children, the inorder successor preserves ordering.",
        body: "Deletion is where BST understanding becomes deeper. Replacing the node with the next larger value keeps the structure valid.",
      },
    ],
  },
  {
    id: "avl",
    type: "avl",
    title: "AVL Tree",
    summary: "Learn balance factors and the four classic rotation cases.",
    sequence: [
      {
        id: "avl-intro",
        title: "Introduction to AVL Trees",
        level: "Beginner",
        summary: "An AVL tree is a BST that stays height-balanced.",
        body: "For every node, the height difference between the left and right subtree must be at most one. That balance keeps search fast.",
      },
      {
        id: "avl-balance",
        title: "Balance Factor",
        level: "Beginner",
        summary: "Balance factor is left height minus right height.",
        body: "Once the absolute value becomes greater than one, the tree needs a structural repair using rotation.",
      },
      {
        id: "avl-rotations",
        title: "LL, RR, LR, RL Rotations",
        level: "Intermediate",
        summary: "Rotation choice depends on where the new value entered.",
        body: "Single rotations fix LL and RR cases. Double rotations handle LR and RL cases while preserving BST order.",
      },
      {
        id: "avl-advanced",
        title: "Deletion and Rebalancing",
        level: "Advanced",
        summary: "AVL deletion can trigger multiple balance checks on the way back up.",
        body: "Insertion usually repairs one local imbalance. Deletion is trickier because several ancestors may need updates.",
      },
    ],
  },
  {
    id: "red-black",
    type: "red-black",
    title: "Red-Black Tree",
    summary: "Move from color rules to rotations and black-height reasoning.",
    sequence: [
      {
        id: "rb-intro",
        title: "Introduction to Red-Black Trees",
        level: "Beginner",
        summary: "A Red-Black tree is a BST with extra color rules for near-balance.",
        body: "It trades strict AVL-style balancing for faster update patterns while still keeping operations logarithmic.",
      },
      {
        id: "rb-rules",
        title: "Core Color Rules",
        level: "Beginner",
        summary: "Root is black, no red node has a red child, and black height stays consistent.",
        body: "These invariants are what make the tree stable even when it does not look perfectly balanced.",
      },
      {
        id: "rb-fixes",
        title: "Rotations and Color Flips",
        level: "Intermediate",
        summary: "Insertions are repaired with left rotation, right rotation, and color flips.",
        body: "The tree reacts locally to a red link leaning the wrong way or to two red links appearing in a row.",
      },
      {
        id: "rb-advanced",
        title: "Black Height and Deletion",
        level: "Advanced",
        summary: "Deletion in Red-Black trees is advanced because color debt must be redistributed safely.",
        body: "The key idea is preserving equal black height on every root-to-null path while restoring valid red-black structure.",
      },
    ],
  },
];
