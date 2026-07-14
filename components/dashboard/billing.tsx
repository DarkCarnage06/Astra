'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, Star, Check, Sparkles, Gift, Share2, FileText, Percent, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PLANS, type PlanKey } from '../../lib/razorpay';
import { toast } from '../../lib/toast';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const PLAN_ICONS: Record<PlanKey, React.ElementType> = {
  FREE: Star,
  PRO: Zap,
  PREMIUM: Crown,
};

const PLAN_COLORS: Record<PlanKey, string> = {
  FREE: '#94A3B8',
  PRO: '#D4AF37',
  PREMIUM: '#A78BFA',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: PlanKey;
  orderId: string;
  paymentId: string;
  status: string;
  createdAt: string;
}

interface BillingHistoryData {
  plan: PlanKey;
  subscription: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status?: string;
    startDate?: string;
    amount?: number;
  } | null;
  invoices: Invoice[];
  referralCode: string;
  referralsCount: number;
  referredBy: string | null;
}

export function BillingPlans({ currentPlan = 'FREE' }: { currentPlan?: string }) {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Billing history / invoice states
  const [historyData, setHistoryData] = useState<BillingHistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Coupon states
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Referral registration states
  const [referralInput, setReferralInput] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);

  // Load Razorpay script & fetch billing history
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      document.head.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }

    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const res = await fetch('/api/payment/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
        if (data.referredBy) {
          setAppliedReferral(data.referredBy);
        }
      }
    } catch (err) {
      console.error('Failed to load billing details:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    if (!couponInput.trim()) return;

    try {
      const res = await fetch('/api/payment/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data.code);
        setDiscountPct(data.discountPct);
        toast.success(`Coupon ${data.code} applied! ${data.discountPct}% Discount.`);
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
        setDiscountPct(0);
      }
    } catch {
      setCouponError('Error validating coupon');
    }
  };

  const handleApplyReferral = async () => {
    setReferralError(null);
    if (!referralInput.trim()) return;

    try {
      const res = await fetch('/api/payment/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: referralInput,
          referredClerkId: 'me' // Backend will retrieve from Clerk auth
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedReferral(data.referrerName);
        toast.success(`Successfully referred by ${data.referrerName}!`);
        fetchBillingHistory();
      } else {
        setReferralError(data.error || 'Invalid referral code');
      }
    } catch {
      setReferralError('Error registering referral');
    }
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    if (planKey === 'FREE' || !razorpayLoaded) return;

    setLoading(planKey);
    try {
      // Create Razorpay order
      const createOrderUrl = '/api/payment/create-order';
      const res = await fetch(createOrderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          couponCode: appliedCoupon,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create order: status ${res.status}`);
      }

      const { orderId, amount, currency, keyId } = await res.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'ASTRA',
        description: `${PLANS[planKey].name} Plan Upgrade`,
        order_id: orderId,
        handler: async (response: Record<string, string>) => {
          // Verify payment on server
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                plan: planKey,
                couponCode: appliedCoupon,
                referralCode: referralInput || undefined,
              }),
            });

            if (verifyRes.ok) {
              toast.success('Subscription completed successfully!');
              window.location.reload();
            } else {
              throw new Error(`Verification endpoint failed with status ${verifyRes.status}`);
            }
          } catch (verErr) {
            console.error('Verification error:', verErr);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#D4AF37' },
        modal: { backdropclose: false },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown payment initialization error';
      toast.error(`Payment initialization failed: ${msg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Generates a dynamic print view / simulated PDF download of the invoice details
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing invoice generation.');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Invoice ASTRA-${invoice.id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .details { margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border-bottom: 1px dashed #000; padding: 10px; text-align: left; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 30px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ASTRA ASTROLOGY SERVICES</div>
            <div>Invoice Number: AST-${invoice.id.slice(-6).toUpperCase()}</div>
            <div>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</div>
          </div>
          <div class="details">
            <strong>Bill To:</strong> User Account ID: ${invoice.userId}<br/>
            <strong>Payment ID:</strong> ${invoice.paymentId}<br/>
            <strong>Order ID:</strong> ${invoice.orderId}
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ASTRA ${invoice.plan} Subscription Package</td>
                <td>1</td>
                <td>INR ${(invoice.amount / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">
            Total Charged: INR ${(invoice.amount / 100).toFixed(2)}
          </div>
          <div class="footer">
            Thank you for using ASTRA self-insight engines.<br/>
            Secured by Razorpay. Keep this copy for your records.<br/><br/>
            <button onclick="window.print()">Print Invoice</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const planKeys = Object.keys(PLANS) as PlanKey[];

  return (
    <div className="space-y-10">
      {/* Active Subscription Status Banner */}
      {!historyLoading && historyData?.subscription && (
        <motion.div
          {...fadeUp(0)}
          className="rounded-[24px] border border-[#D4AF37]/30 bg-black/40 p-6 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Crown size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-white">Active Subscription</h3>
                  <span className="rounded-full bg-[#D4AF37]/20 px-3 py-0.5 text-xs font-semibold text-[#D4AF37]">
                    {historyData.plan}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#B8BCC8]">
                  Started on {new Date(historyData.subscription.startDate || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-[#B8BCC8]">Billing Amount</p>
              <p className="font-display text-lg font-bold text-white">
                ₹{((historyData.subscription.amount ?? 0) / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pricing Cards Grid */}
      <div>
        <h2 className="mb-6 font-display text-2xl font-bold text-white">Available Plans</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {planKeys.map((planKey, i) => {
            const plan = PLANS[planKey];
            const Icon = PLAN_ICONS[planKey];
            const color = PLAN_COLORS[planKey];
            const isCurrent = currentPlan === planKey;
            const isPro = planKey === 'PRO';

            // Calculate price based on applied coupons
            let displayPrice: number = plan.price;
            if (appliedCoupon && plan.price > 0) {
              displayPrice = Math.max(0, Math.floor(plan.price * (1 - discountPct / 100)));
            }

            return (
              <motion.div
                key={planKey}
                {...fadeUp(i * 0.1)}
                whileHover={!isCurrent ? { y: -6, scale: 1.01 } : {}}
                className={`relative flex flex-col rounded-[24px] border p-6 backdrop-blur-xl transition ${
                  isCurrent
                    ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                    : isPro
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                {/* Current / Popular badge */}
                {isCurrent ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                    Current Plan
                  </div>
                ) : isPro ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    Most Popular
                  </div>
                ) : null}

                {/* Plan header */}
                <div className="mb-5">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="font-display text-3xl font-bold text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-[#B8BCC8]">₹</span>
                        <span className="font-display text-3xl font-bold text-white">
                          {(displayPrice / 100).toFixed(0)}
                        </span>
                        {appliedCoupon && (
                          <span className="ml-2 text-xs line-through text-[#B8BCC8]/50">
                            ₹{(plan.price / 100).toFixed(0)}
                          </span>
                        )}
                        <span className="text-sm text-[#B8BCC8]">/lifetime</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color }} />
                      <span className="text-sm text-[#B8BCC8]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={isCurrent || loading === planKey || plan.price === 0}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                    isCurrent
                      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-[#B8BCC8]'
                      : plan.price === 0
                      ? 'cursor-default border border-white/10 bg-white/5 text-[#B8BCC8]'
                      : isPro
                      ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90'
                      : 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {loading === planKey ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={14} />
                    </motion.span>
                  ) : null}
                  {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : `Upgrade to ${plan.name}`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Promos, Coupons & Referrals Section */}
      {currentPlan === 'FREE' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Coupon Entry */}
          <motion.div {...fadeUp(0.2)} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-white">
              <Percent size={18} className="text-[#D4AF37]" />
              Apply Discount Coupon
            </h3>
            <p className="mb-4 text-xs text-[#B8BCC8]">
              Have a promotional discount code? Enter it below to discount checkout amounts.
            </p>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="WELCOME10, ASTRA50"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-[#B8BCC8]/50 outline-none focus:border-[#D4AF37]/40"
              />
              <button
                onClick={handleApplyCoupon}
                className="rounded-xl bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15 transition"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="mt-2 text-xs text-red-400">{couponError}</p>}
            {appliedCoupon && (
              <p className="mt-2 text-xs text-green-400">
                Code <strong>{appliedCoupon}</strong> active ({discountPct}% discount applied).
              </p>
            )}
          </motion.div>

          {/* Referral Register */}
          <motion.div {...fadeUp(0.3)} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-white">
              <Gift size={18} className="text-[#D4AF37]" />
              Enter Friend's Referral Code
            </h3>
            <p className="mb-4 text-xs text-[#B8BCC8]">
              Enter a friend's code. Both of you receive benefits.
            </p>
            <div className="flex gap-2">
              <input
                value={referralInput}
                disabled={!!appliedReferral}
                onChange={(e) => setReferralInput(e.target.value)}
                placeholder="ASTRA-XXXXXX"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-[#B8BCC8]/50 outline-none focus:border-[#D4AF37]/40 disabled:opacity-50"
              />
              <button
                disabled={!!appliedReferral}
                onClick={handleApplyReferral}
                className="rounded-xl bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15 transition disabled:opacity-50"
              >
                Register
              </button>
            </div>
            {referralError && <p className="mt-2 text-xs text-red-400">{referralError}</p>}
            {appliedReferral && (
              <p className="mt-2 text-xs text-green-400">
                Referred successfully by <strong>{appliedReferral}</strong>.
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Referral Program Overview (For all users) */}
      {!historyLoading && historyData && (
        <motion.div {...fadeUp(0.4)} className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <Share2 size={18} className="text-[#D4AF37]" />
                Your Referral Program
              </h3>
              <p className="text-xs text-[#B8BCC8]">
                Share your unique code with friends. When they upgrade, both get access rewards.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="select-all rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 font-mono text-sm text-[#D4AF37]">
                  {historyData.referralCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(historyData.referralCode);
                    toast.success('Referral code copied to clipboard!');
                  }}
                  className="rounded-lg bg-white/5 p-1.5 hover:bg-white/10 text-white transition"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-black/30 p-4 text-center border border-white/5">
              <p className="text-xl font-bold text-[#D4AF37]">{historyData.referralsCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#B8BCC8]">Friends Referred</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Invoices and Payment History */}
      {!historyLoading && historyData && historyData.invoices.length > 0 && (
        <motion.div {...fadeUp(0.5)} className="space-y-4">
          <h2 className="font-display text-lg font-bold text-white">Invoices & Payment History</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[#B8BCC8]">
                  <th className="p-4">Date</th>
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Plan Upgrade</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {historyData.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-[#D4AF37]">
                      AST-{invoice.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 font-semibold">{invoice.plan}</td>
                    <td className="p-4">₹{(invoice.amount / 100).toFixed(2)}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 transition"
                      >
                        <FileText size={12} />
                        Invoice
                        <Download size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
