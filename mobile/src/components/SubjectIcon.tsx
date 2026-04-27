import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  AtomicPowerIcon,
  TestTube01Icon,
  Leaf03Icon,
  FunctionSquareIcon,
  LaptopProgrammingIcon,
  BookOpen01Icon,
  GraduationScrollIcon,
  Globe02Icon,
  Book02Icon,
} from '@hugeicons/core-free-icons';
import type { Subject } from '@/types';

// Maps a subject's "family" name to a Hugeicons stroke icon.
function pickIcon(subject?: Pick<Subject, 'name' | 'slug' | 'icon'>) {
  const haystack = `${subject?.name ?? ''} ${subject?.slug ?? ''} ${subject?.icon ?? ''}`.toLowerCase();
  if (/phys|atom/.test(haystack)) return AtomicPowerIcon;
  if (/chem|flask|test.?tube/.test(haystack)) return TestTube01Icon;
  if (/bio|leaf|plant|dna|cell/.test(haystack)) return Leaf03Icon;
  if (/math|sigma|funct|sqrt|calc/.test(haystack)) return FunctionSquareIcon;
  if (/comp|cs|laptop|code/.test(haystack)) return LaptopProgrammingIcon;
  if (/eng|writ|literat|book/.test(haystack)) return BookOpen01Icon;
  if (/hist|scroll/.test(haystack)) return GraduationScrollIcon;
  if (/geo|globe|map/.test(haystack)) return Globe02Icon;
  return Book02Icon;
}

interface Props {
  subject?: Pick<Subject, 'name' | 'slug' | 'icon'>;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SubjectIcon({ subject, size = 22, color = '#fff', strokeWidth = 2 }: Props) {
  return (
    <HugeiconsIcon
      icon={pickIcon(subject)}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}
