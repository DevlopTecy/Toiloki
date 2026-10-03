import { EngineResult } from '../../core/types/engine';

export interface DateDiffResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  nextBirthday: string;
  daysUntilNextBirthday: number;
  totalDaysLived: number;
  dayOfWeekBorn: string;
}

export interface BusinessDaysResult {
  businessDays: number;
  calendarDays: number;
  weekends: number;
  from: string;
  to: string;
}

export class DateEngine {
  /**
   * Calculate difference between two dates
   */
  static dateDiff(from: string, to: string): EngineResult<DateDiffResult> {
    const start = performance.now();
    try {
      const d1 = new Date(from);
      const d2 = new Date(to);
      if (isNaN(d1.getTime())) throw new Error('Invalid start date');
      if (isNaN(d2.getTime())) throw new Error('Invalid end date');

      const later = d1 <= d2 ? d2 : d1;
      const earlier = d1 <= d2 ? d1 : d2;

      const totalMs = later.getTime() - earlier.getTime();
      const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);
      const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor(totalMs / (1000 * 60));

      // Year/month/day breakdown
      let years = later.getFullYear() - earlier.getFullYear();
      let months = later.getMonth() - earlier.getMonth();
      let days = later.getDate() - earlier.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      return {
        success: true,
        data: { years, months, days, totalDays, totalWeeks, totalHours, totalMinutes },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Calculate age from birthdate
   */
  static calculateAge(birthdate: string, referenceDate?: string): EngineResult<AgeResult> {
    const start = performance.now();
    try {
      const born = new Date(birthdate);
      if (isNaN(born.getTime())) throw new Error('Invalid birthdate');

      const ref = referenceDate ? new Date(referenceDate) : new Date();

      const diff = DateEngine.dateDiff(birthdate, ref.toISOString().split('T')[0]);
      if (!diff.success || !diff.data) throw new Error(diff.error);

      const { years, months, days, totalDays } = diff.data;

      // Next birthday
      const nextBirthday = new Date(ref.getFullYear(), born.getMonth(), born.getDate());
      if (nextBirthday <= ref) nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      const daysUntilNextBirthday = Math.ceil(
        (nextBirthday.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24)
      );

      const days_of_week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeekBorn = days_of_week[born.getDay()];

      return {
        success: true,
        data: {
          years,
          months,
          days,
          nextBirthday: nextBirthday.toDateString(),
          daysUntilNextBirthday,
          totalDaysLived: totalDays,
          dayOfWeekBorn,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Add or subtract days/months/years from a date
   */
  static addSubtractDate(
    baseDate: string,
    operation: 'add' | 'subtract',
    amount: number,
    unit: 'days' | 'weeks' | 'months' | 'years'
  ): EngineResult<{ result: string; formatted: string }> {
    const start = performance.now();
    try {
      const d = new Date(baseDate);
      if (isNaN(d.getTime())) throw new Error('Invalid base date');
      const sign = operation === 'add' ? 1 : -1;

      switch (unit) {
        case 'days':
          d.setDate(d.getDate() + sign * amount);
          break;
        case 'weeks':
          d.setDate(d.getDate() + sign * amount * 7);
          break;
        case 'months':
          d.setMonth(d.getMonth() + sign * amount);
          break;
        case 'years':
          d.setFullYear(d.getFullYear() + sign * amount);
          break;
      }

      const result = d.toISOString().split('T')[0];
      const formatted = d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return { success: true, data: { result, formatted }, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Count business days between two dates (excludes weekends)
   */
  static businessDaysBetween(from: string, to: string): EngineResult<BusinessDaysResult> {
    const start = performance.now();
    try {
      const d1 = new Date(from);
      const d2 = new Date(to);
      if (isNaN(d1.getTime())) throw new Error('Invalid start date');
      if (isNaN(d2.getTime())) throw new Error('Invalid end date');

      const earlier = d1 <= d2 ? d1 : d2;
      const later = d1 <= d2 ? d2 : d1;

      let businessDays = 0;
      let weekends = 0;
      const current = new Date(earlier);

      while (current <= later) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) businessDays++;
        else weekends++;
        current.setDate(current.getDate() + 1);
      }

      const calendarDays = Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return {
        success: true,
        data: {
          businessDays,
          calendarDays,
          weekends,
          from: earlier.toISOString().split('T')[0],
          to: later.toISOString().split('T')[0],
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Timezone converter
   */
  static convertTimezone(
    isoDate: string,
    fromTz: string,
    toTz: string
  ): EngineResult<{ original: string; converted: string; offset: string }> {
    const start = performance.now();
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) throw new Error('Invalid date/time');

      const toFormatted = d.toLocaleString('en-US', { timeZone: toTz, dateStyle: 'full', timeStyle: 'long' });
      const fromFormatted = d.toLocaleString('en-US', { timeZone: fromTz, dateStyle: 'full', timeStyle: 'long' });

      // Calculate offset
      const toTime = new Date(d.toLocaleString('en-US', { timeZone: toTz })).getTime();
      const fromTime = new Date(d.toLocaleString('en-US', { timeZone: fromTz })).getTime();
      const offsetHours = (toTime - fromTime) / (1000 * 60 * 60);

      return {
        success: true,
        data: {
          original: fromFormatted,
          converted: toFormatted,
          offset: `${offsetHours >= 0 ? '+' : ''}${offsetHours.toFixed(1)}h`,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
