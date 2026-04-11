import {
  TREE_TYPES,
  createTreeFromValues,
  evaluateSubmission,
  getTreeTypeMeta,
  simulateOperations,
} from "@algoyantra/shared";

import Assignment from "../models/Assignment.js";
import Lesson from "../models/Lesson.js";
import Performance from "../models/Performance.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

const defaultAccounts = {
  teacher: {
    name: "Prof. Arya Menon",
    email: "teacher@algoyantra.dev",
    password: "Teach123!",
    role: "teacher",
  },
  student: {
    name: "Riya Sharma",
    email: "student@algoyantra.dev",
    password: "Learn123!",
    role: "student",
  },
};

function buildLessonTemplates(teacherId) {
  const overviewSteps = {
    [TREE_TYPES.BINARY]: simulateOperations({
      treeType: TREE_TYPES.BINARY,
      operations: [
        { action: "insert", value: 10 },
        { action: "insert", value: 7 },
        { action: "insert", value: 15 },
        { action: "traverse", order: "levelorder" },
      ],
    }),
    [TREE_TYPES.BST]: simulateOperations({
      treeType: TREE_TYPES.BST,
      operations: [
        { action: "insert", value: 40 },
        { action: "insert", value: 20 },
        { action: "insert", value: 60 },
        { action: "insert", value: 10 },
        { action: "insert", value: 30 },
      ],
    }),
    [TREE_TYPES.AVL]: simulateOperations({
      treeType: TREE_TYPES.AVL,
      operations: [
        { action: "insert", value: 30 },
        { action: "insert", value: 20 },
        { action: "insert", value: 10 },
      ],
    }),
    [TREE_TYPES.RB]: simulateOperations({
      treeType: TREE_TYPES.RB,
      operations: [
        { action: "insert", value: 15 },
        { action: "insert", value: 10 },
        { action: "insert", value: 25 },
        { action: "insert", value: 18 },
      ],
    }),
  };

  return [
    {
      teacher: teacherId,
      title: "Binary Tree Foundations",
      summary: "Understand node relationships, tree depth, and breadth-first growth.",
      type: TREE_TYPES.BINARY,
      difficulty: "Beginner",
      durationMinutes: 18,
      content: [
        {
          heading: "Mental model",
          body: "Binary trees only care that every node has at most two children. This flexibility makes them a useful base structure before adding ordering or balancing rules.",
        },
        {
          heading: "When to use",
          body: "Use a plain binary tree when shape matters more than sorted access, such as expression trees or decision trees.",
        },
      ],
      visualizationData: {
        ...overviewSteps[TREE_TYPES.BINARY],
        keyTakeaways: [
          "Level-order insertion grows the tree from left to right.",
          "Traversal order changes what we learn from the same shape.",
        ],
      },
    },
    {
      teacher: teacherId,
      title: "BST Range Reasoning",
      summary: "Learn how binary search trees maintain sorted order through local range constraints.",
      type: TREE_TYPES.BST,
      difficulty: "Intermediate",
      durationMinutes: 24,
      content: [
        {
          heading: "Range-based thinking",
          body: "Every node inherits a valid numeric interval from its ancestors. That interval is the real rule behind the BST property.",
        },
        {
          heading: "Deletion strategy",
          body: "When deleting a node with two children, replace it with the inorder successor so the ordering invariant remains valid.",
        },
      ],
      visualizationData: {
        ...overviewSteps[TREE_TYPES.BST],
        keyTakeaways: [
          "Each insertion walks down the unique valid path.",
          "Validation should check ranges, not only parent-child comparisons.",
        ],
      },
    },
    {
      teacher: teacherId,
      title: "AVL Rotations in Motion",
      summary: "See how balance factors trigger LL, RR, LR, and RL rebalancing rotations.",
      type: TREE_TYPES.AVL,
      difficulty: "Advanced",
      durationMinutes: 26,
      content: [
        {
          heading: "Balance factor",
          body: "AVL trees keep subtree height difference within one at every node. Rotations are structural repairs that preserve sorted order.",
        },
        {
          heading: "Four imbalance cases",
          body: "The insertion path tells you whether the tree needs a single or double rotation.",
        },
      ],
      visualizationData: {
        ...overviewSteps[TREE_TYPES.AVL],
        keyTakeaways: [
          "AVL trees optimize lookup depth through strict balancing.",
          "Rotations only rewire pointers; they do not break the BST invariant.",
        ],
      },
    },
    {
      teacher: teacherId,
      title: "Red-Black Tree Color Balancing",
      summary: "Explore color flips and rotations that preserve logarithmic behavior with looser balancing.",
      type: TREE_TYPES.RB,
      difficulty: "Advanced",
      durationMinutes: 28,
      content: [
        {
          heading: "Color rules",
          body: "The root must be black, no red node can have a red child, and all root-to-null paths must contain equal black height.",
        },
        {
          heading: "Why it matters",
          body: "Red-Black Trees balance efficiently for maps, sets, and ordered indexes because they trade strictness for simpler updates.",
        },
      ],
      visualizationData: {
        ...overviewSteps[TREE_TYPES.RB],
        keyTakeaways: [
          "Color flips redistribute black height pressure.",
          "A left-leaning implementation keeps rebalancing rules compact and consistent.",
        ],
      },
    },
  ];
}

