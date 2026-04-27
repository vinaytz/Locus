#!/usr/bin/env node
/**
 * Generates Courses/database.json and Courses/seed.sql
 * Schema follows ../Helper/Scalable MCQ App Database Architecture.md
 *
 * Run:  node Courses/generate.js
 */

const fs = require("fs");
const path = require("path");

// ---------- helpers ---------------------------------------------------------
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const id = (...parts) => parts.map(slug).join(":");

const sqlEscape = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
};

// ---------- content seed ----------------------------------------------------
/**
 * Each subject -> units -> exercises -> questions.
 * Questions are authored as compact records that are normalized below.
 *   { t:'MCQ',  q, opts:[...], a:index, exp? }
 *   { t:'MATCH', q, left:[...], right:[...], map:{l:r}, exp? }
 *   { t:'REORDER', q, items:[...], order:[i,...], exp? }
 *   { t:'COMPLETE', q, blanks:[...], exp? }       // q contains "___"
 *   { t:'TRANSLATE', q, answer, exp? }
 */
const SUBJECTS = [
  {
    name: "Physics",
    icon: "atom",
    description: "Mechanics, waves, electromagnetism and modern physics.",
    units: [
      {
        title: "Kinematics",
        description: "Motion in one and two dimensions.",
        exercises: [
          {
            title: "Motion Basics",
            questions: [
              { t: "MCQ", q: "SI unit of acceleration is?", opts: ["m/s", "m/s²", "m·s", "N"], a: 1, exp: "Acceleration = change in velocity / time." },
              { t: "MCQ", q: "Which quantity is a vector?", opts: ["Speed", "Distance", "Velocity", "Mass"], a: 2 },
              { t: "MCQ", q: "Slope of a position-time graph gives:", opts: ["Acceleration", "Velocity", "Force", "Momentum"], a: 1 },
              { t: "COMPLETE", q: "An object in free fall accelerates at ___ m/s² near Earth's surface.", blanks: ["9.8"] },
              { t: "REORDER", q: "Order the steps to solve a kinematics problem:", items: ["Identify knowns", "Pick equation", "Solve", "Verify units"], order: [0, 1, 2, 3] },
            ],
          },
          {
            title: "Projectile Motion",
            questions: [
              { t: "MCQ", q: "At max height in a projectile, vertical velocity is:", opts: ["Maximum", "Zero", "Equal to horizontal", "Negative"], a: 1 },
              { t: "MCQ", q: "Range of a projectile is maximum at angle:", opts: ["30°", "45°", "60°", "90°"], a: 1 },
              { t: "MCQ", q: "Horizontal acceleration of an ideal projectile is:", opts: ["g", "0", "-g", "g/2"], a: 1 },
              { t: "MATCH", q: "Match symbol with quantity:", left: ["v", "a", "t", "s"], right: ["velocity", "acceleration", "time", "displacement"], map: { v: "velocity", a: "acceleration", t: "time", s: "displacement" } },
              { t: "COMPLETE", q: "Time of flight T = 2u sinθ / ___.", blanks: ["g"] },
            ],
          },
        ],
      },
      {
        title: "Laws of Motion",
        description: "Newton's laws and applications.",
        exercises: [
          {
            title: "Newton's Laws",
            questions: [
              { t: "MCQ", q: "Newton's first law is also called:", opts: ["Law of inertia", "Law of action", "Law of gravity", "Law of momentum"], a: 0 },
              { t: "MCQ", q: "F = ma is which law?", opts: ["First", "Second", "Third", "Zeroth"], a: 1 },
              { t: "MCQ", q: "Action and reaction act on:", opts: ["Same body", "Different bodies", "No body", "Earth only"], a: 1 },
              { t: "REORDER", q: "Order Newton's laws:", items: ["Inertia", "F=ma", "Action-Reaction"], order: [0, 1, 2] },
              { t: "COMPLETE", q: "Momentum p = m × ___.", blanks: ["v"] },
            ],
          },
          {
            title: "Friction & Circular Motion",
            questions: [
              { t: "MCQ", q: "Centripetal force points:", opts: ["Outward", "Tangent", "Inward", "Upward"], a: 2 },
              { t: "MCQ", q: "Friction always opposes:", opts: ["Motion", "Mass", "Weight", "Time"], a: 0 },
              { t: "MCQ", q: "Coefficient of friction is:", opts: ["Vector", "Dimensional", "Dimensionless", "Negative"], a: 2 },
              { t: "MATCH", q: "Match force with example:", left: ["Tension", "Normal", "Friction"], right: ["Rope", "Surface", "Brake"], map: { Tension: "Rope", Normal: "Surface", Friction: "Brake" } },
              { t: "COMPLETE", q: "Centripetal acceleration a = v² / ___.", blanks: ["r"] },
            ],
          },
        ],
      },
      {
        title: "Electromagnetism",
        description: "Charges, currents and fields.",
        exercises: [
          {
            title: "Electrostatics",
            questions: [
              { t: "MCQ", q: "SI unit of electric charge:", opts: ["Volt", "Ampere", "Coulomb", "Ohm"], a: 2 },
              { t: "MCQ", q: "Coulomb's law force varies as:", opts: ["1/r", "1/r²", "r", "r²"], a: 1 },
              { t: "MCQ", q: "Electric field inside a conductor in equilibrium is:", opts: ["Maximum", "Zero", "Infinite", "Variable"], a: 1 },
              { t: "COMPLETE", q: "1 Coulomb = ___ × electron charge approximately (use 6.24e18).", blanks: ["6.24e18"] },
              { t: "MATCH", q: "Match constant with value:", left: ["k", "ε₀", "e"], right: ["9e9", "8.85e-12", "1.6e-19"], map: { k: "9e9", "ε₀": "8.85e-12", e: "1.6e-19" } },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "Chemistry",
    icon: "flask",
    description: "Physical, inorganic and organic chemistry.",
    units: [
      {
        title: "Atomic Structure",
        exercises: [
          {
            title: "Atoms & Quantum Numbers",
            questions: [
              { t: "MCQ", q: "Maximum electrons in n=2 shell:", opts: ["2", "8", "18", "32"], a: 1 },
              { t: "MCQ", q: "Discoverer of the electron:", opts: ["Bohr", "Thomson", "Rutherford", "Dalton"], a: 1 },
              { t: "MCQ", q: "Principal quantum number defines:", opts: ["Shape", "Orientation", "Shell", "Spin"], a: 2 },
              { t: "COMPLETE", q: "Mass number = protons + ___.", blanks: ["neutrons"] },
              { t: "MATCH", q: "Match scientist with model:", left: ["Bohr", "Thomson", "Rutherford"], right: ["Orbits", "Plum-pudding", "Nucleus"], map: { Bohr: "Orbits", Thomson: "Plum-pudding", Rutherford: "Nucleus" } },
            ],
          },
        ],
      },
      {
        title: "Periodic Table",
        exercises: [
          {
            title: "Periodic Trends",
            questions: [
              { t: "MCQ", q: "Most electronegative element:", opts: ["O", "F", "Cl", "N"], a: 1 },
              { t: "MCQ", q: "Group of alkali metals:", opts: ["1", "2", "17", "18"], a: 0 },
              { t: "MCQ", q: "Atomic radius across a period:", opts: ["Increases", "Decreases", "Same", "Random"], a: 1 },
              { t: "REORDER", q: "Order by increasing atomic number:", items: ["H", "He", "Li", "Be"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "Noble gases are in group ___.", blanks: ["18"] },
            ],
          },
        ],
      },
      {
        title: "Organic Basics",
        exercises: [
          {
            title: "Hydrocarbons",
            questions: [
              { t: "MCQ", q: "Simplest alkane:", opts: ["Methane", "Ethane", "Propane", "Butane"], a: 0 },
              { t: "MCQ", q: "General formula of alkenes:", opts: ["CnH2n+2", "CnH2n", "CnH2n-2", "CnHn"], a: 1 },
              { t: "MCQ", q: "Functional group of alcohols:", opts: ["-COOH", "-OH", "-CHO", "-NH2"], a: 1 },
              { t: "MATCH", q: "Match compound with class:", left: ["CH4", "C2H4", "C2H2"], right: ["Alkane", "Alkene", "Alkyne"], map: { CH4: "Alkane", C2H4: "Alkene", C2H2: "Alkyne" } },
              { t: "COMPLETE", q: "Benzene molecular formula is ___.", blanks: ["C6H6"] },
            ],
          },
        ],
      },
      {
        title: "Chemical Bonding",
        exercises: [
          {
            title: "Bonds & Geometry",
            questions: [
              { t: "MCQ", q: "Bond in NaCl is:", opts: ["Covalent", "Ionic", "Metallic", "Hydrogen"], a: 1 },
              { t: "MCQ", q: "Shape of CH4:", opts: ["Linear", "Trigonal", "Tetrahedral", "Bent"], a: 2 },
              { t: "MCQ", q: "Hybridization in BF3:", opts: ["sp", "sp²", "sp³", "sp³d"], a: 1 },
              { t: "COMPLETE", q: "Water molecule is ___ in shape.", blanks: ["bent"] },
              { t: "REORDER", q: "Bond strength order (low→high):", items: ["Hydrogen", "Ionic", "Covalent", "Metallic"], order: [0, 3, 1, 2] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "Biology",
    icon: "leaf",
    description: "Cells, genetics, physiology and ecology.",
    units: [
      {
        title: "Cell Biology",
        exercises: [
          {
            title: "The Cell",
            questions: [
              { t: "MCQ", q: "Powerhouse of the cell:", opts: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], a: 1 },
              { t: "MCQ", q: "Plant cells uniquely contain:", opts: ["Mitochondria", "Cell wall", "Nucleus", "ER"], a: 1 },
              { t: "MCQ", q: "Site of protein synthesis:", opts: ["Ribosome", "Lysosome", "Vacuole", "Nucleolus"], a: 0 },
              { t: "MATCH", q: "Match organelle to function:", left: ["Nucleus", "Mitochondria", "Chloroplast"], right: ["DNA", "ATP", "Photosynthesis"], map: { Nucleus: "DNA", Mitochondria: "ATP", Chloroplast: "Photosynthesis" } },
              { t: "COMPLETE", q: "Cell theory states all living things are made of ___.", blanks: ["cells"] },
            ],
          },
        ],
      },
      {
        title: "Genetics",
        exercises: [
          {
            title: "Mendelian Genetics",
            questions: [
              { t: "MCQ", q: "Mendel worked on:", opts: ["Pea plants", "Mice", "Fruit fly", "Bacteria"], a: 0 },
              { t: "MCQ", q: "Genotype Aa is:", opts: ["Homozygous", "Heterozygous", "Hemizygous", "Recessive"], a: 1 },
              { t: "MCQ", q: "DNA bases pair as:", opts: ["A-G", "A-T", "C-T", "A-C"], a: 1 },
              { t: "REORDER", q: "Order central dogma:", items: ["DNA", "RNA", "Protein"], order: [0, 1, 2] },
              { t: "COMPLETE", q: "Humans have ___ pairs of chromosomes.", blanks: ["23"] },
            ],
          },
        ],
      },
      {
        title: "Human Physiology",
        exercises: [
          {
            title: "Systems",
            questions: [
              { t: "MCQ", q: "Number of chambers in human heart:", opts: ["2", "3", "4", "5"], a: 2 },
              { t: "MCQ", q: "Largest gland in human body:", opts: ["Pancreas", "Liver", "Thyroid", "Adrenal"], a: 1 },
              { t: "MCQ", q: "Functional unit of kidney:", opts: ["Neuron", "Nephron", "Alveolus", "Villus"], a: 1 },
              { t: "MATCH", q: "Match organ to system:", left: ["Heart", "Lung", "Kidney"], right: ["Circulatory", "Respiratory", "Excretory"], map: { Heart: "Circulatory", Lung: "Respiratory", Kidney: "Excretory" } },
              { t: "COMPLETE", q: "Hemoglobin contains the metal ___.", blanks: ["iron"] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "Mathematics",
    icon: "sigma",
    description: "Algebra, calculus, geometry and statistics.",
    units: [
      {
        title: "Algebra",
        exercises: [
          {
            title: "Equations",
            questions: [
              { t: "MCQ", q: "Solve x: 2x+3=11", opts: ["3", "4", "5", "6"], a: 1 },
              { t: "MCQ", q: "Discriminant of ax²+bx+c is:", opts: ["b²-4ac", "b²+4ac", "4ac-b²", "2a"], a: 0 },
              { t: "MCQ", q: "Sum of roots of x²-5x+6=0:", opts: ["5", "-5", "6", "-6"], a: 0 },
              { t: "COMPLETE", q: "Identity: (a+b)² = a² + 2ab + ___.", blanks: ["b²"] },
              { t: "REORDER", q: "Solve a linear equation steps:", items: ["Simplify", "Isolate variable", "Divide", "Verify"], order: [0, 1, 2, 3] },
            ],
          },
        ],
      },
      {
        title: "Calculus",
        exercises: [
          {
            title: "Limits & Derivatives",
            questions: [
              { t: "MCQ", q: "d/dx(x²) =", opts: ["x", "2x", "x²", "2"], a: 1 },
              { t: "MCQ", q: "lim x→0 sinx/x =", opts: ["0", "1", "∞", "undefined"], a: 1 },
              { t: "MCQ", q: "Integral of 1/x dx is:", opts: ["x", "ln|x|+C", "1/x²", "e^x"], a: 1 },
              { t: "COMPLETE", q: "d/dx(sin x) = ___.", blanks: ["cos x"] },
              { t: "MATCH", q: "Match function to derivative:", left: ["x", "x²", "e^x"], right: ["1", "2x", "e^x"], map: { x: "1", "x²": "2x", "e^x": "e^x" } },
            ],
          },
        ],
      },
      {
        title: "Trigonometry",
        exercises: [
          {
            title: "Identities",
            questions: [
              { t: "MCQ", q: "sin²θ + cos²θ =", opts: ["0", "1", "2", "tan²θ"], a: 1 },
              { t: "MCQ", q: "tan(45°) =", opts: ["0", "1", "√2", "∞"], a: 1 },
              { t: "MCQ", q: "sin(90°) =", opts: ["0", "1", "0.5", "-1"], a: 1 },
              { t: "COMPLETE", q: "1 + tan²θ = ___.", blanks: ["sec²θ"] },
              { t: "REORDER", q: "Increasing order in [0,90°]:", items: ["sin 0°", "sin 30°", "sin 45°", "sin 90°"], order: [0, 1, 2, 3] },
            ],
          },
        ],
      },
      {
        title: "Probability",
        exercises: [
          {
            title: "Basics",
            questions: [
              { t: "MCQ", q: "P(Head) on a fair coin:", opts: ["0", "0.25", "0.5", "1"], a: 2 },
              { t: "MCQ", q: "P(impossible event):", opts: ["0", "0.5", "1", "∞"], a: 0 },
              { t: "MCQ", q: "Sum of probabilities of sample space:", opts: ["0", "0.5", "1", "depends"], a: 2 },
              { t: "COMPLETE", q: "P(A∪B) = P(A) + P(B) - P(___).", blanks: ["A∩B"] },
              { t: "MATCH", q: "Match event with prob (fair die):", left: ["1", "even", "<3"], right: ["1/6", "1/2", "1/3"], map: { "1": "1/6", "even": "1/2", "<3": "1/3" } },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "Computer Science",
    icon: "laptop-code",
    description: "Programming, data structures, algorithms and systems.",
    units: [
      {
        title: "Programming Fundamentals",
        exercises: [
          {
            title: "Python Basics",
            questions: [
              { t: "MCQ", q: "Which is mutable in Python?", opts: ["tuple", "list", "str", "int"], a: 1 },
              { t: "MCQ", q: "len('python') is:", opts: ["5", "6", "7", "Error"], a: 1 },
              { t: "MCQ", q: "Operator for integer division:", opts: ["/", "//", "%", "**"], a: 1 },
              { t: "COMPLETE", q: "To define a function use the ___ keyword.", blanks: ["def"] },
              { t: "REORDER", q: "Run a Python script steps:", items: ["Write code", "Save .py", "Run interpreter", "See output"], order: [0, 1, 2, 3] },
            ],
          },
        ],
      },
      {
        title: "Data Structures",
        exercises: [
          {
            title: "Linear Structures",
            questions: [
              { t: "MCQ", q: "LIFO order is:", opts: ["Queue", "Stack", "Heap", "Tree"], a: 1 },
              { t: "MCQ", q: "Worst case access in singly linked list:", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], a: 2 },
              { t: "MCQ", q: "Array index in most languages starts at:", opts: ["-1", "0", "1", "depends"], a: 1 },
              { t: "MATCH", q: "Match structure to property:", left: ["Stack", "Queue", "BST"], right: ["LIFO", "FIFO", "Sorted"], map: { Stack: "LIFO", Queue: "FIFO", BST: "Sorted" } },
              { t: "COMPLETE", q: "A balanced BST search is O(___).", blanks: ["log n"] },
            ],
          },
          {
            title: "Trees & Graphs",
            questions: [
              { t: "MCQ", q: "Root of a tree has level:", opts: ["-1", "0", "1", "2"], a: 1 },
              { t: "MCQ", q: "BFS uses:", opts: ["Stack", "Queue", "Heap", "Set"], a: 1 },
              { t: "MCQ", q: "Edges in a tree with n nodes:", opts: ["n", "n-1", "n+1", "2n"], a: 1 },
              { t: "REORDER", q: "DFS traversal order (preorder of root,L,R):", items: ["Visit root", "Traverse left", "Traverse right"], order: [0, 1, 2] },
              { t: "COMPLETE", q: "Dijkstra finds the ___ path.", blanks: ["shortest"] },
            ],
          },
        ],
      },
      {
        title: "Algorithms",
        exercises: [
          {
            title: "Sorting & Searching",
            questions: [
              { t: "MCQ", q: "Average time for QuickSort:", opts: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], a: 1 },
              { t: "MCQ", q: "Binary search requires array to be:", opts: ["Random", "Sorted", "Hashed", "Reversed"], a: 1 },
              { t: "MCQ", q: "Best case BubbleSort:", opts: ["O(1)", "O(n)", "O(n log n)", "O(n²)"], a: 1 },
              { t: "MATCH", q: "Match algo to type:", left: ["MergeSort", "Dijkstra", "DFS"], right: ["Sort", "Shortest path", "Traversal"], map: { MergeSort: "Sort", Dijkstra: "Shortest path", DFS: "Traversal" } },
              { t: "COMPLETE", q: "Big-O of binary search is O(___).", blanks: ["log n"] },
            ],
          },
        ],
      },
      {
        title: "Operating Systems",
        exercises: [
          {
            title: "Processes & Memory",
            questions: [
              { t: "MCQ", q: "A deadlock requires:", opts: ["1 condition", "2 conditions", "3 conditions", "4 conditions"], a: 3 },
              { t: "MCQ", q: "Page fault is handled by:", opts: ["CPU", "OS", "User", "Disk"], a: 1 },
              { t: "MCQ", q: "Process states minimum count:", opts: ["2", "3", "5", "7"], a: 2 },
              { t: "REORDER", q: "Process lifecycle:", items: ["New", "Ready", "Running", "Terminated"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "Virtual memory uses ___ to extend RAM.", blanks: ["disk"] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "English",
    icon: "book",
    description: "Grammar, vocabulary and comprehension.",
    units: [
      {
        title: "Grammar",
        exercises: [
          {
            title: "Tenses & Parts of Speech",
            questions: [
              { t: "MCQ", q: "Choose the verb: She ___ to school every day.", opts: ["go", "goes", "going", "gone"], a: 1 },
              { t: "MCQ", q: "'Quickly' is a:", opts: ["Noun", "Verb", "Adverb", "Adjective"], a: 2 },
              { t: "MCQ", q: "Past tense of 'run':", opts: ["runned", "ran", "run", "running"], a: 1 },
              { t: "COMPLETE", q: "He has ___ his homework. (do)", blanks: ["done"] },
              { t: "MATCH", q: "Match word with part of speech:", left: ["dog", "swiftly", "blue"], right: ["noun", "adverb", "adjective"], map: { dog: "noun", swiftly: "adverb", blue: "adjective" } },
            ],
          },
        ],
      },
      {
        title: "Vocabulary",
        exercises: [
          {
            title: "Synonyms & Antonyms",
            questions: [
              { t: "MCQ", q: "Synonym of 'happy':", opts: ["sad", "joyful", "angry", "tired"], a: 1 },
              { t: "MCQ", q: "Antonym of 'begin':", opts: ["start", "open", "end", "go"], a: 2 },
              { t: "MCQ", q: "Synonym of 'huge':", opts: ["tiny", "enormous", "narrow", "weak"], a: 1 },
              { t: "REORDER", q: "Order alphabetically:", items: ["apple", "banana", "cherry", "date"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "Antonym of 'difficult' is ___.", blanks: ["easy"] },
            ],
          },
        ],
      },
      {
        title: "Comprehension",
        exercises: [
          {
            title: "Reading Skills",
            questions: [
              { t: "MCQ", q: "Main idea of a passage is the:", opts: ["Detail", "Theme", "Quote", "Title"], a: 1 },
              { t: "MCQ", q: "An inference is:", opts: ["A direct quote", "A logical conclusion", "A summary", "An opinion"], a: 1 },
              { t: "MCQ", q: "Tone refers to:", opts: ["Plot", "Author's attitude", "Setting", "Length"], a: 1 },
              { t: "TRANSLATE", q: "Translate to formal English: 'gonna'", answer: "going to" },
              { t: "COMPLETE", q: "A short summary of a text is called an ___.", blanks: ["abstract"] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "General Knowledge",
    icon: "globe",
    description: "World affairs, science and culture.",
    units: [
      {
        title: "World Capitals",
        exercises: [
          {
            title: "Capitals & Countries",
            questions: [
              { t: "MCQ", q: "Capital of Japan:", opts: ["Seoul", "Beijing", "Tokyo", "Bangkok"], a: 2 },
              { t: "MCQ", q: "Capital of Australia:", opts: ["Sydney", "Canberra", "Melbourne", "Perth"], a: 1 },
              { t: "MCQ", q: "Capital of France:", opts: ["Lyon", "Nice", "Paris", "Marseille"], a: 2 },
              { t: "MATCH", q: "Match country with capital:", left: ["India", "Egypt", "Brazil"], right: ["New Delhi", "Cairo", "Brasília"], map: { India: "New Delhi", Egypt: "Cairo", Brazil: "Brasília" } },
              { t: "COMPLETE", q: "Capital of Canada is ___.", blanks: ["Ottawa"] },
            ],
          },
        ],
      },
      {
        title: "Science Trivia",
        exercises: [
          {
            title: "Discoveries",
            questions: [
              { t: "MCQ", q: "Gravity is associated with:", opts: ["Einstein", "Newton", "Tesla", "Galileo"], a: 1 },
              { t: "MCQ", q: "Penicillin discovered by:", opts: ["Fleming", "Pasteur", "Curie", "Darwin"], a: 0 },
              { t: "MCQ", q: "Theory of evolution by:", opts: ["Mendel", "Darwin", "Watson", "Hooke"], a: 1 },
              { t: "REORDER", q: "Earliest first:", items: ["Wheel", "Printing press", "Steam engine", "Internet"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "First man on the Moon was ___.", blanks: ["Neil Armstrong"] },
            ],
          },
        ],
      },
      {
        title: "Sports",
        exercises: [
          {
            title: "Olympic Sports",
            questions: [
              { t: "MCQ", q: "Olympics held every:", opts: ["2 years", "3 years", "4 years", "5 years"], a: 2 },
              { t: "MCQ", q: "FIFA governs:", opts: ["Cricket", "Football", "Tennis", "Hockey"], a: 1 },
              { t: "MCQ", q: "Number of players in a cricket team:", opts: ["9", "10", "11", "12"], a: 2 },
              { t: "MATCH", q: "Match sport with venue:", left: ["Tennis", "Boxing", "Swimming"], right: ["Court", "Ring", "Pool"], map: { Tennis: "Court", Boxing: "Ring", Swimming: "Pool" } },
              { t: "COMPLETE", q: "Cricket originated in ___.", blanks: ["England"] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "Reasoning",
    icon: "brain",
    description: "Logical and analytical reasoning.",
    units: [
      {
        title: "Verbal Reasoning",
        exercises: [
          {
            title: "Series & Analogy",
            questions: [
              { t: "MCQ", q: "Find next: 2, 4, 8, 16, ?", opts: ["18", "20", "32", "24"], a: 2 },
              { t: "MCQ", q: "Cat:Kitten :: Dog:?", opts: ["Cub", "Puppy", "Calf", "Foal"], a: 1 },
              { t: "MCQ", q: "Odd one out:", opts: ["Apple", "Mango", "Carrot", "Banana"], a: 2 },
              { t: "REORDER", q: "Order by size (smallest first):", items: ["Ant", "Cat", "Dog", "Elephant"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "If MONDAY=2, then SUNDAY=___.", blanks: ["1"] },
            ],
          },
        ],
      },
      {
        title: "Non-Verbal",
        exercises: [
          {
            title: "Patterns",
            questions: [
              { t: "MCQ", q: "Which shape has 6 sides?", opts: ["Pentagon", "Hexagon", "Octagon", "Heptagon"], a: 1 },
              { t: "MCQ", q: "Mirror image of 'b' is:", opts: ["d", "p", "q", "b"], a: 0 },
              { t: "MCQ", q: "Cube has ___ faces.", opts: ["4", "6", "8", "12"], a: 1 },
              { t: "MATCH", q: "Match shape with sides:", left: ["Triangle", "Square", "Pentagon"], right: ["3", "4", "5"], map: { Triangle: "3", Square: "4", Pentagon: "5" } },
              { t: "COMPLETE", q: "A circle has ___ sides.", blanks: ["0"] },
            ],
          },
        ],
      },
      {
        title: "Logical Puzzles",
        exercises: [
          {
            title: "Direction & Blood Relation",
            questions: [
              { t: "MCQ", q: "Facing north, turn 180°: now facing:", opts: ["East", "West", "South", "North"], a: 2 },
              { t: "MCQ", q: "My father's sister is my:", opts: ["Aunt", "Cousin", "Niece", "Mother"], a: 0 },
              { t: "MCQ", q: "Sun rises in the:", opts: ["North", "South", "East", "West"], a: 2 },
              { t: "REORDER", q: "Compass clockwise from N:", items: ["N", "E", "S", "W"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "Opposite of 'up' is ___.", blanks: ["down"] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "History",
    icon: "scroll",
    description: "World and Indian history.",
    units: [
      {
        title: "Ancient History",
        exercises: [
          {
            title: "Indus Valley & Beyond",
            questions: [
              { t: "MCQ", q: "Indus Valley civilization site:", opts: ["Harappa", "Pataliputra", "Ujjain", "Vijayanagara"], a: 0 },
              { t: "MCQ", q: "Author of Arthashastra:", opts: ["Kalidasa", "Chanakya", "Tulsidas", "Aryabhata"], a: 1 },
              { t: "MCQ", q: "Buddha attained enlightenment at:", opts: ["Lumbini", "Bodh Gaya", "Sarnath", "Kushinagar"], a: 1 },
              { t: "MATCH", q: "Match dynasty with founder:", left: ["Maurya", "Gupta", "Mughal"], right: ["Chandragupta", "Sri Gupta", "Babur"], map: { Maurya: "Chandragupta", Gupta: "Sri Gupta", Mughal: "Babur" } },
              { t: "COMPLETE", q: "Ashoka belonged to the ___ dynasty.", blanks: ["Maurya"] },
            ],
          },
        ],
      },
      {
        title: "Medieval History",
        exercises: [
          {
            title: "Sultanates & Mughals",
            questions: [
              { t: "MCQ", q: "First Mughal emperor:", opts: ["Akbar", "Babur", "Humayun", "Shah Jahan"], a: 1 },
              { t: "MCQ", q: "Taj Mahal built by:", opts: ["Akbar", "Babur", "Shah Jahan", "Aurangzeb"], a: 2 },
              { t: "MCQ", q: "Battle of Panipat (1st) year:", opts: ["1526", "1556", "1761", "1857"], a: 0 },
              { t: "REORDER", q: "Mughals chronological:", items: ["Babur", "Humayun", "Akbar", "Jahangir"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "Akbar's capital was ___.", blanks: ["Fatehpur Sikri"] },
            ],
          },
        ],
      },
      {
        title: "Modern History",
        exercises: [
          {
            title: "Freedom Movement",
            questions: [
              { t: "MCQ", q: "Year of Indian independence:", opts: ["1942", "1945", "1947", "1950"], a: 2 },
              { t: "MCQ", q: "Father of the Nation:", opts: ["Nehru", "Gandhi", "Patel", "Bose"], a: 1 },
              { t: "MCQ", q: "Quit India movement year:", opts: ["1919", "1930", "1942", "1946"], a: 2 },
              { t: "MATCH", q: "Match leader with movement:", left: ["Gandhi", "Bose", "Bhagat Singh"], right: ["Non-cooperation", "INA", "HSRA"], map: { Gandhi: "Non-cooperation", Bose: "INA", "Bhagat Singh": "HSRA" } },
              { t: "COMPLETE", q: "First PM of India was ___.", blanks: ["Jawaharlal Nehru"] },
            ],
          },
        ],
      },
    ],
  },

  {
    name: "Geography",
    icon: "map",
    description: "Physical and human geography.",
    units: [
      {
        title: "Physical Geography",
        exercises: [
          {
            title: "Earth & Atmosphere",
            questions: [
              { t: "MCQ", q: "Largest ocean:", opts: ["Atlantic", "Indian", "Arctic", "Pacific"], a: 3 },
              { t: "MCQ", q: "Layer we live in:", opts: ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"], a: 1 },
              { t: "MCQ", q: "Earth's shape is:", opts: ["Sphere", "Oblate spheroid", "Cube", "Disk"], a: 1 },
              { t: "REORDER", q: "Atmosphere layers (low→high):", items: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "Earth has ___ continents.", blanks: ["7"] },
            ],
          },
        ],
      },
      {
        title: "World Geography",
        exercises: [
          {
            title: "Rivers & Mountains",
            questions: [
              { t: "MCQ", q: "Longest river:", opts: ["Amazon", "Nile", "Yangtze", "Ganga"], a: 1 },
              { t: "MCQ", q: "Highest peak:", opts: ["K2", "Everest", "Kanchenjunga", "Lhotse"], a: 1 },
              { t: "MCQ", q: "Sahara is a:", opts: ["Forest", "Desert", "Plateau", "Plain"], a: 1 },
              { t: "MATCH", q: "Match river to country:", left: ["Nile", "Amazon", "Ganga"], right: ["Egypt", "Brazil", "India"], map: { Nile: "Egypt", Amazon: "Brazil", Ganga: "India" } },
              { t: "COMPLETE", q: "Mt. Everest lies in the ___ range.", blanks: ["Himalaya"] },
            ],
          },
        ],
      },
      {
        title: "Indian Geography",
        exercises: [
          {
            title: "States & Rivers",
            questions: [
              { t: "MCQ", q: "Largest Indian state by area:", opts: ["Maharashtra", "Rajasthan", "Madhya Pradesh", "UP"], a: 1 },
              { t: "MCQ", q: "Capital of Karnataka:", opts: ["Mysore", "Bengaluru", "Mangalore", "Hubli"], a: 1 },
              { t: "MCQ", q: "Tropic of Cancer passes through how many Indian states:", opts: ["6", "8", "10", "12"], a: 1 },
              { t: "REORDER", q: "Rivers from north to south:", items: ["Ganga", "Narmada", "Krishna", "Kaveri"], order: [0, 1, 2, 3] },
              { t: "COMPLETE", q: "India has ___ Union Territories (as of 2024).", blanks: ["8"] },
            ],
          },
        ],
      },
    ],
  },
];

const EXAMS = [
  { title: "JEE Main 2026", description: "Engineering entrance — Physics, Chemistry, Mathematics.", subjects: ["physics", "chemistry", "mathematics"] },
  { title: "NEET 2026", description: "Medical entrance — Physics, Chemistry, Biology.", subjects: ["physics", "chemistry", "biology"] },
  { title: "NIMCET 2026", description: "MCA entrance — Mathematics, Computer Science, Reasoning, English.", subjects: ["mathematics", "computer-science", "reasoning", "english"] },
  { title: "GATE CSE 2026", description: "Graduate aptitude in CS — CS, Mathematics, Reasoning.", subjects: ["computer-science", "mathematics", "reasoning"] },
  { title: "UPSC Prelims 2026", description: "Civil services — History, Geography, GK, English, Reasoning.", subjects: ["history", "geography", "general-knowledge", "english", "reasoning"] },
];

// ---------- normalize -------------------------------------------------------
const db = { subjects: [], units: [], exercises: [], exams: [], exam_subjects: [], questions: [] };

for (const s of SUBJECTS) {
  const sId = id("subj", s.name);
  db.subjects.push({ id: sId, name: s.name, slug: slug(s.name), icon: s.icon, description: s.description });

  s.units.forEach((u, ui) => {
    const uId = id("unit", s.name, u.title);
    db.units.push({ id: uId, subject_id: sId, title: u.title, order_index: ui, description: u.description ?? null });

    u.exercises.forEach((ex, ei) => {
      const eId = id("ex", s.name, u.title, ex.title);
      db.exercises.push({ id: eId, unit_id: uId, title: ex.title, duration: 5 + ei, points: 10 + ex.questions.length, order_index: ei });

      ex.questions.forEach((q, qi) => {
        const qId = id("q", s.name, u.title, ex.title, String(qi));
        let type, prompt, content;
        switch (q.t) {
          case "MCQ":
            type = "MCQ"; prompt = q.q;
            content = { options: q.opts, correct_index: q.a };
            break;
          case "MATCH":
            type = "MATCH"; prompt = q.q;
            content = { left: q.left, right: q.right, map: q.map };
            break;
          case "REORDER":
            type = "REORDER"; prompt = q.q;
            content = { items: q.items, order: q.order };
            break;
          case "COMPLETE":
            type = "COMPLETE"; prompt = q.q;
            content = { blanks: q.blanks };
            break;
          case "TRANSLATE":
            type = "TRANSLATE"; prompt = q.q;
            content = { answer: q.answer };
            break;
          default:
            throw new Error("Unknown question type: " + q.t);
        }
        db.questions.push({
          id: qId,
          exercise_id: eId,
          type,
          prompt,
          points: 10,
          difficulty: ["easy", "medium", "hard"][qi % 3],
          content,
          explanation: q.exp ?? null,
        });
      });
    });
  });
}

EXAMS.forEach((e) => {
  const eId = id("exam", e.title);
  db.exams.push({ id: eId, title: e.title, slug: slug(e.title), description: e.description });
  e.subjects.forEach((subSlug, i) => {
    db.exam_subjects.push({ exam_id: eId, subject_id: id("subj", subSlug.replace(/-/g, " ")), order_index: i });
  });
});

// Re-key exam_subjects: subject ids were generated from name above; rebuild map by slug.
const slugToSubjectId = Object.fromEntries(db.subjects.map((s) => [s.slug, s.id]));
db.exam_subjects = db.exam_subjects.map((row) => {
  // recover slug from the (possibly off) generated id
  const tail = row.subject_id.split(":").slice(1).join("-");
  return { ...row, subject_id: slugToSubjectId[tail] ?? row.subject_id };
});

// ---------- write outputs ---------------------------------------------------
const outDir = __dirname;
fs.writeFileSync(path.join(outDir, "database.json"), JSON.stringify(db, null, 2));

// Build seed.sql
const lines = [
  "-- Auto-generated by Courses/generate.js",
  "BEGIN TRANSACTION;",
];
const insert = (table, row, jsonCols = []) => {
  const cols = Object.keys(row);
  const vals = cols.map((c) => (jsonCols.includes(c) ? sqlEscape(JSON.stringify(row[c])) : sqlEscape(row[c])));
  lines.push(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${vals.join(",")});`);
};
db.subjects.forEach((r) => insert("subjects", r));
db.units.forEach((r) => insert("units", r));
db.exercises.forEach((r) => insert("exercises", r));
db.exams.forEach((r) => insert("exams", r));
db.exam_subjects.forEach((r) => insert("exam_subjects", r));
db.questions.forEach((r) => insert("questions", r, ["content"]));
lines.push("COMMIT;");
fs.writeFileSync(path.join(outDir, "seed.sql"), lines.join("\n"));

// Stats
const stats = {
  subjects: db.subjects.length,
  units: db.units.length,
  exercises: db.exercises.length,
  exams: db.exams.length,
  exam_subjects: db.exam_subjects.length,
  questions: db.questions.length,
};
fs.writeFileSync(path.join(outDir, "stats.json"), JSON.stringify(stats, null, 2));
console.log("Generated:", stats);
