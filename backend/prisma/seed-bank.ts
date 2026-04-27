/**
 * Authoritative question bank used by `prisma/seed.ts`.
 *
 * Structure:
 *   SUBJECT_DEFS    — 5 subjects, 3 difficulty levels each
 *   buildSubjectBank(name, level) → Unit[] for that subject/level
 *
 * Each Exercise has exactly 10 questions: 8 marked `easy`, 2 marked `medium`,
 * per the user spec. Questions cover MCQ / COMPLETE / MATCH / REORDER types.
 */

export type QType = 'MCQ' | 'MATCH' | 'REORDER' | 'COMPLETE' | 'TRANSLATE';
export type QDifficulty = 'easy' | 'medium' | 'hard';

export interface SeedQuestion {
  type: QType;
  prompt: string;
  difficulty: QDifficulty;
  content: any;
  explanation?: string;
}
export interface SeedExercise {
  title: string;
  questions: SeedQuestion[];
}
export interface SeedUnit {
  title: string;
  description: string;
  exercises: SeedExercise[];
}

export const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------------------------------------------------------------------------
// Subject + Exam definitions
// ---------------------------------------------------------------------------
export const SUBJECT_DEFS = [
  {
    name: 'Physics',
    icon: 'atom',
    descriptions: [
      'Foundational physics covering motion, force and energy (≈ Class 10).',
      'Mechanics, electromagnetism and modern physics for senior secondary (≈ Class 12).',
      'Graduate-level mechanics, fields and quantum concepts.',
    ],
  },
  {
    name: 'Chemistry',
    icon: 'flask',
    descriptions: [
      'Atoms, periodic table and reactions (≈ Class 10).',
      'Physical, organic and inorganic chemistry (≈ Class 12).',
      'Advanced organic mechanisms, thermodynamics and quantum chemistry.',
    ],
  },
  {
    name: 'Mathematics',
    icon: 'sigma',
    descriptions: [
      'Algebra, geometry and arithmetic essentials (≈ Class 10).',
      'Calculus, vectors and probability (≈ Class 12).',
      'Linear algebra, real analysis and advanced calculus.',
    ],
  },
  {
    name: 'Biology',
    icon: 'leaf',
    descriptions: [
      'Cells, plants and human body basics (≈ Class 10).',
      'Genetics, physiology and ecology (≈ Class 12).',
      'Molecular biology, biotechnology and systems biology.',
    ],
  },
  {
    name: 'Computer Science',
    icon: 'laptop-code',
    descriptions: [
      'Computer fundamentals and beginner programming (≈ Class 10).',
      'Data structures, OOP and DBMS basics (≈ Class 12).',
      'Algorithms, OS, networks and theory of computation.',
    ],
  },
  {
    name: 'DSA',
    icon: 'code',
    descriptions: [
      'Beginner data structures — arrays, strings, basic recursion.',
      'Intermediate DSA — trees, graphs, hashing, two-pointers.',
      'Advanced algorithms — DP, segment trees, graph algorithms.',
    ],
  },
  {
    name: 'Python',
    icon: 'python',
    descriptions: [
      'Python basics — syntax, variables, loops, functions.',
      'Intermediate Python — OOP, comprehensions, error handling, modules.',
      'Advanced Python — decorators, async, typing, performance.',
    ],
  },
  {
    name: 'C++',
    icon: 'code',
    descriptions: [
      'C++ basics — syntax, I/O, control flow, functions.',
      'Intermediate C++ — OOP, templates, STL containers.',
      'Advanced C++ — move semantics, concurrency, templates, modern features.',
    ],
  },
] as const;

export const EXAM_DEFS = [
  {
    slug: 'jee-main-2026',
    title: 'JEE Main 2026',
    description: 'Joint Entrance Examination — engineering. Physics 2, Chemistry 2 and Mathematics 2 (senior secondary syllabus).',
    subjectMatchers: ['physics-2', 'chemistry-2', 'mathematics-2'],
  },
  {
    slug: 'neet-2026',
    title: 'NEET 2026',
    description: 'National Eligibility cum Entrance Test — medical undergraduate. Physics, Chemistry and Biology at Class 12 level.',
    subjectMatchers: ['physics-2', 'chemistry-2', 'biology-2'],
  },
  {
    slug: 'upsc-cse-2026',
    title: 'UPSC CSE 2026',
    description: 'Civil Services Examination prelims — broad GS coverage including history, polity and aptitude. (Subjects: General Studies sample.)',
    subjectMatchers: ['mathematics-2', 'biology-2'],
  },
  {
    slug: 'nimcet-2026',
    title: 'NIMCET 2026',
    description: 'NIT MCA Common Entrance Test — mathematics, computer awareness, English and reasoning.',
    subjectMatchers: ['mathematics-2', 'computer-science-2', 'dsa-2'],
  },
  {
    slug: 'cuet-2026',
    title: 'CUET 2026',
    description: 'Common University Entrance Test — multi-domain undergraduate admissions test.',
    subjectMatchers: ['mathematics-2', 'physics-2', 'biology-2'],
  },
] as const;

// Backwards-compat alias used in old code paths.
export const EXAM_DEF = EXAM_DEFS[0];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mcq = (
  prompt: string,
  options: string[],
  correctIndex: number,
  difficulty: QDifficulty = 'easy',
  explanation?: string,
): SeedQuestion => ({
  type: 'MCQ',
  prompt,
  difficulty,
  content: { options, correct_index: correctIndex },
  explanation,
});

const fill = (
  prompt: string,
  blanks: string[],
  difficulty: QDifficulty = 'easy',
): SeedQuestion => ({
  type: 'COMPLETE',
  prompt,
  difficulty,
  content: { blanks },
});

const match = (
  prompt: string,
  left: string[],
  right: string[],
  map: Record<string, string>,
  difficulty: QDifficulty = 'easy',
): SeedQuestion => ({
  type: 'MATCH',
  prompt,
  difficulty,
  content: { left, right, map },
});

const reorder = (
  prompt: string,
  items: string[],
  order: number[],
  difficulty: QDifficulty = 'easy',
): SeedQuestion => ({
  type: 'REORDER',
  prompt,
  difficulty,
  content: { items, order },
});

/**
 * Take a curated list of question authors and produce a balanced 10-question
 * exercise: 8 easy + 2 medium. Inputs are tagged `easy` or `medium`; we pick
 * 8 easy (cycling if needed) and 2 medium.
 */
function makeExercise(title: string, pool: SeedQuestion[]): SeedExercise {
  const easies = pool.filter((q) => q.difficulty === 'easy');
  const mediums = pool.filter((q) => q.difficulty === 'medium');
  if (easies.length < 8 || mediums.length < 2) {
    throw new Error(
      `Pool for "${title}" must have ≥8 easy and ≥2 medium questions (got ${easies.length}/${mediums.length})`,
    );
  }
  return {
    title,
    questions: [...easies.slice(0, 8), ...mediums.slice(0, 2)],
  };
}

