import { evaluate, unit, mean, median, mode, std, variance } from 'mathjs';
import { EngineResult } from '../../core/types/engine';

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  stdDev: number;
  variance: number;
  min: number;
  max: number;
}

export interface DiscountResult {
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
  taxAmount: number;
  finalPrice: number;
  totalSavings: number;
}

export interface EvaluateOptions {
  isRad?: boolean;
  precision?: number;
}

export class CalcEngine {
  /**
   * Format a number string with standard thousands commas (e.g. 1,234,567.89)
   */
  static formatNumberWithCommas(val: number | string): string {
    const str = String(val).trim();
    if (!str || isNaN(Number(str))) return str;
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Evaluate mathematical expressions safely using mathjs with floating-point precision fix,
   * standard percent behavior, Deg/Rad trig support, and divide-by-zero protection.
   */
  static evaluateExpression(expr: string, options: EvaluateOptions = { isRad: true }): EngineResult<string> {
    const start = performance.now();
    try {
      if (!expr || !expr.trim()) {
        return { success: true, data: '0', elapsedMs: 0 };
      }

      let sanitized = expr.trim();
      // Normalize operators
      sanitized = sanitized
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/−/g, '-');

      // Percentage handling: e.g. "100 + 10%" -> "100 + (100 * (10 / 100))"
      sanitized = sanitized.replace(
        /(\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)%/g,
        '$1 $2 ($1 * ($3 / 100))'
      );
      // Standalone percentages: "50%" -> "(50 / 100)"
      sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');

      // DEG vs RAD handling for trigonometric functions
      if (options.isRad === false) {
        sanitized = sanitized.replace(/\b(sin|cos|tan)\(([^)]+)\)/g, '$1(($2) * pi / 180)');
      }

      const result = evaluate(sanitized);

      // Divide by zero and Infinity check
      if (result === Infinity || result === -Infinity || (typeof result === 'number' && !isFinite(result))) {
        return {
          success: false,
          error: 'Cannot divide by zero',
          elapsedMs: Math.round(performance.now() - start),
        };
      }

      // Eliminate floating point noise: 0.1 + 0.2 -> 0.3
      let output: string;
      if (typeof result === 'number') {
        if (Number.isInteger(result)) {
          output = result.toString();
        } else {
          output = parseFloat(result.toPrecision(options.precision || 12)).toString();
        }
      } else {
        output = String(result);
      }

      return {
        success: true,
        data: output,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert between physical and digital units using mathjs
   */
  static convertUnit(
    val: number,
    fromUnit: string,
    toUnit: string
  ): EngineResult<{ value: number; formatted: string }> {
    const start = performance.now();
    try {
      const u = unit(val, fromUnit);
      const converted = u.to(toUnit);
      return {
        success: true,
        data: {
          value: converted.toNumber(),
          formatted: converted.format({ precision: 6 }),
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Compute comprehensive statistical measures for an array of numbers
   */
  static calculateStats(numbers: number[]): EngineResult<StatsResult> {
    const start = performance.now();
    try {
      if (numbers.length === 0) {
        throw new Error('At least one numeric value is required');
      }

      const sum = numbers.reduce((acc, curr) => acc + curr, 0);
      const avg = Number(mean(numbers));
      const med = Number(median(numbers));
      const m = mode(numbers) as number[];
      const s = numbers.length > 1 ? Number(std(numbers)) : 0;
      const v = numbers.length > 1 ? Number(variance(numbers)) : 0;
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);

      return {
        success: true,
        data: {
          count: numbers.length,
          sum,
          mean: Number(avg.toFixed(4)),
          median: Number(med.toFixed(4)),
          mode: Array.isArray(m) ? m : [m],
          stdDev: Number(s.toFixed(4)),
          variance: Number(v.toFixed(4)),
          min,
          max,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Calculate discount, sales tax and net price
   */
  static calculateDiscount(
    originalPrice: number,
    discountPercent: number,
    taxPercent: number = 0
  ): EngineResult<DiscountResult> {
    const start = performance.now();
    try {
      const discountAmount = originalPrice * (discountPercent / 100);
      const discountedPrice = originalPrice - discountAmount;
      const taxAmount = discountedPrice * (taxPercent / 100);
      const finalPrice = discountedPrice + taxAmount;

      return {
        success: true,
        data: {
          originalPrice,
          discountAmount: Number(discountAmount.toFixed(2)),
          discountedPrice: Number(discountedPrice.toFixed(2)),
          taxAmount: Number(taxAmount.toFixed(2)),
          finalPrice: Number(finalPrice.toFixed(2)),
          totalSavings: Number(discountAmount.toFixed(2)),
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Ohm's Law Calculator (V = I * R)
   */
  static calculateOhmsLaw(params: {
    v?: number;
    i?: number;
    r?: number;
  }): EngineResult<{ v: number; i: number; r: number }> {
    const start = performance.now();
    try {
      let { v, i, r } = params;
      if (v !== undefined && i !== undefined && i !== 0) {
        r = v / i;
      } else if (v !== undefined && r !== undefined && r !== 0) {
        i = v / r;
      } else if (i !== undefined && r !== undefined) {
        v = i * r;
      } else {
        throw new Error('Provide at least two values out of Voltage (V), Current (I), or Resistance (R)');
      }

      return {
        success: true,
        data: {
          v: Number(v.toFixed(4)),
          i: Number(i.toFixed(4)),
          r: Number(r.toFixed(4)),
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Calculate percentage of a value relative to a total
   */
  static calculatePercentage(
    part: number,
    total: number
  ): EngineResult<{ percentage: number; decimal: number }> {
    const start = performance.now();
    try {
      if (total === 0) throw new Error('Total cannot be zero');
      const pct = (part / total) * 100;
      return {
        success: true,
        data: {
          percentage: Number(pct.toFixed(4)),
          decimal: Number((part / total).toFixed(6)),
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Simplify ratio A:B using greatest common divisor
   */
  static calculateRatio(
    a: number,
    b: number
  ): EngineResult<{ simplifiedA: number; simplifiedB: number; ratioString: string; decimal: number }> {
    const start = performance.now();
    try {
      if (b === 0) throw new Error('Ratio denominator cannot be zero');
      const gcd = (x: number, y: number): number => {
        x = Math.round(Math.abs(x));
        y = Math.round(Math.abs(y));
        while (y) {
          const t = y;
          y = x % y;
          x = t;
        }
        return x;
      };
      const divisor = gcd(a, b) || 1;
      const simA = a / divisor;
      const simB = b / divisor;

      return {
        success: true,
        data: {
          simplifiedA: simA,
          simplifiedB: simB,
          ratioString: `${simA}:${simB}`,
          decimal: Number((a / b).toFixed(4)),
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Solve proportion A / B = C / X -> X = (B * C) / A
   */
  static calculateProportion(
    a: number,
    b: number,
    c: number
  ): EngineResult<{ result: number; formula: string }> {
    const start = performance.now();
    try {
      if (a === 0) throw new Error('Value A cannot be zero in proportion A:B = C:X');
      const x = (b * c) / a;
      return {
        success: true,
        data: {
          result: Number(x.toFixed(4)),
          formula: `(${b} * ${c}) / ${a} = ${Number(x.toFixed(4))}`,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}
