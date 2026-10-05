import React, { useState, useMemo } from 'react';
import { CalcEngine, StatsResult, DiscountResult } from '../../engines/calculator/calc.engine';
import { FinanceEngine, LoanResult, AmortizationRow } from '../../engines/calculator/finance.engine';
import { DateEngine, AgeResult, DateDiffResult, BusinessDaysResult } from '../../engines/calculator/date.engine';
import { Copy, Check, RotateCcw, ArrowRightLeft, Equal } from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import { CalcKeypad } from '../../components/common/CalcKeypad';
import './CalculatorWorkspaceView.css';

interface CalculatorWorkspaceViewProps {
  utilityId: string;
}

export const CalculatorWorkspaceView: React.FC<CalculatorWorkspaceViewProps> = ({ utilityId }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // =================== BASIC & SCIENTIFIC CALCULATOR STATE ===================
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcHistory, setCalcHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('toiloki_calc_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isRad, setIsRad] = useState<boolean>(false);

  const updateCalcHistory = (newItem: string) => {
    setCalcHistory((prev) => {
      const next = [newItem, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('toiloki_calc_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearHistory = () => {
    setCalcHistory([]);
    try {
      localStorage.removeItem('toiloki_calc_history');
    } catch {}
  };

  const handleCalcInput = (token: string) => {
    const mapped = token === '÷' ? '/' : token === '×' ? '*' : token === '−' ? '-' : token;
    if (mapped === 'C' || mapped === 'CE') {
      setCalcDisplay('0');
    } else if (mapped === '⌫') {
      if (
        calcDisplay.length > 1 &&
        calcDisplay !== 'Error' &&
        calcDisplay !== 'Cannot divide by zero'
      ) {
        setCalcDisplay(calcDisplay.slice(0, -1));
      } else {
        setCalcDisplay('0');
      }
    } else if (mapped === '=') {
      const res = CalcEngine.evaluateExpression(calcDisplay, { isRad });
      if (res.success && res.data) {
        updateCalcHistory(`${calcDisplay} = ${res.data}`);
        setCalcDisplay(res.data);
        HistoryService.record({
          toolName: 'Calculator',
          workspaceId: 'calculator',
          groupId: 'calc-general',
          utilityId: 'calc-basic',
          input: calcDisplay,
          output: res.data,
          status: 'completed',
        });
      } else {
        setCalcDisplay(res.error || 'Error');
      }
    } else if (mapped === '±') {
      if (calcDisplay.startsWith('-')) {
        setCalcDisplay(calcDisplay.slice(1));
      } else if (
        calcDisplay !== '0' &&
        calcDisplay !== 'Error' &&
        calcDisplay !== 'Cannot divide by zero'
      ) {
        setCalcDisplay('-' + calcDisplay);
      }
    } else {
      if (
        calcDisplay === '0' ||
        calcDisplay === 'Error' ||
        calcDisplay === 'Cannot divide by zero'
      ) {
        setCalcDisplay(mapped);
      } else {
        setCalcDisplay(calcDisplay + mapped);
      }
    }
  };

  // Keyboard handler for scientific calculator view
  React.useEffect(() => {
    if (utilityId !== 'calc-trig-logs') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleCalcInput(e.key);
      } else if (e.key === '.') {
        handleCalcInput('.');
      } else if (e.key === '+') {
        handleCalcInput('+');
      } else if (e.key === '-') {
        handleCalcInput('-');
      } else if (e.key === '*') {
        handleCalcInput('*');
      } else if (e.key === '/') {
        e.preventDefault();
        handleCalcInput('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalcInput('=');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleCalcInput('⌫');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCalcInput('C');
      } else if (e.key === '(' || e.key === ')') {
        handleCalcInput(e.key);
      } else if (e.key === '%') {
        handleCalcInput('%');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [utilityId, calcDisplay, isRad]);

  // =================== PERCENTAGE STATE ===================
  const [pctX, setPctX] = useState<number>(15);
  const [pctY, setPctY] = useState<number>(200);

  // =================== DISCOUNT STATE ===================
  const [discPrice, setDiscPrice] = useState<number>(120);
  const [discPercent, setDiscPercent] = useState<number>(20);
  const [discTax, setDiscTax] = useState<number>(8.5);
  const discountResult: DiscountResult | null = React.useMemo(() => {
    const res = CalcEngine.calculateDiscount(discPrice, discPercent, discTax);
    return res.success && res.data ? res.data : null;
  }, [discPrice, discPercent, discTax]);

  // =================== RATIO & PROPORTION STATE ===================
  const [ratioA, setRatioA] = useState<number>(16);
  const [ratioB, setRatioB] = useState<number>(9);
  const [ratioC, setRatioC] = useState<number>(1920);
  const ratioResult = React.useMemo(() => {
    if (ratioA === 0) return 0;
    return Number(((ratioB * ratioC) / ratioA).toFixed(2));
  }, [ratioA, ratioB, ratioC]);

  // =================== STATISTICS STATE ===================
  const [statsInput, setStatsInput] = useState<string>('12, 19, 24, 30, 30, 42, 55, 68');
  const statsResult: StatsResult | null = React.useMemo(() => {
    const nums = statsInput
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && isFinite(n));
    if (nums.length === 0) return null;
    const res = CalcEngine.calculateStats(nums);
    return res.success && res.data ? res.data : null;
  }, [statsInput]);

  // =================== FRACTIONS STATE ===================
  const [fracN1, setFracN1] = useState<number>(3);
  const [fracD1, setFracD1] = useState<number>(4);
  const [fracOp, setFracOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [fracN2, setFracN2] = useState<number>(2);
  const [fracD2, setFracD2] = useState<number>(5);
  const fracResult = React.useMemo(() => {
    try {
      const expr = `(${fracN1}/${fracD1}) ${fracOp} (${fracN2}/${fracD2})`;
      const res = CalcEngine.evaluateExpression(expr);
      const decRes = CalcEngine.evaluateExpression(String(res.data));
      return { expr, val: res.data || '—', dec: decRes.data || '—' };
    } catch {
      return { expr: '', val: 'Error', dec: '' };
    }
  }, [fracN1, fracD1, fracOp, fracN2, fracD2]);

  // =================== EQUATIONS STATE ===================
  const [eqA, setEqA] = useState<number>(1);
  const [eqB, setEqB] = useState<number>(-5);
  const [eqC, setEqC] = useState<number>(6);
  const quadraticRoots = React.useMemo(() => {
    if (eqA === 0) return { root1: 'Not quadratic (a=0)', root2: '' };
    const disc = eqB * eqB - 4 * eqA * eqC;
    if (disc >= 0) {
      const r1 = (-eqB + Math.sqrt(disc)) / (2 * eqA);
      const r2 = (-eqB - Math.sqrt(disc)) / (2 * eqA);
      return { root1: `x₁ = ${r1.toFixed(4)}`, root2: `x₂ = ${r2.toFixed(4)}` };
    } else {
      const real = (-eqB / (2 * eqA)).toFixed(4);
      const imag = (Math.sqrt(-disc) / (2 * eqA)).toFixed(4);
      return { root1: `x₁ = ${real} + ${imag}i`, root2: `x₂ = ${real} - ${imag}i` };
    }
  }, [eqA, eqB, eqC]);

  // =================== OHM'S LAW STATE ===================
  const [ohmsV, setOhmsV] = useState<string>('12');
  const [ohmsI, setOhmsI] = useState<string>('2');
  const [ohmsR, setOhmsR] = useState<string>('');
  const ohmsResult = React.useMemo(() => {
    const v = ohmsV ? Number(ohmsV) : undefined;
    const i = ohmsI ? Number(ohmsI) : undefined;
    const r = ohmsR ? Number(ohmsR) : undefined;
    const res = CalcEngine.calculateOhmsLaw({ v, i, r });
    return res.success && res.data ? res.data : null;
  }, [ohmsV, ohmsI, ohmsR]);

  // =================== ELECTRICAL POWER STATE ===================
  const [pVolts, setPVolts] = useState<number>(120);
  const [pAmps, setPAmps] = useState<number>(5);
  const [pHours, setPHours] = useState<number>(8);
  const [pKwhRate, setPKwhRate] = useState<number>(0.15);
  const powerWatts = pVolts * pAmps;
  const powerKwh = (powerWatts * pHours) / 1000;
  const powerCost = powerKwh * pKwhRate;

  // =================== CONSTANTS REFERENCE ===================
  const constantsList = [
    { symbol: 'π', name: 'Pi', value: '3.141592653589793', desc: 'Ratio of circumference to diameter' },
    { symbol: 'e', name: 'Euler\'s Number', value: '2.718281828459045', desc: 'Base of natural logarithms' },
    { symbol: 'c', name: 'Speed of Light', value: '299792458 m/s', desc: 'In vacuum' },
    { symbol: 'G', name: 'Gravitational Constant', value: '6.67430e-11 N·m²/kg²', desc: 'Newtonian gravitational constant' },
    { symbol: 'h', name: 'Planck Constant', value: '6.62607015e-34 J·s', desc: 'Quantum of electromagnetic action' },
    { symbol: 'Nₐ', name: 'Avogadro Constant', value: '6.02214076e23 mol⁻¹', desc: 'Constituent particles per mole' },
    { symbol: 'g', name: 'Standard Gravity', value: '9.80665 m/s²', desc: 'Earth standard surface gravity' },
    { symbol: 'R', name: 'Gas Constant', value: '8.314462618 J/(mol·K)', desc: 'Molar gas constant' },
  ];

  // =================== UNIT CONVERTER STATE ===================
  const [unitCategory, setUnitCategory] = useState<
    'length' | 'mass' | 'temp' | 'data' | 'speed' | 'volume' | 'area' | 'time'
  >('length');
  const [unitVal, setUnitVal] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');

  const unitCategories: Record<string, Array<{ id: string; name: string }>> = {
    length: [
      { id: 'm', name: 'Meters (m)' },
      { id: 'km', name: 'Kilometers (km)' },
      { id: 'cm', name: 'Centimeters (cm)' },
      { id: 'mm', name: 'Millimeters (mm)' },
      { id: 'inch', name: 'Inches (in)' },
      { id: 'foot', name: 'Feet (ft)' },
      { id: 'yard', name: 'Yards (yd)' },
      { id: 'mile', name: 'Miles (mi)' },
    ],
    mass: [
      { id: 'g', name: 'Grams (g)' },
      { id: 'kg', name: 'Kilograms (kg)' },
      { id: 'mg', name: 'Milligrams (mg)' },
      { id: 'lb', name: 'Pounds (lb)' },
      { id: 'oz', name: 'Ounces (oz)' },
    ],
    temp: [
      { id: 'degC', name: 'Celsius (°C)' },
      { id: 'degF', name: 'Fahrenheit (°F)' },
      { id: 'K', name: 'Kelvin (K)' },
    ],
    data: [
      { id: 'B', name: 'Bytes (B)' },
      { id: 'kB', name: 'Kilobytes (KB)' },
      { id: 'MB', name: 'Megabytes (MB)' },
      { id: 'GB', name: 'Gigabytes (GB)' },
      { id: 'TB', name: 'Terabytes (TB)' },
    ],
    speed: [
      { id: 'm/s', name: 'Meters/second (m/s)' },
      { id: 'km/h', name: 'Kilometers/hour (km/h)' },
      { id: 'mph', name: 'Miles/hour (mph)' },
      { id: 'knot', name: 'Knots' },
    ],
    volume: [
      { id: 'l', name: 'Liters (L)' },
      { id: 'ml', name: 'Milliliters (mL)' },
      { id: 'm^3', name: 'Cubic Meters (m³)' },
      { id: 'gal', name: 'Gallons (US gal)' },
    ],
    area: [
      { id: 'm^2', name: 'Square Meters (m²)' },
      { id: 'km^2', name: 'Square Kilometers (km²)' },
      { id: 'ft^2', name: 'Square Feet (ft²)' },
      { id: 'acre', name: 'Acres' },
      { id: 'hectare', name: 'Hectares' },
    ],
    time: [
      { id: 's', name: 'Seconds (s)' },
      { id: 'minute', name: 'Minutes (min)' },
      { id: 'hour', name: 'Hours (hr)' },
      { id: 'day', name: 'Days' },
      { id: 'week', name: 'Weeks' },
    ],
  };

  const convertedUnit = React.useMemo(() => {
    const res = CalcEngine.convertUnit(unitVal, fromUnit, toUnit);
    return res.success && res.data ? res.data.formatted : '—';
  }, [unitVal, fromUnit, toUnit]);

  // Unit converter swap: 180deg rotation over 200ms, 150ms values crossfade
  const [unitSwapRotated, setUnitSwapRotated] = React.useState(false);
  const [unitSwapCrossfade, setUnitSwapCrossfade] = React.useState(false);

  const handleSwapUnits = () => {
    setUnitSwapRotated((r) => !r);
    setUnitSwapCrossfade(true);
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setTimeout(() => setUnitSwapCrossfade(false), 150);
  };

  return (
    <div className="calc-workspace-container">
      {/* 1. BASIC CALCULATOR */}
      {utilityId === 'calc-basic' && (
        <CalcKeypad
          displayValue={calcDisplay}
          expression={calcHistory.length > 0 ? calcHistory[0] : undefined}
          onKeyPress={handleCalcInput}
          history={calcHistory}
          onClearHistory={handleClearHistory}
          onSelectHistory={(item) => setCalcDisplay(item.split('=')[1]?.trim() || '0')}
        />
      )}

      {/* 2. SCIENTIFIC CALCULATOR */}
      {utilityId === 'calc-trig-logs' && (
        <div className="calc-card-view">
          <div className="calc-desktop-frame scientific">
            <div className="calc-display-section">
              <div className="calc-rad-toggle">
                <button
                  className={`rad-btn ${!isRad ? 'active' : ''}`}
                  onClick={() => setIsRad(false)}
                >
                  DEG
                </button>
                <button
                  className={`rad-btn ${isRad ? 'active' : ''}`}
                  onClick={() => setIsRad(true)}
                >
                  RAD
                </button>
              </div>
              <div className="calc-main-num" title={calcDisplay}>{calcDisplay}</div>
            </div>

            <div className="calc-keypad-grid scientific">
              <button className="calc-btn fn" onClick={() => handleCalcInput(isRad ? 'sin(' : 'sin(')}>sin</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput(isRad ? 'cos(' : 'cos(')}>cos</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput(isRad ? 'tan(' : 'tan(')}>tan</button>
              <button className="calc-btn op" onClick={() => handleCalcInput('(')}>(</button>
              <button className="calc-btn op" onClick={() => handleCalcInput(')')}>)</button>
              <button className="calc-btn op" onClick={() => handleCalcInput('C')}>C</button>

              <button className="calc-btn fn" onClick={() => handleCalcInput('log10(')}>log</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('log(')}>ln</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('sqrt(')}>√</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('^2')}>x²</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('^')}>xʸ</button>
              <button className="calc-btn action" onClick={() => handleCalcInput('/')}>÷</button>

              <button className="calc-btn fn" onClick={() => handleCalcInput('pi')}>π</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('e')}>e</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('7')}>7</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('8')}>8</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('9')}>9</button>
              <button className="calc-btn action" onClick={() => handleCalcInput('*')}>×</button>

              <button className="calc-btn fn" onClick={() => handleCalcInput('!')}>n!</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('%')}>%</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('4')}>4</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('5')}>5</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('6')}>6</button>
              <button className="calc-btn action" onClick={() => handleCalcInput('-')}>−</button>

              <button className="calc-btn fn" onClick={() => handleCalcInput('abs(')}>|x|</button>
              <button className="calc-btn fn" onClick={() => handleCalcInput('cbrt(')}>∛</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('1')}>1</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('2')}>2</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('3')}>3</button>
              <button className="calc-btn action" onClick={() => handleCalcInput('+')}>+</button>

              <button className="calc-btn op" onClick={() => handleCalcInput('⌫')}>⌫</button>
              <button className="calc-btn op" onClick={() => handleCalcInput('±')}>±</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('0')}>0</button>
              <button className="calc-btn num" onClick={() => handleCalcInput('.')}>.</button>
              <button className="calc-btn equals full-span" onClick={() => handleCalcInput('=')}>=</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PERCENTAGE */}
      {utilityId === 'calc-percentage' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Percentage Calculations</h3>
            <div className="pct-row">
              <span>What is</span>
              <input
                type="number"
                className="control-input small-num"
                value={pctX}
                onChange={(e) => setPctX(Number(e.target.value))}
              />
              <span>% of</span>
              <input
                type="number"
                className="control-input small-num"
                value={pctY}
                onChange={(e) => setPctY(Number(e.target.value))}
              />
              <span className="pct-equals">=</span>
              <span className="pct-val">{((pctX / 100) * pctY).toFixed(2)}</span>
            </div>

            <div className="pct-divider" />

            <div className="pct-row">
              <input
                type="number"
                className="control-input small-num"
                value={pctX}
                onChange={(e) => setPctX(Number(e.target.value))}
              />
              <span>is what % of</span>
              <input
                type="number"
                className="control-input small-num"
                value={pctY}
                onChange={(e) => setPctY(Number(e.target.value))}
              />
              <span className="pct-equals">=</span>
              <span className="pct-val">{pctY !== 0 ? ((pctX / pctY) * 100).toFixed(2) : 0}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. DISCOUNT CALCULATOR */}
      {utilityId === 'calc-discount' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Discount & Sales Tax Calculator</h3>
            <div className="calc-inputs-grid">
              <div className="control-group">
                <label className="control-label">Original Price ($):</label>
                <input
                  type="number"
                  className="control-input"
                  value={discPrice}
                  onChange={(e) => setDiscPrice(Number(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Discount (%):</label>
                <input
                  type="number"
                  className="control-input"
                  value={discPercent}
                  onChange={(e) => setDiscPercent(Number(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Sales Tax (%):</label>
                <input
                  type="number"
                  className="control-input"
                  value={discTax}
                  onChange={(e) => setDiscTax(Number(e.target.value))}
                />
              </div>
            </div>

            {discountResult && (
              <div className="calc-summary-stats-box">
                <div className="stat-pill">
                  <span className="stat-pill-label">Final Price</span>
                  <span className="stat-pill-val highlight">${discountResult.finalPrice}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">You Save</span>
                  <span className="stat-pill-val green">${discountResult.totalSavings}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Tax Amount</span>
                  <span className="stat-pill-val">${discountResult.taxAmount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. RATIO & PROPORTION */}
      {utilityId === 'calc-ratio' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Ratio & Proportion Solver (A : B = C : X)</h3>
            <div className="ratio-flex-row">
              <div className="ratio-term">
                <label className="control-label">A</label>
                <input
                  type="number"
                  className="control-input small-num"
                  value={ratioA}
                  onChange={(e) => setRatioA(Number(e.target.value))}
                />
              </div>
              <span className="ratio-sep">:</span>
              <div className="ratio-term">
                <label className="control-label">B</label>
                <input
                  type="number"
                  className="control-input small-num"
                  value={ratioB}
                  onChange={(e) => setRatioB(Number(e.target.value))}
                />
              </div>
              <span className="ratio-equal">=</span>
              <div className="ratio-term">
                <label className="control-label">C</label>
                <input
                  type="number"
                  className="control-input small-num"
                  value={ratioC}
                  onChange={(e) => setRatioC(Number(e.target.value))}
                />
              </div>
              <span className="ratio-sep">:</span>
              <div className="ratio-term">
                <label className="control-label">X (Result)</label>
                <div className="ratio-result-badge">{ratioResult}</div>
              </div>
            </div>
            <p className="calc-helper-note">Formula: X = (B × C) ÷ A</p>
          </div>
        </div>
      )}

      {/* 6. CONSTANTS */}
      {utilityId === 'calc-constants' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Scientific & Mathematical Constants</h3>
            <div className="constants-table-view">
              {constantsList.map((c) => (
                <div key={c.symbol} className="constant-row">
                  <div className="const-sym-col">
                    <span className="const-sym">{c.symbol}</span>
                    <span className="const-name">{c.name}</span>
                  </div>
                  <div className="const-desc-col">{c.desc}</div>
                  <div className="const-val-col">
                    <code>{c.value}</code>
                    <button
                      className="icon-action-btn small"
                      onClick={() => copyToClipboard(c.value, c.symbol)}
                      title="Copy Constant"
                    >
                      {copiedKey === c.symbol ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. FRACTIONS */}
      {utilityId === 'calc-fractions' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Fraction Arithmetic</h3>
            <div className="fraction-calc-row">
              <div className="frac-box">
                <input
                  type="number"
                  className="control-input frac-input"
                  value={fracN1}
                  onChange={(e) => setFracN1(Number(e.target.value))}
                />
                <div className="frac-bar" />
                <input
                  type="number"
                  className="control-input frac-input"
                  value={fracD1}
                  onChange={(e) => setFracD1(Number(e.target.value))}
                />
              </div>

              <select
                className="control-select frac-op-select"
                value={fracOp}
                onChange={(e) => setFracOp(e.target.value as any)}
              >
                <option value="+">+</option>
                <option value="-">−</option>
                <option value="*">×</option>
                <option value="/">÷</option>
              </select>

              <div className="frac-box">
                <input
                  type="number"
                  className="control-input frac-input"
                  value={fracN2}
                  onChange={(e) => setFracN2(Number(e.target.value))}
                />
                <div className="frac-bar" />
                <input
                  type="number"
                  className="control-input frac-input"
                  value={fracD2}
                  onChange={(e) => setFracD2(Number(e.target.value))}
                />
              </div>

              <span className="ratio-equal">=</span>

              <div className="frac-res-box">
                <span className="frac-val-main">{fracResult.val}</span>
                <span className="frac-val-dec">≈ {fracResult.dec}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. STATISTICS */}
      {utilityId === 'calc-statistics' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Descriptive Statistics</h3>
            <label className="control-label">Enter numeric values (separated by commas or spaces):</label>
            <textarea
              className="control-textarea"
              rows={3}
              value={statsInput}
              onChange={(e) => setStatsInput(e.target.value)}
              placeholder="e.g. 10, 25, 30, 45, 50, 60"
            />

            {statsResult && (
              <div className="stats-grid-view">
                <div className="stat-card-item">
                  <span className="stat-title">Sample Count (n)</span>
                  <span className="stat-num">{statsResult.count}</span>
                </div>
                <div className="stat-card-item">
                  <span className="stat-title">Sum (Σx)</span>
                  <span className="stat-num">{statsResult.sum}</span>
                </div>
                <div className="stat-card-item highlight">
                  <span className="stat-title">Mean (Average)</span>
                  <span className="stat-num">{statsResult.mean}</span>
                </div>
                <div className="stat-card-item highlight">
                  <span className="stat-title">Median</span>
                  <span className="stat-num">{statsResult.median}</span>
                </div>
                <div className="stat-card-item">
                  <span className="stat-title">Mode</span>
                  <span className="stat-num">{statsResult.mode.join(', ')}</span>
                </div>
                <div className="stat-card-item">
                  <span className="stat-title">Std Deviation (σ)</span>
                  <span className="stat-num">{statsResult.stdDev}</span>
                </div>
                <div className="stat-card-item">
                  <span className="stat-title">Variance (σ²)</span>
                  <span className="stat-num">{statsResult.variance}</span>
                </div>
                <div className="stat-card-item">
                  <span className="stat-title">Min / Max Range</span>
                  <span className="stat-num">{statsResult.min} – {statsResult.max}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. EQUATIONS */}
      {utilityId === 'calc-equations' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Quadratic Equation Solver (ax² + bx + c = 0)</h3>
            <div className="ratio-flex-row">
              <input
                type="number"
                className="control-input small-num"
                value={eqA}
                onChange={(e) => setEqA(Number(e.target.value))}
              />
              <span>x² +</span>
              <input
                type="number"
                className="control-input small-num"
                value={eqB}
                onChange={(e) => setEqB(Number(e.target.value))}
              />
              <span>x +</span>
              <input
                type="number"
                className="control-input small-num"
                value={eqC}
                onChange={(e) => setEqC(Number(e.target.value))}
              />
              <span>= 0</span>
            </div>

            <div className="quadratic-roots-box">
              <div className="root-pill">{quadraticRoots.root1}</div>
              <div className="root-pill">{quadraticRoots.root2}</div>
            </div>
          </div>
        </div>
      )}

      {/* 10. OHM'S LAW */}
      {utilityId === 'calc-ohms-law' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Ohm's Law Calculator (V = I × R)</h3>
            <p className="calc-helper-note">Enter any two fields. The third field will automatically be calculated.</p>
            <div className="calc-inputs-grid">
              <div className="control-group">
                <label className="control-label">Voltage (V) in Volts:</label>
                <input
                  type="number"
                  className="control-input"
                  placeholder="e.g. 12"
                  value={ohmsV}
                  onChange={(e) => setOhmsV(e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Current (I) in Amperes:</label>
                <input
                  type="number"
                  className="control-input"
                  placeholder="e.g. 2"
                  value={ohmsI}
                  onChange={(e) => setOhmsI(e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Resistance (R) in Ohms (Ω):</label>
                <input
                  type="number"
                  className="control-input"
                  placeholder="e.g. 6"
                  value={ohmsR}
                  onChange={(e) => setOhmsR(e.target.value)}
                />
              </div>
            </div>

            {ohmsResult && (
              <div className="calc-summary-stats-box">
                <div className="stat-pill">
                  <span className="stat-pill-label">Voltage</span>
                  <span className="stat-pill-val">{ohmsResult.v} V</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Current</span>
                  <span className="stat-pill-val">{ohmsResult.i} A</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Resistance</span>
                  <span className="stat-pill-val">{ohmsResult.r} Ω</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. ELECTRICAL POWER */}
      {utilityId === 'calc-power' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <h3 className="calc-card-title">Electrical Power & Energy Cost</h3>
            <div className="calc-inputs-grid">
              <div className="control-group">
                <label className="control-label">Voltage (V):</label>
                <input
                  type="number"
                  className="control-input"
                  value={pVolts}
                  onChange={(e) => setPVolts(Number(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Current (Amps):</label>
                <input
                  type="number"
                  className="control-input"
                  value={pAmps}
                  onChange={(e) => setPAmps(Number(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Usage Duration (Hours/day):</label>
                <input
                  type="number"
                  className="control-input"
                  value={pHours}
                  onChange={(e) => setPHours(Number(e.target.value))}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Electricity Rate ($/kWh):</label>
                <input
                  type="number"
                  step="0.01"
                  className="control-input"
                  value={pKwhRate}
                  onChange={(e) => setPKwhRate(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="calc-summary-stats-box">
              <div className="stat-pill">
                <span className="stat-pill-label">Power (Watts)</span>
                <span className="stat-pill-val highlight">{powerWatts} W</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-label">Daily Consumption</span>
                <span className="stat-pill-val">{powerKwh.toFixed(3)} kWh</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-label">Estimated Cost / Day</span>
                <span className="stat-pill-val green">${powerCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. UNIT CONVERTER */}
      {utilityId === 'unit-converter-all' && (
        <div className="calc-card-view single-col">
          <div className="calc-form-card">
            <div className="unit-category-tabs">
              {(
                ['length', 'mass', 'temp', 'data', 'speed', 'volume', 'area', 'time'] as const
              ).map((cat) => (
                <button
                  key={cat}
                  className={`unit-cat-btn ${unitCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                    setUnitCategory(cat);
                    const opts = unitCategories[cat];
                    setFromUnit(opts[0].id);
                    setToUnit(opts[1].id);
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="unit-converter-grid">
              <div className="unit-input-pane">
                <label className="control-label">From Value:</label>
                <input
                  type="number"
                  className="control-input"
                  value={unitVal}
                  onChange={(e) => setUnitVal(Number(e.target.value))}
                />
                <select
                  className={`control-select ${unitSwapCrossfade ? 'swap-crossfade-active' : ''}`}
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                >
                  {unitCategories[unitCategory].map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="unit-swap-icon">
                <button
                  type="button"
                  className={`unit-swap-btn ${unitSwapRotated ? 'rotated' : ''}`}
                  onClick={handleSwapUnits}
                  title="Swap units"
                  aria-label="Swap units"
                >
                  <ArrowRightLeft size={16} />
                </button>
              </div>

              <div className="unit-input-pane">
                <label className="control-label">To Unit:</label>
                <select
                  className={`control-select ${unitSwapCrossfade ? 'swap-crossfade-active' : ''}`}
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                >
                  {unitCategories[unitCategory].map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>

                <div className="converted-val-box">
                  <span className="converted-num">{convertedUnit}</span>
                  <button
                    className="icon-action-btn small"
                    onClick={() => copyToClipboard(convertedUnit, 'unit-res')}
                    title="Copy Converted Value"
                  >
                    {copiedKey === 'unit-res' ? (
                      <Check size={14} color="var(--accent-green)" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── AGE CALCULATOR ─── */}
      {utilityId === 'calc-age' && <AgeCalculator />}

      {/* ─── DATE DIFFERENCE ─── */}
      {utilityId === 'calc-date-diff' && <DateDiffCalc />}

      {/* ─── DATE ADD/SUBTRACT ─── */}
      {utilityId === 'calc-date-add-sub' && <DateAddSubCalc />}

      {/* ─── BUSINESS DAYS ─── */}
      {utilityId === 'calc-business-days' && <BusinessDaysCalc />}

      {/* ─── LOAN EMI ─── */}
      {utilityId === 'calc-loan-emi' && <LoanEMICalc />}

      {/* ─── AMORTIZATION ─── */}
      {utilityId === 'calc-amortization' && <AmortizationCalc />}

      {/* ─── COMPOUND INTEREST ─── */}
      {utilityId === 'calc-compound-interest' && <CompoundInterestCalc />}

      {/* ─── SIP ─── */}
      {utilityId === 'calc-sip' && <SIPCalc />}

      {/* ─── GST/VAT ─── */}
      {utilityId === 'calc-gst-vat' && <GSTVATCalc />}

      {/* ─── MARGIN & MARKUP ─── */}
      {utilityId === 'calc-margin-markup' && <MarginMarkupCalc />}

      {/* ─── TIP SPLIT ─── */}
      {utilityId === 'calc-tip-split' && <TipSplitCalc />}

      {/* ─── BMI ─── */}
      {utilityId === 'calc-bmi' && <BMICalc />}

      {/* ─── CALORIE/BMR ─── */}
      {utilityId === 'calc-calorie-bmr' && <BMRCalc />}

      {/* ─── NUMBER BASE ─── */}
      {utilityId === 'calc-number-base' && <NumberBaseCalc />}

      {/* ─── ROMAN NUMERALS ─── */}
      {utilityId === 'calc-roman-numerals' && <RomanNumeralCalc />}

      {/* ─── NUMBER TO WORDS ─── */}
      {utilityId === 'calc-number-to-words' && <NumberToWordsCalc />}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components for new calc utilities
// ─────────────────────────────────────────────────────────────────────────────

function CalcCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="calc-card-view single-col">
      <div className="calc-form-card">
        <h3 className="calc-card-title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ResultRow({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text)', fontFamily: mono ? 'var(--font-mono)' : undefined, fontWeight: 600, fontSize: 13 }}>{value}</span>
    </div>
  );
}

function NumInput({ label, value, onChange, step = 1, min = 0, unit }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; unit?: string }) {
  return (
    <div className="control-group">
      <label className="control-label">{label}{unit ? ` (${unit})` : ''}:</label>
      <input type="number" className="control-input" value={value} min={min} step={step}
        onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

function AgeCalculator() {
  const today = new Date().toISOString().split('T')[0];
  const [birthdate, setBirthdate] = React.useState('1990-01-15');
  const result = React.useMemo(() => {
    const r = DateEngine.calculateAge(birthdate);
    return r.success ? r.data : null;
  }, [birthdate]);

  return (
    <CalcCard title="Age Calculator">
      <div className="control-group">
        <label className="control-label">Date of Birth:</label>
        <input type="date" className="control-input" value={birthdate} max={today}
          onChange={e => setBirthdate(e.target.value)} />
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            {result.years}y {result.months}m {result.days}d
          </div>
          <ResultRow label="Total days lived" value={result.totalDaysLived.toLocaleString()} />
          <ResultRow label="Day of week born" value={result.dayOfWeekBorn} mono={false} />
          <ResultRow label="Next birthday" value={result.nextBirthday} mono={false} />
          <ResultRow label="Days until next birthday" value={result.daysUntilNextBirthday} />
        </div>
      )}
    </CalcCard>
  );
}

function DateDiffCalc() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = React.useState('2020-01-01');
  const [to, setTo] = React.useState(today);
  const result = React.useMemo(() => {
    const r = DateEngine.dateDiff(from, to);
    return r.success ? r.data : null;
  }, [from, to]);

  return (
    <CalcCard title="Date Difference">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="control-group">
          <label className="control-label">From:</label>
          <input type="date" className="control-input" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">To:</label>
          <input type="date" className="control-input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            {result.years}y {result.months}m {result.days}d
          </div>
          <ResultRow label="Total days" value={result.totalDays.toLocaleString()} />
          <ResultRow label="Total weeks" value={result.totalWeeks.toLocaleString()} />
          <ResultRow label="Total hours" value={result.totalHours.toLocaleString()} />
          <ResultRow label="Total minutes" value={result.totalMinutes.toLocaleString()} />
        </div>
      )}
    </CalcCard>
  );
}

function DateAddSubCalc() {
  const today = new Date().toISOString().split('T')[0];
  const [base, setBase] = React.useState(today);
  const [op, setOp] = React.useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = React.useState(30);
  const [unit, setUnit] = React.useState<'days' | 'weeks' | 'months' | 'years'>('days');

  const result = React.useMemo(() => {
    const r = DateEngine.addSubtractDate(base, op, amount, unit);
    return r.success ? r.data : null;
  }, [base, op, amount, unit]);

  return (
    <CalcCard title="Add / Subtract Dates">
      <div className="control-group">
        <label className="control-label">Base Date:</label>
        <input type="date" className="control-input" value={base} onChange={e => setBase(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="control-group">
          <label className="control-label">Operation:</label>
          <select className="control-select" value={op} onChange={e => setOp(e.target.value as 'add' | 'subtract')}>
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Amount:</label>
          <input type="number" className="control-input" value={amount} min={1} onChange={e => setAmount(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Unit:</label>
          <select className="control-select" value={unit} onChange={e => setUnit(e.target.value as typeof unit)}>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </div>
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          <ResultRow label="Result date" value={result.result} />
          <ResultRow label="Formatted" value={result.formatted} mono={false} />
        </div>
      )}
    </CalcCard>
  );
}

function BusinessDaysCalc() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = React.useState('2024-01-01');
  const [to, setTo] = React.useState(today);
  const result = React.useMemo(() => {
    const r = DateEngine.businessDaysBetween(from, to);
    return r.success ? r.data : null;
  }, [from, to]);

  return (
    <CalcCard title="Business Days Calculator">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="control-group">
          <label className="control-label">From:</label>
          <input type="date" className="control-input" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">To:</label>
          <input type="date" className="control-input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            {result.businessDays} business days
          </div>
          <ResultRow label="Calendar days" value={result.calendarDays} />
          <ResultRow label="Weekend days" value={result.weekends} />
        </div>
      )}
    </CalcCard>
  );
}

function LoanEMICalc() {
  const [principal, setPrincipal] = React.useState(500000);
  const [rate, setRate] = React.useState(8.5);
  const [tenure, setTenure] = React.useState(240);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateLoanEMI(principal, rate, tenure);
    return r.success ? r.data : null;
  }, [principal, rate, tenure]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <CalcCard title="Loan / EMI Calculator">
      <NumInput label="Loan Amount" value={principal} onChange={setPrincipal} min={1} />
      <NumInput label="Annual Interest Rate" value={rate} onChange={setRate} step={0.1} unit="%" />
      <NumInput label="Tenure" value={tenure} onChange={setTenure} min={1} unit="months" />
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            EMI: ₹{fmt(result.emi)}
          </div>
          <ResultRow label="Principal" value={`₹${fmt(result.principal)}`} />
          <ResultRow label="Total interest" value={`₹${fmt(result.totalInterest)}`} />
          <ResultRow label="Total amount" value={`₹${fmt(result.totalAmount)}`} />
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interest / Principal ratio</div>
            <div style={{ height: 8, background: 'var(--surface-hover)', borderRadius: 4, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 4, width: `${Math.min(100, (result.principal / result.totalAmount) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
    </CalcCard>
  );
}

function AmortizationCalc() {
  const [principal, setPrincipal] = React.useState(500000);
  const [rate, setRate] = React.useState(8.5);
  const [tenure, setTenure] = React.useState(60);
  const [showAll, setShowAll] = React.useState(false);

  const result = React.useMemo(() => {
    const r = FinanceEngine.generateAmortization(principal, rate, tenure);
    return r.success ? r.data : null;
  }, [principal, rate, tenure]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const displayRows = result ? (showAll ? result : result.slice(0, 12)) : [];

  return (
    <div className="calc-card-view">
      <div className="calc-form-card" style={{ flex: '0 0 280px', minWidth: 280 }}>
        <h3 className="calc-card-title">Amortization Schedule</h3>
        <NumInput label="Loan Amount" value={principal} onChange={setPrincipal} min={1} />
        <NumInput label="Annual Rate" value={rate} onChange={setRate} step={0.1} unit="%" />
        <NumInput label="Tenure" value={tenure} onChange={setTenure} min={1} unit="months" />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 0 0 16px' }}>
        {result && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Mo.', 'EMI', 'Principal', 'Interest', 'Balance'].map(h => (
                    <th key={h} style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-2)', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map(row => (
                  <tr key={row.month} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.month}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmt(row.emi)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--accent)' }}>{fmt(row.principal)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-2)' }}>{fmt(row.interest)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmt(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!showAll && result.length > 12 && (
              <button className="btn-secondary" style={{ marginTop: 8, fontSize: 12 }} onClick={() => setShowAll(true)}>
                Show all {result.length} rows
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CompoundInterestCalc() {
  const [principal, setPrincipal] = React.useState(100000);
  const [rate, setRate] = React.useState(10);
  const [years, setYears] = React.useState(10);
  const [freq, setFreq] = React.useState(12);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateCompoundInterest(principal, rate, years, freq);
    return r.success ? r.data : null;
  }, [principal, rate, years, freq]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <CalcCard title="Compound Interest Calculator">
      <NumInput label="Principal" value={principal} onChange={setPrincipal} min={1} />
      <NumInput label="Annual Rate" value={rate} onChange={setRate} step={0.1} unit="%" />
      <NumInput label="Duration" value={years} onChange={setYears} min={1} unit="years" />
      <div className="control-group">
        <label className="control-label">Compounding Frequency:</label>
        <select className="control-select" value={freq} onChange={e => setFreq(Number(e.target.value))}>
          <option value={1}>Annually</option>
          <option value={2}>Semi-annually</option>
          <option value={4}>Quarterly</option>
          <option value={12}>Monthly</option>
          <option value={365}>Daily</option>
        </select>
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            ₹{fmt(result.futureValue)}
          </div>
          <ResultRow label="Principal invested" value={`₹${fmt(result.principal)}`} />
          <ResultRow label="Interest earned" value={`₹${fmt(result.totalInterest)}`} />
          <ResultRow label="Growth" value={`${Math.round((result.futureValue / result.principal - 1) * 1000) / 10}%`} />
        </div>
      )}
    </CalcCard>
  );
}

function SIPCalc() {
  const [monthly, setMonthly] = React.useState(10000);
  const [rate, setRate] = React.useState(12);
  const [years, setYears] = React.useState(10);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateSIP(monthly, rate, years);
    return r.success ? r.data : null;
  }, [monthly, rate, years]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <CalcCard title="SIP Calculator">
      <NumInput label="Monthly SIP Amount" value={monthly} onChange={setMonthly} min={1} />
      <NumInput label="Expected Annual Return" value={rate} onChange={setRate} step={0.5} unit="%" />
      <NumInput label="Investment Period" value={years} onChange={setYears} min={1} unit="years" />
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            ₹{fmt(result.maturityAmount)}
          </div>
          <ResultRow label="Total invested" value={`₹${fmt(result.totalInvested)}`} />
          <ResultRow label="Wealth gained" value={`₹${fmt(result.wealthGained)}`} />
          <ResultRow label="Returns" value={`${Math.round((result.wealthGained / result.totalInvested) * 1000) / 10}%`} />
        </div>
      )}
    </CalcCard>
  );
}

function GSTVATCalc() {
  const [amount, setAmount] = React.useState(1000);
  const [rate, setRate] = React.useState(18);
  const [direction, setDirection] = React.useState<'add' | 'remove'>('add');
  const [split, setSplit] = React.useState(true);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateGST(amount, rate, direction, split);
    return r.success ? r.data : null;
  }, [amount, rate, direction, split]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <CalcCard title="GST / VAT Calculator">
      <NumInput label={direction === 'add' ? 'Base Amount' : 'Inclusive Amount'} value={amount} onChange={setAmount} min={0.01} step={0.01} />
      <NumInput label="Tax Rate" value={rate} onChange={setRate} step={0.5} unit="%" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="control-group">
          <label className="control-label">Mode:</label>
          <select className="control-select" value={direction} onChange={e => setDirection(e.target.value as 'add' | 'remove')}>
            <option value="add">Add tax to amount</option>
            <option value="remove">Extract tax from price</option>
          </select>
        </div>
        <div className="control-group" style={{ justifyContent: 'flex-end', paddingTop: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={split} onChange={e => setSplit(e.target.checked)} />
            Split CGST/SGST
          </label>
        </div>
      </div>
      {result && (
        <div style={{ marginTop: 16 }}>
          <ResultRow label="Base amount" value={`₹${fmt(result.baseAmount)}`} />
          <ResultRow label="Tax amount" value={`₹${fmt(result.gstAmount)}`} />
          {result.cgst !== undefined && <ResultRow label="CGST (½)" value={`₹${fmt(result.cgst)}`} />}
          {result.sgst !== undefined && <ResultRow label="SGST (½)" value={`₹${fmt(result.sgst)}`} />}
          <div style={{ borderTop: '2px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
            <ResultRow label="Total" value={`₹${fmt(result.totalAmount)}`} />
          </div>
        </div>
      )}
    </CalcCard>
  );
}

function MarginMarkupCalc() {
  const [cost, setCost] = React.useState(500);
  const [sp, setSp] = React.useState(750);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateMargin(cost, sp);
    return r.success ? r.data : null;
  }, [cost, sp]);

  return (
    <CalcCard title="Margin & Markup Calculator">
      <NumInput label="Cost Price" value={cost} onChange={setCost} min={0.01} step={0.01} />
      <NumInput label="Selling Price" value={sp} onChange={setSp} min={0.01} step={0.01} />
      {result && (
        <div style={{ marginTop: 16 }}>
          <ResultRow label="Profit" value={`${result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}`} />
          <ResultRow label="Gross Margin" value={`${result.margin.toFixed(2)}%`} />
          <ResultRow label="Markup" value={`${result.markup.toFixed(2)}%`} />
        </div>
      )}
    </CalcCard>
  );
}

function TipSplitCalc() {
  const [bill, setBill] = React.useState(1200);
  const [tipPct, setTipPct] = React.useState(15);
  const [people, setPeople] = React.useState(4);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateTip(bill, tipPct, people);
    return r.success ? r.data : null;
  }, [bill, tipPct, people]);

  return (
    <CalcCard title="Tip Split Calculator">
      <NumInput label="Bill Amount" value={bill} onChange={setBill} min={0.01} step={0.01} />
      <div style={{ marginBottom: 8 }}>
        <label className="control-label">Tip: {tipPct}%</label>
        <input type="range" min={0} max={30} step={1} value={tipPct} className="control-slider"
          onChange={e => setTipPct(Number(e.target.value))} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[0, 5, 10, 15, 18, 20, 25].map(v => (
            <button key={v} style={{ fontSize: 11, padding: '2px 6px', background: tipPct === v ? 'var(--accent)' : 'var(--surface)', color: tipPct === v ? 'var(--bg)' : 'var(--text-2)', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => setTipPct(v)}>{v}%</button>
          ))}
        </div>
      </div>
      <NumInput label="People" value={people} onChange={setPeople} min={1} />
      {result && (
        <div style={{ marginTop: 16 }}>
          <ResultRow label="Tip amount" value={`${result.tipAmount.toFixed(2)}`} />
          <ResultRow label="Total bill" value={`${result.totalBill.toFixed(2)}`} />
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 12 }}>
            Per person: {result.perPersonBill.toFixed(2)}
          </div>
          <ResultRow label="Per person tip" value={`${result.perPersonTip.toFixed(2)}`} />
        </div>
      )}
    </CalcCard>
  );
}

function BMICalc() {
  const [unit, setUnit] = React.useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = React.useState(70);
  const [height, setHeight] = React.useState(175);

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateBMI(weight, height, unit);
    return r.success ? r.data : null;
  }, [weight, height, unit]);

  const bmiColors: Record<string, string> = {
    'Underweight': 'var(--cat-documents)',
    'Normal weight': 'var(--success)',
    'Overweight': 'var(--warning)',
    'Obese': 'var(--danger)',
  };

  return (
    <CalcCard title="BMI Calculator">
      <div className="control-group">
        <label className="control-label">Unit System:</label>
        <select className="control-select" value={unit} onChange={e => setUnit(e.target.value as 'metric' | 'imperial')}>
          <option value="metric">Metric (kg, cm)</option>
          <option value="imperial">Imperial (lbs, in)</option>
        </select>
      </div>
      <NumInput label={unit === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'} value={weight} onChange={setWeight} min={1} step={0.5} />
      <NumInput label={unit === 'metric' ? 'Height (cm)' : 'Height (inches)'} value={height} onChange={setHeight} min={1} step={0.5} />
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: bmiColors[result.category] || 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            {result.bmi}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: bmiColors[result.category] || 'var(--accent)', marginBottom: 12 }}>
            {result.category}
          </div>
          <ResultRow label={`Healthy range (${unit === 'metric' ? 'kg' : 'lbs'})`} value={`${result.healthyWeightRange.min} – ${result.healthyWeightRange.max}`} />
        </div>
      )}
    </CalcCard>
  );
}

function BMRCalc() {
  const [weight, setWeight] = React.useState(70);
  const [height, setHeight] = React.useState(175);
  const [age, setAge] = React.useState(30);
  const [sex, setSex] = React.useState<'male' | 'female'>('male');

  const result = React.useMemo(() => {
    const r = FinanceEngine.calculateBMR(weight, height, age, sex);
    return r.success ? r.data : null;
  }, [weight, height, age, sex]);

  return (
    <CalcCard title="Calorie / BMR Calculator">
      <div className="control-group">
        <label className="control-label">Sex:</label>
        <select className="control-select" value={sex} onChange={e => setSex(e.target.value as 'male' | 'female')}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <NumInput label="Weight (kg)" value={weight} onChange={setWeight} min={1} step={0.5} />
      <NumInput label="Height (cm)" value={height} onChange={setHeight} min={1} />
      <NumInput label="Age (years)" value={age} onChange={setAge} min={1} />
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            BMR: {result.bmr} kcal/day
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>Formula: {result.formula}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>TDEE (Total Daily Energy Expenditure):</div>
          {Object.entries(result.tdee).map(([level, kcal]) => (
            <ResultRow key={level} label={level} value={`${kcal} kcal`} mono={false} />
          ))}
        </div>
      )}
    </CalcCard>
  );
}

function NumberBaseCalc() {
  const [value, setValue] = React.useState('255');
  const [fromBase, setFromBase] = React.useState(10);
  const [toBase, setToBase] = React.useState(16);

  const result = React.useMemo(() => {
    const r = FinanceEngine.convertBase(value, fromBase, toBase);
    return r.success ? r.data : null;
  }, [value, fromBase, toBase]);

  const err = React.useMemo(() => {
    if (!value.trim()) return null;
    const r = FinanceEngine.convertBase(value, fromBase, toBase);
    return r.success ? null : r.error;
  }, [value, fromBase, toBase]);

  return (
    <CalcCard title="Number Base Converter">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="control-group">
          <label className="control-label">From Base:</label>
          <select className="control-select" value={fromBase} onChange={e => setFromBase(Number(e.target.value))}>
            <option value={2}>Base 2 (Binary)</option>
            <option value={8}>Base 8 (Octal)</option>
            <option value={10}>Base 10 (Decimal)</option>
            <option value={16}>Base 16 (Hex)</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Value:</label>
          <input className="control-input" value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">To Base:</label>
          <select className="control-select" value={toBase} onChange={e => setToBase(Number(e.target.value))}>
            <option value={2}>Base 2 (Binary)</option>
            <option value={8}>Base 8 (Octal)</option>
            <option value={10}>Base 10 (Decimal)</option>
            <option value={16}>Base 16 (Hex)</option>
          </select>
        </div>
      </div>
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{err}</div>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
            {result.result}
          </div>
          <ResultRow label="Binary" value={result.allBases.Binary} />
          <ResultRow label="Octal" value={result.allBases.Octal} />
          <ResultRow label="Decimal" value={result.allBases.Decimal} />
          <ResultRow label="Hexadecimal" value={result.allBases.Hexadecimal} />
        </div>
      )}
    </CalcCard>
  );
}

function RomanNumeralCalc() {
  const [input, setInput] = React.useState('2024');
  const [dir, setDir] = React.useState<'toRoman' | 'toDecimal'>('toRoman');

  const result = React.useMemo(() => {
    const r = FinanceEngine.convertRoman(input, dir);
    return r.success ? r.data : null;
  }, [input, dir]);

  const err = React.useMemo(() => {
    const r = FinanceEngine.convertRoman(input, dir);
    return r.success ? null : r.error;
  }, [input, dir]);

  return (
    <CalcCard title="Roman Numerals Converter">
      <div className="control-group">
        <label className="control-label">Direction:</label>
        <select className="control-select" value={dir} onChange={e => setDir(e.target.value as 'toRoman' | 'toDecimal')}>
          <option value="toRoman">Number → Roman</option>
          <option value="toDecimal">Roman → Number</option>
        </select>
      </div>
      <div className="control-group">
        <label className="control-label">{dir === 'toRoman' ? 'Number (1–3999)' : 'Roman Numeral'}:</label>
        <input className="control-input"
          value={input} onChange={e => setInput(e.target.value)} />
      </div>
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{err}</div>}
      {result && !err && (
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 16 }}>
          {result}
        </div>
      )}
    </CalcCard>
  );
}

function NumberToWordsCalc() {
  const [num, setNum] = React.useState(1000000);

  const result = React.useMemo(() => {
    const r = FinanceEngine.numberToWords(num);
    return r.success ? r.data : null;
  }, [num]);

  const err = React.useMemo(() => {
    const r = FinanceEngine.numberToWords(num);
    return r.success ? null : r.error;
  }, [num]);

  return (
    <CalcCard title="Number to Words">
      <div className="control-group">
        <label className="control-label">Number:</label>
        <input type="number" className="control-input" value={num} onChange={e => setNum(Number(e.target.value))} />
      </div>
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{err}</div>}
      {result && !err && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface)', borderRadius: 6 }}>
          <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.6, textTransform: 'capitalize' }}>{result}</div>
        </div>
      )}
    </CalcCard>
  );
}
