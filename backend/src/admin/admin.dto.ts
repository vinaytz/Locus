import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// ---------- Subjects ----------
export class UpsertSubjectDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsString() @IsNotEmpty() displayName!: string;
  @IsInt() @Min(1) @Max(3) level!: number; // 1..3
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() description?: string;
}

// ---------- Exams ----------
export class UpsertExamDto {
  @IsString() @IsNotEmpty() slug!: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
}

export class ExamSubjectsDto {
  @IsArray() @IsString({ each: true }) subjectIds!: string[];
}

// ---------- Units ----------
export class UpsertUnitDto {
  @IsString() @IsNotEmpty() subjectId!: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsInt() orderIndex?: number;
  @IsOptional() @IsString() description?: string;
}

// ---------- Exercises ----------
export class UpsertExerciseDto {
  @IsString() @IsNotEmpty() unitId!: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsInt() duration?: number;
  @IsOptional() @IsInt() points?: number;
  @IsOptional() @IsInt() orderIndex?: number;
}

// ---------- Questions ----------
export class UpsertQuestionDto {
  @IsString() @IsNotEmpty() exerciseId!: string;
  // 'MCQ' | 'MATCH' | 'REORDER' | 'COMPLETE' | 'TRANSLATE'
  @IsString() @IsNotEmpty() type!: string;
  @IsString() @IsNotEmpty() prompt!: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsInt() points?: number;
  @IsObject() content!: Record<string, unknown>;
  @IsOptional() @IsString() explanation?: string;
}
