import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Settings, Users, Building2, RotateCcw, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

// ヘルパー関数
const formatYen = (amount) => Math.floor(amount).toLocaleString();
const parseNum = (val, max = 100000000) => {
  const n = parseInt(String(val).replace(/[^0-9]/g, ''));
  if (isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > max) return max;
  return n;
};
const parseQty = (val) => parseNum(val, 999);
const parseYen = (val) => parseNum(val, 100000000);

// ローカルストレージキー
const STORAGE_KEY = 'shiri_sensor_tco_data';

// デフォルト値
const defaultQuantities = {
  camera: 2,
  sensorNormal: 3,
  sensorHigh: 1,
  wireless: 2,
};

const defaultOwnCosts = {
  camera: 150000,
  sensorNormal: 200000,
  sensorHigh: 500000,
  wireless: 80000,
  miscellaneous: 50000,
  installCamera: 50000,
  installOther: 300000,
  monitoring: 30000,
  lte: 3000,
  storage: 5000,
};

const defaultOwnPrices = {
  camera: 195000,
  sensorNormal: 260000,
  sensorHigh: 650000,
  wireless: 104000,
  miscellaneous: 65000,
  installCamera: 50000,
  installOther: 300000,
  monitoring: 39000,
  lte: 3900,
  storage: 6500,
};

const defaultCompetitorPrices = {
  camera: 0,
  installCamera: 0,
  sensorNormal: 0,
  sensorHigh: 0,
  wireless: 0,
  miscellaneous: 0,
  installOther: 0,
  monitoring: 0,
  lte: 0,
  storage: 0,
};

// 共通の項目定義
const getItemDefs = (quantities, calculations) => {
  const c = calculations;
  const q = quantities;
  return {
    initialItems: [
      { key: 'camera', label: '監視カメラ', category: '監視カメラ', unitPrice: c.cameraCosts.camera.unitPrice, qty: q.camera },
      { key: 'installCamera', label: '設置設定費', category: '監視カメラ', unitPrice: c.cameraCosts.installCamera.unitPrice, qty: q.camera },
      { key: 'sensorNormal', label: 'アクアテック製水質センサー', category: 'センサ機器', unitPrice: c.sensorIctCosts.sensorNormal.unitPrice, qty: q.sensorNormal },
      { key: 'wireless', label: '無線オプション', category: 'センサ機器', unitPrice: c.sensorIctCosts.wireless.unitPrice, qty: q.wireless },
      { key: 'installOther', label: 'ハード設定費', category: 'センサ機器', unitPrice: c.sensorIctCosts.installOther.unitPrice, qty: 1, isLumpSum: true },
    ],
    miscItems: [
      { key: 'miscellaneous', label: 'ステンレススタンド/PoEHUB', category: 'ステンレススタンド/PoEHUB', unitPrice: c.miscCosts.miscellaneous.unitPrice, qty: 1, isLumpSum: true },
    ],
    annualItems: [
      { key: 'monitoring', label: 'モニタリング' },
      { key: 'lte', label: 'LTE通信料' },
      { key: 'storage', label: 'ストレージ' },
    ],
  };
};

// ローカルストレージから読み込み
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // データの整合性チェック
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    // 壊れたデータをクリア
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

