import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Copy,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { financeApi } from '../../api/finance';
import type { MonthlyInvoice } from '../../api/finance';

interface OperatorEarningsInvoicesViewProps {
  businessId?: string;
  businessName?: string;
  primaryType?: string;
  isDemoUser?: boolean;
}

export const OperatorEarningsInvoicesView: React.FC<OperatorEarningsInvoicesViewProps> = ({
  businessId,
  businessName = 'My Business',
  primaryType = 'hotel',
  isDemoUser = false,
}) => {
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyInvoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      if (businessId) {
        // Fetch strictly for this authenticated business profile
        const data = await financeApi.getMyInvoices(businessId);
        setInvoices(data || []);
      } else if (isDemoUser) {
        // Only unauthenticated demo mode accounts load mock demo list
        const all = await financeApi.getInvoices();
        setInvoices(all.slice(0, 5));
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Failed to load operator invoices:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [businessId, isDemoUser]);

  const handleCopyOneBill = (onebillId: string) => {
    navigator.clipboard.writeText(onebillId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePayNow = async (invoiceId: string) => {
    try {
      await financeApi.payInvoice(invoiceId, '1bill');
      setPaidSuccess(true);
      setTimeout(() => {
        setPaidSuccess(false);
        setSelectedInvoice(null);
        loadInvoices();
      }, 2000);
    } catch {
      alert('Payment processing failed');
    }
  };

  const handleReportNoShow = () => {
    alert('No-Show reported. Under the 48-hour policy, this booking commission will be audited and removed from your monthly invoice.');
  };

  const totalGross = invoices.reduce((sum, i) => sum + Number(i.total_gross_bookings), 0);
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const dueAmount = unpaidInvoices.reduce((sum, i) => sum + Number(i.total_commission_due), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
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
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>
            {primaryType} Partner Portal
          </span>
          <h2 style={{ margin: '2px 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
            Earnings & Monthly Commission Bills
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--mute, #64748b)' }}>
            {businessName} • Monthly Invoices via 1Link 1Bill & JazzCash
          </p>
        </div>

        <button
          onClick={loadInvoices}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--line, #cbd5e1)',
            backgroundColor: 'var(--bg, #f8fafc)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Cards Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ padding: '18px', backgroundColor: 'var(--card, #ffffff)', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--mute, #64748b)', fontWeight: 600 }}>Total Bookings Volume</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink, #0f172a)', marginTop: '6px' }}>
            PKR {totalGross.toLocaleString()}
          </div>
          <span style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 600 }}>100% Cash / Online stays</span>
        </div>

        <div style={{ padding: '18px', backgroundColor: 'var(--card, #ffffff)', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--mute, #64748b)', fontWeight: 600 }}>Commission Rate</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F766E', marginTop: '6px' }}>
            {primaryType === 'hotel' ? '10.0%' : primaryType === 'transport' ? '5.0%' : '8.0%'}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--mute, #64748b)' }}>Standard Category Tier</span>
        </div>

        <div style={{ padding: '18px', backgroundColor: 'var(--card, #ffffff)', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--mute, #64748b)', fontWeight: 600 }}>Net Commission Due</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: dueAmount > 0 ? '#DC2626' : '#16A34A', marginTop: '6px' }}>
            PKR {dueAmount.toLocaleString()}
          </div>
          <span style={{ fontSize: '11.5px', color: dueAmount > 0 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
            {dueAmount > 0 ? 'Due by 15th of month' : '✓ All Bills Paid'}
          </span>
        </div>

        <div style={{ padding: '18px', backgroundColor: 'var(--card, #ffffff)', borderRadius: '12px', border: '1px solid var(--line, #e2e8f0)' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--mute, #64748b)', fontWeight: 600 }}>Account Standing</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#16A34A', marginTop: '8px' }}>
            Good Standing ✓
          </div>
          <span style={{ fontSize: '11.5px', color: '#16A34A' }}>Instant Reserve Active</span>
        </div>
      </div>

      {/* No-Show Policy Callout */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={20} color="#0F766E" />
          <span style={{ fontSize: '13.5px', color: 'var(--ink, #0f172a)' }}>
            <strong>48-Hour No-Show Commission Protection:</strong> If a traveler didn't show up, report it within 48 hours to waive commission.
          </span>
        </div>

        <button
          onClick={handleReportNoShow}
          style={{
            padding: '6px 14px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Report No-Show
        </button>
      </div>

      {/* Monthly Invoices Table */}
      <div
        style={{
          padding: '24px',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--line, #e2e8f0)',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
          Monthly Invoices & Bills History
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg, #f8fafc)', borderBottom: '1.5px solid var(--line, #e2e8f0)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Invoice #</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Period</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>1Bill Consumer ID</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Total Bookings</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Commission (10%)</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px 14px', textAlign: 'center', color: 'var(--mute, #64748b)' }}>
                    <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink, #0f172a)' }}>No invoices yet</div>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Monthly commission invoices for {businessName} will appear here after completed guest stays.
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--line, #f1f5f9)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td style={{ padding: '12px 14px' }}>{inv.billing_period}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                        {inv.onebill_consumer_id}
                      </span>
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
                          onClick={() => setSelectedInvoice(inv)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#0F766E',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Pay Invoice
                        </button>
                      ) : (
                        <span style={{ fontSize: '12.5px', color: '#16A34A', fontWeight: 700 }}>
                          ✓ Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Invoice Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={22} color="#0F766E" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
                  Pay Commission Invoice
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Invoice Number</span>
                <strong>{selectedInvoice.invoice_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                <span>Due Date</span>
                <strong>{selectedInvoice.due_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#0F766E', fontWeight: 800, marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                <span>Amount Due</span>
                <span>PKR {Number(selectedInvoice.total_commission_due).toLocaleString()}</span>
              </div>
            </div>

            {/* 1Bill Consumer Number Box */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0F766E', marginBottom: '6px' }}>
                1Link 1Bill Consumer Number
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '10px',
                  border: '1.5px solid #86EFAC',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#166534' }}>
                  {selectedInvoice.onebill_consumer_id}
                </span>

                <button
                  onClick={() => handleCopyOneBill(selectedInvoice.onebill_consumer_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    backgroundColor: '#16A34A',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={13} />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                Pay directly inside HBL, Meezan, Bank of Khyber, Easypaisa, or JazzCash app under <strong>1Bill Invoices</strong>.
              </p>
            </div>

            {/* Quick Simulation / Mark Paid Button */}
            {paidSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#16A34A', fontWeight: 700, fontSize: '15px' }}>
                ✓ Payment Received! Invoice Settled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handlePayNow(selectedInvoice.id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0F766E',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                  }}
                >
                  Confirm Payment via 1Bill
                </button>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Close & Pay Later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
