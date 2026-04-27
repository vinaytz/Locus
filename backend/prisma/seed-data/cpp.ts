/**
 * C++ question bank.
 * Levels: 1 = beginner, 2 = intermediate (OOP/STL), 3 = advanced (modern C++).
 */

import type { SeedUnit } from '../seed-bank';
import { mcq, fill, match, makeExercise } from '../seed-bank';

export const CPP: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'Syntax & I/O',
      description: 'Compilation model, headers, std::cout / std::cin.',
      exercises: [
        makeExercise('Hello, C++', [
          mcq('Entry point of a C++ program:', ['start()', 'main()', 'init()', 'begin()'], 1),
          mcq('Header for cout:', ['<stdio.h>', '<iostream>', '<string>', '<cstdio>'], 1),
          mcq('Standard namespace:', ['sys', 'std', 'cpp', 'system'], 1),
          mcq('Statement terminator:', [':', ';', '.', 'newline'], 1),
          mcq('Single-line comment:', ['#', '//', '--', '%'], 1),
          mcq('Compile typical command:', ['gcc a.c', 'g++ a.cpp', 'cpp a', 'make a.cpp'], 1),
          fill('C++ is a ___ typed language.', ['statically']),
          fill('A program file must include exactly one ___ function.', ['main']),
          mcq('Result of `cout << 5 << \" \" << 6;`:', ['56', '5 6', '5,6', '11'], 1, 'medium'),
          mcq('std::endl differs from \"\\n\" because it also:', ['Adds tab', 'Flushes the stream', 'Crashes', 'Does nothing'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Variables & Types',
      description: 'Primitive types, sizes, casts, const.',
      exercises: [
        makeExercise('Types', [
          mcq('Typical size of int (most platforms):', ['2 bytes', '4 bytes', '8 bytes', '1 byte'], 1),
          mcq('Floating-point types:', ['int / long', 'float / double', 'char / bool', 'string / int'], 1),
          mcq('const variable means:', ['Compile error', 'Cannot be reassigned', 'Globally shared', 'Random'], 1),
          mcq('auto x = 3.14; deduces:', ['int', 'double', 'float', 'long'], 1),
          mcq('Boolean type:', ['boolean', 'bool', 'Bool', 'flag'], 1),
          mcq('Character type:', ['chr', 'char', 'character', 'byte'], 1),
          fill('Use ___ to print to standard output.', ['cout']),
          fill('Read input with ___.', ['cin']),
          mcq('static_cast<int>(3.7) is:', ['3', '4', '3.7', 'Error'], 0, 'medium'),
          mcq('size_t is typically:', ['Signed', 'Unsigned integer for sizes', 'Floating-point', 'Pointer'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Control Flow & Functions',
      description: 'if/else, loops, function basics.',
      exercises: [
        makeExercise('Control & Functions', [
          mcq('Loop that runs at least once:', ['for', 'while', 'do-while', 'foreach'], 2),
          mcq('Range-based for needs:', ['Pointer', 'Container with begin/end', 'Macros', 'Globals'], 1),
          mcq('Pass by reference:', ['void f(int x)', 'void f(int& x)', 'void f(int* x) only', 'void f(const int)'], 1),
          mcq('Default arg in function:', ['void f(int x=0)', 'void f(int x:0)', 'void f(int x default 0)', 'void f(int x ?? 0)'], 0),
          mcq('Function overloading allows:', ['Same name, different signatures', 'Same signature, different return', 'Templates only', 'Globals only'], 0),
          mcq('inline keyword hints:', ['Threading', 'Compiler may inline', 'Recursion', 'Static'], 1),
          fill('Pass-by-value copies the ___.', ['argument']),
          fill('A function with no return type uses ___.', ['void']),
          mcq('Const reference avoids copy and forbids:', ['Reading', 'Writing', 'Both', 'Neither'], 1, 'medium'),
          mcq('Recursion base case must:', ['Recurse', 'Return without recursing', 'Throw', 'Loop'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Arrays & Pointers',
      description: 'C-style arrays, pointers, references.',
      exercises: [
        makeExercise('Pointers', [
          mcq('Pointer declaration:', ['int p*;', 'int *p;', 'int& p;', 'pointer<int> p;'], 1),
          mcq('Address-of operator:', ['*', '&', '->', '@'], 1),
          mcq('Dereference operator:', ['*', '&', '->', '$'], 0),
          mcq('Null pointer (modern):', ['NULL', 'nullptr', '0', 'void'], 1),
          mcq('Array decays to:', ['Reference', 'Pointer to first element', 'Vector', 'Span'], 1),
          mcq('Reference must be:', ['Optionally bound', 'Bound at creation', 'Re-bindable', 'Heap-allocated'], 1),
          fill('sizeof yields a ___-time constant for arrays.', ['compile']),
          fill('new allocates on the ___.', ['heap']),
          mcq('delete[] is required for memory allocated with:', ['new T', 'new T[n]', 'malloc', 'stack'], 1, 'medium'),
          mcq('Reference vs pointer: a reference cannot:', ['Be reassigned', 'Be const', 'Refer to objects', 'Exist'], 0, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'OOP Basics',
      description: 'Classes, members, constructors and access.',
      exercises: [
        makeExercise('Classes', [
          mcq('Default access in class:', ['public', 'private', 'protected', 'internal'], 1),
          mcq('Default access in struct:', ['public', 'private', 'protected', 'package'], 0),
          mcq('Constructor with no args:', ['Copy constructor', 'Default constructor', 'Move constructor', 'Destructor'], 1),
          mcq('~ClassName() is:', ['Constructor', 'Destructor', 'Operator', 'Friend'], 1),
          mcq('Member init list precedes:', ['Body', 'Class', 'Header', 'Destructor'], 0),
          mcq('this is:', ['Pointer to current object', 'Reference to class', 'Macro', 'Reserved future'], 0),
          fill('Encapsulation hides ___ details.', ['implementation']),
          fill('A class can declare a ___ to grant access.', ['friend']),
          mcq('Copy constructor signature:', ['T(T)', 'T(const T&)', 'T(T&&)', 'T(T*)'], 1, 'medium'),
          mcq('Rule of three concerns:', ['Loops', 'Copy ctor / copy assign / dtor', 'Templates', 'Threads'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Inheritance & Polymorphism',
      description: 'Virtual functions, vtables and overriding.',
      exercises: [
        makeExercise('Polymorphism', [
          mcq('Virtual function dispatch is:', ['Static', 'Dynamic', 'Compile-time', 'Hashed'], 1),
          mcq('Mark override safety with:', ['final', 'override', 'sealed', 'virtualOnly'], 1),
          mcq('Abstract method declared with:', ['= delete', '= 0', '= abstract', 'abstract'], 1),
          mcq('Without virtual destructor in base, deleting derived via base ptr is:', ['Safe', 'Undefined behaviour', 'Same', 'Forbidden by compiler'], 1),
          mcq('Multiple inheritance is:', ['Forbidden', 'Allowed', 'Only single', 'Only with interfaces'], 1),
          mcq('Diamond problem solved with:', ['final', 'virtual inheritance', 'private', 'mutex'], 1),
          fill('A pure virtual class is ___.', ['abstract']),
          fill('Slicing happens when assigning derived to base by ___.', ['value']),
          mcq('dynamic_cast on a non-polymorphic class is:', ['Allowed', 'Compile error', 'Undefined', 'Same as static_cast'], 1, 'medium'),
          mcq('Final class cannot be:', ['Constructed', 'Inherited from', 'Used', 'Linked'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Templates & STL',
      description: 'Generic programming and standard containers.',
      exercises: [
        makeExercise('STL Containers', [
          mcq('Dynamic array:', ['array', 'vector', 'list', 'deque'], 1),
          mcq('Doubly-linked list:', ['list', 'vector', 'forward_list', 'array'], 0),
          mcq('Hash map:', ['map', 'unordered_map', 'set', 'multimap'], 1),
          mcq('Sorted map (RB tree):', ['unordered_map', 'map', 'list', 'array'], 1),
          mcq('FIFO container adapter:', ['stack', 'queue', 'priority_queue', 'list'], 1),
          mcq('LIFO container adapter:', ['queue', 'stack', 'deque', 'vector'], 1),
          fill('std::vector grows by reallocating with amortised ___.', ['O(1)']),
          fill('std::array has size known at ___ time.', ['compile']),
          mcq('Average lookup of unordered_map:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 0, 'medium'),
          mcq('Iterator invalidation on vector push_back may occur on:', ['Every call', 'Reallocation', 'Never', 'Only erase'], 1, 'medium'),
        ]),
        makeExercise('Templates', [
          mcq('Template function header:', ['template<typename T>', 'generic<T>', 'using T', 'def<T>'], 0),
          mcq('Template specialisation lets you:', ['Disable templates', 'Customise for a specific type', 'Force inheritance', 'Use macros'], 1),
          mcq('SFINAE means:', ['Static fail not error', 'Substitution Failure Is Not An Error', 'Stack Frame Inline Auto Expand', 'Standard Function Init'], 1),
          mcq('Variadic templates use:', ['template<T...>', 'template<typename... Ts>', 'template<list T>', 'template<va_list>'], 1),
          mcq('Type deduction for `auto x = {1,2,3};`:', ['vector<int>', 'std::initializer_list<int>', 'array<int,3>', 'int[3]'], 1),
          mcq('Concepts (C++20) constrain:', ['Macros', 'Templates', 'Pointers', 'Threads'], 1),
          fill('decltype(expr) yields the ___ of expr.', ['type']),
          fill('Templates are instantiated at ___ time.', ['compile']),
          mcq('Function template overloading vs class template specialisation: function templates support:', ['Partial specialisation', 'Only full specialisation (use overloads)', 'Neither', 'Both unconditionally'], 1, 'medium'),
          mcq('std::enable_if is used for:', ['Threading', 'Conditional template instantiation', 'I/O', 'Hashing'], 1, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Modern Memory Model',
      description: 'RAII, smart pointers, move semantics.',
      exercises: [
        makeExercise('Smart Pointers & RAII', [
          mcq('RAII ties resource lifetime to:', ['Heap', 'Object lifetime', 'Threads', 'Files'], 1),
          mcq('Owning unique resource:', ['shared_ptr', 'unique_ptr', 'weak_ptr', 'auto_ptr'], 1),
          mcq('Reference-counted ownership:', ['shared_ptr', 'unique_ptr', 'weak_ptr', 'raw ptr'], 0),
          mcq('weak_ptr is used to break:', ['Recursion', 'Reference cycles', 'Threads', 'Inheritance'], 1),
          mcq('std::move converts to:', ['lvalue', 'rvalue (xvalue)', 'reference', 'pointer'], 1),
          mcq('Move constructor signature:', ['T(T)', 'T(const T&)', 'T(T&&)', 'T(T*)'], 2),
          fill('Rule of five adds move ctor and move ___.', ['assignment']),
          fill('make_unique avoids manual ___.', ['new']),
          mcq('After std::move(x), x is:', ['Destroyed', 'Valid but unspecified', 'Same as before', 'nullptr'], 1, 'medium'),
          mcq('shared_ptr control block holds:', ['Strong + weak counts', 'Hash', 'Mutex only', 'Type info only'], 0, 'medium'),
        ]),
      ],
    },
    {
      title: 'Concurrency',
      description: 'Threads, mutexes, atomics, async.',
      exercises: [
        makeExercise('Threads', [
          mcq('Standard thread type:', ['std::thread', 'std::task', 'std::pthread', 'std::process'], 0),
          mcq('Mutual exclusion lock:', ['std::lock', 'std::mutex', 'std::sync', 'std::guard'], 1),
          mcq('RAII mutex helper:', ['lock_guard', 'mutex_lock', 'sync', 'auto_lock'], 0),
          mcq('Atomic types live in:', ['<atomic>', '<thread>', '<mutex>', '<future>'], 0),
          mcq('std::async returns a:', ['thread', 'future', 'promise', 'mutex'], 1),
          mcq('A data race is:', ['Two reads', 'Concurrent unsynchronised read & write', 'Single thread bug', 'Compile error'], 1),
          fill('std::condition_variable needs an associated ___.', ['mutex']),
          fill('memory_order_relaxed gives no ___ guarantees.', ['ordering']),
          mcq('std::jthread differs from std::thread by:', ['Faster', 'Auto-joins on destruction & supports stop_token', 'Detached', 'Single core'], 1, 'medium'),
          mcq('Spurious wakeup is handled by:', ['Single if', 'A loop that re-checks the predicate', 'Ignoring it', 'Locking twice'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Modern C++ Features',
      description: 'Lambdas, ranges, constexpr, modules.',
      exercises: [
        makeExercise('C++17/20', [
          mcq('Lambda expression syntax starts with:', ['[]', '<>', '{}', '()'], 0),
          mcq('Lambda capture by value:', ['[&]', '[=]', '[*]', '[+]'], 1),
          mcq('constexpr function is evaluated at:', ['Runtime only', 'Compile time when possible', 'Link time', 'Never'], 1),
          mcq('Structured bindings (C++17) destructure:', ['Pointers', 'Tuples / pairs / structs', 'Functions', 'Macros'], 1),
          mcq('std::optional represents:', ['Definitely has value', 'Maybe-has-value', 'Reference', 'Pointer'], 1),
          mcq('std::variant is a:', ['Type-safe union', 'Tuple', 'List', 'Pointer'], 0),
          fill('Ranges (C++20) compose with the ___ operator.', ['|']),
          fill('Modules replace many uses of header ___.', ['files']),
          mcq('consteval enforces evaluation at:', ['Runtime', 'Compile time mandatorily', 'Both', 'Never'], 1, 'medium'),
          mcq('constexpr if is used to:', ['Branch at runtime', 'Conditionally compile template branches', 'Replace if', 'Replace switch'], 1, 'medium'),
        ]),
        makeExercise('Performance & Idioms', [
          mcq('Pass large object as:', ['By value', 'const T&', 'T**', 'T&& always'], 1),
          mcq('Return value optimisation (RVO) avoids:', ['Allocation', 'Unnecessary copies/moves of return values', 'Exceptions', 'Threads'], 1),
          mcq('Avoid premature optimisation by first:', ['Inline assembly', 'Profiling', 'Manual SIMD', 'Removing tests'], 1),
          mcq('Branch prediction misses cost:', ['Nothing', 'Many CPU cycles (pipeline flush)', 'Memory only', 'Disk I/O'], 1),
          mcq('Cache-friendly layout prefers:', ['Linked nodes scattered', 'Contiguous arrays', 'Random allocations', 'Pointer chasing'], 1),
          mcq('std::string Small String Optimisation stores small strings:', ['On heap', 'Inline in the object', 'Mmap', 'Compressed'], 1),
          fill('noexcept lets compiler avoid extra ___ handling.', ['exception']),
          fill('std::move on a const object becomes a ___.', ['copy']),
          mcq('reserve() on a vector:', ['Resizes', 'Reserves capacity to avoid reallocations', 'Shrinks', 'Sorts'], 1, 'medium'),
          mcq('Empty-base optimisation reduces size when:', ['No base', 'Base is empty', 'Base is virtual', 'Always'], 1, 'medium'),
        ]),
      ],
    },
  ],
};