const App = () => {
  const [viewMode, setViewMode] = useState('internal');
  const savedData = loadFromStorage();
  const [quantities, setQuantities] = useState({ ...defaultQuantities, ...(savedData?.quantities || {}) });
  const [ownCosts, setOwnCosts] = useState({ ...defaultOwnCosts, ...(savedData?.ownCosts || {}) });
  const [ownPrices, setOwnPrices] = useState({ ...defaultOwnPrices, ...(savedData?.ownPrices || {}) });
  const [competitorPrices, setCompetitorPrices] = useState({ ...defaultCompetitorPrices, ...(savedData?.competitorPrices || {}) });

  useEffect(() => {
    const data = { quantities, ownCosts, ownPrices, competitorPrices };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [quantities, ownCosts, ownPrices, competitorPrices]);

  const resetData = () => {
    if (window.confirm('入力データをリセットしますか？')) {
      setQuantities(defaultQuantities);
      setOwnCosts(defaultOwnCosts);
      setOwnPrices(defaultOwnPrices);
      setCompetitorPrices(defaultCompetitorPrices);
    }
  };

  // 計算ロジック
  const calculations = useMemo(() => {
    const q = quantities;

    const cameraCosts = {
      camera: { cost: ownCosts.camera * q.camera, sales: ownPrices.camera * q.camera, qty: q.camera, unitCost: ownCosts.camera, unitPrice: ownPrices.camera },
      installCamera: { cost: ownCosts.installCamera * q.camera, sales: ownPrices.installCamera * q.camera, qty: q.camera, unitCost: ownCosts.installCamera, unitPrice: ownPrices.installCamera },
    };
    const cameraTotalCost = Object.values(cameraCosts).reduce((sum, item) => sum + item.cost, 0);
    const cameraTotalSales = Object.values(cameraCosts).reduce((sum, item) => sum + item.sales, 0);

    const sensorIctCosts = {
      sensorNormal: { cost: ownCosts.sensorNormal * q.sensorNormal, sales: ownPrices.sensorNormal * q.sensorNormal, qty: q.sensorNormal, unitCost: ownCosts.sensorNormal, unitPrice: ownPrices.sensorNormal },
      wireless: { cost: ownCosts.wireless * q.wireless, sales: ownPrices.wireless * q.wireless, qty: q.wireless, unitCost: ownCosts.wireless, unitPrice: ownPrices.wireless },
      installOther: { cost: ownCosts.installOther, sales: ownPrices.installOther, qty: 1, unitCost: ownCosts.installOther, unitPrice: ownPrices.installOther },
    };
    const sensorIctTotalCost = Object.values(sensorIctCosts).reduce((sum, item) => sum + item.cost, 0);
    const sensorIctTotalSales = Object.values(sensorIctCosts).reduce((sum, item) => sum + item.sales, 0);

    const miscCosts = {
      miscellaneous: { cost: ownCosts.miscellaneous, sales: ownPrices.miscellaneous, qty: 1, unitCost: ownCosts.miscellaneous, unitPrice: ownPrices.miscellaneous },
    };
    const miscTotalCost = miscCosts.miscellaneous.cost;
    const miscTotalSales = miscCosts.miscellaneous.sales;

    const multiSensorCosts = {
      sensorHigh: { cost: ownCosts.sensorHigh * q.sensorHigh, sales: ownPrices.sensorHigh * q.sensorHigh, qty: q.sensorHigh, unitCost: ownCosts.sensorHigh, unitPrice: ownPrices.sensorHigh },
    };
    const multiSensorTotalCost = multiSensorCosts.sensorHigh.cost;
    const multiSensorTotalSales = multiSensorCosts.sensorHigh.sales;

    const initialCost = cameraTotalCost + sensorIctTotalCost + multiSensorTotalCost + miscTotalCost;
    const initialSales = cameraTotalSales + sensorIctTotalSales + multiSensorTotalSales + miscTotalSales;
    const initialProfit = initialSales - initialCost;

    const lteQty = q.sensorNormal + q.sensorHigh;
    const swCosts = {
      monitoring: { costMonth: ownCosts.monitoring, costYear: ownCosts.monitoring * 12, salesMonth: ownPrices.monitoring, salesYear: ownPrices.monitoring * 12 },
      lte: { costMonth: ownCosts.lte * lteQty, costYear: ownCosts.lte * lteQty * 12, salesMonth: ownPrices.lte * lteQty, salesYear: ownPrices.lte * lteQty * 12, qty: lteQty, unitCost: ownCosts.lte, unitPrice: ownPrices.lte },
      storage: { costMonth: ownCosts.storage, costYear: ownCosts.storage * 12, salesMonth: ownPrices.storage, salesYear: ownPrices.storage * 12 },
    };
    const swTotalCostYear = swCosts.monitoring.costYear + swCosts.lte.costYear + swCosts.storage.costYear;
    const swTotalSalesYear = swCosts.monitoring.salesYear + swCosts.lte.salesYear + swCosts.storage.salesYear;

    const runningCostYear = swTotalCostYear;
    const runningSalesYear = swTotalSalesYear;
    const runningProfitYear = runningSalesYear - runningCostYear;

    const cp = competitorPrices;
    const compCameraTotal = cp.camera * q.camera + cp.installCamera * q.camera;
    const compSensorTotal = cp.sensorNormal * q.sensorNormal + cp.wireless * q.wireless + cp.installOther * q.sensorNormal;
    const compMiscTotal = cp.miscellaneous;
    const compInitial = compCameraTotal + compSensorTotal + compMiscTotal;
    const compAnnual =
      cp.monitoring * 12 +
      cp.lte * q.sensorNormal * 12 +
      cp.storage * 12;

    return {
      cameraCosts, cameraTotalCost, cameraTotalSales,
      sensorIctCosts, sensorIctTotalCost, sensorIctTotalSales,
      miscCosts, miscTotalCost, miscTotalSales,
      multiSensorCosts, multiSensorTotalCost, multiSensorTotalSales,
      swCosts, swTotalCostYear, swTotalSalesYear,
      initialCost, initialSales, initialProfit,
      runningCostYear, runningSalesYear, runningProfitYear,
      compCameraTotal, compSensorTotal, compMiscTotal,
      compInitial, compAnnual,
    };
  }, [quantities, ownCosts, ownPrices, competitorPrices]);

  const exportPDF = () => {
    window.print();
  };

  const exportExcel = () => {
    const c = calculations;
    const data = [
      ['水質モニタリングアプリケーション シミュレーション結果'],
      [''],
      ['【初期費用】'],
      ['項目', '単価', '数量', '金額'],
      ['監視カメラ', ownPrices.camera, quantities.camera, c.cameraCosts.camera.sales],
      ['監視カメラ設置設定費', ownPrices.installCamera, quantities.camera, c.cameraCosts.installCamera.sales],
      ['アクアテック製水質センサー', ownPrices.sensorNormal, quantities.sensorNormal, c.sensorIctCosts.sensorNormal.sales],
      ['無線オプション', ownPrices.wireless, quantities.wireless, c.sensorIctCosts.wireless.sales],
      ['ハード設定費', ownPrices.installOther, '一式', c.sensorIctCosts.installOther.sales],
      ['ザイレム製水質センサ', ownPrices.sensorHigh, quantities.sensorHigh, c.multiSensorCosts.sensorHigh.sales],
      ['ステンレススタンド/PoEHUB', ownPrices.miscellaneous, '一式', c.miscCosts.miscellaneous.sales],
      ['初期費用 合計', '', '', c.initialSales],
      [''],
      ['【年間運用費用（水質モニタリングアプリケーション）】'],
      ['項目', '', '', '年額'],
      ['モニタリング', '', '', c.swCosts.monitoring.salesYear],
      ['LTE通信料', '', '', c.swCosts.lte.salesYear],
      ['ストレージ', '', '', c.swCosts.storage.salesYear],
      ['年間運用費用 合計', '', '', c.runningSalesYear],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '見積もり');
    XLSX.writeFile(wb, 'water_monitoring_tco.xlsx');
  };

  const updateQuantity = (key, value) => setQuantities(prev => ({ ...prev, [key]: parseQty(value) }));
  const updateOwnCost = (key, value) => setOwnCosts(prev => ({ ...prev, [key]: parseYen(value) }));
  const updateOwnPrice = (key, value) => setOwnPrices(prev => ({ ...prev, [key]: parseYen(value) }));
  const updateCompetitorPrice = (key, value) => setCompetitorPrices(prev => ({ ...prev, [key]: parseYen(value) }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 font-sans">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-6 print-header-compact">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Calculator size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">水質モニタリングアプリケーション Simulator</h1>
                <p className="text-slate-400 text-sm">費用シミュレーション</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('internal')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'internal' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                <Settings size={18} />
                内部管理
              </button>
              <button
                onClick={() => setViewMode('customer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'customer' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                <Users size={18} />
                顧客提示用
              </button>
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-600">
                <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-orange-600 hover:text-white transition-all" title="PDF出力（印刷）">
                  <Printer size={18} />
                </button>
                <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-green-600 hover:text-white transition-all" title="Excel出力">
                  <FileSpreadsheet size={18} />
                </button>
                <button onClick={resetData} className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-red-600 hover:text-white transition-all" title="データをリセット">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'internal' ? (
        <InternalView
          quantities={quantities}
          ownCosts={ownCosts}
          ownPrices={ownPrices}
          competitorPrices={competitorPrices}
          calculations={calculations}
          updateQuantity={updateQuantity}
          updateOwnCost={updateOwnCost}
          updateOwnPrice={updateOwnPrice}
          updateCompetitorPrice={updateCompetitorPrice}
        />
      ) : (
        <CustomerView
          calculations={calculations}
          quantities={quantities}
          competitorPrices={competitorPrices}
        />
      )}
    </div>
  );
};

// ========================================
// 内部管理用ビュー
// ========================================
const InternalView = ({
  quantities, ownCosts, ownPrices, competitorPrices, calculations,
  updateQuantity, updateOwnCost, updateOwnPrice, updateCompetitorPrice
}) => {
  const c = calculations;
  const { initialItems, annualItems } = getItemDefs(quantities, calculations);

  // カテゴリ分け
  const categories = [];
  let currentCat = null;
  initialItems.forEach(item => {
    if (!currentCat || currentCat.name !== item.category) {
      currentCat = { name: item.category, items: [] };
      categories.push(currentCat);
    }
    currentCat.items.push(item);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左: 自社 */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="font-bold flex items-center gap-2">
              <Building2 size={20} />
              自社
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* 基本数量 */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2 flex items-center gap-2">
                <Settings size={16} className="text-blue-600" />
                基本数量
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InputField label="監視カメラ" value={quantities.camera} onChange={(v) => updateQuantity('camera', v)} suffix="台" />
                <InputField label="アクアテック製水質センサー" value={quantities.sensorNormal} onChange={(v) => updateQuantity('sensorNormal', v)} suffix="台" />
                <InputField label="無線オプション" value={quantities.wireless} onChange={(v) => updateQuantity('wireless', v)} suffix="台" />
              </div>
            </div>

            {/* 収益項目ヘッダー */}
            <div className="grid grid-cols-12 gap-2 items-center text-xs font-bold text-slate-500 border-b pb-2">
              <span className="col-span-2">項目</span>
              <span className="col-span-2 text-center text-blue-600">販売単価</span>
              <span className="col-span-2 text-center text-orange-600">原価</span>
              <span className="col-span-1 text-center">数量</span>
              <span className="col-span-3 text-right text-blue-600">販売計</span>
              <span className="col-span-2 text-right text-orange-600">原価計</span>
            </div>

            {/* センサ機器 */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">センサ機器（初期費用）</h3>
              <div className="space-y-2">
                <CostRow label="アクアテック製水質センサー" cost={ownCosts.sensorNormal} price={ownPrices.sensorNormal} qty={quantities.sensorNormal} onCostChange={(v) => updateOwnCost('sensorNormal', v)} onPriceChange={(v) => updateOwnPrice('sensorNormal', v)} />
                <CostRow label="無線オプション" cost={ownCosts.wireless} price={ownPrices.wireless} qty={quantities.wireless} onCostChange={(v) => updateOwnCost('wireless', v)} onPriceChange={(v) => updateOwnPrice('wireless', v)} />
                <CostRow label="ハード設定費" cost={ownCosts.installOther} price={ownPrices.installOther} qty={1} onCostChange={(v) => updateOwnCost('installOther', v)} onPriceChange={(v) => updateOwnPrice('installOther', v)} />
                <SubtotalRow label="センサ機器小計" cost={c.sensorIctTotalCost} sales={c.sensorIctTotalSales} />
              </div>
            </div>

            {/* 水質モニタリングアプリケーション */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">水質モニタリングアプリケーション（月額）</h3>
              <div className="space-y-2">
                <CostRow label="モニタリング" cost={ownCosts.monitoring} price={ownPrices.monitoring} qty={1} onCostChange={(v) => updateOwnCost('monitoring', v)} onPriceChange={(v) => updateOwnPrice('monitoring', v)} />
                <CostRow label="LTE通信料" cost={ownCosts.lte} price={ownPrices.lte} qty={quantities.sensorNormal + quantities.sensorHigh} onCostChange={(v) => updateOwnCost('lte', v)} onPriceChange={(v) => updateOwnPrice('lte', v)} />
                <CostRow label="ストレージ" cost={ownCosts.storage} price={ownPrices.storage} qty={1} onCostChange={(v) => updateOwnCost('storage', v)} onPriceChange={(v) => updateOwnPrice('storage', v)} />
                <SubtotalRow label="システム小計/年" cost={c.swTotalCostYear} sales={c.swTotalSalesYear} />
              </div>
            </div>

            {/* ザイレム製水質センサ（別枠） */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">ザイレム製水質センサ（初期費用）</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <InputField label="数量" value={quantities.sensorHigh} onChange={(v) => updateQuantity('sensorHigh', v)} suffix="台" />
                </div>
                <CostRow label="ザイレム製水質センサ" cost={ownCosts.sensorHigh} price={ownPrices.sensorHigh} qty={quantities.sensorHigh} onCostChange={(v) => updateOwnCost('sensorHigh', v)} onPriceChange={(v) => updateOwnPrice('sensorHigh', v)} />
                <SubtotalRow label="ザイレム製水質センサ小計" cost={c.multiSensorTotalCost} sales={c.multiSensorTotalSales} />
              </div>
            </div>

            {/* 監視カメラ */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">監視カメラ（初期費用）</h3>
              <div className="space-y-2">
                <CostRow label="監視カメラ" cost={ownCosts.camera} price={ownPrices.camera} qty={quantities.camera} onCostChange={(v) => updateOwnCost('camera', v)} onPriceChange={(v) => updateOwnPrice('camera', v)} />
                <CostRow label="設置設定費" cost={ownCosts.installCamera} price={ownPrices.installCamera} qty={quantities.camera} onCostChange={(v) => updateOwnCost('installCamera', v)} onPriceChange={(v) => updateOwnPrice('installCamera', v)} />
                <SubtotalRow label="カメラ小計" cost={c.cameraTotalCost} sales={c.cameraTotalSales} />
              </div>
            </div>

            {/* ステンレススタンド/PoEHUB（別枠） */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">ステンレススタンド/PoEHUB</h3>
              <div className="space-y-2">
                <CostRow label="ステンレススタンド/PoEHUB" cost={ownCosts.miscellaneous} price={ownPrices.miscellaneous} qty={1} onCostChange={(v) => updateOwnCost('miscellaneous', v)} onPriceChange={(v) => updateOwnPrice('miscellaneous', v)} />
                <SubtotalRow label="ステンレススタンド/PoEHUB小計" cost={c.miscTotalCost} sales={c.miscTotalSales} />
              </div>
            </div>
          </div>
        </div>

        {/* 右: 他社（コンパクト） */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-red-700 text-white px-4 py-4">
            <h2 className="font-bold">他社</h2>
          </div>
          <div className="p-4 space-y-5">
            {/* 基本数量 */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-2 border-b pb-2 flex items-center gap-2">
                <Settings size={16} className="text-red-600" />
                基本数量
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="監視カメラ" value={quantities.camera} onChange={(v) => updateQuantity('camera', v)} suffix="台" />
                <InputField label="水温センサー" value={quantities.sensorNormal} onChange={(v) => updateQuantity('sensorNormal', v)} suffix="台" />
                <InputField label="無線オプション" value={quantities.wireless} onChange={(v) => updateQuantity('wireless', v)} suffix="台" />
              </div>
            </div>

            {/* センサ機器 */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 mb-2 border-b pb-1">センサ機器（初期費用）</h3>
              <div className="space-y-1">
                <CompCostRow label="水温センサー" price={competitorPrices.sensorNormal} qty={quantities.sensorNormal} onChange={(v) => updateCompetitorPrice('sensorNormal', v)} />
                <CompCostRow label="無線オプション" price={competitorPrices.wireless} qty={quantities.wireless} onChange={(v) => updateCompetitorPrice('wireless', v)} />
                <CompCostRow label="ハード設定費" price={competitorPrices.installOther} qty={quantities.sensorNormal} onChange={(v) => updateCompetitorPrice('installOther', v)} />
                <CompSubtotalRow label="センサ機器小計" sales={c.compSensorTotal} />
              </div>
            </div>

            {/* 水質モニタリングアプリケーション */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 mb-2 border-b pb-1">水質モニタリングアプリケーション（月額）</h3>
              <div className="space-y-1">
                <CompCostRow label="モニタリング" price={competitorPrices.monitoring} qty={1} onChange={(v) => updateCompetitorPrice('monitoring', v)} />
                <CompCostRow label="LTE通信料" price={competitorPrices.lte} qty={quantities.sensorNormal} onChange={(v) => updateCompetitorPrice('lte', v)} />
                <CompCostRow label="ストレージ" price={competitorPrices.storage} qty={1} onChange={(v) => updateCompetitorPrice('storage', v)} />
                <CompSubtotalRow label="システム小計/年" sales={c.compAnnual} />
              </div>
            </div>

            {/* 監視カメラ */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 mb-2 border-b pb-1">監視カメラ（初期費用）</h3>
              <div className="space-y-1">
                <CompCostRow label="監視カメラ" price={competitorPrices.camera} qty={quantities.camera} onChange={(v) => updateCompetitorPrice('camera', v)} />
                <CompCostRow label="設置設定費" price={competitorPrices.installCamera} qty={quantities.camera} onChange={(v) => updateCompetitorPrice('installCamera', v)} />
                <CompSubtotalRow label="カメラ小計" sales={competitorPrices.camera * quantities.camera + competitorPrices.installCamera * quantities.camera} />
              </div>
            </div>

            {/* ステンレススタンド/PoEHUB（別枠） */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 mb-2 border-b pb-1">ステンレススタンド/PoEHUB</h3>
              <div className="space-y-1">
                <CompCostRow label="ステンレススタンド/PoEHUB" price={competitorPrices.miscellaneous} qty={1} isLumpSum onChange={(v) => updateCompetitorPrice('miscellaneous', v)} />
                <CompSubtotalRow label="ステンレススタンド/PoEHUB小計" sales={c.compMiscTotal} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 粗利サマリー（下部） */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-600 text-white px-6 py-4">
          <h2 className="font-bold">原価・粗利サマリー</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2 text-xs font-bold text-slate-500">
              <span>項目</span>
              <span className="text-right text-blue-600">販売計</span>
              <span className="text-right text-orange-600">原価計</span>
              <span className="text-right text-emerald-600">粗利額</span>
              <span className="text-right">粗利率</span>
              <span className="text-right text-red-600">他社販売計</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-sm">
              <span>センサ機器</span>
              <span className="text-right font-mono text-blue-600">{formatYen(c.sensorIctTotalSales)}</span>
              <span className="text-right font-mono text-orange-600">{formatYen(c.sensorIctTotalCost)}</span>
              <span className="text-right font-mono text-emerald-600">{formatYen(c.sensorIctTotalSales - c.sensorIctTotalCost)}</span>
              <span className="text-right font-mono">{c.sensorIctTotalSales > 0 ? (((c.sensorIctTotalSales - c.sensorIctTotalCost) / c.sensorIctTotalSales) * 100).toFixed(1) : 0}%</span>
              <span className="text-right font-mono text-red-600">{c.compSensorTotal > 0 ? formatYen(c.compSensorTotal) : '-'}</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-sm">
              <span>アプリ年間運用</span>
              <span className="text-right font-mono text-blue-600">{formatYen(c.runningSalesYear)}</span>
              <span className="text-right font-mono text-orange-600">{formatYen(c.runningCostYear)}</span>
              <span className="text-right font-mono text-emerald-600">{formatYen(c.runningProfitYear)}</span>
              <span className="text-right font-mono">{c.runningSalesYear > 0 ? ((c.runningProfitYear / c.runningSalesYear) * 100).toFixed(1) : 0}%</span>
              <span className="text-right font-mono text-red-600">{c.compAnnual > 0 ? formatYen(c.compAnnual) : '-'}</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-sm">
              <span>ザイレム製水質センサ</span>
              <span className="text-right font-mono text-blue-600">{formatYen(c.multiSensorTotalSales)}</span>
              <span className="text-right font-mono text-orange-600">{formatYen(c.multiSensorTotalCost)}</span>
              <span className="text-right font-mono text-emerald-600">{formatYen(c.multiSensorTotalSales - c.multiSensorTotalCost)}</span>
              <span className="text-right font-mono">{c.multiSensorTotalSales > 0 ? (((c.multiSensorTotalSales - c.multiSensorTotalCost) / c.multiSensorTotalSales) * 100).toFixed(1) : 0}%</span>
              <span className="text-right font-mono text-red-600">-</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-sm">
              <span>監視カメラ</span>
              <span className="text-right font-mono text-blue-600">{formatYen(c.cameraTotalSales)}</span>
              <span className="text-right font-mono text-orange-600">{formatYen(c.cameraTotalCost)}</span>
              <span className="text-right font-mono text-emerald-600">{formatYen(c.cameraTotalSales - c.cameraTotalCost)}</span>
              <span className="text-right font-mono">{c.cameraTotalSales > 0 ? (((c.cameraTotalSales - c.cameraTotalCost) / c.cameraTotalSales) * 100).toFixed(1) : 0}%</span>
              <span className="text-right font-mono text-red-600">{c.compCameraTotal > 0 ? formatYen(c.compCameraTotal) : '-'}</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-sm">
              <span>ステンレススタンド/PoEHUB</span>
              <span className="text-right font-mono text-blue-600">{formatYen(c.miscTotalSales)}</span>
              <span className="text-right font-mono text-orange-600">{formatYen(c.miscTotalCost)}</span>
              <span className="text-right font-mono text-emerald-600">{formatYen(c.miscTotalSales - c.miscTotalCost)}</span>
              <span className="text-right font-mono">{c.miscTotalSales > 0 ? (((c.miscTotalSales - c.miscTotalCost) / c.miscTotalSales) * 100).toFixed(1) : 0}%</span>
              <span className="text-right font-mono text-red-600">{c.compMiscTotal > 0 ? formatYen(c.compMiscTotal) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 顧客提示用ビュー（印刷用・A4縦）
// ========================================
const CustomerView = ({ calculations, quantities, competitorPrices }) => {
  const c = calculations;
  const { initialItems, miscItems, annualItems } = getItemDefs(quantities, calculations);

  // センサ機器のみ（監視カメラ除外）
  const sensorIctItems = initialItems.filter(item => item.category !== '監視カメラ');

  const compAnnualItems = [
    { key: 'monitoring', label: 'モニタリング', own: c.swCosts.monitoring.salesYear, comp: competitorPrices.monitoring * 12 },
    { key: 'lte', label: 'LTE通信料', own: c.swCosts.lte.salesYear, comp: competitorPrices.lte * quantities.sensorNormal * 12 },
    { key: 'storage', label: 'ストレージ', own: c.swCosts.storage.salesYear, comp: competitorPrices.storage * 12 },
  ];

  // 比較用: カメラ
  const ownCameraTotal = c.cameraTotalSales;
  const compCameraTotal = c.compCameraTotal;

  // 比較用: センサ機器（カメラ・ステンレススタンド/PoEHUB除外）
  const ownInitialExCamera = c.sensorIctTotalSales;
  const compInitialExCamera = c.compSensorTotal;

  // 比較用: ステンレススタンド/PoEHUB
  const ownMiscTotal = c.miscTotalSales;
  const compMiscTotal = c.compMiscTotal;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 左: 自社見積もり明細 */}
        <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden">
          <div className="bg-blue-700 text-white px-6 py-4">
            <h2 className="font-bold text-lg text-center">自社 お見積り明細</h2>
          </div>
          <div className="px-6 py-5">

            {/* センサ機器 */}
            <h3 className="font-bold text-slate-700 text-sm mb-3 pb-2 border-b-2 border-slate-300">センサ機器（初期費用）</h3>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="text-left py-1.5 font-bold">項目</th>
                  <th className="text-right py-1.5 font-bold w-20">単価</th>
                  <th className="text-center py-1.5 font-bold w-10">数量</th>
                  <th className="text-right py-1.5 font-bold w-24">金額</th>
                </tr>
              </thead>
              <tbody>
                {sensorIctItems.filter(item => item.qty > 0).map((item) => {
                  const total = item.isLumpSum ? item.unitPrice : item.unitPrice * item.qty;
                  return (
                    <tr key={item.key} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-700 pl-2">{item.label}</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">{formatYen(item.unitPrice)}</td>
                      <td className="py-1.5 text-center text-slate-500">{item.isLumpSum ? '一式' : item.qty}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-800">{formatYen(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td colSpan={3} className="py-2 font-bold text-slate-700">センサ機器合計</td>
                  <td className="py-2 text-right font-mono font-black text-slate-800">{formatYen(ownInitialExCamera)} 円</td>
                </tr>
              </tfoot>
            </table>

            {/* 年間運用費用 */}
            <h3 className="font-bold text-slate-700 text-sm mb-3 pb-2 border-b-2 border-slate-300">年間運用費用（水質モニタリングアプリケーション）</h3>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="text-left py-1.5 font-bold">項目</th>
                  <th className="text-right py-1.5 font-bold w-24">年額</th>
                </tr>
              </thead>
              <tbody>
                {compAnnualItems.map((item) => (
                  <tr key={item.key} className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700 pl-2">{item.label}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{formatYen(item.own)} 円</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-blue-50">
                  <td className="py-2 font-bold text-blue-700">年間運用合計</td>
                  <td className="py-2 text-right font-mono font-black text-blue-800">{formatYen(c.runningSalesYear)} 円/年</td>
                </tr>
              </tfoot>
            </table>

            {/* 自社サマリー */}
            <div className="border-2 border-blue-200 rounded-lg overflow-hidden mt-4">
              <div className="bg-blue-700 text-white px-4 py-2">
                <h3 className="font-bold text-center text-sm">自社費用サマリー</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">センサ機器</span>
                  <span className="font-mono text-lg font-black text-blue-800">{formatYen(ownInitialExCamera)}<span className="text-xs text-slate-500 ml-0.5">円</span></span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-bold text-slate-700 text-sm">年間運用</span>
                  <span className="font-mono text-lg font-black text-blue-800">{formatYen(c.runningSalesYear)}<span className="text-xs text-slate-500 ml-0.5">円/年</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右: 他社比較費用 */}
        <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden">
          <div className="bg-red-700 text-white px-6 py-4">
            <h2 className="font-bold text-lg text-center">他社 費用比較</h2>
          </div>
          <div className="px-6 py-5">

            {/* センサ機器 */}
            <h3 className="font-bold text-slate-700 text-sm mb-3 pb-2 border-b-2 border-slate-300">センサ機器（初期費用）</h3>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="text-left py-1.5 font-bold">項目</th>
                  <th className="text-center py-1.5 font-bold w-10">数量</th>
                  <th className="text-right py-1.5 font-bold w-24">金額</th>
                </tr>
              </thead>
              <tbody>
                {quantities.sensorNormal > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700 pl-2">水温センサー</td>
                    <td className="py-1.5 text-center text-slate-500">{quantities.sensorNormal}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{competitorPrices.sensorNormal * quantities.sensorNormal > 0 ? formatYen(competitorPrices.sensorNormal * quantities.sensorNormal) : '-'}</td>
                  </tr>
                )}
                {quantities.wireless > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700 pl-2">無線オプション</td>
                    <td className="py-1.5 text-center text-slate-500">{quantities.wireless}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{competitorPrices.wireless * quantities.wireless > 0 ? formatYen(competitorPrices.wireless * quantities.wireless) : '-'}</td>
                  </tr>
                )}
                {quantities.sensorNormal > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700 pl-2">ハード設定費</td>
                    <td className="py-1.5 text-center text-slate-500">{quantities.sensorNormal}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{competitorPrices.installOther * quantities.sensorNormal > 0 ? formatYen(competitorPrices.installOther * quantities.sensorNormal) : '-'}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td colSpan={2} className="py-2 font-bold text-slate-700">センサ機器合計</td>
                  <td className="py-2 text-right font-mono font-black text-slate-800">{compInitialExCamera > 0 ? formatYen(compInitialExCamera) + ' 円' : '-'}</td>
                </tr>
              </tfoot>
            </table>

            {/* 年間運用費用 */}
            <h3 className="font-bold text-slate-700 text-sm mb-3 pb-2 border-b-2 border-slate-300">年間運用費用（水質モニタリングアプリケーション）</h3>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="text-left py-1.5 font-bold">項目</th>
                  <th className="text-right py-1.5 font-bold w-24">年額</th>
                </tr>
              </thead>
              <tbody>
                {compAnnualItems.map((item) => (
                  <tr key={item.key} className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700 pl-2">{item.label}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{item.comp > 0 ? formatYen(item.comp) + ' 円' : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-red-50">
                  <td className="py-2 font-bold text-red-700">年間運用合計</td>
                  <td className="py-2 text-right font-mono font-black text-red-800">{c.compAnnual > 0 ? formatYen(c.compAnnual) + ' 円/年' : '-'}</td>
                </tr>
              </tfoot>
            </table>

            {/* 他社サマリー */}
            <div className="border-2 border-red-200 rounded-lg overflow-hidden mt-4">
              <div className="bg-red-700 text-white px-4 py-2">
                <h3 className="font-bold text-center text-sm">他社費用サマリー</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">センサ機器</span>
                  <span className="font-mono text-lg font-black text-red-800">{compInitialExCamera > 0 ? formatYen(compInitialExCamera) : '-'}<span className="text-xs text-slate-500 ml-0.5">{compInitialExCamera > 0 ? '円' : ''}</span></span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-bold text-slate-700 text-sm">年間運用</span>
                  <span className="font-mono text-lg font-black text-red-800">{c.compAnnual > 0 ? formatYen(c.compAnnual) : '-'}<span className="text-xs text-slate-500 ml-0.5">{c.compAnnual > 0 ? '円/年' : ''}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ========================================
// 共通コンポーネント
// ========================================
const InputField = ({ label, value, onChange, suffix }) => (
  <div className="flex items-center gap-1">
    <label className="text-xs text-slate-500 whitespace-nowrap">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-14 px-1.5 py-0.5 border rounded text-right font-mono text-xs border-slate-300" />
    <span className="text-xs text-slate-400">{suffix}</span>
  </div>
);

const CostRow = ({ label, cost, price, qty, onCostChange, onPriceChange }) => (
  <div className="grid grid-cols-12 gap-2 items-center text-sm">
    <span className="col-span-2 text-slate-600">{label}</span>
    <div className="col-span-2">
      <input type="text" value={formatYen(price)} onChange={(e) => onPriceChange(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-sm bg-blue-50" />
    </div>
    <div className="col-span-2">
      <input type="text" value={formatYen(cost)} onChange={(e) => onCostChange(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-sm bg-orange-50" />
    </div>
    <span className="col-span-1 text-slate-400 text-xs text-center">×{qty}</span>
    <span className="col-span-3 text-right font-mono text-blue-600 font-medium">{formatYen(price * qty)}</span>
    <span className="col-span-2 text-right font-mono text-slate-600">{formatYen(cost * qty)}</span>
  </div>
);

const CompCostRow = ({ label, price, qty, isLumpSum, onChange }) => (
  <div className="flex items-center justify-between gap-2 text-sm py-0.5">
    <span className="text-slate-600 text-xs whitespace-nowrap">{label}</span>
    <div className="flex items-center gap-1">
      <input type="text" value={formatYen(price)} onChange={(e) => onChange(e.target.value)} className="w-24 p-1 border border-slate-300 rounded text-right font-mono text-xs bg-red-50" />
      <span className="text-slate-400 text-xs w-6 text-center">{isLumpSum ? '式' : `×${qty}`}</span>
      <span className="font-mono text-red-600 font-medium text-xs w-20 text-right">{formatYen(isLumpSum ? price : price * qty)}</span>
    </div>
  </div>
);

const CompSubtotalRow = ({ label, sales }) => (
  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 mt-1.5">
    <span className="font-medium text-slate-700 text-xs">{label}</span>
    <span className="font-mono text-red-600 font-bold text-sm">{formatYen(sales)} 円</span>
  </div>
);

const CompetitorRow = ({ label, value, qty, isLumpSum, onChange, suffix }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
    <span className="text-sm text-slate-600">{label}</span>
    <div className="flex items-center gap-2">
      {!isLumpSum && qty > 1 && <span className="text-slate-400 text-xs">×{qty}</span>}
      <input
        type="text"
        value={formatYen(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 p-1.5 border border-slate-300 rounded text-right font-mono text-sm bg-red-50"
      />
      {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      {!isLumpSum && qty > 1 && !suffix && (
        <span className="font-mono text-sm text-slate-500 w-20 text-right">{formatYen(value * qty)}</span>
      )}
    </div>
  </div>
);

const SubtotalRow = ({ label, cost, sales }) => (
  <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
    <span className="font-medium text-slate-700">{label}</span>
    <div className="flex gap-4">
      <span className="font-mono text-blue-600 font-bold">販売: {formatYen(sales)} 円</span>
      <span className="font-mono text-slate-500">原価: {formatYen(cost)}</span>
    </div>
  </div>
);

export default App;
