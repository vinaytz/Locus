import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RefillHeartsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  count?: number;
}

export class EnrollExamDto {
  @IsString()
  examId: string;

  @IsDateString()
  examDate: string; // ISO date
}

export class EnrollSubjectDto {
  @IsString()
  subjectId: string;

  // 1=Enjoy, 2=Pro, 3=Expert (per spec)
  @IsInt()
  @IsIn([1, 2, 3])
  difficulty: number;
}
