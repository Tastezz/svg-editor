import { Numeric } from '../../domain/model/Numeric.js';

export class SvgNumbers {
  static list(value: string): number[] {
    if (!value.trim()) return [];
    return value.trim().split(/\s*,\s*|\s+/).map(Numeric.parse);
  }
  static length(value: string): number { return Numeric.parse(value.trim().replace(/px$/,'')); }
}
