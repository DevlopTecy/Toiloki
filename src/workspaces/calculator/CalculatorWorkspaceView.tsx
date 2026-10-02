import React, { useState } from 'react';
import { CalcEngine, StatsResult, DiscountResult } from '../../engines/calculator/calc.engine';
import { Copy, Check, RotateCcw, ArrowRightLeft, Equal } from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import { CalcKeypad } from '../../components/common/CalcKeypad';
import './CalculatorWorkspaceView.css';

interface CalculatorWorkspaceViewProps {
  featureId: string;
}

export const CalculatorWorkspaceView: React.FC<CalculatorWorkspaceViewProps> = ({ featureId }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // =================== BASIC & SCIENTIFIC CALCULATOR STATE ===================
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcHistory, setCalcHistory] = useState<string[]>([]);
  const [isRad, setIsRad] = useState<boolean>(false);

  const handleCalcInput = (token: string) => {
    const mapped = token === '÷' ? '/' : token === '×' ? '*' : token === '−' ? '-' : token;
    if (mapped === 'C' || mapped === 'CE') {
      setCalcDisplay('0');
    } else if (mapped === '⌫') {
      if (calcDisplay.length > 1) {
        setCalcDisplay(calcDisplay.slice(0, -1));
      } else {
        setCalcDisplay('0');
      }
    } else if (mapped === '=') {
      const res = CalcEngine.evaluateExpression(calcDisplay);
      if (res.success && res.data) {
        setCalcHistory((prev) => [`${calcDisplay} = ${res.data}`, ...prev.slice(0, 9)]);
        setCalcDisplay(res.data);
        HistoryService.record({
          toolName: 'Calculator',
          workspaceId: 'calculator',
          utilityId: 'calc-general',
          featureId: 'calc-basic',
          input: calcDisplay,
          output: res.data,
          status: 'completed',
        });
      } else {
        setCalcDisplay('Error');
      }
    } else if (mapped === '±') {
      if (calcDisplay.startsWith('-')) {
        setCalcDisplay(calcDisplay.slice(1));
      } else if (calcDisplay !== '0') {
        setCalcDisplay('-' + calcDisplay);
      }
    } else {
      if (calcDisplay === '0' || calcDisplay === 'Error') {
        setCalcDisplay(mapped);
      } else {
        setCalcDisplay(calcDisplay + mapped);
      }
    }
  };

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
      {featureId === 'calc-basic' && (
        <CalcKeypad
          displayValue={calcDisplay}
          expression={calcHistory.length > 0 ? calcHistory[0] : undefined}
          onKeyPress={handleCalcInput}
          history={calcHistory}
          onClearHistory={() => setCalcHistory([])}
          onSelectHistory={(item) => setCalcDisplay(item.split('=')[1]?.trim() || '0')}
        />
      )}

      {/* 2. SCIENTIFIC CALCULATOR */}
      {featureId === 'calc-trig-logs' && (
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
      {featureId === 'calc-percentage' && (
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
      {featureId === 'calc-discount' && (
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
      {featureId === 'calc-ratio' && (
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
      {featureId === 'calc-constants' && (
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
      {featureId === 'calc-fractions' && (
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
      {featureId === 'calc-statistics' && (
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
      {featureId === 'calc-equations' && (
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
      {featureId === 'calc-ohms-law' && (
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
      {featureId === 'calc-power' && (
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
      {featureId === 'unit-converter-all' && (
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
    </div>
  );
};
