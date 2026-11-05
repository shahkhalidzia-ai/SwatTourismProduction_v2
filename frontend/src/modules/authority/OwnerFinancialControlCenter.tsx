import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CircleDollarSign,
  Receipt,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { financeApi } from '../../api/finance';
import type {
  CommissionTier,
  FinancialStats,
  MonthlyInvoice,
  OperatorPayout,
  RegisteredFinanceBusiness,
} from '../../api/finance';

export const OwnerFinancialControlCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'tiers' | 'invoices' | 'payouts' | 'enforcement'>('overview');
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [payouts, setPayouts] = useState<OperatorPayout[]>([]);
  const [registeredBusinesses, setRegisteredBusinesses] = useState<RegisteredFinanceBusiness[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rate edit state
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, tiersData, invoicesData, payoutsData, bizData] = await Promise.all([
        financeApi.getStats(),
        financeApi.getCommissionTiers(),
        financeApi.getInvoices(),
        financeApi.getPayouts(),
        financeApi.getRegisteredBusinesses(),
      ]);
      setStats(statsData);
      setTiers(tiersData);
      setInvoices(invoicesData);
      setPayouts(payoutsData);
      setRegisteredBusinesses(bizData || []);

      const rateMap: Record<string, number> = {};
      tiersData.forEach((t) => {
        rateMap[t.vertical] = Number(t.default_rate);
      });
      setEditingRates(rateMap);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIndividualInvoice = async (bId: string) => {
    if (!bId) return;
    setLoading(true);
    try {
      const generated = await financeApi.generateMonthlyInvoices('2026-11', bId);
      const bizName = registeredBusinesses.find((b) => b.id === bId)?.business_name || 'Business';
      if (generated && generated.length > 0) {
        showToast(`Invoice ${generated[0].invoice_number} successfully generated for ${bizName}! (1Bill ID: ${generated[0].onebill_consumer_id})`);
      } else {
        showToast(`Invoice updated for ${bizName}`);
      }
      setSelectedBizId('');
      loadData();
    } catch {
      alert('Failed to generate invoice for business');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTier = async (vertical: string) => {
    try {
      const newRate = editingRates[vertical];
      await financeApi.updateCommissionTier({
        vertical,
        default_rate: newRate,
      });
      showToast(`Updated ${vertical.toUpperCase()} commission rate to ${newRate}%`);
      loadData();
    } catch {
      alert('Failed to update commission rate');
    }
  };

  const handleGenerateInvoices = async () => {
    setLoading(true);
    try {
      const generated = await financeApi.generateMonthlyInvoices('2026-11');
      showToast(`Successfully generated ${generated.length} monthly 1Link invoices!`);
      loadData();
    } catch {
      alert('Failed to generate monthly invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (invId: string) => {
    try {
      await financeApi.payInvoice(invId, '1bill');
      showToast('1Link 1Bill Payment received! Invoice marked as PAID ✓');
      loadData();
    } catch {
      alert('Failed to simulate payment');
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    try {
      await financeApi.approvePayout(payoutId);
      showToast('Payout authorized! SBP Raast transfer executed.');
      loadData();
    } catch {
      alert('Failed to approve payout');
    }
  };

  const handleFreezePayout = async (payoutId: string) => {
    const reason = prompt('Enter dispute/fraud inquiry reason to freeze payout:');
    if (!reason) return;
    try {
      await financeApi.freezePayout(payoutId, reason);
      showToast('Payout frozen. Funds safely held in escrow.');
      loadData();
    } catch {
      alert('Failed to freeze payout');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '20px 24px',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: '16px',
          border: '1.5px solid rgba(15, 118, 110, 0.2)',
          boxShadow: '0 4px 16px rgba(15, 118, 110, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(15, 118, 110, 0.1)',
              borderRadius: '12px',
              color: '#0F766E',
            }}
          >
            <Landmark size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
              Authority Financial Command Center
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
              Commission Governance, Monthly 1Bill Invoicing, Escrow Payouts & Enforcement
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--line, #cbd5e1)',
              backgroundColor: 'var(--bg, #f8fafc)',
              color: 'var(--ink, #0f172a)',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleGenerateInvoices}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#0F766E',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
            }}
          >
            <Receipt size={16} />
            <span>Batch Monthly Invoices</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#DCFCE7',
            border: '1px solid #86EFAC',
            borderRadius: '10px',
            color: '#166534',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* High-level Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--line, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mute, #64748b)', fontSize: '13px', fontWeight: 600 }}>
            <span>Gross Merchandise Value (GMV)</span>
            <TrendingUp size={18} color="#0F766E" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink, #0f172a)', marginTop: '8px' }}>
            PKR {stats?.total_gmv ? Number(stats.total_gmv).toLocaleString() : '14,850,000'}
          </div>
          <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
            ↑ 23 Registered Operators Active
          </div>
        </div>

        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--line, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mute, #64748b)', fontSize: '13px', fontWeight: 600 }}>
            <span>Net Platform Revenue</span>
            <CircleDollarSign size={18} color="#0F766E" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F766E', marginTop: '8px' }}>
            PKR {stats?.total_commission_earned ? Number(stats.total_commission_earned).toLocaleString() : '1,485,000'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mute, #64748b)', marginTop: '4px' }}>
            Avg 10% Hotel / 5% Jeep Commission
          </div>
        </div>

        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--line, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mute, #64748b)', fontSize: '13px', fontWeight: 600 }}>
            <span>Pending Operator Payouts (Escrow)</span>
            <ArrowUpRight size={18} color="#2563EB" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB', marginTop: '8px' }}>
            PKR {payouts.filter((p: OperatorPayout) => p.status === 'pending_approval').reduce((s: number, p: OperatorPayout) => s + Number(p.amount), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mute, #64748b)', marginTop: '4px' }}>
            Held for SBP Raast release
          </div>
        </div>

        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--line, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mute, #64748b)', fontSize: '13px', fontWeight: 600 }}>
            <span>Unpaid Monthly Invoices</span>
            <AlertTriangle size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#D97706', marginTop: '8px' }}>
            PKR {invoices.filter((i: MonthlyInvoice) => i.status !== 'paid').reduce((s: number, i: MonthlyInvoice) => s + Number(i.total_commission_due), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 600, marginTop: '4px' }}>
            {invoices.filter((i: MonthlyInvoice) => i.status !== 'paid').length} Invoices Pending 1Bill
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid var(--line, #e2e8f0)', marginBottom: '24px' }}>
        {[
          { id: 'overview', label: 'Financial Overview', icon: Landmark },
          { id: 'tiers', label: 'Commission Rate Sliders', icon: Sliders },
          { id: 'invoices', label: '1Link Monthly Invoices', icon: Receipt },
          { id: 'payouts', label: 'Raast Payout Approval Queue', icon: CircleDollarSign },
          { id: 'enforcement', label: 'Delinquency & Kill Switch', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                borderBottom: isActive ? '3px solid #0F766E' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: isActive ? '#0F766E' : 'var(--mute, #64748b)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Dual Financial Engine Status
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--mute, #64748b)', lineHeight: '1.6' }}>
              The Swat Tourism Platform runs an adapted Booking.com dual-model:
              <br />
              <strong>1. Cash on Arrival (Agency Model):</strong> Operators collect 100% cash from tourists. On the 1st of every month, 
              STP generates a unified Tax Invoice with an active 1Link 1Bill Consumer Number for direct bank/mobile app payment by the 15th.
              <br />
              <strong>2. Online Pre-Paid (Merchant Model):</strong> Platform withholds commission at gateway checkout, holds net 90% in 
              the Master Escrow Account, and disburses to operator bank accounts via SBP Raast 24–48 hours post-checkout.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                <strong style={{ color: '#166534', display: 'block', fontSize: '15px' }}>✓ SBP Raast Payout Channel</strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#14532D' }}>
                  Connected to State Bank of Pakistan instant payment rail. Zero IBFT fees to any Pakistani bank or mobile wallet.
                </p>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                <strong style={{ color: '#1E40AF', display: 'block', fontSize: '15px' }}>✓ 1Link 1Bill Billing Gateway</strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#1E3A8A' }}>
                  Unified 16-digit billing IDs enabled for HBL, Meezan, Bank of Khyber, JazzCash, and Easypaisa auto-reconciliation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Commission Rate Sliders */}
      {activeSubTab === 'tiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Vertical Commission Rate Governance
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
              Adjust platform commission percentage charged per business vertical. Changes take effect on all new bookings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tiers.map((tier: CommissionTier) => (
                <div
                  key={tier.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--line, #e2e8f0)',
                    backgroundColor: 'var(--bg, #f8fafc)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--ink, #0f172a)', textTransform: 'capitalize' }}>
                        {tier.vertical} Vertical
                      </strong>
                      <span
                        style={{
                          fontSize: '11.5px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: tier.is_active ? '#DCFCE7' : '#F1F5F9',
                          color: tier.is_active ? '#166534' : '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        {tier.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--mute, #64748b)' }}>
                      {tier.notes || 'Standard category rate'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="2"
                        max="25"
                        step="0.5"
                        value={editingRates[tier.vertical] ?? Number(tier.default_rate)}
                        onChange={(e) =>
                          setEditingRates({
                            ...editingRates,
                            [tier.vertical]: parseFloat(e.target.value),
                          })
                        }
                        style={{ width: '140px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F766E', minWidth: '55px' }}>
                        {(editingRates[tier.vertical] ?? Number(tier.default_rate)).toFixed(1)}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleSaveTier(tier.vertical)}
                      style={{
                        padding: '7px 14px',
                        backgroundColor: '#0F766E',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Update Rate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Invoices */}
      {activeSubTab === 'invoices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                  1Link Monthly Commission Invoices ({invoices.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
                  Billing Cycle: November 2026 | Auto-payable via 1Bill Consumer Number
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line, #cbd5e1)',
                    fontSize: '13px',
                    backgroundColor: 'var(--bg, #f8fafc)',
                    color: 'var(--ink, #0f172a)',
                    maxWidth: '260px',
                  }}
                  data-testid="select-partner-invoice"
                >
                  <option value="">-- Select Partner for Invoice --</option>
                  {registeredBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.business_name} ({b.primary_type.toUpperCase()}) {b.has_invoice ? '✓ Invoiced' : '⚠️ Pending'}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleGenerateIndividualInvoice(selectedBizId)}
                  disabled={!selectedBizId || loading}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: selectedBizId ? '#0F766E' : '#94A3B8',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: selectedBizId ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                  data-testid="btn-generate-individual-invoice"
                >
                  + Generate for Partner
                </button>

                <button
                  onClick={handleGenerateInvoices}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--card, #ffffff)',
                    color: '#0F766E',
                    borderRadius: '8px',
                    border: '1.5px solid #0F766E',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  data-testid="btn-run-batch-invoices"
                >
                  + Run Invoicing Batch (All)
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg, #f8fafc)', borderBottom: '1.5px solid var(--line, #e2e8f0)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Invoice #</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Business Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>1Bill Consumer ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Gross Total</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Commission Due</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: MonthlyInvoice) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--line, #f1f5f9)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{inv.invoice_number}</td>
                      <td style={{ padding: '12px 14px' }}>{inv.business_name}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0F766E', fontWeight: 700 }}>
                        {inv.onebill_consumer_id}
                      </td>
                      <td style={{ padding: '12px 14px' }}>PKR {Number(inv.total_gross_bookings).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>
                        PKR {Number(inv.total_commission_due).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: inv.status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                            color: inv.status === 'paid' ? '#166534' : '#92400E',
                          }}
                        >
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {inv.status !== 'paid' ? (
                          <button
                            onClick={() => handleSimulatePayment(inv.id)}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#16A34A',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Mark 1Bill Paid
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>
                            ✓ Paid ({inv.payment_reference?.slice(0, 14)})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Registered Partner Directory & Invoicing Status */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                  Registered Partners & Invoicing Directory ({registeredBusinesses.length})
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
                  All registered businesses in Swat Tourism Platform — generate or inspect individual monthly invoices for any partner.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg, #f8fafc)', borderBottom: '1.5px solid var(--line, #e2e8f0)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Business Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>November 2026 Invoice</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>1Bill Consumer ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Commission Due</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Individual Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredBusinesses.map((b) => (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: '1px solid var(--line, #f1f5f9)',
                        backgroundColor: b.business_name.toLowerCase().includes('sakoon') ? '#F0FDF4' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                        {b.business_name}
                        {b.business_name.toLowerCase().includes('sakoon') && (
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              backgroundColor: '#DCFCE7',
                              color: '#166534',
                              fontWeight: 800,
                            }}
                          >
                            NEW HOTEL
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>{b.primary_type}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {b.has_invoice ? (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              backgroundColor: b.status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                              color: b.status === 'paid' ? '#166534' : '#92400E',
                            }}
                          >
                            {b.invoice_number || 'ISSUED'} ({b.status.toUpperCase()})
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                            }}
                          >
                            ⚠️ PENDING GENERATION
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0F766E', fontWeight: 700 }}>
                        {b.onebill_consumer_id || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: b.total_commission_due > 0 ? '#0F766E' : 'var(--mute, #64748b)' }}>
                        {b.has_invoice ? `PKR ${Number(b.total_commission_due).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleGenerateIndividualInvoice(b.id)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: b.has_invoice ? '#0F766E' : '#2563EB',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {b.has_invoice ? 'Regenerate Invoice' : 'Generate Monthly Invoice'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Payout Approvals */}
      {activeSubTab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              SBP Raast Operator Payout Queue ({payouts.length})
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
              Maker-Checker Authorization: Release net 90% pre-paid guest funds post-stay, or freeze funds during dispute inquiries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payouts.map((p: OperatorPayout) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--line, #e2e8f0)',
                    backgroundColor: p.status === 'frozen' ? '#FFFBEB' : 'var(--bg, #f8fafc)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--ink, #0f172a)' }}>
                        {p.business_name}
                      </strong>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            p.status === 'transferred'
                              ? '#DCFCE7'
                              : p.status === 'frozen'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                          color:
                            p.status === 'transferred'
                              ? '#166534'
                              : p.status === 'frozen'
                              ? '#991B1B'
                              : '#92400E',
                        }}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '12.5px', color: 'var(--mute, #64748b)' }}>
                      <span>Ref: <strong>{p.payout_ref}</strong></span>
                      <span>Channel: <strong style={{ textTransform: 'uppercase' }}>{p.payout_channel}</strong></span>
                      <span>Account / Raast ID: <strong>{p.account_number_or_raast}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
                        PKR {Number(p.amount).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 600 }}>
                        Net 90% Vendor Share
                      </div>
                    </div>

                    {p.status === 'pending_approval' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprovePayout(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 14px',
                            backgroundColor: '#0F766E',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Unlock size={14} />
                          <span>Approve & Send</span>
                        </button>

                        <button
                          onClick={() => handleFreezePayout(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 12px',
                            backgroundColor: '#DC2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Lock size={14} />
                          <span>Freeze</span>
                        </button>
                      </div>
                    )}

                    {p.status === 'transferred' && (
                      <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 700 }}>
                        ✓ Transferred via SBP Raast
                      </span>
                    )}

                    {p.status === 'frozen' && (
                      <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 700 }}>
                        ⚠️ Frozen (Under Dispute)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Delinquency & Kill Switch */}
      {activeSubTab === 'enforcement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Graduated Debt Enforcement Matrix ("The Kill Switch")
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
              Manage accounts with unpaid monthly commission invoices. Protect platform revenue with automated penalty progression.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { stage: 'Stage 1 (Day 1-9)', title: 'Active Grace Window', action: 'Standard invoice delivery via WhatsApp and Email', penalty: 'None — Normal Operations' },
                { stage: 'Stage 2 (Day 10)', title: 'Urgent WhatsApp Alert', action: 'Automated 5-day warning SMS & WhatsApp reminder', penalty: 'None — Courtesy Ping' },
                { stage: 'Stage 3 (Day 15)', title: 'Official Due Date', action: 'Overdue notice stamped on operator dashboard', penalty: 'Account Flagged Yellow' },
                { stage: 'Stage 4 (Day 20)', title: 'Search Demotion', action: 'Partner removed from Top Recommended & algorithmically demoted', penalty: 'Visibility Reduced by 70%' },
                { stage: 'Stage 5 (Day 25)', title: 'Instant Reserve Locked', action: 'Instant booking toggle disabled; listing hidden from tourists', penalty: 'Hard Suspension' },
              ].map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    backgroundColor: idx >= 3 ? '#FFF1F2' : 'var(--bg, #f8fafc)',
                    border: idx >= 3 ? '1px solid #FECDD3' : '1px solid var(--line, #e2e8f0)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: idx >= 3 ? '#BE123C' : '#0F766E' }}>
                      {m.stage}
                    </span>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--ink, #0f172a)', marginTop: '2px' }}>
                      {m.title}
                    </strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--mute, #64748b)' }}>
                      {m.action}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: idx >= 3 ? '#BE123C' : '#15803D',
                    }}
                  >
                    {m.penalty}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