function buildAssignmentTemplates(teacherId, lessonMap) {
  return [
    {
      teacher: teacherId,
      lesson: lessonMap["Binary Tree Foundations"],
      title: "Binary Tree Warm-Up",
      description: "Construct a complete binary tree using level-order insertions, then report the level-order traversal.",
      treeType: TREE_TYPES.BINARY,
      constraints: {
        minValue: 1,
        maxValue: 99,
        minNodes: 5,
        maxNodes: 8,
      },
      operations: [
        { action: "insert", value: 12 },
        { action: "insert", value: 8 },
        { action: "insert", value: 18 },
        { action: "insert", value: 5 },
        { action: "insert", value: 9 },
        { action: "traverse", order: "levelorder" },
      ],
      expectedRules: {
        scoringWeights: {
          validity: 20,
          values: 40,
          constraints: 20,
          traversal: 20,
        },
      },
      difficulty: "Beginner",
      xpReward: 90,
      liveSessionEnabled: true,
    },
    {
      teacher: teacherId,
      lesson: lessonMap["BST Range Reasoning"],
      title: "BST Constraint Builder",
      description: "Insert the required values and keep every node within the correct ancestor range. Exact layout is not hardcoded; validity comes from the BST property.",
      treeType: TREE_TYPES.BST,
      constraints: {
        minValue: 1,
        maxValue: 100,
        allowDuplicates: false,
        placeholderRules: [
          { path: "left", minValue: 10, maxValue: 49 },
          { path: "right", minValue: 51, maxValue: 95 },
        ],
      },
      operations: [
        { action: "insert", value: 50 },
        { action: "insert", value: 25 },
        { action: "insert", value: 70 },
        { action: "insert", value: 10 },
        { action: "insert", value: 35 },
        { action: "insert", value: 60 },
        { action: "delete", value: 25 },
      ],
      expectedRules: {
        scoringWeights: {
          validity: 45,
          values: 25,
          constraints: 20,
          traversal: 10,
        },
      },
      difficulty: "Intermediate",
      xpReward: 140,
      liveSessionEnabled: true,
    },
    {
      teacher: teacherId,
      lesson: lessonMap["AVL Rotations in Motion"],
      title: "AVL Rotation Challenge",
      description: "Apply insertions and deletions so the final tree remains a valid AVL tree after each rebalance.",
      treeType: TREE_TYPES.AVL,
      constraints: {
        minValue: 1,
        maxValue: 99,
        allowDuplicates: false,
      },
      operations: [
        { action: "insert", value: 30 },
        { action: "insert", value: 10 },
        { action: "insert", value: 20 },
        { action: "insert", value: 40 },
        { action: "insert", value: 50 },
        { action: "delete", value: 10 },
      ],
      expectedRules: {
        scoringWeights: {
          validity: 50,
          values: 25,
          constraints: 15,
          traversal: 10,
        },
      },
      difficulty: "Advanced",
      xpReward: 180,
      liveSessionEnabled: true,
    },
    {
      teacher: teacherId,
      lesson: lessonMap["Red-Black Tree Color Balancing"],
      title: "Red-Black Color Repair",
      description: "Build a Red-Black Tree that preserves equal black height and avoids consecutive red links after insert/delete operations.",
      treeType: TREE_TYPES.RB,
      constraints: {
        minValue: 1,
        maxValue: 120,
        allowDuplicates: false,
      },
      operations: [
        { action: "insert", value: 20 },
        { action: "insert", value: 10 },
        { action: "insert", value: 30 },
        { action: "insert", value: 25 },
        { action: "insert", value: 35 },
        { action: "delete", value: 10 },
      ],
      expectedRules: {
        scoringWeights: {
          validity: 55,
          values: 25,
          constraints: 10,
          traversal: 10,
        },
      },
      difficulty: "Advanced",
      xpReward: 220,
      liveSessionEnabled: true,
    },
  ];
}

