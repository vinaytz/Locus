/**
 * Python question bank.
 * Levels: 1 = beginner, 2 = intermediate, 3 = advanced.
 */

import type { SeedUnit } from '../seed-bank';
import { mcq, fill, match, makeExercise } from '../seed-bank';

export const PYTHON: Record<1 | 2 | 3, SeedUnit[]> = {
  1: [
    {
      title: 'Syntax & Variables',
      description: 'Indentation, types, naming and printing.',
      exercises: [
        makeExercise('Hello, Python', [
          mcq('Print syntax in Python 3:', ['print "x"', 'print(x)', 'echo x', 'puts x'], 1),
          mcq('Comment in Python starts with:', ['//', '#', '--', '/*'], 1),
          mcq('Python is:', ['Compiled to native machine code only', 'Dynamically typed', 'Statically typed', 'Strongly OOP only'], 1),
          mcq('File extension:', ['.pyx', '.py', '.pn', '.pl'], 1),
          mcq('Boolean values:', ['true / false', 'True / False', 'TRUE / FALSE', '1 / 0'], 1),
          mcq('None is similar to:', ['undefined', 'null', 'void', 'nil-pointer only'], 1),
          fill('Variables are created on first ___.', ['assignment']),
          fill('Indentation matters; use spaces or ___.', ['tabs']),
          mcq('Type of 3.14:', ['int', 'float', 'str', 'bool'], 1, 'medium'),
          mcq('Result of 7 // 2:', ['3.5', '3', '4', '7'], 1, 'medium'),
        ]),
        makeExercise('Strings & Numbers', [
          mcq('len(\"hello\"):', ['4', '5', '6', 'error'], 1),
          mcq('\"a\" + \"b\":', ['ab', 'a b', 'b a', 'error'], 0),
          mcq('\"ha\" * 3:', ['hahaha', 'ha3', '3ha', 'error'], 0),
          mcq('Index of first char:', ['1', '0', '-1', 'undefined'], 1),
          mcq('\"abc\"[-1]:', ['a', 'b', 'c', 'error'], 2),
          mcq('Type of \"42\":', ['int', 'str', 'float', 'list'], 1),
          fill('Convert string to int with ___().', ['int']),
          fill('f-strings start with the letter ___.', ['f']),
          mcq('Result of 2 ** 10:', ['20', '1024', '512', '100'], 1, 'medium'),
          mcq('Result of int(\"3.5\"):', ['3', '4', 'ValueError', '3.5'], 2, 'medium'),
        ]),
      ],
    },
    {
      title: 'Control Flow',
      description: 'if/else, while, for and range.',
      exercises: [
        makeExercise('Conditionals & Loops', [
          mcq('if-elif-else uses keyword:', ['else if', 'elif', 'elsif', 'switch'], 1),
          mcq('Logical and:', ['&&', 'and', 'AND', '&'], 1),
          mcq('Logical or:', ['||', 'or', 'OR', '|'], 1),
          mcq('range(5) yields:', ['1..5', '0..4', '0..5', '1..4'], 1),
          mcq('Number of iterations of `for i in range(3)`:', ['2', '3', '4', 'infinite'], 1),
          mcq('break exits:', ['Function', 'Loop', 'Module', 'Program'], 1),
          fill('continue jumps to next loop ___.', ['iteration']),
          fill('A while loop runs while condition is ___.', ['true']),
          mcq('range(2, 10, 3) gives:', ['2,5,8', '2,4,6,8', '3,6,9', '2,3,4,...,10'], 0, 'medium'),
          mcq('Else after for runs when:', ['Loop body never runs', 'Loop completes without break', 'Loop breaks', 'Always'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Functions',
      description: 'Defining functions, arguments, return values.',
      exercises: [
        makeExercise('Functions Basics', [
          mcq('Define a function with:', ['function', 'def', 'fun', 'fn'], 1),
          mcq('Return a value with:', ['yield', 'return', 'send', 'output'], 1),
          mcq('Default arg in `def f(x=5)`:', ['Required', 'Optional with default 5', 'Forbidden', 'Type-only'], 1),
          mcq('*args collects:', ['Keyword args', 'Positional args', 'Files', 'Globals'], 1),
          mcq('**kwargs collects:', ['Positional args', 'Keyword args', 'Errors', 'Files'], 1),
          mcq('A function without explicit return returns:', ['0', 'None', 'Empty string', 'Last value'], 1),
          fill('Functions are first-class ___ in Python.', ['objects']),
          fill('Lambda functions are ___ functions.', ['anonymous']),
          mcq('Mutable default arg pitfall: list as default keeps changes:', ['False', 'True (shared)', 'Sometimes', 'Only ints'], 1, 'medium'),
          mcq('Recursion limit default:', ['100', '1000', '10000', 'Infinite'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Lists, Tuples, Dicts',
      description: 'Built-in collections and basic operations.',
      exercises: [
        makeExercise('Collections', [
          mcq('List literal:', ['(1,2,3)', '[1,2,3]', '{1,2,3}', '<1,2,3>'], 1),
          mcq('Tuple literal:', ['[1,2,3]', '(1,2,3)', '{1,2,3}', '<1,2,3>'], 1),
          mcq('Dict literal:', ['[k:v]', '(k,v)', '{k:v}', '<k=v>'], 2),
          mcq('Add to list:', ['list.add()', 'list.append()', 'list.push()', 'list.insertEnd()'], 1),
          mcq('Tuples are:', ['Mutable', 'Immutable', 'Sometimes mutable', 'Always empty'], 1),
          mcq('Dict lookup average:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 0),
          fill('A set has only ___ elements.', ['unique']),
          fill('Lists support negative ___.', ['indexing']),
          mcq('Result of [1,2,3] + [4]:', ['[5,2,3]', '[1,2,3,4]', '[1,6,3]', 'Error'], 1, 'medium'),
          mcq('Iterate dict items with:', ['d.list()', 'd.items()', 'd.entries()', 'd.pairs()'], 1, 'medium'),
        ]),
      ],
    },
  ],

  2: [
    {
      title: 'Comprehensions & Iterators',
      description: 'List/dict/set comprehensions and generators.',
      exercises: [
        makeExercise('Comprehensions', [
          mcq('List comprehension produces a:', ['Generator', 'List', 'Dict', 'Tuple'], 1),
          mcq('Generator expression uses:', ['[]', '()', '{}', '<>'], 1),
          mcq('Set comprehension:', ['[x for x in s]', '{x for x in s}', '(x for x in s)', '<x for x in s>'], 1),
          mcq('Dict comprehension form:', ['{k:v for ...}', '{k,v for ...}', '[k:v for ...]', '(k:v for ...)'], 0),
          mcq('Generator vs list memory:', ['Same', 'Generator is lazy/streaming', 'Generator stores everything', 'List is lazy'], 1),
          mcq('next() advances a:', ['List', 'Generator/iterator', 'Set', 'Dict'], 1),
          fill('A generator function uses the ___ keyword.', ['yield']),
          fill('itertools.chain joins multiple ___ lazily.', ['iterables']),
          mcq('[x*x for x in range(5) if x%2==0] is:', ['[0,4,16]', '[1,9]', '[0,1,4,9,16]', '[0,2,4]'], 0, 'medium'),
          mcq('zip(a,b) yields pairs of:', ['Lists', 'Tuples', 'Dicts', 'Sets'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'OOP',
      description: 'Classes, inheritance, dunder methods.',
      exercises: [
        makeExercise('Classes', [
          mcq('Define a class with:', ['class', 'struct', 'object', 'def'], 0),
          mcq('First param of an instance method is conventionally:', ['this', 'self', 'cls', 'me'], 1),
          mcq('Class method first param:', ['this', 'self', 'cls', 'klass'], 2),
          mcq('Static methods take:', ['self', 'cls', 'No special first arg', 'Both'], 2),
          mcq('Constructor name:', ['__new__', '__init__', '__construct__', 'init'], 1),
          mcq('All Python classes inherit from:', ['Base', 'Object', 'object', 'class'], 2),
          fill('Inheritance: `class Dog(___):`.', ['Animal']),
          fill('Operator overloading uses ___ methods.', ['dunder']),
          mcq('__str__ vs __repr__: __repr__ is intended to be:', ['User-friendly', 'Unambiguous/dev-friendly', 'Empty', 'Same as str()'], 1, 'medium'),
          mcq('Calling super().__init__() does:', ['Nothing', 'Calls parent constructor', 'Crashes', 'Returns self'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Exceptions & Files',
      description: 'try/except, with statements, file I/O.',
      exercises: [
        makeExercise('Errors & I/O', [
          mcq('Catch exception with:', ['catch', 'except', 'rescue', 'on'], 1),
          mcq('Always-run cleanup:', ['always', 'finally', 'ensure', 'close'], 1),
          mcq('Raise exception:', ['throw', 'raise', 'panic', 'error'], 1),
          mcq('with-statement is for:', ['Loops', 'Context managers', 'Closures', 'Threads'], 1),
          mcq('Open file for read:', ['open(p, \"r\")', 'open(p, \"w\")', 'read(p)', 'file(p)'], 0),
          mcq('Newline-stripped file iter:', ['for line in f', 'f.lines()', 'f.iter()', 'next(f)'], 0),
          fill('Custom exception extends ___.', ['Exception']),
          fill('Re-raise without args using bare ___.', ['raise']),
          mcq('FileNotFoundError is a subclass of:', ['Exception', 'OSError', 'ValueError', 'TypeError'], 1, 'medium'),
          mcq('Multiple exception types caught with:', ['except A | B', 'except (A, B)', 'except A,B', 'except A B'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Modules & Packages',
      description: 'Imports, virtualenv, pip and the standard library.',
      exercises: [
        makeExercise('Imports & Stdlib', [
          mcq('Import math:', ['use math', 'import math', 'include math', 'require math'], 1),
          mcq('Import a specific name:', ['from m import x', 'import m.x', 'use m.x', 'import x of m'], 0),
          mcq('Package installer:', ['npm', 'pip', 'gem', 'composer'], 1),
          mcq('Isolated environment:', ['conda only', 'venv', 'docker only', 'jail'], 1),
          mcq('__name__ == \"__main__\" tests:', ['Module imported', 'Script run directly', 'Inside class', 'Generator'], 1),
          mcq('os.path.join is preferred because:', ['It uses /', 'Cross-platform separator', 'Faster', 'Optional only'], 1),
          fill('JSON parsing in stdlib uses the ___ module.', ['json']),
          fill('Hashing is in the ___ module.', ['hashlib']),
          mcq('collections.Counter is good for:', ['Sorting', 'Frequency counts', 'Threading', 'I/O'], 1, 'medium'),
          mcq('functools.lru_cache memoizes:', ['Classes', 'Functions', 'Modules', 'Globals'], 1, 'medium'),
        ]),
      ],
    },
  ],

  3: [
    {
      title: 'Decorators & Closures',
      description: 'Higher-order functions and metaprogramming.',
      exercises: [
        makeExercise('Decorators', [
          mcq('A decorator is a function that:', ['Returns a value', 'Wraps another callable', 'Imports modules', 'Reads files'], 1),
          mcq('Syntax @dec applies to:', ['Variable', 'Function below', 'Module', 'File'], 1),
          mcq('functools.wraps preserves:', ['Memory', 'Metadata of wrapped function', 'Speed', 'Threading'], 1),
          mcq('Closures capture variables by:', ['Value only', 'Reference', 'Copy', 'Pickle'], 1),
          mcq('Stacking decorators applies:', ['Bottom-up (innermost first)', 'Top-down', 'Random', 'Alphabetic'], 0),
          mcq('Decorator with arguments needs:', ['One nested level', 'Two nested levels', 'No nesting', 'Class only'], 1),
          fill('@property turns a method into an ___ attribute.', ['accessor']),
          fill('Closures rely on Python\u2019s ___ scoping rule.', ['LEGB']),
          mcq('@staticmethod vs @classmethod: classmethod receives:', ['nothing', 'self', 'cls', 'instance'], 2, 'medium'),
          mcq('Late-binding closures over loop var: i in lambda captures:', ['Value at definition', 'Final value of i', 'Initial 0', 'None'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Async & Concurrency',
      description: 'asyncio, threading, multiprocessing.',
      exercises: [
        makeExercise('Async', [
          mcq('Coroutine defined with:', ['def', 'async def', 'fn', 'coroutine'], 1),
          mcq('Await pauses on:', ['Synchronous code', 'Awaitable', 'List', 'Print'], 1),
          mcq('asyncio.run starts:', ['Threads', 'Event loop', 'Subprocesses', 'GIL'], 1),
          mcq('GIL prevents:', ['Multiple processes', 'Parallel bytecode in threads', 'I/O', 'Async'], 1),
          mcq('CPU-bound parallelism uses:', ['threading', 'asyncio', 'multiprocessing', 'logging'], 2),
          mcq('I/O-bound parallelism best with:', ['multiprocessing', 'threading or asyncio', 'no concurrency', 'GIL'], 1),
          fill('asyncio.gather runs awaitables ___.', ['concurrently']),
          fill('Threading pools live in ___.', ['concurrent.futures']),
          mcq('Async function called without await returns:', ['Result', 'Coroutine object', 'None', 'Future immediately resolved'], 1, 'medium'),
          mcq('Cancellation in asyncio raises:', ['Exception()', 'CancelledError', 'TimeoutError', 'IOError'], 1, 'medium'),
        ]),
      ],
    },
    {
      title: 'Typing & Performance',
      description: 'Type hints, dataclasses, profiling, optimisations.',
      exercises: [
        makeExercise('Typing', [
          mcq('Type hints are enforced at:', ['Runtime by default', 'Compile time only', 'Not enforced (hints only)', 'Linting only and never useful'], 2),
          mcq('Optional[X] equals:', ['X', 'X | None', 'List[X]', 'Set[X]'], 1),
          mcq('TypeVar is for:', ['Constants', 'Generic types', 'Classes only', 'Modules'], 1),
          mcq('@dataclass auto-generates:', ['__init__/__repr__/__eq__', 'Threading', 'I/O', 'Logging'], 0),
          mcq('mypy is a:', ['Profiler', 'Static type checker', 'Test runner', 'Debugger'], 1),
          mcq('Protocol enables:', ['Inheritance', 'Structural typing', 'Threading', 'Async'], 1),
          fill('From Python 3.9, list[int] works without ___.', ['List']),
          fill('Pydantic enforces types at ___ time.', ['runtime']),
          mcq('Frozen dataclass behaves:', ['Mutable', 'Immutable, hashable', 'Lazy', 'Threaded'], 1, 'medium'),
          mcq('Self type (PEP 673) refers to:', ['Module', 'Containing class', 'Function', 'Decorator'], 1, 'medium'),
        ]),
        makeExercise('Performance', [
          mcq('CPython compiles to:', ['Native code', 'Bytecode', 'JS', 'WASM only'], 1),
          mcq('Faster numerical work is best done with:', ['Pure Python', 'NumPy', 'JSON', 'pickle'], 1),
          mcq('PyPy is:', ['Profiler', 'JIT-compiled Python', 'Linter', 'Type checker'], 1),
          mcq('cProfile measures:', ['Memory', 'Time of function calls', 'Threads', 'Tests'], 1),
          mcq('timeit is for:', ['Long jobs', 'Small benchmarks', 'Memory', 'I/O'], 1),
          mcq('Avoid global lookups by:', ['Aliasing locally in hot loops', 'Using more imports', 'Using long names', 'None'], 0),
          fill('Cython compiles Python-like code to ___.', ['C']),
          fill('Memory profiling: install ___-profiler.', ['memory']),
          mcq('Calling a built-in (like sum) vs a hand loop is usually:', ['Slower', 'Faster (C-level)', 'Same', 'Random'], 1, 'medium'),
          mcq('Numpy vectorised ops avoid:', ['Python interpreter overhead per element', 'Memory entirely', 'GIL release', 'Imports'], 0, 'medium'),
        ]),
      ],
    },
  ],
};
