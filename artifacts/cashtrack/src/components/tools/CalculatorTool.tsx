import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Delete, Percent, Divide, Minus, Plus, X } from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '@/utils';

export function CalculatorTool() {
  const [currencyMode, setCurrencyMode] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const calculate = (a: string, b: string, op: string) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return '';
    let result = 0;
    switch (op) {
      case '+': result = numA + numB; break;
      case '-': result = numA - numB; break;
      case '×': result = numA * numB; break;
      case '÷': result = numB === 0 ? 0 : numA / numB; break;
    }
    return parseFloat(result.toPrecision(10)).toString();
  };

  const handleNum = (num: string) => {
    if (waitingForNewValue) {
      setDisplayValue(num);
      setWaitingForNewValue(false);
    } else {
      setDisplayValue(displayValue === '0' ? num : displayValue + num);
    }
  };

  const handleDot = () => {
    if (waitingForNewValue) {
      setDisplayValue('0.');
      setWaitingForNewValue(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const handleOp = (op: string) => {
    if (operator && !waitingForNewValue && previousValue != null) {
      const result = calculate(previousValue, displayValue, operator);
      setDisplayValue(result);
      setPreviousValue(result);
    } else {
      setPreviousValue(displayValue);
    }
    setOperator(op);
    setWaitingForNewValue(true);
  };

  const handleEqual = () => {
    if (operator && previousValue != null) {
      const result = calculate(previousValue, displayValue, operator);
      setDisplayValue(result);
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleDelete = () => {
    if (waitingForNewValue) return;
    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  };

  const handlePercent = () => {
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      setDisplayValue(parseFloat((val / 100).toPrecision(10)).toString());
    }
  };

  const renderDisplayValue = () => {
    let num = parseFloat(displayValue);
    if (isNaN(num)) return displayValue;
    if (currencyMode) {
      return num >= 10000000 ? formatCompactCurrency(num) : formatCurrency(num);
    }
    if (displayValue.length > 10) return num.toExponential(4);
    return displayValue;
  };

  const getExpression = () => {
    if (previousValue != null && operator) {
      return `${previousValue} ${operator}`;
    }
    return '';
  };

  return (
    <div className="flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex justify-end p-4 border-b border-border/50">
        <button
          onClick={() => setCurrencyMode(!currencyMode)}
          className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
            currencyMode 
              ? 'bg-primary/10 border-primary text-primary' 
              : 'bg-background border-border text-muted-foreground'
          }`}
        >
          ₹ INR Mode
        </button>
      </div>

      <div className="flex flex-col items-end justify-end p-6 min-h-[140px] bg-background/30">
        <span className="text-muted-foreground text-sm font-medium h-5 tracking-widest">
          {getExpression()}
        </span>
        <span className="figure-lg text-foreground truncate max-w-full tracking-tighter mt-1">
          {renderDisplayValue()}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 p-5 sm:p-6 bg-card">
        <CalcBtn onClick={handleClear} variant="fn">C</CalcBtn>
        <CalcBtn onClick={handleDelete} variant="fn"><Delete className="w-5 h-5" /></CalcBtn>
        <CalcBtn onClick={handlePercent} variant="fn"><Percent className="w-5 h-5" /></CalcBtn>
        <CalcBtn onClick={() => handleOp('÷')} variant="op" active={operator === '÷'}><Divide className="w-5 h-5" /></CalcBtn>

        <CalcBtn onClick={() => handleNum('7')} variant="num">7</CalcBtn>
        <CalcBtn onClick={() => handleNum('8')} variant="num">8</CalcBtn>
        <CalcBtn onClick={() => handleNum('9')} variant="num">9</CalcBtn>
        <CalcBtn onClick={() => handleOp('×')} variant="op" active={operator === '×'}><X className="w-5 h-5" /></CalcBtn>

        <CalcBtn onClick={() => handleNum('4')} variant="num">4</CalcBtn>
        <CalcBtn onClick={() => handleNum('5')} variant="num">5</CalcBtn>
        <CalcBtn onClick={() => handleNum('6')} variant="num">6</CalcBtn>
        <CalcBtn onClick={() => handleOp('-')} variant="op" active={operator === '-'}><Minus className="w-5 h-5" /></CalcBtn>

        <CalcBtn onClick={() => handleNum('1')} variant="num">1</CalcBtn>
        <CalcBtn onClick={() => handleNum('2')} variant="num">2</CalcBtn>
        <CalcBtn onClick={() => handleNum('3')} variant="num">3</CalcBtn>
        <CalcBtn onClick={() => handleOp('+')} variant="op" active={operator === '+'}><Plus className="w-5 h-5" /></CalcBtn>

        <CalcBtn onClick={() => handleNum('0')} variant="num" className="col-span-2">0</CalcBtn>
        <CalcBtn onClick={handleDot} variant="num">.</CalcBtn>
        <CalcBtn onClick={handleEqual} variant="eq">=</CalcBtn>
      </div>
    </div>
  );
}

function CalcBtn({ 
  children, onClick, variant, active, className = '' 
}: { 
  children: React.ReactNode, onClick: () => void, variant: 'fn' | 'op' | 'num' | 'eq', active?: boolean, className?: string 
}) {
  const baseColors = {
    fn: 'bg-background border-border text-muted-foreground',
    op: active ? 'bg-background border-primary text-primary' : 'bg-background border-border text-muted-foreground',
    num: 'bg-card border-border text-foreground hover:bg-background',
    eq: 'bg-destructive border-destructive text-white',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`flex items-center justify-center h-14 rounded-xl border font-bold text-lg shadow-sm transition-colors ${baseColors[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
