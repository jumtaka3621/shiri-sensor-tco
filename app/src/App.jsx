import React, { useState, useMemo } from 'react';
import { Calculator, Eye, EyeOff, FileDown, Settings, Users, Building2 } from 'lucide-react';

// ヘルパー関数
const formatYen = (amount) => Math.floor(amount).toLocaleString();
const parseNum = (val) => {
  const n = parseInt(String(val).replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
};

const App = () => {
  // 表示モード: 'internal' = 内部管理用, 'customer' = 顧客提示用
  const [viewMode, setViewMode] = useState('internal');

  // 数量設定
  const [quantities, setQuantities] = useState({
    camera: 2,
    sensorNormal: 3,
    sensorHigh: 1,
    ictPoe: 2,
    ictLte: 1,
  });

  // 自社収益項目（原価）
  const [ownCosts, setOwnCosts] = useState({
    // ハードウェア（単価）
    camera: 150000,
    sensorNormal: 200000,
    sensorHigh: 500000,
    ictPoe: 80000,
    ictLte: 120000,
    // 保守（年額単価）
    maintCamera: 15000,
    maintSensorNormal: 20000,
    maintSensorHigh: 40000,
    maintIctPoe: 10000,
    maintIctLte: 15000,
    // ソフトウェア（月額）
    monitoring: 30000,
    lte: 3000,
    storage: 5000,
  });

  // 自社収益項目（販売単価）
  const [ownPrices, setOwnPrices] = useState({
    // ハードウェア（単価）
    camera: 195000,
    sensorNormal: 260000,
    sensorHigh: 650000,
    ictPoe: 104000,
    ictLte: 156000,
    // 保守（年額単価）
    maintCamera: 19500,
    maintSensorNormal: 26000,
    maintSensorHigh: 52000,
    maintIctPoe: 13000,
    maintIctLte: 19500,
    // ソフトウェア（月額）
    monitoring: 39000,
    lte: 3900,
    storage: 6500,
  });

  // 外部スルー項目（原価=販売価格）
  const [externalCosts, setExternalCosts] = useState({
    installCamera: 50000,
    installOther: 300000,
  });

  // 計算ロジック
  const calculations = useMemo(() => {
    const q = quantities;

    // === 自社収益項目 ===
    // ハードウェア初期費用
    const hwCosts = {
      camera: { cost: ownCosts.camera * q.camera, sales: ownPrices.camera * q.camera, qty: q.camera, unitCost: ownCosts.camera, unitPrice: ownPrices.camera },
      sensorNormal: { cost: ownCosts.sensorNormal * q.sensorNormal, sales: ownPrices.sensorNormal * q.sensorNormal, qty: q.sensorNormal, unitCost: ownCosts.sensorNormal, unitPrice: ownPrices.sensorNormal },
      sensorHigh: { cost: ownCosts.sensorHigh * q.sensorHigh, sales: ownPrices.sensorHigh * q.sensorHigh, qty: q.sensorHigh, unitCost: ownCosts.sensorHigh, unitPrice: ownPrices.sensorHigh },
      ictPoe: { cost: ownCosts.ictPoe * q.ictPoe, sales: ownPrices.ictPoe * q.ictPoe, qty: q.ictPoe, unitCost: ownCosts.ictPoe, unitPrice: ownPrices.ictPoe },
      ictLte: { cost: ownCosts.ictLte * q.ictLte, sales: ownPrices.ictLte * q.ictLte, qty: q.ictLte, unitCost: ownCosts.ictLte, unitPrice: ownPrices.ictLte },
    };
    const hwTotalCost = Object.values(hwCosts).reduce((sum, item) => sum + item.cost, 0);
    const hwTotalSales = Object.values(hwCosts).reduce((sum, item) => sum + item.sales, 0);

    // 保守費用（年額）
    const maintCosts = {
      camera: { cost: ownCosts.maintCamera * q.camera, sales: ownPrices.maintCamera * q.camera, qty: q.camera, unitCost: ownCosts.maintCamera, unitPrice: ownPrices.maintCamera },
      sensorNormal: { cost: ownCosts.maintSensorNormal * q.sensorNormal, sales: ownPrices.maintSensorNormal * q.sensorNormal, qty: q.sensorNormal, unitCost: ownCosts.maintSensorNormal, unitPrice: ownPrices.maintSensorNormal },
      sensorHigh: { cost: ownCosts.maintSensorHigh * q.sensorHigh, sales: ownPrices.maintSensorHigh * q.sensorHigh, qty: q.sensorHigh, unitCost: ownCosts.maintSensorHigh, unitPrice: ownPrices.maintSensorHigh },
      ictPoe: { cost: ownCosts.maintIctPoe * q.ictPoe, sales: ownPrices.maintIctPoe * q.ictPoe, qty: q.ictPoe, unitCost: ownCosts.maintIctPoe, unitPrice: ownPrices.maintIctPoe },
      ictLte: { cost: ownCosts.maintIctLte * q.ictLte, sales: ownPrices.maintIctLte * q.ictLte, qty: q.ictLte, unitCost: ownCosts.maintIctLte, unitPrice: ownPrices.maintIctLte },
    };
    const maintTotalCostYear = Object.values(maintCosts).reduce((sum, item) => sum + item.cost, 0);
    const maintTotalSalesYear = Object.values(maintCosts).reduce((sum, item) => sum + item.sales, 0);

    // ソフトウェア費用（月額 → 年額）
    const swCosts = {
      monitoring: { costMonth: ownCosts.monitoring, costYear: ownCosts.monitoring * 12, salesMonth: ownPrices.monitoring, salesYear: ownPrices.monitoring * 12 },
      lte: { costMonth: ownCosts.lte * q.ictLte, costYear: ownCosts.lte * q.ictLte * 12, salesMonth: ownPrices.lte * q.ictLte, salesYear: ownPrices.lte * q.ictLte * 12, qty: q.ictLte, unitCost: ownCosts.lte, unitPrice: ownPrices.lte },
      storage: { costMonth: ownCosts.storage, costYear: ownCosts.storage * 12, salesMonth: ownPrices.storage, salesYear: ownPrices.storage * 12 },
    };
    const swTotalCostYear = swCosts.monitoring.costYear + swCosts.lte.costYear + swCosts.storage.costYear;
    const swTotalSalesYear = swCosts.monitoring.salesYear + swCosts.lte.salesYear + swCosts.storage.salesYear;

    // === 外部スルー項目（初期費用のみ） ===
    const extCosts = {
      camera: { cost: externalCosts.installCamera * q.camera, qty: q.camera, unit: externalCosts.installCamera },
      other: { cost: externalCosts.installOther },
    };
    const extTotalCost = extCosts.camera.cost + extCosts.other.cost;
    // 外部スルーは粗利なし: 販売価格 = 原価
    const extTotalSales = extTotalCost;

    // === 合計計算 ===
    // 初期費用
    const initialCost = hwTotalCost + extTotalCost;
    const initialSales = hwTotalSales + extTotalSales;
    const initialProfit = initialSales - initialCost;

    // 年間ランニング（保守 + ソフト）
    const runningCostYear = maintTotalCostYear + swTotalCostYear;
    const runningSalesYear = maintTotalSalesYear + swTotalSalesYear;
    const runningProfitYear = runningSalesYear - runningCostYear;

    // 期間別総額
    const getYearTotal = (years) => {
      const totalCost = initialCost + runningCostYear * years;
      const totalSales = initialSales + runningSalesYear * years;
      const totalProfit = totalSales - totalCost;
      const profitRatio = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
      return { totalCost, totalSales, totalProfit, profitRatio };
    };

    return {
      hwCosts, hwTotalCost, hwTotalSales,
      maintCosts, maintTotalCostYear, maintTotalSalesYear,
      swCosts, swTotalCostYear, swTotalSalesYear,
      extCosts, extTotalCost, extTotalSales,
      initialCost, initialSales, initialProfit,
      runningCostYear, runningSalesYear, runningProfitYear,
      year1: getYearTotal(1),
      year3: getYearTotal(3),
      year5: getYearTotal(5),
    };
  }, [quantities, ownCosts, ownPrices, externalCosts]);

  const updateQuantity = (key, value) => {
    setQuantities(prev => ({ ...prev, [key]: parseNum(value) }));
  };

  const updateOwnCost = (key, value) => {
    setOwnCosts(prev => ({ ...prev, [key]: parseNum(value) }));
  };

  const updateOwnPrice = (key, value) => {
    setOwnPrices(prev => ({ ...prev, [key]: parseNum(value) }));
  };

  const updateExternalCost = (key, value) => {
    setExternalCosts(prev => ({ ...prev, [key]: parseNum(value) }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 font-sans">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Calculator size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Shiri Sensor TCO Simulator</h1>
                <p className="text-slate-400 text-sm">費用シミュレーション（1/3/5年）</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('internal')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'internal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Settings size={18} />
                内部管理
              </button>
              <button
                onClick={() => setViewMode('customer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'customer'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Users size={18} />
                顧客提示用
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'internal' ? (
        <InternalView
          quantities={quantities}
          ownCosts={ownCosts}
          ownPrices={ownPrices}
          externalCosts={externalCosts}
          calculations={calculations}
          updateQuantity={updateQuantity}
          updateOwnCost={updateOwnCost}
          updateOwnPrice={updateOwnPrice}
          updateExternalCost={updateExternalCost}
        />
      ) : (
        <CustomerView calculations={calculations} quantities={quantities} />
      )}
    </div>
  );
};

// 内部管理用ビュー
const InternalView = ({
  quantities, ownCosts, ownPrices, externalCosts, calculations,
  updateQuantity, updateOwnCost, updateOwnPrice, updateExternalCost
}) => {
  const c = calculations;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 設定パネル */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-blue-600" />
          基本設定
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <InputField label="監視カメラ" value={quantities.camera} onChange={(v) => updateQuantity('camera', v)} suffix="台" />
          <InputField label="通常センサ" value={quantities.sensorNormal} onChange={(v) => updateQuantity('sensorNormal', v)} suffix="台" />
          <InputField label="高性能センサ" value={quantities.sensorHigh} onChange={(v) => updateQuantity('sensorHigh', v)} suffix="台" />
          <InputField label="ICT機器(PoE)" value={quantities.ictPoe} onChange={(v) => updateQuantity('ictPoe', v)} suffix="台" />
          <InputField label="ICT機器(LTE)" value={quantities.ictLte} onChange={(v) => updateQuantity('ictLte', v)} suffix="台" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 自社収益項目 */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="font-bold flex items-center gap-2">
              <Building2 size={20} />
              自社収益項目（粗利あり）
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* ヘッダー */}
            <div className="grid grid-cols-12 gap-2 items-center text-xs font-bold text-slate-500 border-b pb-2">
              <span className="col-span-2">項目</span>
              <span className="col-span-2 text-center text-orange-600">原価</span>
              <span className="col-span-2 text-center text-blue-600">販売単価</span>
              <span className="col-span-1 text-center">数量</span>
              <span className="col-span-2 text-right text-orange-600">原価計</span>
              <span className="col-span-3 text-right text-blue-600">販売計</span>
            </div>

            {/* ハードウェア */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">ハードウェア（初期費用）</h3>
              <div className="space-y-2">
                <CostRow label="監視カメラ" cost={ownCosts.camera} price={ownPrices.camera} qty={quantities.camera} onCostChange={(v) => updateOwnCost('camera', v)} onPriceChange={(v) => updateOwnPrice('camera', v)} />
                <CostRow label="通常センサ" cost={ownCosts.sensorNormal} price={ownPrices.sensorNormal} qty={quantities.sensorNormal} onCostChange={(v) => updateOwnCost('sensorNormal', v)} onPriceChange={(v) => updateOwnPrice('sensorNormal', v)} />
                <CostRow label="高性能センサ" cost={ownCosts.sensorHigh} price={ownPrices.sensorHigh} qty={quantities.sensorHigh} onCostChange={(v) => updateOwnCost('sensorHigh', v)} onPriceChange={(v) => updateOwnPrice('sensorHigh', v)} />
                <CostRow label="ICT機器(PoE)" cost={ownCosts.ictPoe} price={ownPrices.ictPoe} qty={quantities.ictPoe} onCostChange={(v) => updateOwnCost('ictPoe', v)} onPriceChange={(v) => updateOwnPrice('ictPoe', v)} />
                <CostRow label="ICT機器(LTE)" cost={ownCosts.ictLte} price={ownPrices.ictLte} qty={quantities.ictLte} onCostChange={(v) => updateOwnCost('ictLte', v)} onPriceChange={(v) => updateOwnPrice('ictLte', v)} />
                <SubtotalRow label="ハード小計" cost={c.hwTotalCost} sales={c.hwTotalSales} />
              </div>
            </div>

            {/* 保守 */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">保守費用（年額）</h3>
              <div className="space-y-2">
                <CostRow label="監視カメラ保守" cost={ownCosts.maintCamera} price={ownPrices.maintCamera} qty={quantities.camera} onCostChange={(v) => updateOwnCost('maintCamera', v)} onPriceChange={(v) => updateOwnPrice('maintCamera', v)} />
                <CostRow label="通常センサ保守" cost={ownCosts.maintSensorNormal} price={ownPrices.maintSensorNormal} qty={quantities.sensorNormal} onCostChange={(v) => updateOwnCost('maintSensorNormal', v)} onPriceChange={(v) => updateOwnPrice('maintSensorNormal', v)} />
                <CostRow label="高性能センサ保守" cost={ownCosts.maintSensorHigh} price={ownPrices.maintSensorHigh} qty={quantities.sensorHigh} onCostChange={(v) => updateOwnCost('maintSensorHigh', v)} onPriceChange={(v) => updateOwnPrice('maintSensorHigh', v)} />
                <CostRow label="ICT機器(PoE)保守" cost={ownCosts.maintIctPoe} price={ownPrices.maintIctPoe} qty={quantities.ictPoe} onCostChange={(v) => updateOwnCost('maintIctPoe', v)} onPriceChange={(v) => updateOwnPrice('maintIctPoe', v)} />
                <CostRow label="ICT機器(LTE)保守" cost={ownCosts.maintIctLte} price={ownPrices.maintIctLte} qty={quantities.ictLte} onCostChange={(v) => updateOwnCost('maintIctLte', v)} onPriceChange={(v) => updateOwnPrice('maintIctLte', v)} />
                <SubtotalRow label="保守小計/年" cost={c.maintTotalCostYear} sales={c.maintTotalSalesYear} />
              </div>
            </div>

            {/* ソフトウェア */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">ソフトウェア（月額）</h3>
              <div className="space-y-2">
                <CostRow label="モニタリング" cost={ownCosts.monitoring} price={ownPrices.monitoring} qty={1} onCostChange={(v) => updateOwnCost('monitoring', v)} onPriceChange={(v) => updateOwnPrice('monitoring', v)} />
                <CostRow label="LTE通信料" cost={ownCosts.lte} price={ownPrices.lte} qty={quantities.ictLte} onCostChange={(v) => updateOwnCost('lte', v)} onPriceChange={(v) => updateOwnPrice('lte', v)} />
                <CostRow label="ストレージ" cost={ownCosts.storage} price={ownPrices.storage} qty={1} onCostChange={(v) => updateOwnCost('storage', v)} onPriceChange={(v) => updateOwnPrice('storage', v)} />
                <SubtotalRow label="ソフト小計/年" cost={c.swTotalCostYear} sales={c.swTotalSalesYear} />
              </div>
            </div>
          </div>
        </div>

        {/* 外部スルー項目 */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-600 text-white px-6 py-4">
            <h2 className="font-bold flex items-center gap-2">
              <EyeOff size={20} />
              外部スルー項目（粗利なし）
            </h2>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">設置・設定費用（初期費用）</h3>
            <div className="space-y-2">
              <ExternalCostRow label="監視カメラ設置" cost={externalCosts.installCamera} qty={quantities.camera} onChange={(v) => updateExternalCost('installCamera', v)} />
              <ExternalCostRow label="その他ハード設定費" cost={externalCosts.installOther} onChange={(v) => updateExternalCost('installOther', v)} isLumpSum />
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-3">
                <span className="font-bold text-slate-700">設置費用合計</span>
                <span className="font-mono font-bold text-slate-800">{formatYen(c.extTotalCost)} 円</span>
              </div>
            </div>
          </div>

          {/* 粗利サマリー */}
          <div className="bg-slate-50 p-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-600 mb-4">原価・粗利サマリー</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2 text-xs font-bold text-slate-500">
                <span>項目</span>
                <span className="text-right text-orange-600">原価計</span>
                <span className="text-right text-blue-600">販売計</span>
                <span className="text-right text-emerald-600">粗利額</span>
                <span className="text-right">粗利率</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <span>初期費用</span>
                <span className="text-right font-mono text-orange-600">{formatYen(c.initialCost)}</span>
                <span className="text-right font-mono text-blue-600">{formatYen(c.initialSales)}</span>
                <span className="text-right font-mono text-emerald-600">{formatYen(c.initialProfit)}</span>
                <span className="text-right font-mono">{c.initialSales > 0 ? ((c.initialProfit / c.initialSales) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <span>年間運用</span>
                <span className="text-right font-mono text-orange-600">{formatYen(c.runningCostYear)}</span>
                <span className="text-right font-mono text-blue-600">{formatYen(c.runningSalesYear)}</span>
                <span className="text-right font-mono text-emerald-600">{formatYen(c.runningProfitYear)}</span>
                <span className="text-right font-mono">{c.runningSalesYear > 0 ? ((c.runningProfitYear / c.runningSalesYear) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="border-t pt-3 mt-3">
                {[
                  { label: '1年総額', data: c.year1 },
                  { label: '3年総額', data: c.year3 },
                  { label: '5年総額', data: c.year5 },
                ].map((item) => (
                  <div key={item.label} className="grid grid-cols-5 gap-2 text-sm py-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-right font-mono text-orange-600">{formatYen(item.data.totalCost)}</span>
                    <span className="text-right font-mono text-blue-600">{formatYen(item.data.totalSales)}</span>
                    <span className="text-right font-mono text-emerald-600 font-bold">{formatYen(item.data.totalProfit)}</span>
                    <span className="text-right font-mono font-bold">{item.data.profitRatio.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 顧客提示用ビュー
const CustomerView = ({ calculations, quantities }) => {
  const c = calculations;

  const items = [
    { category: '機器費用', items: [
      { name: '監視カメラ', price: c.hwCosts.camera.unitPrice, qty: quantities.camera },
      { name: '海中センサ（通常）', price: c.hwCosts.sensorNormal.unitPrice, qty: quantities.sensorNormal },
      { name: '海中センサ（高性能）', price: c.hwCosts.sensorHigh.unitPrice, qty: quantities.sensorHigh },
      { name: 'ICT機器（PoE）', price: c.hwCosts.ictPoe.unitPrice, qty: quantities.ictPoe },
      { name: 'ICT機器（LTE）', price: c.hwCosts.ictLte.unitPrice, qty: quantities.ictLte },
    ]},
    { category: '工事費用', items: [
      { name: '監視カメラ設置工事', price: c.extCosts.camera.unit, qty: quantities.camera },
      { name: 'その他ハード設定費', total: c.extCosts.other.cost },
    ]},
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 期間別総額比較 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: '1年間', data: c.year1, bgClass: 'bg-blue-600' },
          { label: '3年間', data: c.year3, bgClass: 'bg-emerald-600' },
          { label: '5年間', data: c.year5, bgClass: 'bg-purple-600' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl shadow-lg border-2 overflow-hidden border-slate-200"
          >
            <div className={`${item.bgClass} text-white px-6 py-4 text-center`}>
              <span className="font-bold text-lg">{item.label}総額</span>
            </div>
            <div className="p-6 text-center">
              <div className="text-4xl font-black text-slate-800 font-mono">
                {formatYen(item.data.totalSales)}
                <span className="text-lg text-slate-500 ml-1">円</span>
              </div>
              <div className="mt-4 text-sm text-slate-500 space-y-1">
                <div>初期費用: {formatYen(c.initialSales)} 円</div>
                <div>年間運用: {formatYen(c.runningSalesYear)} 円 × {item.label.replace('年間', '')}年</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 費用明細 */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4">
          <h2 className="font-bold text-lg">お見積り明細</h2>
        </div>
        <div className="p-6">
          {/* 初期費用 */}
          <h3 className="font-bold text-slate-700 mb-4 pb-2 border-b-2 border-slate-200">初期費用</h3>
          {items.map((category) => (
            <div key={category.category} className="mb-6">
              <h4 className="text-sm font-bold text-slate-500 mb-2">{category.category}</h4>
              <div className="space-y-2">
                {category.items.filter(item => item.total > 0 || item.qty > 0).map((item) => (
                  <div key={item.name} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-700">{item.name}</span>
                    <div className="text-right">
                      {item.total !== undefined ? (
                        <span className="font-mono font-bold text-slate-800">{formatYen(item.total)} 円</span>
                      ) : (
                        <>
                          <span className="text-slate-500 text-sm mr-4">{formatYen(item.price)} 円 × {item.qty}台</span>
                          <span className="font-mono font-bold text-slate-800">{formatYen(item.price * item.qty)} 円</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center py-3 bg-slate-50 px-4 rounded-lg mt-4">
            <span className="font-bold text-slate-700">初期費用合計</span>
            <span className="font-mono font-bold text-xl text-slate-800">{formatYen(c.initialSales)} 円</span>
          </div>

          {/* 年間運用費用 */}
          <h3 className="font-bold text-slate-700 mb-4 pb-2 border-b-2 border-slate-200 mt-8">年間運用費用</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700">保守費用</span>
              <span className="font-mono font-bold text-slate-800">{formatYen(c.maintTotalSalesYear)} 円/年</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700">モニタリング・通信・ストレージ</span>
              <span className="font-mono font-bold text-slate-800">{formatYen(c.swTotalSalesYear)} 円/年</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg mt-4">
            <span className="font-bold text-blue-700">年間運用費用合計</span>
            <span className="font-mono font-bold text-xl text-blue-800">{formatYen(c.runningSalesYear)} 円/年</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// コンポーネント
const InputField = ({ label, value, onChange, suffix, highlight }) => (
  <div>
    <label className="block text-xs text-slate-500 mb-1">{label}</label>
    <div className="flex items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded-lg text-right font-mono ${
          highlight ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold' : 'border-slate-300'
        }`}
      />
      <span className="ml-2 text-sm text-slate-500 w-8">{suffix}</span>
    </div>
  </div>
);

const CostRow = ({ label, cost, price, qty, onCostChange, onPriceChange }) => (
  <div className="grid grid-cols-12 gap-2 items-center text-sm">
    <span className="col-span-2 text-slate-600">{label}</span>
    <div className="col-span-2">
      <input
        type="text"
        value={formatYen(cost)}
        onChange={(e) => onCostChange(e.target.value)}
        className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-sm bg-orange-50"
      />
    </div>
    <div className="col-span-2">
      <input
        type="text"
        value={formatYen(price)}
        onChange={(e) => onPriceChange(e.target.value)}
        className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-sm bg-blue-50"
      />
    </div>
    <span className="col-span-1 text-slate-400 text-xs text-center">×{qty}</span>
    <span className="col-span-2 text-right font-mono text-slate-600">{formatYen(cost * qty)}</span>
    <span className="col-span-3 text-right font-mono text-blue-600 font-medium">{formatYen(price * qty)}</span>
  </div>
);

const ExternalCostRow = ({ label, cost, qty, onChange, isLumpSum }) => (
  <div className="grid grid-cols-12 gap-2 items-center text-sm">
    <span className="col-span-4 text-slate-600">{label}</span>
    <div className="col-span-3">
      <input
        type="text"
        value={formatYen(cost)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-1.5 border border-slate-300 rounded text-right font-mono text-sm"
      />
    </div>
    {isLumpSum ? (
      <>
        <span className="col-span-1 text-slate-400 text-xs text-center">一式</span>
        <span className="col-span-4 text-right font-mono text-slate-700">{formatYen(cost)} 円</span>
      </>
    ) : (
      <>
        <span className="col-span-1 text-slate-400 text-xs text-center">×{qty}</span>
        <span className="col-span-4 text-right font-mono text-slate-700">{formatYen(cost * qty)} 円</span>
      </>
    )}
  </div>
);

const SubtotalRow = ({ label, cost, sales }) => (
  <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
    <span className="font-medium text-slate-700">{label}</span>
    <div className="flex gap-4">
      <span className="font-mono text-slate-500">原価: {formatYen(cost)}</span>
      <span className="font-mono text-blue-600 font-bold">販売: {formatYen(sales)} 円</span>
    </div>
  </div>
);

export default App;
