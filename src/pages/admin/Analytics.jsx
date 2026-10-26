import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Calendar,
  RefreshCw,
  Search,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Printer
} from 'lucide-react';
import { Button, money } from '../../components/ui';
import { adminService } from '../../services/admin.service';

function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('grocify-admin-user')) || null;
  } catch {
    return null;
  }
}

// Quick Period Presets
const PERIOD_PRESETS = [
  { id: 'today', label: '⚡ Aaj (Today)' },
  { id: 'yesterday', label: '📅 Kal (Yesterday)' },
  { id: 'last7days', label: '📊 Pichhle 7 Din' },
  { id: 'last30days', label: '📆 Pichhle 30 Din' },
  { id: 'custom', label: '🗓️ Custom Range' }
];

export function AdminAnalytics() {
  const [preset, setPreset] = useState('today');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('profit'); // 'profit' | 'sales' | 'units'

  const currentUser = getAdminUser();

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        preset,
        ...(preset === 'custom' && { startDate: customStart, endDate: customEnd })
      };
      const res = await adminService.getSalesProfit(params);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load sales & profit analytics:', err);
      setError(err?.response?.data?.message || err?.message || 'Analytics load karne me dikkat aayi. Kripya dubara try karein.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [preset]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (preset === 'custom') {
      fetchReport();
    } else {
      setPreset('custom');
    }
  };

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    if (!reportData?.products) return [];
    let list = reportData.products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'sales') return b.totalSales - a.totalSales;
      if (sortBy === 'units') return b.unitsSold - a.unitsSold;
      return b.totalProfit - a.totalProfit; // default profit
    });
  }, [reportData, searchQuery, sortBy]);

  const summary = reportData?.summary || {
    totalOrders: 0,
    totalUnits: 0,
    totalSales: 0,
    totalCost: 0,
    netProfit: 0,
    marginPercent: 0
  };

  return (
    <div className="analytics-page" style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Business Analytics & Munafa
            </h1>
            <span style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              ✨ Retail Profit System
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Aapki live bikri (sales), kharid rate (cost), aur har product ka asli munafa (net profit)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Print or Save Report as PDF"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '14px 18px',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
              Time Period:
            </span>
            {PERIOD_PRESETS.map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: active ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                    background: active ? '#059669' : '#ffffff',
                    color: active ? '#ffffff' : '#334155',
                    boxShadow: active ? '0 2px 4px rgba(5,150,105,0.2)' : 'none'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Active Period Label */}
          {reportData?.period && (
            <div style={{
              fontSize: '12px',
              color: '#047857',
              background: '#ecfdf5',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 700,
              border: '1px solid #a7f3d0'
            }}>
              🗓️ {reportData.period.label} ({reportData.period.startFormatted} - {reportData.period.endFormatted})
            </div>
          )}
        </div>

        {/* Custom Range Date Pickers */}
        {preset === 'custom' && (
          <form
            onSubmit={handleApplyCustom}
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px dashed #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>From:</span>
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12.5px',
                  color: '#0f172a'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>To:</span>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12.5px',
                  color: '#0f172a'
                }}
              />
            </div>

            <Button type="submit" disabled={loading} style={{ padding: '6px 14px', fontSize: '12px' }}>
              Apply Range
            </Button>
          </form>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#dc2626" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
          </div>
          <Button variant="outline" onClick={fetchReport} style={{ fontSize: '12px' }}>
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* Top 4 KPI Executive Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Card 1: Total Delivered Orders */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                  Kul Orders (Delivered)
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {summary.totalOrders}{' '}
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>Orders</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📦 Total units sold:</span>
                <b style={{ color: '#0f172a' }}>{summary.totalUnits} items</b>
              </div>
            </div>

            {/* Card 2: Total Bikri (Sales) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                  Kul Bikri (Total Sales)
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.5px' }}>
                ₹{summary.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>💰 Delivered order item sales</span>
              </div>
            </div>

            {/* Card 3: Total Kharid (Cost Price) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                  Kul Kharid (Total Cost)
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Package size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#92400e', letterSpacing: '-0.5px' }}>
                ₹{summary.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📦 Bika hua maal ka kharid rate</span>
              </div>
            </div>

            {/* Card 4: Asli Munafa (Net Profit) */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              borderRadius: '16px',
              border: '2px solid #86efac',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(5,150,105,0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                  ✨ Asli Munafa (Net Profit)
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 900,
                color: summary.netProfit >= 0 ? '#047857' : '#dc2626',
                letterSpacing: '-0.5px'
              }}>
                ₹{summary.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: summary.marginPercent >= 0 ? '#059669' : '#dc2626',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {summary.marginPercent}% Munafa Margin
                </span>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                  (Bikri - Kharid)
                </span>
              </div>
            </div>
          </div>

          {/* Performance Chart (Daily Trend) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '20px 22px',
            marginBottom: '24px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  📊 Daily Bikri, Kharid & Munafa Trend
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Tareekh ke hisab se kitni bikri hui, kitni kharid lagi aur kitna munafa bana
                </p>
              </div>

              {/* Chart type toggle */}
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  style={{
                    border: 'none',
                    background: chartType === 'bar' ? '#ffffff' : 'transparent',
                    color: chartType === 'bar' ? '#0f172a' : '#64748b',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: chartType === 'bar' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <BarChart3 size={13} />
                  <span>Bar Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  style={{
                    border: 'none',
                    background: chartType === 'area' ? '#ffffff' : 'transparent',
                    color: chartType === 'area' ? '#0f172a' : '#64748b',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: chartType === 'area' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <LineChartIcon size={13} />
                  <span>Area Chart</span>
                </button>
              </div>
            </div>

            {reportData?.dailySeries && reportData.dailySeries.length > 0 ? (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={reportData.dailySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        formatter={(val, name) => [`₹${Number(val).toFixed(2)}`, name]}
                        labelFormatter={(label) => `Tareekh: ${label}`}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="sales" name="Kul Bikri (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Kul Kharid (₹)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Asli Munafa (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={reportData.dailySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        formatter={(val, name) => [`₹${Number(val).toFixed(2)}`, name]}
                        labelFormatter={(label) => `Tareekh: ${label}`}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="sales" name="Kul Bikri (₹)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                      <Area type="monotone" dataKey="cost" name="Kul Kharid (₹)" stroke="#94a3b8" strokeWidth={2} fillOpacity={0.2} fill="#94a3b8" />
                      <Area type="monotone" dataKey="profit" name="Asli Munafa (₹)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#94a3b8',
                fontSize: '13px',
                background: '#fafafa',
                borderRadius: '10px'
              }}>
                Is chune hue time period me koi delivered order record nahi hua.
              </div>
            )}
          </div>

          {/* Product-wise Profit Breakdown Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '20px 22px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  📦 Har Product Ka Bikri & Munafa Breakdown
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Konsa product kitna bika, uski kharid rate kya thi, bikri rate kya thi, aur kul kitna munafa hua
                </p>
              </div>

              {/* Search & Sort Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '6px 12px'
                }}>
                  <Search size={14} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search product / SKU…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12.5px',
                      outline: 'none',
                      width: '160px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#334155'
                    }}
                  >
                    <option value="profit">Sabse Jyada Munafa</option>
                    <option value="sales">Sabse Jyada Bikri (₹)</option>
                    <option value="units">Sabse Jyada Bika (Qty)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px' }}>Product</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Bika Hua Qty</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Kharid Rate</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Bikri Rate</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Per Pc Munafa</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Kul Bikri</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Kul Kharid</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Kul Munafa</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        {searchQuery ? `"${searchQuery}" se milta koi product nahi mila.` : 'Is period me koi product sale nahi hua.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, idx) => {
                      const isLoss = p.totalProfit < 0;
                      return (
                        <tr
                          key={p.id || idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Product Info */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt=""
                                  style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              ) : (
                                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f1f5f9', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                                  <Package size={18} />
                                </div>
                              )}
                              <div>
                                <b style={{ color: '#0f172a', display: 'block', fontSize: '13px' }}>{p.name}</b>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  {p.unit && (
                                    <span style={{ fontSize: '10.5px', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>
                                      {p.unit}
                                    </span>
                                  )}
                                  {p.sku && <small style={{ color: '#94a3b8', fontSize: '10.5px' }}>SKU: {p.sku}</small>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Bika Hua Qty */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {p.unitsSold} pcs
                            </span>
                          </td>

                          {/* Kharid Rate */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>
                            {p.costPrice > 0 ? `₹${p.costPrice.toFixed(2)}` : (
                              <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 700 }} title="Product edit karke kharid rate set karein">
                                ₹0.00 (Unset)
                              </span>
                            )}
                          </td>

                          {/* Bikri Rate */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            ₹{p.sellingPrice.toFixed(2)}
                          </td>

                          {/* Per Pc Munafa */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span style={{
                              fontWeight: 800,
                              color: p.perPieceProfit >= 0 ? '#059669' : '#dc2626'
                            }}>
                              {p.perPieceProfit >= 0 ? `+₹${p.perPieceProfit.toFixed(2)}` : `-₹${Math.abs(p.perPieceProfit).toFixed(2)}`}
                            </span>
                          </td>

                          {/* Kul Bikri */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                            ₹{p.totalSales.toFixed(2)}
                          </td>

                          {/* Kul Kharid */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>
                            ₹{p.totalCost.toFixed(2)}
                          </td>

                          {/* Kul Munafa */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{
                                fontSize: '13.5px',
                                fontWeight: 900,
                                color: isLoss ? '#dc2626' : '#047857'
                              }}>
                                {p.totalProfit >= 0 ? `+₹${p.totalProfit.toFixed(2)}` : `-₹${Math.abs(p.totalProfit).toFixed(2)}`}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                background: isLoss ? '#fef2f2' : '#ecfdf5',
                                border: '1px solid ' + (isLoss ? '#fecaca' : '#a7f3d0'),
                                color: isLoss ? '#b91c1c' : '#047857',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                marginTop: '2px'
                              }}>
                                {p.marginPercent}% margin
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar */}
            {filteredProducts.length > 0 && (
              <div style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1.5px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12.5px',
                color: '#64748b'
              }}>
                <span>Total {filteredProducts.length} unique products sold in this period.</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span>Kul Bikri: <b style={{ color: '#1e40af' }}>₹{summary.totalSales.toFixed(2)}</b></span>
                  <span>Kul Kharid: <b style={{ color: '#64748b' }}>₹{summary.totalCost.toFixed(2)}</b></span>
                  <span>Asli Munafa: <b style={{ color: '#047857' }}>₹{summary.netProfit.toFixed(2)} ({summary.marginPercent}%)</b></span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Skeleton loader while analytics data is fetching
 */
function AnalyticsSkeleton() {
  return (
    <div>
      {/* 4 Cards Skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '20px' }}>
            <div className="r2c-skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
            <div className="r2c-skeleton-box" style={{ width: '70%', height: '28px', borderRadius: '6px', marginBottom: '8px' }} />
            <div className="r2c-skeleton-box" style={{ width: '50%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '22px', marginBottom: '24px' }}>
        <div className="r2c-skeleton-box" style={{ width: '30%', height: '18px', borderRadius: '4px', marginBottom: '20px' }} />
        <div className="r2c-skeleton-box" style={{ width: '100%', height: '260px', borderRadius: '8px' }} />
      </div>

      {/* Table Skeleton */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '22px' }}>
        <div className="r2c-skeleton-box" style={{ width: '25%', height: '18px', borderRadius: '4px', marginBottom: '20px' }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div className="r2c-skeleton-box" style={{ width: '30%', height: '24px', borderRadius: '4px' }} />
            <div className="r2c-skeleton-box" style={{ width: '15%', height: '24px', borderRadius: '4px' }} />
            <div className="r2c-skeleton-box" style={{ width: '15%', height: '24px', borderRadius: '4px' }} />
            <div className="r2c-skeleton-box" style={{ width: '20%', height: '24px', borderRadius: '4px' }} />
            <div className="r2c-skeleton-box" style={{ width: '20%', height: '24px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminAnalytics;
