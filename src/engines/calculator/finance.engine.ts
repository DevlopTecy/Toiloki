import { EngineResult } from '../../core/types/engine';

export interface LoanResult {
  emi: number;
  totalAmount: number;
  totalInterest: number;
  principal: number;
  interestRate: number;
  tenureMonths: number;
}

export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface CompoundResult {
  futureValue: number;
  totalInterest: number;
  principal: number;
  rate: number;
  years: number;
}

export interface SIPResult {
  maturityAmount: number;
  totalInvested: number;
  wealthGained: number;
  monthlyAmount: number;
  years: number;
}

export interface GSTResult {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  rate: number;
  direction: 'add' | 'remove';
}

export interface BMIResult {
  bmi: number;
  category: string;
  healthyWeightRange: { min: number; max: number };
  unit: 'metric' | 'imperial';
}

export interface BMRResult {
  bmr: number;
  tdee: { [key: string]: number };
  formula: string;
}

export interface MarginResult {
  sellingPrice: number;
  profit: number;
  margin: number;
  markup: number;
  cost: number;
}

export interface TipResult {
  tipAmount: number;
  totalBill: number;
  perPersonBill: number;
  perPersonTip: number;
  tipPercent: number;
  people: number;
}

export class FinanceEngine {
  /**
   * Calculate EMI for a loan
   * principal: loan amount, annualRate: % per year, tenureMonths: total months
   */
  static calculateLoanEMI(
    principal: number,
    annualRate: number,
    tenureMonths: number
  ): EngineResult<LoanResult> {
    const start = performance.now();
    try {
      if (principal <= 0) throw new Error('Principal must be greater than 0');
      if (annualRate < 0) throw new Error('Interest rate cannot be negative');
      if (tenureMonths <= 0) throw new Error('Tenure must be greater than 0');

      let emi: number;
      let totalAmount: number;
      let totalInterest: number;

      if (annualRate === 0) {
        emi = principal / tenureMonths;
        totalAmount = principal;
        totalInterest = 0;
      } else {
        const r = annualRate / 12 / 100;
        emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
        totalAmount = emi * tenureMonths;
        totalInterest = totalAmount - principal;
      }

      return {
        success: true,
        data: {
          emi: Math.round(emi * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          principal,
          interestRate: annualRate,
          tenureMonths,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate full amortization schedule
   */
  static generateAmortization(
    principal: number,
    annualRate: number,
    tenureMonths: number
  ): EngineResult<AmortizationRow[]> {
    const start = performance.now();
    try {
      const loanRes = FinanceEngine.calculateLoanEMI(principal, annualRate, tenureMonths);
      if (!loanRes.success || !loanRes.data) {
        return { success: false, error: loanRes.error, elapsedMs: 0 };
      }

      const { emi } = loanRes.data;
      const r = annualRate / 12 / 100;
      const schedule: AmortizationRow[] = [];
      let balance = principal;

      for (let month = 1; month <= tenureMonths; month++) {
        const interest = annualRate === 0 ? 0 : balance * r;
        const principalPaid = emi - interest;
        balance = Math.max(0, balance - principalPaid);

        schedule.push({
          month,
          emi: Math.round(emi * 100) / 100,
          principal: Math.round(principalPaid * 100) / 100,
          interest: Math.round(interest * 100) / 100,
          balance: Math.round(balance * 100) / 100,
        });
      }

      return { success: true, data: schedule, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Compound interest calculator
   * principal: initial amount, rate: annual % rate, years: time, n: compounding frequency per year
   */
  static calculateCompoundInterest(
    principal: number,
    rate: number,
    years: number,
    n: number = 12
  ): EngineResult<CompoundResult> {
    const start = performance.now();
    try {
      if (principal <= 0) throw new Error('Principal must be positive');
      if (rate < 0) throw new Error('Rate cannot be negative');
      if (years <= 0) throw new Error('Years must be positive');
      if (n <= 0) throw new Error('Compounding frequency must be positive');

      const fv = principal * Math.pow(1 + rate / 100 / n, n * years);
      const totalInterest = fv - principal;

      return {
        success: true,
        data: {
          futureValue: Math.round(fv * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          principal,
          rate,
          years,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * SIP (Systematic Investment Plan) calculator
   */
  static calculateSIP(
    monthlyAmount: number,
    annualRate: number,
    years: number
  ): EngineResult<SIPResult> {
    const start = performance.now();
    try {
      if (monthlyAmount <= 0) throw new Error('Monthly investment must be positive');
      if (annualRate < 0) throw new Error('Rate cannot be negative');
      if (years <= 0) throw new Error('Years must be positive');

      const months = years * 12;
      const r = annualRate / 12 / 100;
      let maturityAmount: number;

      if (annualRate === 0) {
        maturityAmount = monthlyAmount * months;
      } else {
        maturityAmount = monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      }

      const totalInvested = monthlyAmount * months;
      const wealthGained = maturityAmount - totalInvested;

      return {
        success: true,
        data: {
          maturityAmount: Math.round(maturityAmount * 100) / 100,
          totalInvested: Math.round(totalInvested * 100) / 100,
          wealthGained: Math.round(wealthGained * 100) / 100,
          monthlyAmount,
          years,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * GST / VAT calculator
   * direction 'add': calculate GST on top of base; 'remove': extract GST from inclusive price
   */
  static calculateGST(
    amount: number,
    rate: number,
    direction: 'add' | 'remove' = 'add',
    splitCGSTSGST: boolean = false
  ): EngineResult<GSTResult> {
    const start = performance.now();
    try {
      if (amount <= 0) throw new Error('Amount must be positive');
      if (rate < 0) throw new Error('Rate cannot be negative');

      let baseAmount: number;
      let gstAmount: number;
      let totalAmount: number;

      if (direction === 'add') {
        baseAmount = amount;
        gstAmount = (amount * rate) / 100;
        totalAmount = amount + gstAmount;
      } else {
        totalAmount = amount;
        baseAmount = amount / (1 + rate / 100);
        gstAmount = amount - baseAmount;
      }

      const result: GSTResult = {
        baseAmount: Math.round(baseAmount * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        rate,
        direction,
      };

      if (splitCGSTSGST) {
        result.cgst = Math.round((gstAmount / 2) * 100) / 100;
        result.sgst = Math.round((gstAmount / 2) * 100) / 100;
        result.igst = Math.round(gstAmount * 100) / 100;
      }

      return { success: true, data: result, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * BMI calculator
   * weight in kg or lbs, height in cm or inches
   */
  static calculateBMI(
    weight: number,
    height: number,
    unit: 'metric' | 'imperial' = 'metric'
  ): EngineResult<BMIResult> {
    const start = performance.now();
    try {
      if (weight <= 0) throw new Error('Weight must be positive');
      if (height <= 0) throw new Error('Height must be positive');

      let bmi: number;
      let heightM: number;

      if (unit === 'metric') {
        heightM = height / 100; // cm to m
        bmi = weight / (heightM * heightM);
      } else {
        // imperial: lbs and inches
        bmi = (weight / (height * height)) * 703;
        heightM = height * 0.0254;
      }

      let category: string;
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal weight';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';

      // Healthy weight range for given height (BMI 18.5 - 24.9)
      const minWeight = unit === 'metric' ? 18.5 * heightM * heightM : (18.5 * height * height) / 703;
      const maxWeight = unit === 'metric' ? 24.9 * heightM * heightM : (24.9 * height * height) / 703;

      return {
        success: true,
        data: {
          bmi: Math.round(bmi * 10) / 10,
          category,
          healthyWeightRange: {
            min: Math.round(minWeight * 10) / 10,
            max: Math.round(maxWeight * 10) / 10,
          },
          unit,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * BMR and TDEE calculator using Mifflin-St Jeor formula
   * weight: kg, height: cm, age: years, sex: 'male'|'female'
   */
  static calculateBMR(
    weight: number,
    height: number,
    age: number,
    sex: 'male' | 'female'
  ): EngineResult<BMRResult> {
    const start = performance.now();
    try {
      if (weight <= 0 || height <= 0 || age <= 0) throw new Error('All values must be positive');

      // Mifflin-St Jeor
      const bmr =
        sex === 'male'
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161;

      const tdee: { [key: string]: number } = {
        'Sedentary (little/no exercise)': Math.round(bmr * 1.2),
        'Light (1-3 days/week)': Math.round(bmr * 1.375),
        'Moderate (3-5 days/week)': Math.round(bmr * 1.55),
        'Active (6-7 days/week)': Math.round(bmr * 1.725),
        'Very Active (hard daily exercise)': Math.round(bmr * 1.9),
      };

      return {
        success: true,
        data: {
          bmr: Math.round(bmr),
          tdee,
          formula: 'Mifflin-St Jeor',
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Margin & Markup calculator
   */
  static calculateMargin(
    cost: number,
    sellingPrice?: number,
    marginPercent?: number
  ): EngineResult<MarginResult> {
    const start = performance.now();
    try {
      if (cost <= 0) throw new Error('Cost must be positive');

      let sp: number;
      if (sellingPrice !== undefined) {
        sp = sellingPrice;
      } else if (marginPercent !== undefined) {
        if (marginPercent >= 100) throw new Error('Margin cannot be 100% or more');
        sp = cost / (1 - marginPercent / 100);
      } else {
        throw new Error('Provide either selling price or desired margin');
      }

      const profit = sp - cost;
      const margin = (profit / sp) * 100;
      const markup = (profit / cost) * 100;

      return {
        success: true,
        data: {
          sellingPrice: Math.round(sp * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          margin: Math.round(margin * 100) / 100,
          markup: Math.round(markup * 100) / 100,
          cost,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Tip split calculator
   */
  static calculateTip(
    billAmount: number,
    tipPercent: number,
    people: number = 1
  ): EngineResult<TipResult> {
    const start = performance.now();
    try {
      if (billAmount <= 0) throw new Error('Bill amount must be positive');
      if (tipPercent < 0) throw new Error('Tip cannot be negative');
      if (people <= 0) throw new Error('Number of people must be positive');

      const tipAmount = (billAmount * tipPercent) / 100;
      const totalBill = billAmount + tipAmount;

      return {
        success: true,
        data: {
          tipAmount: Math.round(tipAmount * 100) / 100,
          totalBill: Math.round(totalBill * 100) / 100,
          perPersonBill: Math.round((totalBill / people) * 100) / 100,
          perPersonTip: Math.round((tipAmount / people) * 100) / 100,
          tipPercent,
          people,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Number base converter (2-36)
   */
  static convertBase(
    value: string,
    fromBase: number,
    toBase: number
  ): EngineResult<{ result: string; allBases: Record<string, string> }> {
    const start = performance.now();
    try {
      if (fromBase < 2 || fromBase > 36) throw new Error('Base must be between 2 and 36');
      if (toBase < 2 || toBase > 36) throw new Error('Base must be between 2 and 36');
      if (!value.trim()) throw new Error('Value is required');

      const decimal = parseInt(value.trim(), fromBase);
      if (isNaN(decimal)) throw new Error(`"${value}" is not a valid base-${fromBase} number`);

      const allBases: Record<string, string> = {
        Binary: decimal.toString(2),
        Octal: decimal.toString(8),
        Decimal: decimal.toString(10),
        Hexadecimal: decimal.toString(16).toUpperCase(),
      };

      return {
        success: true,
        data: {
          result: decimal.toString(toBase).toUpperCase(),
          allBases,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Roman numerals converter (both directions)
   */
  static convertRoman(
    input: string | number,
    direction: 'toRoman' | 'toDecimal'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      const romanValues: [string, number][] = [
        ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
        ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
        ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
      ];

      if (direction === 'toRoman') {
        let n = typeof input === 'string' ? parseInt(input) : input;
        if (isNaN(n) || n < 1 || n > 3999) throw new Error('Number must be between 1 and 3999');
        let result = '';
        for (const [roman, val] of romanValues) {
          while (n >= val) {
            result += roman;
            n -= val;
          }
        }
        return { success: true, data: result, elapsedMs: Math.round(performance.now() - start) };
      } else {
        const str = String(input).toUpperCase().trim();
        if (!/^[IVXLCDM]+$/.test(str)) throw new Error('Invalid Roman numeral characters');
        let result = 0;
        let i = 0;
        for (const [roman, val] of romanValues) {
          while (str.startsWith(roman, i)) {
            result += val;
            i += roman.length;
          }
        }
        return { success: true, data: String(result), elapsedMs: Math.round(performance.now() - start) };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Convert number to words (English, up to trillions)
   */
  static numberToWords(n: number): EngineResult<string> {
    const start = performance.now();
    try {
      if (!isFinite(n)) throw new Error('Invalid number');
      if (n > 999_999_999_999_999) throw new Error('Number too large (max: 999 trillion)');

      const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

      const toWords = (num: number): string => {
        if (num === 0) return '';
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + toWords(num % 100) : '');
        if (num < 1_000_000) return toWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + toWords(num % 1000) : '');
        if (num < 1_000_000_000) return toWords(Math.floor(num / 1_000_000)) + ' million' + (num % 1_000_000 ? ' ' + toWords(num % 1_000_000) : '');
        if (num < 1_000_000_000_000) return toWords(Math.floor(num / 1_000_000_000)) + ' billion' + (num % 1_000_000_000 ? ' ' + toWords(num % 1_000_000_000) : '');
        return toWords(Math.floor(num / 1_000_000_000_000)) + ' trillion' + (num % 1_000_000_000_000 ? ' ' + toWords(num % 1_000_000_000_000) : '');
      };

      const isNeg = n < 0;
      const abs = Math.abs(Math.round(n));
      const result = (isNeg ? 'negative ' : '') + (abs === 0 ? 'zero' : toWords(abs));

      return { success: true, data: result.trim(), elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
