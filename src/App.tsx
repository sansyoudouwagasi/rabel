import React, { useState, useEffect } from 'react';
import type { LabelSize, SavedLabel, ViewState } from './types/label';
import type { LabelTemplate } from './templates/templates';
import { Home } from './pages/Home';
import { CreateLabel } from './pages/CreateLabel';
import { TemplateSelect } from './pages/TemplateSelect';
import { Editor } from './pages/Editor';
import { PrintPreview } from './pages/PrintPreview';
import { SavedLabels } from './pages/SavedLabels';
import { Products } from './pages/Products';
import { Settings } from './pages/Settings';
import { BottomNav, type BottomNavTab } from './components/BottomNav';

export const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'home' });
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [selectedSize, setSelectedSize] = useState<LabelSize>({ width: 50, height: 30 });
  const [editingLabel, setEditingLabel] = useState<{
    size: LabelSize;
    savedLabel?: SavedLabel;
    template?: LabelTemplate | null;
  } | null>(null);
  const [printingLabel, setPrintingLabel] = useState<SavedLabel | null>(null);

  // 画面遷移時にスクロール位置を確実にリセット
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [viewState.type]);

  // ボトムナビタブ切り替え
  const handleTabChange = (tab: BottomNavTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setViewState({ type: 'home' });
    } else if (tab === 'saved') {
      setViewState({ type: 'saved_labels' });
    } else if (tab === 'products') {
      setViewState({ type: 'products' });
    } else if (tab === 'settings') {
      setViewState({ type: 'settings' });
    }
  };

  // 新規ラベル作成開始: ホーム -> サイズ選択
  const handleCreateNew = () => {
    setViewState({ type: 'create_size' });
  };

  // サイズ選択完了: サイズ選択 -> テンプレート選択
  const handleSelectSize = (size: LabelSize) => {
    setSelectedSize(size);
    setViewState({ type: 'create_template', size });
  };

  // テンプレート選択完了: テンプレート選択 -> エディタ
  const handleSelectTemplate = (template: LabelTemplate | null) => {
    setEditingLabel({
      size: selectedSize,
      template,
    });
    setViewState({
      type: 'editor',
      initialSize: selectedSize,
      templateId: template?.id,
    });
  };

  // 既存ラベルの編集開始
  const handleEditLabel = (label: SavedLabel) => {
    setEditingLabel({
      size: {
        width: label.width,
        height: label.height,
        name: `${label.width}×${label.height}mm`,
        paperOrientation: label.paperOrientation,
      },
      savedLabel: label,
    });
    setViewState({
      type: 'editor',
      labelId: label.id,
      initialSize: {
        width: label.width,
        height: label.height,
        paperOrientation: label.paperOrientation,
      },
    });
  };

  // 印刷プレビューを開く
  const handleOpenPrint = (label: SavedLabel) => {
    setPrintingLabel(label);
    setViewState({ type: 'print_preview', label });
  };

  // エディタまたはプレビューから戻る
  const handleBackToHome = () => {
    setViewState({ type: 'home' });
    setActiveTab('home');
    setEditingLabel(null);
    setPrintingLabel(null);
  };

  // 画面の条件付きレンダリング
  const renderContent = () => {
    switch (viewState.type) {
      case 'home':
        return (
          <Home
            onCreateNew={handleCreateNew}
            onEditLabel={handleEditLabel}
            onViewAllSaved={() => handleTabChange('saved')}
          />
        );

      case 'create_size':
        return (
          <CreateLabel
            onBack={() => setViewState({ type: 'home' })}
            onSelectSize={handleSelectSize}
          />
        );

      case 'create_template':
        return (
          <TemplateSelect
            size={viewState.size}
            onBack={() => setViewState({ type: 'create_size' })}
            onSelectTemplate={handleSelectTemplate}
          />
        );

      case 'editor':
        if (!editingLabel) return null;
        return (
          <Editor
            initialSize={editingLabel.size}
            existingLabel={editingLabel.savedLabel}
            templateId={editingLabel.template?.id}
            onBack={handleBackToHome}
            onOpenPrint={handleOpenPrint}
            onSaved={(saved) => {
              setEditingLabel({
                size: {
                  width: saved.width,
                  height: saved.height,
                  paperOrientation: saved.paperOrientation,
                },
                savedLabel: saved,
              });
            }}
          />
        );

      case 'print_preview':
        if (!printingLabel) return null;
        return (
          <PrintPreview
            label={printingLabel}
            onBack={() => {
              if (editingLabel) {
                setViewState({ type: 'editor', initialSize: editingLabel.size });
              } else {
                handleTabChange('saved');
              }
            }}
          />
        );

      case 'saved_labels':
        return (
          <SavedLabels
            onCreateNew={handleCreateNew}
            onEditLabel={handleEditLabel}
            onPrintLabel={handleOpenPrint}
          />
        );

      case 'products':
        return <Products />;

      case 'settings':
        return <Settings />;

      default:
        return null;
    }
  };

  // フルスクリーン作業領域（エディタ、プレビュー、作成フロー中はボトムナビを隠す）
  const showBottomNav =
    viewState.type === 'home' ||
    viewState.type === 'saved_labels' ||
    viewState.type === 'products' ||
    viewState.type === 'settings';

  // エディタ画面および印刷プレビュー画面は親ラッパーを排除して直接レンダリング
  if (viewState.type === 'editor' || viewState.type === 'print_preview') {
    return <>{renderContent()}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      <div className="flex-1">{renderContent()}</div>
      {showBottomNav && (
        <BottomNav activeTab={activeTab} onSelectTab={handleTabChange} />
      )}
    </div>
  );
};

export default App;
