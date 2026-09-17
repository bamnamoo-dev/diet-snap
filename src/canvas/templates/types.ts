import { NutritionItem, PortionModifier, AspectRatio, PhotoTransform } from '../../types/diet';

export interface TemplateRenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: AspectRatio;
  imgElement?: HTMLImageElement;
  nutrition: NutritionItem;
  portion: PortionModifier;
  transform?: PhotoTransform;
  isPro?: boolean;
  displayCaloriesText: string;
  caloriesUnitText: string;
  humorTopBadge: string;
  mealLabel: string;
  dDayLabel: string;
  displayCarbs: number;
  displayProtein: number;
  displayFat: number;
}