// ===========================================================================
// PHYSICS
// ===========================================================================
const PHYSICS: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'Motion',
      description: 'Distance, displacement, speed, velocity and acceleration.',
      exercises: [
        makeExercise('Speed & Velocity', [
          mcq('SI unit of speed is:', ['m', 'm/s', 'm/s²', 'kg'], 1),
          mcq('Distance is a:', ['Vector', 'Scalar', 'Matrix', 'Tensor'], 1),
          mcq('Displacement can be:', ['Only positive', 'Only negative', 'Zero or non-zero', 'Always 1'], 2),
          mcq('Average speed = total distance / ?', ['mass', 'time', 'force', 'volume'], 1),
          mcq('Velocity has:', ['Magnitude only', 'Direction only', 'Both', 'Neither'], 2),
          mcq('Unit of acceleration:', ['m/s', 'm/s²', 'm·s', 'N'], 1),
          fill('Speed = distance / ___.', ['time']),
          fill('A scalar has only ___.', ['magnitude']),
          mcq('A car going around a circle at constant speed has:', ['Zero acceleration', 'Constant velocity', 'Changing velocity', 'No motion'], 2, 'medium'),
          fill('If displacement is 0 over a journey, the body has returned to its ___.', ['start'], 'medium'),
        ]),
        makeExercise('Acceleration & Graphs', [
          mcq('Slope of velocity-time graph gives:', ['Distance', 'Speed', 'Acceleration', 'Mass'], 2),
          mcq('Area under v-t graph gives:', ['Time', 'Acceleration', 'Displacement', 'Force'], 2),
          mcq('Acceleration of free-fall ≈', ['8.9', '9.8', '10.5', '11.2'], 1),
          mcq('Uniform motion means:', ['Constant velocity', 'Zero velocity', 'High speed', 'Random'], 0),
          mcq('Negative acceleration is called:', ['Deceleration', 'Velocity', 'Inertia', 'Momentum'], 0),
          mcq('SI unit of distance:', ['m', 'kg', 's', 'A'], 0),
          fill('On a position-time graph, slope gives ___.', ['velocity']),
          match('Match graph with quantity:', ['v-t slope', 'x-t slope', 'v-t area'], ['acceleration', 'velocity', 'displacement'], { 'v-t slope': 'acceleration', 'x-t slope': 'velocity', 'v-t area': 'displacement' }),
          mcq('A body starts from rest with a = 2 m/s². Velocity after 5 s:', ['5 m/s', '7 m/s', '10 m/s', '20 m/s'], 2, 'medium'),
          fill('In 1D motion, acceleration is the ___ of velocity with respect to time.', ['derivative'], 'medium'),
        ]),
      ],
    },
    {
      title: 'Force & Newton’s Laws',
      description: "Inertia, F = ma, action–reaction.",
      exercises: [
        makeExercise('Newton’s Laws', [
          mcq('Newton’s 1st law is also known as:', ['Law of inertia', 'Law of action', 'Law of energy', 'Law of motion'], 0),
          mcq('SI unit of force:', ['Pascal', 'Newton', 'Joule', 'Watt'], 1),
          mcq('F = m × ?', ['v', 'a', 't', 'd'], 1),
          mcq('Action and reaction act on:', ['Same body', 'Different bodies', 'No body', 'Earth only'], 1),
          mcq('Mass is measured in:', ['kg', 'N', 'm', 's'], 0),
          mcq('Weight = mass × ?', ['speed', 'g', 'distance', 'time'], 1),
          fill('1 N = 1 kg·___.', ['m/s²']),
          fill('Inertia depends on ___.', ['mass']),
          mcq('A 2 kg body accelerates at 3 m/s². Force on it:', ['3 N', '5 N', '6 N', '12 N'], 2, 'medium'),
          mcq('A book on a table is in equilibrium because:', ['No forces act', 'Forces are balanced', 'Mass is small', 'No friction'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Energy & Work',
      description: 'Work, kinetic and potential energy, conservation.',
      exercises: [
        makeExercise('Work & Energy', [
          mcq('SI unit of work:', ['Pascal', 'Joule', 'Newton', 'Watt'], 1),
          mcq('Kinetic energy depends on:', ['Mass only', 'Velocity only', 'Both', 'Neither'], 2),
          mcq('PE near Earth = m × g × ?', ['v', 'h', 'a', 't'], 1),
          mcq('1 Joule = 1 N · ?', ['s', 'kg', 'm', 'A'], 2),
          mcq('Power is rate of doing:', ['Force', 'Work', 'Mass', 'Pressure'], 1),
          mcq('Unit of power:', ['Joule', 'Newton', 'Watt', 'Volt'], 2),
          fill('KE = ½ m ___².', ['v']),
          fill('Mechanical energy = KE + ___.', ['PE']),
          mcq('Work done by a force perpendicular to motion is:', ['Maximum', 'Zero', 'Negative', 'Variable'], 1, 'medium'),
          mcq('A 5 kg body moves at 4 m/s. KE is:', ['10 J', '20 J', '40 J', '80 J'], 2, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'Kinematics in 2D',
      description: 'Vectors, projectile motion, relative velocity.',
      exercises: [
        makeExercise('Projectile Motion', [
          mcq('Range is maximum at angle:', ['30°', '45°', '60°', '90°'], 1),
          mcq('At max height, vertical velocity is:', ['Maximum', 'Zero', 'Equal to horizontal', 'Negative'], 1),
          mcq('Horizontal acceleration of an ideal projectile:', ['g', '0', '-g', 'g/2'], 1),
          mcq('Trajectory of a projectile is a:', ['Line', 'Parabola', 'Circle', 'Hyperbola'], 1),
          mcq('Time of flight T =', ['u/g', '2u sinθ / g', 'u sinθ / g', 'u² / g'], 1),
          mcq('Two vectors add by:', ['Triangle law', 'Algebra only', 'Cross product', 'Division'], 0),
          fill('Range R = u² sin(2θ) / ___.', ['g']),
          fill('Maximum height H = u² sin²θ / ___.', ['2g']),
          mcq('A ball is thrown at 20 m/s at 30°. Time of flight (g=10):', ['1 s', '2 s', '3 s', '4 s'], 1, 'medium'),
          mcq('Horizontal range when θ → 0 is:', ['Maximum', 'Zero', 'Half', 'Doubled'], 1, 'medium'),
        ]),
        makeExercise('Vectors', [
          mcq('Dot product of perpendicular vectors:', ['1', '0', '-1', 'magnitude'], 1),
          mcq('|i × j| =', ['0', '1', 'i', 'k'], 1),
          mcq('A vector has:', ['Only magnitude', 'Only direction', 'Both', 'Neither'], 2),
          mcq('Resultant of two equal vectors at 60°:', ['Equal in magnitude', '√3 times', 'Twice', 'Zero'], 1),
          mcq('Cross product is:', ['Scalar', 'Vector', 'Tensor', 'Number'], 1),
          mcq('Unit vector along x:', ['i', 'j', 'k', 'r'], 0),
          fill('A · A = |A|² so A·A is a ___.', ['scalar']),
          fill('A × B is perpendicular to ___.', ['both A and B']),
          mcq('Angle between A and B if A·B=0 (both nonzero):', ['0°', '45°', '90°', '180°'], 2, 'medium'),
          mcq('|A + B|² =', ['|A|² + |B|² + 2A·B', '|A|² - |B|²', '|A| + |B|', '|A·B|²'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Electromagnetism',
      description: 'Coulomb’s law, fields, magnetism, induction.',
      exercises: [
        makeExercise('Electrostatics', [
          mcq('SI unit of charge:', ['Volt', 'Ampere', 'Coulomb', 'Ohm'], 2),
          mcq('Coulomb force varies as:', ['1/r', '1/r²', 'r', 'r²'], 1),
          mcq('Electric field inside a conductor in equilibrium:', ['Maximum', 'Zero', 'Infinite', 'Variable'], 1),
          mcq('Unit of electric field:', ['N/C', 'C/N', 'V/A', 'J/C'], 0),
          mcq('Capacitance unit:', ['Henry', 'Ohm', 'Farad', 'Tesla'], 2),
          mcq('Potential difference unit:', ['Volt', 'Ampere', 'Tesla', 'Watt'], 0),
          fill('Electric field of a point charge: E = kq / ___.', ['r²']),
          fill('Capacitance C = Q / ___.', ['V']),
          mcq('Two equal positive charges experience:', ['Attraction', 'Repulsion', 'No force', 'Magnetic force'], 1, 'medium'),
          mcq('A capacitor stores energy as:', ['Magnetic field', 'Electric field', 'Heat', 'Sound'], 1, 'medium'),
        ]),
        makeExercise('Magnetism & Induction', [
          mcq('Unit of magnetic flux density:', ['Tesla', 'Henry', 'Volt', 'Watt'], 0),
          mcq('Faraday’s law relates:', ['Mass and energy', 'EMF and flux', 'Force and charge', 'Power and current'], 1),
          mcq('Lenz’s law is a statement of:', ['Conservation of charge', 'Conservation of energy', 'Conservation of mass', 'Newton’s 3rd'], 1),
          mcq('SI unit of inductance:', ['Henry', 'Farad', 'Ohm', 'Watt'], 0),
          mcq('Magnetic field around a long wire goes as:', ['1/r', '1/r²', 'r', 'r²'], 0),
          mcq('Direction of force on +ve charge given by:', ['Right-hand rule', 'Left-foot rule', 'Coulomb’s law', 'Lenz’s rule'], 0),
          fill('EMF ε = -dΦ/___.', ['dt']),
          fill('Force on a charge: F = qv × ___.', ['B']),
          mcq('A bar magnet pushed into a coil induces EMF because of changing:', ['Voltage', 'Current', 'Flux', 'Resistance'], 2, 'medium'),
          mcq('1 Tesla = 1 Wb / ?', ['m', 'm²', 'm³', 's'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Modern Physics',
      description: 'Photoelectric effect, atomic models, nuclei.',
      exercises: [
        makeExercise('Photons & Atoms', [
          mcq('Photon energy E =', ['hν', 'mc²', 'kT', 'pV'], 0),
          mcq('Photoelectric effect explained by:', ['Newton', 'Einstein', 'Planck', 'Bohr'], 1),
          mcq('Bohr’s model applies best to:', ['He', 'H', 'Li', 'Ne'], 1),
          mcq('Mass-energy relation: E =', ['mc', 'mc²', 'mv²', 'm/c'], 1),
          mcq('Stable orbits in Bohr have:', ['Quantized angular momentum', 'Random radii', 'Zero radius', 'Infinite energy'], 0),
          mcq('Half-life relates to:', ['Charge', 'Decay rate', 'Voltage', 'Mass only'], 1),
          fill('h ≈ 6.626×10⁻³⁴ J·___.', ['s']),
          fill('Work function is the ___ energy to eject an electron.', ['minimum']),
          mcq('If incident frequency < threshold, photoelectric current is:', ['Maximum', 'Zero', 'Constant', 'Increasing'], 1, 'medium'),
          mcq('λ = h / p is the ___ wavelength.', ['de Broglie', 'Bohr', 'Bragg', 'Compton'], 0, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Classical Mechanics',
      description: 'Lagrangian and Hamiltonian formulations.',
      exercises: [
        makeExercise('Lagrangian Mechanics', [
          mcq('Lagrangian L =', ['T - V', 'T + V', 'V - T', 'TV'], 0),
          mcq('Euler-Lagrange equation involves derivatives w.r.t.:', ['Only time', 'Only generalized coords', 'Time and generalized coords', 'None'], 2),
          mcq('Generalized coordinates are:', ['Cartesian only', 'Any independent coords', 'Spherical only', 'Polar only'], 1),
          mcq('Phase space dimension for N particles:', ['N', '2N', '3N', '6N'], 3),
          mcq('Hamiltonian H typically equals:', ['T - V', 'T + V', 'pq', 'q²'], 1),
          mcq('A cyclic coordinate yields a conserved:', ['Energy', 'Momentum', 'Angle', 'Position'], 1),
          fill('Conjugate momentum p_i = ∂L/∂___.', ['q̇_i']),
          fill('In Hamiltonian dynamics dq/dt = ∂H/∂___.', ['p']),
          mcq('Poisson bracket {q,p} =', ['0', '1', '-1', 'p'], 1, 'medium'),
          mcq('Noether’s theorem connects symmetries to:', ['Forces', 'Conservation laws', 'Constraints', 'Damping'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Electrodynamics',
      description: 'Maxwell’s equations and waves.',
      exercises: [
        makeExercise('Maxwell & Waves', [
          mcq('Maxwell’s equations are how many?', ['2', '3', '4', '5'], 2),
          mcq('Speed of light in vacuum c =', ['1/√(μ₀ε₀)', '√(μ₀ε₀)', 'μ₀ε₀', '1/μ₀'], 0),
          mcq('Gauss’s law (electric) involves:', ['∇·E = ρ/ε₀', '∇×E = 0', '∇·B = ρ', '∇×B = 0'], 0),
          mcq('Faraday’s law in differential form:', ['∇·E = ρ/ε₀', '∇×E = -∂B/∂t', '∇·B = 0', '∇×B = J'], 1),
          mcq('Poynting vector represents:', ['Energy density', 'Energy flux', 'Charge density', 'Force'], 1),
          mcq('Electromagnetic waves are:', ['Longitudinal', 'Transverse', 'Mechanical', 'Stationary'], 1),
          fill('∇·B = ___.', ['0']),
          fill('In free space, ∇×B = μ₀ε₀ ∂E/___.', ['∂t']),
          mcq('A plane EM wave has E and B that are:', ['Parallel', 'Anti-parallel', 'Perpendicular', 'Equal'], 2, 'medium'),
          mcq('Energy density of an EM wave is proportional to:', ['E', 'E²', '1/E', 'log E'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Quantum Mechanics',
      description: 'Postulates, operators, and spectra.',
      exercises: [
        makeExercise('Postulates & Operators', [
          mcq('State of a quantum system is:', ['A vector in Hilbert space', 'A real number', 'A scalar', 'A matrix only'], 0),
          mcq('Observable is a:', ['Hermitian operator', 'Unitary operator', 'Skew matrix', 'Vector'], 0),
          mcq('Eigenvalues of Hermitian operators are:', ['Complex', 'Real', 'Negative', 'Zero'], 1),
          mcq('Time evolution governed by:', ['Newton', 'Schrödinger', 'Maxwell', 'Boltzmann'], 1),
          mcq('Heisenberg uncertainty relates Δx and:', ['Δt', 'Δp', 'ΔE', 'Δm'], 1),
          mcq('Probability density is:', ['ψ', '|ψ|', 'ψ²', '|ψ|²'], 3),
          fill('Commutator [x, p] = i___.', ['ℏ']),
          fill('Energy eigenstates of H solve H ψ = ___ ψ.', ['E']),
          mcq('Particle in a box has energies proportional to:', ['n', 'n²', '1/n', '√n'], 1, 'medium'),
          mcq('Pauli exclusion applies to:', ['Bosons', 'Fermions', 'Photons', 'Phonons'], 1, 'medium'),
        ]),
      ],
    },
  ],
};

// ===========================================================================
// CHEMISTRY
// ===========================================================================
const CHEMISTRY: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'Atoms & Molecules',
      description: 'Atomic structure, ions, simple compounds.',
      exercises: [
        makeExercise('Atoms Basics', [
          mcq('Smallest particle of an element:', ['Atom', 'Molecule', 'Ion', 'Compound'], 0),
          mcq('Charge on a proton:', ['0', '+1', '-1', '+2'], 1),
          mcq('Charge on a neutron:', ['0', '+1', '-1', '+2'], 0),
          mcq('Most of an atom’s mass is in:', ['Electrons', 'Nucleus', 'Shells', 'Empty space'], 1),
          mcq('H₂O is:', ['Element', 'Compound', 'Mixture', 'Ion'], 1),
          mcq('Symbol for sodium:', ['So', 'S', 'Na', 'N'], 2),
          fill('Atomic number = number of ___.', ['protons']),
          fill('Mass number = protons + ___.', ['neutrons']),
          mcq('Isotopes have same protons but different ___.', ['Electrons', 'Neutrons', 'Charges', 'Names'], 1, 'medium'),
          mcq('Number of electrons in neutral O (Z=8):', ['6', '7', '8', '16'], 2, 'medium'),
        ]),
      ],
    },
    {
      title: 'Periodic Table',
      description: 'Groups, periods and key trends.',
      exercises: [
        makeExercise('Periodic Trends', [
          mcq('Group 1 metals are called:', ['Alkali', 'Halogen', 'Noble', 'Transition'], 0),
          mcq('Most reactive non-metal group:', ['Alkali', 'Alkaline earth', 'Halogens', 'Noble gases'], 2),
          mcq('Helium is in group:', ['1', '2', '17', '18'], 3),
          mcq('Across a period, atomic radius:', ['Increases', 'Decreases', 'Same', 'Random'], 1),
          mcq('Down a group, metallic character:', ['Decreases', 'Increases', 'Same', 'None'], 1),
          mcq('Symbol of iron:', ['Ir', 'I', 'Fe', 'Fr'], 2),
          fill('Periodic table arranged by atomic ___.', ['number']),
          match('Match group with type:', ['1', '17', '18'], ['Alkali', 'Halogen', 'Noble'], { '1': 'Alkali', '17': 'Halogen', '18': 'Noble' }),
          mcq('Most electronegative element overall:', ['O', 'F', 'Cl', 'N'], 1, 'medium'),
          mcq('Noble gases are unreactive because their valence shell is:', ['Half-full', 'Empty', 'Full', 'Singly occupied'], 2, 'medium'),
        ]),
      ],
    },
    {
      title: 'Chemical Reactions',
      description: 'Types of reactions, equations, balancing.',
      exercises: [
        makeExercise('Reaction Types', [
          mcq('A + B → AB is:', ['Decomposition', 'Combination', 'Displacement', 'Redox'], 1),
          mcq('Rusting is an example of:', ['Oxidation', 'Reduction', 'Sublimation', 'Filtration'], 0),
          mcq('Acid + base →', ['Salt + water', 'Gas only', 'Metal', 'Element'], 0),
          mcq('Litmus turns red in:', ['Base', 'Acid', 'Water', 'Salt'], 1),
          mcq('pH of pure water:', ['1', '7', '10', '14'], 1),
          mcq('Symbol of hydrogen:', ['He', 'H', 'Hy', 'Hg'], 1),
          fill('Mass is conserved in a chemical reaction (Law of ___).', ['conservation of mass']),
          fill('In CH4 + 2O2 → CO2 + 2H2O, the coefficient of water is ___.', ['2']),
          mcq('Balanced equation: 2H2 + O2 → ?', ['H2O', '2H2O', 'H2O2', '2HO'], 1, 'medium'),
          mcq('Endothermic reactions:', ['Release heat', 'Absorb heat', 'Need no energy', 'Are explosive'], 1, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'Physical Chemistry',
      description: 'Thermodynamics, equilibrium, kinetics.',
      exercises: [
        makeExercise('Thermo & Kinetics', [
          mcq('1st law of thermodynamics:', ['Energy conserved', 'Entropy increases', 'Δ G < 0', 'PV = nRT'], 0),
          mcq('Entropy is a measure of:', ['Energy', 'Disorder', 'Mass', 'Charge'], 1),
          mcq('Δ G < 0 means reaction is:', ['Spontaneous', 'Non-spontaneous', 'At equilibrium', 'Endothermic'], 0),
          mcq('Catalyst affects:', ['Equilibrium', 'Rate', 'Both', 'Neither'], 1),
          mcq('Order of reaction is determined by:', ['Stoichiometry', 'Experiment', 'Charge', 'Temperature'], 1),
          mcq('Kc depends on:', ['Concentration', 'Temperature', 'Pressure only', 'Volume only'], 1),
          fill('For an ideal gas, PV = n___T.', ['R']),
          fill('Half-life of a 1st-order reaction is independent of ___.', ['concentration']),
          mcq('At equilibrium, rates of forward and reverse are:', ['Zero', 'Equal', 'Maximum', 'Random'], 1, 'medium'),
          mcq('Rate law for a 2nd-order reaction in A:', ['k', 'k[A]', 'k[A]²', 'k/[A]'], 2, 'medium'),
        ]),
      ],
    },
    {
      title: 'Organic Chemistry',
      description: 'Hydrocarbons, functional groups and reactions.',
      exercises: [
        makeExercise('Functional Groups', [
          mcq('-OH is the functional group of:', ['Aldehyde', 'Alcohol', 'Acid', 'Ester'], 1),
          mcq('-COOH is:', ['Alcohol', 'Ketone', 'Carboxylic acid', 'Amine'], 2),
          mcq('General formula of alkanes:', ['CnH2n', 'CnH2n+2', 'CnH2n-2', 'CnHn'], 1),
          mcq('Benzene molecular formula:', ['C5H5', 'C6H6', 'C6H12', 'C7H8'], 1),
          mcq('-NH2 is:', ['Amine', 'Amide', 'Acid', 'Alcohol'], 0),
          mcq('Markovnikov rule applies to:', ['Alkanes', 'Alkenes', 'Alkynes', 'Alcohols'], 1),
          fill('Alkenes contain a ___ bond.', ['double']),
          fill('Esterification produces ester and ___.', ['water']),
          mcq('SN1 reactions form a:', ['Carbocation', 'Carbanion', 'Radical', 'Pi bond'], 0, 'medium'),
          mcq('Aromatic rings undergo electrophilic ___.', ['Addition', 'Substitution', 'Elimination', 'Reduction'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Inorganic Chemistry',
      description: 'Coordination, p-block and s-block essentials.',
      exercises: [
        makeExercise('Coordination & Blocks', [
          mcq('Ligand donates a:', ['Proton', 'Electron pair', 'Photon', 'Neutron'], 1),
          mcq('Coordination number of [Cu(NH3)4]²⁺:', ['2', '4', '6', '8'], 1),
          mcq('Geometry of [Ni(CO)4]:', ['Square planar', 'Tetrahedral', 'Octahedral', 'Linear'], 1),
          mcq('Group 17 elements:', ['Alkali', 'Halogens', 'Noble', 'Lanthanides'], 1),
          mcq('Most abundant gas in atmosphere:', ['O2', 'N2', 'CO2', 'Ar'], 1),
          mcq('Strongest reducing agent (alkali):', ['Li', 'Na', 'K', 'Cs'], 3),
          fill('Diamagnetic species have ___ unpaired electrons.', ['no']),
          fill('Crystal field splitting is denoted Δ_o for ___ geometry.', ['octahedral']),
          mcq('EAN of [Fe(CN)6]⁴⁻:', ['34', '36', '38', '40'], 1, 'medium'),
          mcq('CFSE of low-spin d6 octahedral (in Δo units):', ['-0.4', '-1.6', '-2.4', '0'], 2, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Advanced Organic',
      description: 'Mechanisms and stereochemistry.',
      exercises: [
        makeExercise('Mechanisms', [
          mcq('SN2 stereochemistry shows:', ['Retention', 'Inversion', 'Racemization', 'No change'], 1),
          mcq('E1 reaction is favored by:', ['Strong base', 'Weak base, polar protic', 'Cold', 'Aprotic only'], 1),
          mcq('Hammond postulate relates:', ['Equilibrium', 'TS to nearest stable species', 'Rates', 'Bonds'], 1),
          mcq('Diels-Alder is a:', ['SN2', '[4+2] cycloaddition', 'Radical', 'E2'], 1),
          mcq('Aldol reaction makes:', ['β-hydroxy carbonyl', 'Ester', 'Ether', 'Amide'], 0),
          mcq('Markovnikov regioselectivity is from:', ['Steric', 'Carbocation stability', 'Solvent only', 'Light'], 1),
          fill('Curly arrows in mechanisms denote movement of ___.', ['electrons']),
          fill('Chiral center has ___ different groups.', ['four']),
          mcq('Optical rotation by enantiomers is:', ['Equal', 'Opposite', 'Random', 'Zero'], 1, 'medium'),
          mcq('Aromatic substitution that adds NO2 uses:', ['HNO3 + H2SO4', 'NaOH', 'NH3', 'H2'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Quantum Chemistry',
      description: 'Wavefunctions and molecular orbitals.',
      exercises: [
        makeExercise('Wavefunctions & MO', [
          mcq('LCAO produces:', ['Bonding & antibonding MOs', 'Only bonding', 'Only antibonding', 'No change'], 0),
          mcq('Bond order of H2:', ['0', '0.5', '1', '2'], 2),
          mcq('Bond order of He2:', ['0', '0.5', '1', '2'], 0),
          mcq('Pauli exclusion limits electrons per orbital:', ['1', '2', '3', '4'], 1),
          mcq('Hund’s rule maximizes:', ['Pairing', 'Spin multiplicity', 'Energy', 'Symmetry'], 1),
          mcq('Aufbau principle fills orbitals in order of:', ['Decreasing energy', 'Increasing energy', 'Spin', 'Random'], 1),
          fill('Probability density = |ψ|² and is always ___.', ['non-negative']),
          fill('σ MO is symmetric about the ___ axis.', ['inter-nuclear']),
          mcq('In O2, magnetic property is:', ['Diamagnetic', 'Paramagnetic', 'Ferromagnetic', 'Antiferromagnetic'], 1, 'medium'),
          mcq('Bonding MOs have ___ energy than atomic orbitals.', ['Higher', 'Lower', 'Same', 'Variable'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Thermodynamics & Kinetics',
      description: 'Free energy, statistical thermodynamics, rate theories.',
      exercises: [
        makeExercise('Advanced Thermo', [
          mcq('ΔG = ΔH - T·?', ['ΔS', 'ΔU', 'ΔV', 'ΔP'], 0),
          mcq('Boltzmann distribution: P ∝ exp(-E/?)', ['kT', 'kB', 'h', 'NA'], 0),
          mcq('Activation energy comes from:', ['Newton', 'Arrhenius', 'Bohr', 'Planck'], 1),
          mcq('At equilibrium, ΔG =', ['<0', '>0', '0', '∞'], 2),
          mcq('Van’t Hoff equation links Keq to:', ['Pressure', 'Temperature', 'Volume', 'Mass'], 1),
          mcq('Eyring equation involves:', ['Transition state theory', 'Quantum mechanics', 'Optics', 'Photonics'], 0),
          fill('Arrhenius: k = A exp(-Ea/___).', ['RT']),
          fill('A reaction with ΔG < 0 is ___.', ['spontaneous']),
          mcq('A higher activation energy means ___ rate at fixed T.', ['Higher', 'Lower', 'Same', 'Random'], 1, 'medium'),
          mcq('Entropy of mixing two ideal gases is:', ['Zero', 'Positive', 'Negative', 'Undefined'], 1, 'medium'),
        ]),
      ],
    },
  ],
};

// ===========================================================================
// MATHEMATICS
// ===========================================================================
const MATHEMATICS: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'Algebra',
      description: 'Linear and quadratic equations.',
      exercises: [
        makeExercise('Equations', [
          mcq('Solve 2x + 3 = 11:', ['3', '4', '5', '6'], 1),
          mcq('Solve x - 5 = 0:', ['0', '5', '-5', '1'], 1),
          mcq('Slope of y = 3x + 2:', ['1', '2', '3', '5'], 2),
          mcq('Identity (a+b)² =', ['a²+b²', 'a²+2ab+b²', 'a²-b²', '2ab'], 1),
          mcq('Discriminant of ax²+bx+c:', ['b²-4ac', 'b²+4ac', '4ac-b²', '2a'], 0),
          mcq('Roots of x²-9 = 0:', ['±3', '±9', '3 only', '0'], 0),
          fill('Sum of roots of x²-5x+6 = ___.', ['5']),
          fill('Product of roots of x²-5x+6 = ___.', ['6']),
          mcq('If x²-7x+12=0, the larger root is:', ['3', '4', '5', '6'], 1, 'medium'),
          mcq('Number of solutions of |x|=3:', ['0', '1', '2', 'Infinite'], 2, 'medium'),
        ]),
      ],
    },
    {
      title: 'Geometry',
      description: 'Triangles, circles and basic theorems.',
      exercises: [
        makeExercise('Geometry Basics', [
          mcq('Sum of angles in a triangle:', ['90°', '180°', '270°', '360°'], 1),
          mcq('Pythagoras: a² + b² =', ['c', 'c²', '2c', '√c'], 1),
          mcq('Circumference of circle:', ['πr', '2πr', 'πr²', '2πr²'], 1),
          mcq('Area of a circle:', ['πr', '2πr', 'πr²', '2πr²'], 2),
          mcq('Right triangle has one ___ angle:', ['acute', '90°', 'obtuse', 'reflex'], 1),
          mcq('Hexagon has ___ sides:', ['4', '5', '6', '7'], 2),
          fill('All radii of a circle are ___.', ['equal']),
          fill('A triangle with all equal sides is ___.', ['equilateral']),
          mcq('In a 30-60-90 triangle, side ratios are:', ['1:1:√2', '1:√3:2', '2:3:5', '3:4:5'], 1, 'medium'),
          mcq('Diagonals of a square are ___:', ['Equal & perpendicular', 'Equal only', 'Perpendicular only', 'Neither'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Arithmetic & Statistics',
      description: 'Ratios, percentages, mean/median/mode.',
      exercises: [
        makeExercise('Stats & Ratios', [
          mcq('25% of 200 =', ['25', '50', '75', '100'], 1),
          mcq('Mean of 2,4,6,8 =', ['4', '5', '6', '7'], 1),
          mcq('Median of 1,3,5,7,9 =', ['3', '5', '7', '9'], 1),
          mcq('Mode of 1,2,2,3 =', ['1', '2', '3', 'None'], 1),
          mcq('Ratio 2:4 simplifies to:', ['1:1', '1:2', '2:1', '1:4'], 1),
          mcq('5 ÷ 0 is:', ['0', '5', 'Undefined', '∞'], 2),
          fill('Range = max - ___.', ['min']),
          fill('% increase = (new-old)/old × ___.', ['100']),
          mcq('A train covers 120 km in 2 h. Speed:', ['40', '50', '60', '80'], 2, 'medium'),
          mcq('If price rises from 80 to 100, % increase:', ['10%', '20%', '25%', '30%'], 2, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'Calculus',
      description: 'Limits, derivatives, integrals.',
      exercises: [
        makeExercise('Derivatives', [
          mcq('d/dx(x²) =', ['x', '2x', 'x²', '2'], 1),
          mcq('d/dx(sin x) =', ['cos x', '-cos x', 'sin x', '-sin x'], 0),
          mcq('d/dx(e^x) =', ['e^x', 'x e^x', '1', '0'], 0),
          mcq('d/dx(ln x) =', ['1/x', 'x', 'e^x', 'ln x'], 0),
          mcq('lim x→0 sin x / x =', ['0', '1', '∞', 'undefined'], 1),
          mcq('Derivative of constant:', ['1', '0', 'x', '∞'], 1),
          fill('d/dx(x^n) = n x^___.', ['n-1']),
          fill('Chain rule: d/dx f(g(x)) = f’(g(x))·___.', ['g’(x)']),
          mcq('d/dx(x³ - 3x) at x=1:', ['0', '1', '3', '6'], 0, 'medium'),
          mcq('Maximum of f(x)=-x²+4 at:', ['-2', '0', '2', '4'], 1, 'medium'),
        ]),
        makeExercise('Integrals', [
          mcq('∫x dx =', ['x', 'x²/2 + C', 'x²', '1'], 1),
          mcq('∫1 dx =', ['x + C', '0', '1', 'x²'], 0),
          mcq('∫e^x dx =', ['e^x + C', 'e + C', 'x e^x', '1'], 0),
          mcq('∫1/x dx =', ['x', 'ln|x| + C', '1', '-1/x²'], 1),
          mcq('Definite integral gives:', ['Slope', 'Area', 'Tangent', 'Limit'], 1),
          mcq('∫sin x dx =', ['cos x + C', '-cos x + C', 'sin x', '-sin x'], 1),
          fill('∫x² dx = x³/___ + C.', ['3']),
          fill('Fundamental theorem links derivatives and ___.', ['integrals']),
          mcq('∫₀¹ 2x dx =', ['0', '1', '2', '4'], 1, 'medium'),
          mcq('Area under y=x from 0 to 2:', ['1', '2', '3', '4'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Probability & Stats',
      description: 'Sample spaces, distributions and inference.',
      exercises: [
        makeExercise('Probability', [
          mcq('P(Head) on a fair coin:', ['0', '0.25', '0.5', '1'], 2),
          mcq('Sum of probabilities:', ['0', '0.5', '1', 'Variable'], 2),
          mcq('Mutually exclusive: P(A∩B) =', ['P(A)P(B)', '0', '1', 'P(A)+P(B)'], 1),
          mcq('Independent: P(A∩B) =', ['0', 'P(A)+P(B)', 'P(A)P(B)', '1'], 2),
          mcq('Mean of 1..10:', ['4', '5', '5.5', '6'], 2),
          mcq('Variance is squared:', ['Mean', 'Std dev', 'Range', 'Median'], 1),
          fill('P(A∪B) = P(A) + P(B) − P(___).', ['A∩B']),
          fill('Bayes: P(A|B) = P(B|A)P(A)/P(___).', ['B']),
          mcq('A bag has 3 red, 2 blue. P(red):', ['1/5', '2/5', '3/5', '4/5'], 2, 'medium'),
          mcq('Expected value of a fair die:', ['3', '3.5', '4', '6'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Vectors & Coordinate Geometry',
      description: 'Lines, planes, conics.',
      exercises: [
        makeExercise('Vectors & Lines', [
          mcq('Slope of x-axis:', ['0', '1', '∞', '-1'], 0),
          mcq('Equation of y-axis:', ['x = 0', 'y = 0', 'x = y', 'x + y = 0'], 0),
          mcq('Distance between (0,0) and (3,4):', ['3', '4', '5', '7'], 2),
          mcq('Dot product if ⟂:', ['1', '0', '-1', 'undefined'], 1),
          mcq('|i|=', ['0', '1', 'i', 'k'], 1),
          mcq('Lines y=2x+1 and y=2x+5 are:', ['Equal', 'Parallel', 'Perpendicular', 'Intersecting'], 1),
          fill('Standard form of circle: (x-h)² + (y-k)² = ___.', ['r²']),
          fill('Cross product gives a vector ___ to both.', ['perpendicular']),
          mcq('Eccentricity of a circle:', ['0', '0.5', '1', '∞'], 0, 'medium'),
          mcq('Midpoint of (1,2) and (5,6):', ['(3,4)', '(2,4)', '(4,5)', '(6,8)'], 0, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Linear Algebra',
      description: 'Vector spaces, matrices, eigenvalues.',
      exercises: [
        makeExercise('Matrices & Eigen', [
          mcq('Determinant of identity I_n:', ['0', '1', 'n', 'n!'], 1),
          mcq('det(AB) = det(A)·?', ['det(A)', 'det(B)', 'A', 'B'], 1),
          mcq('Eigenvalue equation: A v = ?', ['λv', 'λ²v', 'Av²', 'v/λ'], 0),
          mcq('Symmetric matrices have eigenvalues that are:', ['Complex', 'Real', 'Negative', 'Zero'], 1),
          mcq('Rank ≤ min(rows, ___).', ['cols', 'det', 'trace', 'norm'], 0),
          mcq('Trace of a matrix is sum of:', ['Rows', 'Diagonal', 'Cols', 'Entries'], 1),
          fill('A·A⁻¹ = ___.', ['I']),
          fill('Inverse exists iff det ≠ ___.', ['0']),
          mcq('Eigenvalues of a 2×2 [[2,0],[0,3]]:', ['{0,1}', '{2,3}', '{1,1}', '{2,2}'], 1, 'medium'),
          mcq('A matrix with linearly dependent rows has det:', ['0', '1', '-1', 'undefined'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Real Analysis',
      description: 'Sequences, series, continuity.',
      exercises: [
        makeExercise('Sequences & Series', [
          mcq('A bounded monotonic sequence is:', ['Divergent', 'Convergent', 'Periodic', 'Oscillating'], 1),
          mcq('Σ 1/n is:', ['Convergent', 'Divergent', 'Conditional', 'Telescoping'], 1),
          mcq('Σ 1/n² converges to:', ['1', 'π²/6', 'e', '∞'], 1),
          mcq('lim n→∞ (1+1/n)^n =', ['1', '2', 'e', '∞'], 2),
          mcq('A continuous function on [a,b] attains its:', ['Min only', 'Max only', 'Min & max', 'Neither'], 2),
          mcq('Cauchy sequences in R are:', ['Divergent', 'Convergent', 'Bounded only', 'Unbounded'], 1),
          fill('Squeeze theorem requires bounding by ___ functions.', ['two']),
          fill('A function is continuous at a if lim x→a f(x) = ___.', ['f(a)']),
          mcq('Σ (-1)^n / n is:', ['Divergent', 'Conditionally convergent', 'Absolutely convergent', 'Periodic'], 1, 'medium'),
          mcq('lim x→0 (1-cos x)/x² =', ['0', '1/2', '1', '2'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Multivariable Calculus',
      description: 'Partial derivatives and multiple integrals.',
      exercises: [
        makeExercise('Partials & Integrals', [
          mcq('∂/∂x (x²y) =', ['x²', '2xy', 'y', '0'], 1),
          mcq('∇f gives:', ['Scalar', 'Vector', 'Matrix', 'Number'], 1),
          mcq('Divergence of a constant field:', ['0', '1', '∇', '∞'], 0),
          mcq('Curl of a gradient:', ['Field itself', '0', '∞', 'Identity'], 1),
          mcq('Double integral over R²:', ['Length', 'Area-weighted sum', 'Volume', 'Tangent'], 1),
          mcq('Stokes’ theorem links curl to:', ['Volume integral', 'Boundary integral', 'Mass', 'Pressure'], 1),
          fill('Mixed partials are equal under ___ conditions (Clairaut).', ['continuity']),
          fill('div(curl F) = ___.', ['0']),
          mcq('∫∫_D 1 dA gives:', ['Volume', 'Area of D', 'Length', 'Curl'], 1, 'medium'),
          mcq('Jacobian is needed when:', ['Differentiating', 'Changing variables', 'Series test', 'Limit comparison'], 1, 'medium'),
        ]),
      ],
    },
  ],
};

// ===========================================================================
// BIOLOGY
// ===========================================================================
const BIOLOGY: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'The Cell',
      description: 'Cell organelles and basic functions.',
      exercises: [
        makeExercise('Cell Basics', [
          mcq('Powerhouse of the cell:', ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'], 1),
          mcq('Plant cells uniquely have:', ['Mitochondria', 'Cell wall', 'Nucleus', 'ER'], 1),
          mcq('Site of protein synthesis:', ['Ribosome', 'Lysosome', 'Vacuole', 'Nucleolus'], 0),
          mcq('Cell membrane is mainly:', ['Carbohydrate', 'Lipid bilayer', 'DNA', 'Protein only'], 1),
          mcq('Discoverer of cells:', ['Hooke', 'Newton', 'Mendel', 'Watson'], 0),
          mcq('Chloroplasts perform:', ['Respiration', 'Photosynthesis', 'Digestion', 'Transport'], 1),
          fill('Cell theory: all living things are made of ___.', ['cells']),
          fill('DNA is stored mainly in the ___.', ['nucleus']),
          mcq('Cell division producing identical cells:', ['Mitosis', 'Meiosis', 'Binary fission only', 'Apoptosis'], 0, 'medium'),
          mcq('Prokaryotes lack a true:', ['Membrane', 'Nucleus', 'Cytoplasm', 'Wall'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Plants',
      description: 'Plant parts, photosynthesis, transport.',
      exercises: [
        makeExercise('Plant Life', [
          mcq('Photosynthesis happens in:', ['Mitochondria', 'Chloroplasts', 'Nucleus', 'Vacuole'], 1),
          mcq('Photosynthesis equation: 6CO2 + 6H2O →', ['Sugar + O2', 'Acid + Water', 'CO2 + Heat', 'Salt'], 0),
          mcq('Roots absorb water through:', ['Bark', 'Hairs', 'Xylem only', 'Cuticle'], 1),
          mcq('Xylem carries:', ['Food', 'Water', 'Salt', 'Air'], 1),
          mcq('Phloem carries:', ['Water', 'Food', 'Sand', 'O2'], 1),
          mcq('Pigment for green color:', ['Hemoglobin', 'Chlorophyll', 'Melanin', 'Carotene'], 1),
          fill('Plants release ___ during photosynthesis.', ['oxygen']),
          fill('Stomata are found mostly on the leaf ___.', ['underside']),
          mcq('Transpiration is loss of water from:', ['Roots', 'Leaves', 'Stems', 'Flowers'], 1, 'medium'),
          mcq('C3 vs C4 plants differ in:', ['Roots', 'CO2 fixation', 'Leaves color', 'Seed shape'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Human Body',
      description: 'Major systems and organs.',
      exercises: [
        makeExercise('Systems', [
          mcq('Number of chambers in human heart:', ['2', '3', '4', '5'], 2),
          mcq('Largest organ:', ['Brain', 'Liver', 'Skin', 'Lung'], 2),
          mcq('Functional unit of kidney:', ['Neuron', 'Nephron', 'Alveolus', 'Villus'], 1),
          mcq('Iron is part of:', ['Insulin', 'Hemoglobin', 'Keratin', 'Albumin'], 1),
          mcq('Bones are connected by:', ['Tendons', 'Ligaments', 'Muscles', 'Cartilage'], 1),
          mcq('Adult humans have ___ teeth:', ['28', '30', '32', '36'], 2),
          fill('Insulin is made by the ___.', ['pancreas']),
          fill('Blood plasma is mostly ___.', ['water']),
          mcq('Blood type O is the universal:', ['Recipient', 'Donor', 'Plasma type', 'Platelet type'], 1, 'medium'),
          mcq('Vitamin D is produced via:', ['Diet only', 'Sunlight on skin', 'Liver only', 'Kidney only'], 1, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'Genetics',
      description: 'Mendelian inheritance, DNA, mutations.',
      exercises: [
        makeExercise('Inheritance', [
          mcq('DNA is a:', ['Single helix', 'Double helix', 'Triple helix', 'Sphere'], 1),
          mcq('A-T pairs by ___ H bonds:', ['1', '2', '3', '4'], 1),
          mcq('G-C pairs by ___ H bonds:', ['1', '2', '3', '4'], 2),
          mcq('Genotype Aa is:', ['Homozygous', 'Heterozygous', 'Hemizygous', 'Recessive'], 1),
          mcq('Mendel’s organism:', ['Pea', 'Mouse', 'Fly', 'Bacteria'], 0),
          mcq('Sex chromosomes in humans:', ['XX or XY', 'AA or BB', 'YY only', 'ZZ or ZW'], 0),
          fill('Central dogma: DNA → ___ → Protein.', ['RNA']),
          fill('Number of human chromosome pairs: ___.', ['23']),
          mcq('Crossing over occurs in:', ['Mitosis', 'Meiosis I', 'Meiosis II', 'Interphase'], 1, 'medium'),
          mcq('Sickle-cell is a ___ mutation.', ['Frameshift', 'Point', 'Deletion', 'Inversion'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Physiology',
      description: 'Respiration, circulation, neural signaling.',
      exercises: [
        makeExercise('Body Systems', [
          mcq('Gas exchange happens in the:', ['Bronchi', 'Trachea', 'Alveoli', 'Pleura'], 2),
          mcq('Pacemaker of the heart:', ['SA node', 'AV node', 'Purkinje', 'Bundle of His'], 0),
          mcq('Neurotransmitter at NMJ:', ['Dopamine', 'Acetylcholine', 'Serotonin', 'GABA'], 1),
          mcq('Nephron’s filter:', ['Glomerulus', 'Loop of Henle', 'Bladder', 'Ureter'], 0),
          mcq('Liver detoxifies:', ['Ammonia', 'Glucose', 'Water', 'Salt'], 0),
          mcq('Insulin lowers:', ['Salt', 'Glucose', 'Water', 'Calcium'], 1),
          fill('Carrier of O2 in blood: ___.', ['hemoglobin']),
          fill('Resting potential is roughly ___ mV.', ['-70']),
          mcq('Action potential is propagated by:', ['K+ alone', 'Na+ then K+', 'Ca2+ only', 'Cl- only'], 1, 'medium'),
          mcq('Bicarbonate buffers:', ['Stomach', 'Blood', 'Bladder', 'Sweat'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Ecology',
      description: 'Populations, communities and ecosystems.',
      exercises: [
        makeExercise('Ecology', [
          mcq('Food chain starts with:', ['Carnivores', 'Producers', 'Decomposers', 'Detritus'], 1),
          mcq('Energy transfer between trophic levels:', ['~1%', '~10%', '~50%', '~90%'], 1),
          mcq('Symbiosis where both benefit:', ['Mutualism', 'Commensalism', 'Parasitism', 'Predation'], 0),
          mcq('Nitrogen in atmosphere mostly:', ['NH3', 'N2', 'NO2', 'NO3'], 1),
          mcq('Greenhouse gas:', ['O2', 'CO2', 'N2', 'Ar'], 1),
          mcq('Apex predator example:', ['Grass', 'Rabbit', 'Wolf', 'Fungus'], 2),
          fill('Biotic + abiotic factors form an ___.', ['ecosystem']),
          fill('Niche includes a species’ role and its ___.', ['habitat']),
          mcq('Carrying capacity is the:', ['Max sustainable population', 'Average', 'Birth rate', 'Death rate'], 0, 'medium'),
          mcq('Eutrophication is caused by:', ['Excess nutrients', 'Salt', 'Drought', 'Frost'], 0, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Molecular Biology',
      description: 'Replication, transcription, translation.',
      exercises: [
        makeExercise('DNA & RNA', [
          mcq('DNA replication is:', ['Semi-conservative', 'Conservative', 'Dispersive', 'Random'], 0),
          mcq('Enzyme that synthesizes RNA:', ['DNA polymerase', 'RNA polymerase', 'Helicase', 'Ligase'], 1),
          mcq('Translation occurs at:', ['Nucleus', 'Mitochondrion', 'Ribosome', 'Lysosome'], 2),
          mcq('Stop codon example:', ['AUG', 'UAA', 'CCC', 'GGG'], 1),
          mcq('Promoter binds:', ['Ribosome', 'RNA polymerase', 'tRNA', 'Lipid'], 1),
          mcq('mRNA in eukaryotes gets a 5\' ___:', ['Tail', 'Cap', 'Loop', 'Box'], 1),
          fill('Okazaki fragments form on the ___ strand.', ['lagging']),
          fill('tRNA carries ___ to the ribosome.', ['amino acids']),
          mcq('Reverse transcriptase makes:', ['DNA from RNA', 'RNA from DNA', 'Protein from RNA', 'DNA from protein'], 0, 'medium'),
          mcq('Splicing removes:', ['Exons', 'Introns', 'UTRs', 'Caps'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Biotechnology',
      description: 'Recombinant DNA, PCR, CRISPR.',
      exercises: [
        makeExercise('Tools & Techniques', [
          mcq('PCR amplifies:', ['Proteins', 'DNA', 'Lipids', 'Carbohydrates'], 1),
          mcq('Restriction enzymes cut:', ['Protein', 'DNA at specific sites', 'RNA randomly', 'Cell walls'], 1),
          mcq('CRISPR-Cas9 is used for:', ['Imaging', 'Genome editing', 'Sequencing only', 'Cooling'], 1),
          mcq('Gel electrophoresis separates by:', ['Color', 'Size & charge', 'Mass only', 'Volume'], 1),
          mcq('Vector for cloning often:', ['Cell', 'Plasmid', 'Tissue', 'Organelle'], 1),
          mcq('Sanger method sequences:', ['Protein', 'RNA only', 'DNA', 'Lipids'], 2),
          fill('Taq polymerase is heat ___.', ['stable']),
          fill('A DNA library stores ___ of an organism.', ['gene fragments']),
          mcq('qPCR quantifies amplification in:', ['Real time', 'Endpoint only', 'Reverse', 'Stop'], 0, 'medium'),
          mcq('Cas9 needs which RNA component?', ['mRNA', 'sgRNA', 'rRNA', 'tRNA'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Systems Biology',
      description: 'Networks, omics, signaling.',
      exercises: [
        makeExercise('Networks & Omics', [
          mcq('Genomics studies:', ['Genes', 'Proteins', 'Lipids', 'Metabolites'], 0),
          mcq('Proteomics studies:', ['Genes', 'Proteins', 'Sugars', 'Lipids'], 1),
          mcq('Transcriptome is the set of:', ['Proteins', 'mRNAs', 'Genes only', 'Metabolites'], 1),
          mcq('Hub gene in a network has:', ['Few connections', 'Many connections', 'No edges', 'Negative weight'], 1),
          mcq('Pathway databases include:', ['KEGG', 'IEEE', 'IMDB', 'NPM'], 0),
          mcq('Microarray measures:', ['Protein folding', 'Gene expression', 'Cell shape', 'Brain waves'], 1),
          fill('A network of nodes and edges is a ___.', ['graph']),
          fill('A cascade like MAPK is a ___ pathway.', ['signaling']),
          mcq('Differential expression compares:', ['Two conditions', 'Just one sample', 'No replicates', 'Random noise'], 0, 'medium'),
          mcq('Single-cell RNA-seq resolves expression at:', ['Tissue level', 'Cell level', 'Organ level', 'Population level'], 1, 'medium'),
        ]),
      ],
    },
  ],
};

// ===========================================================================
// COMPUTER SCIENCE
// ===========================================================================
const CS: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'Computer Fundamentals',
      description: 'Hardware, software and number systems.',
      exercises: [
        makeExercise('Basics', [
          mcq('CPU stands for:', ['Central Processing Unit', 'Computer Power Unit', 'Central Program Unit', 'Core Processing Utility'], 0),
          mcq('RAM is:', ['Permanent', 'Volatile', 'Optical', 'Magnetic only'], 1),
          mcq('Smallest unit of data:', ['Bit', 'Byte', 'Nibble', 'KB'], 0),
          mcq('1 byte =', ['4 bits', '8 bits', '16 bits', '32 bits'], 1),
          mcq('Binary base:', ['2', '8', '10', '16'], 0),
          mcq('Hexadecimal base:', ['8', '10', '12', '16'], 3),
          fill('Output device example: ___.', ['monitor']),
          fill('Input device example: ___.', ['keyboard']),
          mcq('Decimal 10 in binary:', ['1000', '1010', '1100', '1110'], 1, 'medium'),
          mcq('1 KB ≈', ['100 B', '1024 B', '10000 B', '1 MB'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Intro to Programming',
      description: 'Variables, conditionals, loops.',
      exercises: [
        makeExercise('Programming Basics', [
          mcq('A loop that runs a known number of times:', ['for', 'while', 'do-while', 'switch'], 0),
          mcq('Comparison operator for equality (most languages):', ['=', '==', '!=', '=>'], 1),
          mcq('Variable holds a:', ['Type only', 'Value', 'Function', 'Loop'], 1),
          mcq('Conditional statement:', ['if', 'for', 'while', 'def'], 0),
          mcq('Compiler converts source to:', ['Source', 'Machine code', 'HTML', 'PDF'], 1),
          mcq('Comment in Python begins with:', ['//', '#', '/*', '<!--'], 1),
          fill('Boolean values are true and ___.', ['false']),
          fill('A function is reusable block of ___.', ['code']),
          mcq('Result of 10 % 3 in most languages:', ['0', '1', '2', '3'], 1, 'medium'),
          mcq('Indexing of a list often starts at:', ['-1', '0', '1', '2'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'The Internet',
      description: 'Web basics, browsers, safety.',
      exercises: [
        makeExercise('Web Basics', [
          mcq('HTTP stands for:', ['Hyper Text Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Tool Transfer Process', 'Hyper Transfer Text Page'], 0),
          mcq('HTML is used for:', ['Styling only', 'Page structure', 'Logic', 'Storage'], 1),
          mcq('CSS is used for:', ['Logic', 'Storage', 'Styling', 'DB'], 2),
          mcq('JS runs in:', ['Servers only', 'Browsers (and servers)', 'DBs only', 'Files'], 1),
          mcq('A web address is a:', ['IP only', 'URL', 'DNS only', 'Port'], 1),
          mcq('A safe password should be:', ['Short', 'Reused', 'Long & unique', 'Your name'], 2),
          fill('HTTPS adds ___ to HTTP.', ['security']),
          fill('Browser fetches pages over the ___.', ['internet']),
          mcq('A cookie typically stores:', ['Software', 'Small text data', 'Images', 'Videos'], 1, 'medium'),
          mcq('DNS converts names to:', ['Mail', 'IP addresses', 'Files', 'Ports'], 1, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'Data Structures',
      description: 'Arrays, linked lists, trees, hash tables.',
      exercises: [
        makeExercise('Linear Structures', [
          mcq('LIFO order:', ['Queue', 'Stack', 'Heap', 'Tree'], 1),
          mcq('FIFO order:', ['Stack', 'Queue', 'Tree', 'Graph'], 1),
          mcq('Array random access is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 0),
          mcq('Singly linked list access at index k:', ['O(1)', 'O(log n)', 'O(k)', 'O(n²)'], 2),
          mcq('Hash table average lookup:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 0),
          mcq('Stack push then pop returns:', ['First inserted', 'Last inserted', 'Random', 'None'], 1),
          fill('A balanced BST search is O(___).', ['log n']),
          fill('A graph with n nodes and n-1 edges and connected is a ___.', ['tree']),
          mcq('Best case BFS on a graph (V vertices, E edges):', ['O(V)', 'O(V+E)', 'O(VE)', 'O(V²)'], 1, 'medium'),
          mcq('Hash collisions can be resolved by:', ['Open addressing', 'Removing keys', 'Sorting', 'Indexing'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'OOP & Programming',
      description: 'Classes, inheritance, polymorphism.',
      exercises: [
        makeExercise('OOP', [
          mcq('A class is a ___ for objects:', ['Copy', 'Blueprint', 'Variable', 'Module'], 1),
          mcq('Inheritance allows:', ['Code reuse', 'Slow code', 'No reuse', 'Random behavior'], 0),
          mcq('Encapsulation bundles data and:', ['Other objects', 'Methods', 'Files', 'Threads'], 1),
          mcq('Polymorphism enables:', ['One interface, many forms', 'No reuse', 'Static only', 'Compile only'], 0),
          mcq('Abstraction hides:', ['Logic only', 'Implementation details', 'All code', 'No data'], 1),
          mcq('Method overriding happens in:', ['Same class', 'Child class', 'Static block', 'Constructor only'], 1),
          fill('A constructor initializes a new ___.', ['object']),
          fill('Public, private and ___ are common access modifiers.', ['protected']),
          mcq('Composition prefers:', ['has-a', 'is-a', 'no-relation', 'has-many of self'], 0, 'medium'),
          mcq('Liskov substitution is part of:', ['DRY', 'SOLID', 'KISS', 'YAGNI'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Databases',
      description: 'Relational model, SQL, normalization.',
      exercises: [
        makeExercise('SQL Basics', [
          mcq('SQL stands for:', ['Structured Query Language', 'Sequential Question List', 'Simple Query Library', 'Standard Quoted Language'], 0),
          mcq('Primary key must be:', ['NULL', 'Unique & not null', 'Foreign', 'Repeating'], 1),
          mcq('JOIN combines:', ['Files', 'Tables', 'Rows of one table', 'Indexes'], 1),
          mcq('SELECT * FROM t means:', ['All cols', 'All rows of one col', 'No rows', 'Random'], 0),
          mcq('GROUP BY is used for:', ['Filtering rows', 'Aggregations', 'Sorting only', 'Joins'], 1),
          mcq('A foreign key references a:', ['Index', 'Primary key elsewhere', 'Trigger', 'View'], 1),
          fill('1NF requires atomic ___.', ['values']),
          fill('Index improves ___ speed at cost of writes.', ['read']),
          mcq('Transactions guarantee:', ['ACID', 'CRUD', 'BASE', 'OOP'], 0, 'medium'),
          mcq('A LEFT JOIN keeps:', ['Right rows only', 'Left rows always', 'No rows', 'Only matches'], 1, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Algorithms',
      description: 'Design and analysis of algorithms.',
      exercises: [
        makeExercise('Sorting & Searching', [
          mcq('QuickSort average:', ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 1),
          mcq('MergeSort worst:', ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'], 1),
          mcq('Binary search needs:', ['Hash', 'Sorted array', 'Tree only', 'Stream'], 1),
          mcq('Dijkstra finds:', ['MST', 'Shortest path', 'Topo sort', 'TSP'], 1),
          mcq('Kruskal builds:', ['Path', 'MST', 'Cycle', 'DFS tree'], 1),
          mcq('Dynamic programming exploits:', ['Greedy', 'Overlapping subproblems', 'Randomness', 'I/O'], 1),
          fill('Big-O of binary search: O(___).', ['log n']),
          fill('Greedy works when problem has ___ substructure.', ['optimal']),
          mcq('NP-complete problems are:', ['In P', 'Hardest in NP', 'Trivial', 'Random'], 1, 'medium'),
          mcq('Bellman-Ford handles:', ['Negative weights', 'Only positive', 'No weights', 'Cycles only'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Operating Systems',
      description: 'Processes, scheduling, memory.',
      exercises: [
        makeExercise('Concurrency & Memory', [
          mcq('Deadlock requires how many conditions?', ['1', '2', '3', '4'], 3),
          mcq('A page fault is handled by:', ['User', 'OS', 'Disk firmware', 'Compiler'], 1),
          mcq('Round-robin scheduling uses:', ['Priority only', 'Time quanta', 'I/O bursts', 'Random'], 1),
          mcq('Mutex provides:', ['Mutual exclusion', 'Speed', 'Storage', 'Logging'], 0),
          mcq('Virtual memory extends RAM with:', ['CPU cache', 'Disk', 'Registers', 'GPU'], 1),
          mcq('Producer-consumer is solved by:', ['Semaphores', 'Pointers', 'Hash tables', 'Trees'], 0),
          fill('A thread shares memory with its ___.', ['process']),
          fill('TLB caches translations between virtual and ___ addresses.', ['physical']),
          mcq('Banker’s algorithm is used for:', ['Scheduling', 'Deadlock avoidance', 'Paging', 'Caching'], 1, 'medium'),
          mcq('FIFO page replacement can suffer from:', ['Belady’s anomaly', 'Thrashing only', 'No issues', 'Stack overflow'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Networks & Theory',
      description: 'TCP/IP, automata, computability.',
      exercises: [
        makeExercise('Networks', [
          mcq('TCP is:', ['Connectionless', 'Reliable, connection-oriented', 'Unreliable', 'Broadcast'], 1),
          mcq('UDP is:', ['Reliable', 'Connectionless', 'Stateful', 'Encrypted by default'], 1),
          mcq('HTTP default port:', ['21', '22', '80', '443'], 2),
          mcq('HTTPS default port:', ['80', '443', '8080', '21'], 1),
          mcq('IPv4 address bits:', ['16', '24', '32', '64'], 2),
          mcq('DNS resolves:', ['IP to name', 'Name to IP', 'Mac to IP', 'Port to mac'], 1),
          fill('OSI model has ___ layers.', ['7']),
          fill('A subnet mask 255.255.255.0 is /___ .', ['24']),
          mcq('TCP three-way handshake: SYN, SYN-ACK, ?', ['ACK', 'RST', 'FIN', 'PSH'], 0, 'medium'),
          mcq('NAT maps:', ['Public ↔ private addresses', 'IPs to MACs', 'Names to IPs', 'Ports to ports only'], 0, 'medium'),
        ]),
        makeExercise('Theory', [
          mcq('A DFA is:', ['Deterministic FA', 'Distributed FA', 'Dynamic FA', 'Direct FA'], 0),
          mcq('Regular languages closed under:', ['Union', 'Context-free only', 'Recursive', 'None'], 0),
          mcq('CFG generates:', ['Regular', 'Context-free', 'Recursively enumerable', 'Random'], 1),
          mcq('Halting problem is:', ['Decidable', 'Undecidable', 'Polynomial', 'Trivial'], 1),
          mcq('Turing machines model:', ['Hardware', 'Computation', 'Networks', 'Compilers only'], 1),
          mcq('P ⊆ NP is:', ['False', 'True', 'Unknown if equal', 'Disproven'], 1),
          fill('Pumping lemma proves a language is not ___.', ['regular']),
          fill('NP stands for nondeterministic ___ time.', ['polynomial']),
          mcq('SAT is the canonical:', ['P-complete', 'NP-complete', 'EXP-complete', 'L-complete'], 1, 'medium'),
          mcq('Closure of regular under intersection:', ['No', 'Yes', 'Sometimes', 'Unknown'], 1, 'medium'),
        ]),
      ],
    },
  ],
};

// ===========================================================================
// Helper exports for per-subject modules
// ===========================================================================
export { mcq, fill, match, reorder, makeExercise };

// ===========================================================================
// Dispatcher
// ===========================================================================
import { DSA } from './seed-data/dsa';
import { PYTHON } from './seed-data/python';
import { CPP } from './seed-data/cpp';
import { PHYSICS_EXTRA } from './seed-data/physics-extra';
import { CHEMISTRY_EXTRA } from './seed-data/chemistry-extra';
import { MATHEMATICS_EXTRA } from './seed-data/mathematics-extra';
import { BIOLOGY_EXTRA } from './seed-data/biology-extra';
import { CS_EXTRA } from './seed-data/cs-extra';

export function buildSubjectBank(name: string, level: 1 | 2 | 3): SeedUnit[] {
  switch (name) {
    case 'Physics':         return [...PHYSICS[level], ...PHYSICS_EXTRA[level]];
    case 'Chemistry':       return [...CHEMISTRY[level], ...CHEMISTRY_EXTRA[level]];
    case 'Mathematics':     return [...MATHEMATICS[level], ...MATHEMATICS_EXTRA[level]];
    case 'Biology':         return [...BIOLOGY[level], ...BIOLOGY_EXTRA[level]];
    case 'Computer Science':return [...CS[level], ...CS_EXTRA[level]];
    case 'DSA':             return DSA[level];
    case 'Python':          return PYTHON[level];
    case 'C++':             return CPP[level];
    default:
      throw new Error(`No bank for subject ${name}`);
  }
}
