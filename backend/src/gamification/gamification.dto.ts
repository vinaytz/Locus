import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CompleteExerciseDto {
  @IsString()
  exerciseId: string;

  /**
   * For each question in the exercise: was the user's answer correct?
   * Length must match the number of questions in the exercise.
   */
  @IsArray()
  @ArrayMinSize(1)
  results: boolean[];
}