function buildProgressTemplates() {
  return getTreeTypeMeta().map((item, index) => ({
    treeType: item.id,
    title: item.label,
    mastery: 42 + index * 12,
    attempts: 2 + index,
  }));
}

export async function seedDatabase() {
  let seededAny = false;

  let teacher = await User.findOne({ email: defaultAccounts.teacher.email.toLowerCase() });
  if (!teacher) {
    teacher = await User.create(defaultAccounts.teacher);
    seededAny = true;
  }

  let student = await User.findOne({ email: defaultAccounts.student.email.toLowerCase() });
  if (!student) {
    student = await User.create(defaultAccounts.student);
    seededAny = true;
  }

  const lessonTemplates = buildLessonTemplates(teacher._id);
  const lessons = [];

  for (const template of lessonTemplates) {
    let lesson = await Lesson.findOne({
      teacher: teacher._id,
      title: template.title,
    });

    if (!lesson) {
      lesson = await Lesson.create(template);
      seededAny = true;
    }

    lessons.push(lesson);
  }

  const lessonMap = Object.fromEntries(lessons.map((lesson) => [lesson.title, lesson._id]));
  const assignmentTemplates = buildAssignmentTemplates(teacher._id, lessonMap);
  const assignments = [];

  for (const template of assignmentTemplates) {
    let assignment = await Assignment.findOne({
      teacher: teacher._id,
      title: template.title,
    });

    if (!assignment) {
      assignment = await Assignment.create(template);
      seededAny = true;
    }

    assignments.push(assignment);
  }

  const sampleTree = createTreeFromValues(TREE_TYPES.BST, [50, 35, 70, 10, 60]);
  const bstAssignment = assignments.find((assignment) => assignment.treeType === TREE_TYPES.BST);
  const evaluation = evaluateSubmission({
    treeType: bstAssignment.treeType,
    assignment: bstAssignment.toObject(),
    submissionTree: sampleTree,
    submittedTraversals: [{ order: "inorder", values: [10, 35, 50, 60, 70] }],
  });

  const existingSubmission = await Submission.findOne({
    assignment: bstAssignment._id,
    student: student._id,
  });

  if (!existingSubmission) {
    await Submission.create({
      assignment: bstAssignment._id,
      student: student._id,
      answers: {
        tree: sampleTree,
        traversals: [{ order: "inorder", values: [10, 35, 50, 60, 70] }],
        notes: ["Used range reasoning to keep the tree valid after deletion."],
      },
      score: evaluation.score,
      mistakes: evaluation.mistakes,
      suggestions: evaluation.suggestions,
      correctTree: evaluation.correctTree,
      feedback: "Strong structural reasoning. Review deletion successor logic once more for speed.",
    });
    seededAny = true;
  }

  const existingPerformance = await Performance.findOne({ student: student._id });
  if (!existingPerformance) {
    await Performance.create({
      student: student._id,
      history: assignments.map((assignment, index) => ({
        assignmentTitle: assignment.title,
        treeType: assignment.treeType,
        score: Math.min(100, 72 + index * 7),
        xpGained: assignment.xpReward,
        completedAt: new Date(Date.now() - index * 86400000),
      })),
      accuracy: 84,
      progress: buildProgressTemplates(),
      totalXp: 630,
      streak: 6,
      level: 4,
      lastSubmissionAt: new Date(),
    });
    seededAny = true;
  }

  return {
    seeded: seededAny,
    teacher: defaultAccounts.teacher.email,
    student: defaultAccounts.student.email,
  };
}
