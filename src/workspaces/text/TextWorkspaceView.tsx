import React, { useState, useMemo, useEffect } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { SplitEditor } from '../../components/common/SplitEditor';
import { TextEngine, CaseType } from '../../engines/text/text.engine';
import { DiffEngine, DiffChange } from '../../engines/diff/diff.engine';
import { DevEngine } from '../../engines/developer/dev.engine';
import { GitCompare } from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import './TextWorkspaceView.css';

interface TextWorkspaceViewProps {
  utilityId: string;
  featureId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const TextWorkspaceView: React.FC<TextWorkspaceViewProps> = ({
  utilityId,
  featureId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  const [inputText, setInputText] = useState(
    'The quick brown fox jumps over the lazy dog.\n\nToiloki provides offline local utilities with zero tracking.\nExtra whitespace and duplicate lines can be cleaned in milliseconds.'
  );
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCaseOption, setActiveCaseOption] = useState<string>(() => {
    if (featureId.startsWith('case-')) return featureId;
    return 'case-upper';
  });

  // Compare diff state
  const [compareLeft, setCompareLeft] = useState(
    'First line of original document.\nSecond line with some parameters.\nThird line unchanged.\nFourth line for testing.'
  );
  const [compareRight, setCompareRight] = useState(
    'First line of original document.\nSecond line with updated production parameters.\nThird line unchanged.\nFifth line newly appended.'
  );
  const [diffChanges, setDiffChanges] = useState<DiffChange[] | null>(null);

  // Sync activeCaseOption when featureId prop changes
  useEffect(() => {
    if (featureId.startsWith('case-')) {
      setActiveCaseOption(featureId);
      runTransform(featureId);
    } else if (featureId.startsWith('clean-') || featureId.startsWith('remove-')) {
      runTransform(featureId);
    }
  }, [featureId]);

  // Text analysis metrics
  const metrics = useMemo(() => {
    const res = TextEngine.analyzeText(inputText);
    return res.data || { words: 0, characters: 0, lines: 0, sentences: 0, readingTimeMin: 0 };
  }, [inputText]);

  const runTransform = (actionId: string) => {
    let result = '';

    if (actionId.startsWith('case-')) {
      const mode = actionId.replace('case-', '') as CaseType;
      const res = TextEngine.transformCase(inputText, mode);
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'clean-trim' || actionId === 'trim') {
      const res = TextEngine.cleanText(inputText, { removeExtraSpaces: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'remove-spaces' || actionId === 'clean-spaces') {
      const res = TextEngine.cleanText(inputText, { removeExtraSpaces: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'remove-blank-lines' || actionId === 'clean-blank') {
      const res = TextEngine.cleanText(inputText, { removeBlankLines: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'strip-invisible') {
      const res = TextEngine.cleanText(inputText, { stripInvisibleChars: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'base64-encode') {
      const res = DevEngine.encodeDecode(inputText, 'base64-encode');
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'base64-decode') {
      const res = DevEngine.encodeDecode(inputText, 'base64-decode');
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'url-encode') {
      const res = DevEngine.encodeDecode(inputText, 'url-encode');
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'url-decode') {
      const res = DevEngine.encodeDecode(inputText, 'url-decode');
      if (res.success && res.data) result = res.data;
    } else {
      result = inputText;
    }

    setOutputText(result);

    HistoryService.record({
      toolName,
      workspaceId: 'text',
      utilityId,
      featureId: actionId,
      input: `${inputText.length} chars`,
      output: `Completed ${actionId}`,
      status: 'completed',
    });
  };

  const handleSwap = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setDiffChanges(null);
  };

  const handleCopyOutput = async () => {
    const textToCopy = outputText || inputText;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveOutput = () => {
    const textToSave = outputText || inputText;
    if (!textToSave) return;
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toiloki_${featureId}_output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunDiff = () => {
    const res = DiffEngine.compareLines(compareLeft, compareRight);
    if (res.success && res.data) {
      setDiffChanges(res.data.changes);
    }
  };

  const caseOptions = [
    { id: 'case-upper', label: 'UPPERCASE' },
    { id: 'case-lower', label: 'lowercase' },
    { id: 'case-title', label: 'Title Case' },
    { id: 'case-sentence', label: 'Sentence case' },
    { id: 'case-camel', label: 'camelCase' },
    { id: 'case-snake', label: 'snake_case' },
    { id: 'case-kebab', label: 'kebab-case' },
    { id: 'case-pascal', label: 'PascalCase' },
    { id: 'case-constant', label: 'CONSTANT_CASE' },
  ];

  const cleanOptions = [
    { id: 'clean-trim', label: 'Trim Lines' },
    { id: 'remove-spaces', label: 'Remove Extra Spaces' },
    { id: 'remove-blank-lines', label: 'Remove Blank Lines' },
    { id: 'strip-invisible', label: 'Strip Invisible Chars' },
  ];

  const breadcrumbs = [
    { label: 'Home', onClick: onBackToUtilities },
    { label: 'Text', onClick: onBackToUtilities },
    { label: toolName },
  ];

  return (
    <ToolLayout
      breadcrumbItems={breadcrumbs}
      title={toolName}
      description={toolDescription}
      badgeGradient="var(--badge-text)"
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReset={handleClear}
    >
      <div className="text-tool-body">
        {featureId === 'text-diff' ? (
          /* Compare Diff Tool */
          <div className="text-compare-container">
            <div className="compare-editors-grid">
              <div className="compare-pane">
                <span className="pane-header-label">Original Text (A)</span>
                <textarea
                  className="compare-textarea"
                  value={compareLeft}
                  onChange={(e) => setCompareLeft(e.target.value)}
                  placeholder="Paste original text here..."
                  spellCheck={false}
                />
              </div>
              <div className="compare-pane">
                <span className="pane-header-label">Modified Text (B)</span>
                <textarea
                  className="compare-textarea"
                  value={compareRight}
                  onChange={(e) => setCompareRight(e.target.value)}
                  placeholder="Paste modified text here..."
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="compare-actions-bar">
              <button
                type="button"
                className="toiloki-btn toiloki-btn-primary"
                onClick={handleRunDiff}
              >
                <GitCompare size={15} />
                <span>Compare Side-by-Side</span>
              </button>
            </div>

            {diffChanges && (
              <div className="diff-results-card">
                <div className="diff-card-header">
                  <h4 className="diff-card-title">Diff Comparison Output</h4>
                  <div className="diff-legend">
                    <span className="legend-chip added">+ Added</span>
                    <span className="legend-chip removed">− Removed</span>
                    <span className="legend-chip unchanged">Unchanged</span>
                  </div>
                </div>
                <div className="diff-pre-box">
                  {diffChanges.map((c, i) => (
                    <div
                      key={i}
                      className={`diff-line-row ${
                        c.added ? 'added' : c.removed ? 'removed' : 'unchanged'
                      }`}
                    >
                      <span className="diff-gutter-symbol">
                        {c.added ? '+' : c.removed ? '−' : ' '}
                      </span>
                      <span className="diff-line-content">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TEMPLATE B: Shared Split Editor */
          <SplitEditor
            toolbarOptions={
              utilityId === 'whitespace-lines' ? (
                <div className="segmented-chip-row">
                  {cleanOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`segmented-chip-btn ${activeCaseOption === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCaseOption(opt.id);
                        runTransform(opt.id);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="segmented-chip-row">
                  {caseOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`segmented-chip-btn ${activeCaseOption === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCaseOption(opt.id);
                        runTransform(opt.id);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )
            }
            primaryAction={{
              label: 'Apply',
              onClick: () => runTransform(activeCaseOption),
            }}
            onClear={handleClear}
            onCopy={handleCopyOutput}
            onSwap={handleSwap}
            onSave={handleSaveOutput}
            copied={copied}
            inputValue={inputText}
            onInputChange={setInputText}
            inputLabel="Input"
            inputMeta={`${inputText.length} chars`}
            outputValue={outputText}
            onOutputChange={setOutputText}
            outputLabel="Output"
            outputMeta={`${outputText.length} chars`}
            stats={`${metrics.words} words • ${metrics.characters} chars • ${metrics.lines} lines`}
          />
        )}
      </div>
    </ToolLayout>
  );
};
