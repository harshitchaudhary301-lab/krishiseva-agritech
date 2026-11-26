"""
Verification Script: Financial Accounting & Ledger Integrity
Mission 03 Acceptance Gate V3.0 (KS-SM-003-EVG-003)
Tests FIN-01 through FIN-12 and mandatory synthetic fixture.
"""
import os
import sys
from decimal import Decimal
import datetime

# Django Setup
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from farm_projects.models import (
    Farm, Field, FarmProject, CropTemplate,
    ExpenseRecord, RevenueRecord, PaymentRecord, FinancialAdjustment
)

User = get_user_model()

def run_financial_verification():
    print("=" * 80)
    print("SECTION 11 — FINANCIAL PLANNER & ACCOUNTING INTEGRITY VERIFICATION")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 80)

    # 1. Setup Test User and Project
    farmer, _ = User.objects.get_or_create(
        email='fin_verify_farmer@krishiseva.internal',
        defaults={'username': 'fin_verify_farmer', 'first_name': 'Ramesh', 'last_name': 'Kumar', 'role': 'farmer', 'phone': '+919876500001'}
    )
    farm, _ = Farm.objects.get_or_create(
        farmer=farmer,
        name='Adarsh Krishi Farm',
        defaults={'size_acres': Decimal('10.00'), 'district': 'Meerut', 'state': 'Uttar Pradesh'}
    )
    field, _ = Field.objects.get_or_create(
        farm=farm,
        name='North Plot',
        defaults={'area_acres': Decimal('5.00'), 'soil_type': 'alluvial'}
    )
    crop_template = CropTemplate.objects.filter(slug='wheat').first()

    project, _ = FarmProject.objects.get_or_create(
        farmer=farmer,
        name='Wheat Rabi 2026 Financial Test Project',
        defaults={
            'farm': farm,
            'field': field,
            'crop_template': crop_template,
            'template_version': 'v1.0',
            'crop': 'Wheat',
            'variant': 'Standard',
            'start_date': datetime.date.today(),
            'expected_completion_date': datetime.date.today() + datetime.timedelta(days=135),
            'target_area_acres': Decimal('5.00'),
            'status': 'active'
        }
    )

    # Reset project financial records for clean reproducible test
    ExpenseRecord.objects.filter(project=project).delete()
    RevenueRecord.objects.filter(project=project).delete()
    PaymentRecord.objects.filter(project=project).delete()

    print("[STEP 1] Initial Project Financial Ledger Initialized (FIN-01)")
    summary_0 = project.get_financial_summary()
    assert Decimal(summary_0['planned_estimates']) == Decimal('0.00')
    assert Decimal(summary_0['confirmed_commitments']) == Decimal('0.00')
    assert Decimal(summary_0['incurred_expenditure']) == Decimal('0.00')
    assert Decimal(summary_0['outstanding_balance']) == Decimal('0.00')
    print("  PASS: Fresh project ledger initialized cleanly with INR 0.00 balances.")

    # 2. FIN-01: Planned Estimates
    est = ExpenseRecord.objects.create(
        project=project,
        title='Seed & Fertilizer Budgeted Estimate',
        category='seeds',
        record_type='estimate',
        amount=Decimal('4500.00'),
        status='active'
    )
    summary_est = project.get_financial_summary()
    assert Decimal(summary_est['planned_estimates']) == Decimal('4500.00')
    print(f"  PASS: Planned estimate recorded: INR {summary_est['planned_estimates']}")

    # 3. MANDATORY SYNTHETIC FIXTURE (Section 11):
    # Commitment: INR 3,000.00
    # Advance Payment: INR 500.00
    # Final Incurred Cost: INR 2,800.00 (adjusted down by 200.00)
    # Expected Outstanding Balance: INR 2,300.00
    print("\n[STEP 2] Executing Mandatory Synthetic Fixture (FIN-02, FIN-03, FIN-04, FIN-05, FIN-06)")
    # Record commitment of 3,000.00
    commitment = ExpenseRecord.objects.create(
        project=project,
        title='Land Preparation Service Booking',
        category='machinery_rental',
        record_type='commitment',
        amount=Decimal('3000.00'),
        status='active'
    )
    summary_commit = project.get_financial_summary()
    assert Decimal(summary_commit['confirmed_commitments']) == Decimal('3000.00')
    print(f"  PASS: Commitment recorded: INR {summary_commit['confirmed_commitments']}")

    # Record advance payment of 500.00
    advance_pmt = PaymentRecord.objects.create(
        project=project,
        expense=commitment,
        payer=farmer,
        payment_type='advance',
        amount=Decimal('500.00'),
        payment_mode='cash',
        transaction_reference='ADV-TEST-001',
        payment_date=datetime.date.today()
    )
    summary_adv = project.get_financial_summary()
    assert Decimal(summary_adv['recorded_advance_payments']) == Decimal('500.00')
    assert Decimal(summary_adv['total_recorded_payments']) == Decimal('500.00')
    print(f"  PASS: Advance payment recorded: INR {summary_adv['recorded_advance_payments']}")

    # Service completed: Convert/record incurred expense of 3,000.00 then adjust down by 200.00 to 2,800.00
    commitment.status = 'converted'
    commitment.save()

    incurred_exp = ExpenseRecord.objects.create(
        project=project,
        title='Land Preparation Final Invoice',
        category='machinery_rental',
        record_type='incurred',
        amount=Decimal('3000.00'),
        status='active'
    )
    # Apply adjustment of -200.00 (FIN-09)
    admin_user, _ = User.objects.get_or_create(
        email='admin_fin@krishiseva.internal',
        defaults={'username': 'admin_fin', 'first_name': 'Admin', 'last_name': 'User', 'role': 'admin'}
    )
    adj = FinancialAdjustment.objects.create(
        expense=incurred_exp,
        amount=Decimal('-200.00'),
        reason='Field area adjustment: 4.8 acres actual vs 5.0 acres estimated (-200 INR)',
        approved_by=admin_user
    )
    summary_inc = project.get_financial_summary()
    assert Decimal(summary_inc['incurred_expenditure']) == Decimal('2800.00'), f"Expected 2800.00, got {summary_inc['incurred_expenditure']}"
    assert Decimal(summary_inc['outstanding_balance']) == Decimal('2300.00'), f"Expected 2300.00, got {summary_inc['outstanding_balance']}"
    print(f"  PASS: Incurred expenditure with adjustment: INR {summary_inc['incurred_expenditure']}")
    print(f"  PASS: Calculated outstanding balance: INR {summary_inc['outstanding_balance']} (2800 - 500 = 2300)")

    # 4. FIN-07: Overpayment / Refundable Balance Validation
    print("\n[STEP 3] Verifying Overpayment & Refundable Balance Handling (FIN-07)")
    # Record payment of 3,000.00 against the 2,300 balance
    over_pmt = PaymentRecord.objects.create(
        project=project,
        expense=incurred_exp,
        payer=farmer,
        payment_type='final',
        amount=Decimal('3000.00'),
        payment_mode='bank_transfer',
        transaction_reference='FINAL-OVER-001',
        payment_date=datetime.date.today()
    )
    summary_over = project.get_financial_summary()
    # Total payments: 500 + 3000 = 3500. Incurred: 2800.
    # Outstanding balance should be 0.00, Overpayment balance should be 700.00
    assert Decimal(summary_over['outstanding_balance']) == Decimal('0.00')
    assert Decimal(summary_over['overpayment_balance']) == Decimal('700.00'), f"Expected 700.00, got {summary_over['overpayment_balance']}"
    print(f"  PASS: Outstanding balance clamped at INR {summary_over['outstanding_balance']}")
    print(f"  PASS: Overpayment balance accurately computed: INR {summary_over['overpayment_balance']}")

    # 5. FIN-11: Refund Tracking & Balance Reconciliation
    print("\n[STEP 4] Verifying Refund Tracking & Net Payments (FIN-11)")
    refund_pmt = PaymentRecord.objects.create(
        project=project,
        expense=incurred_exp,
        payer=admin_user,
        payee=farmer,
        payment_type='refund',
        amount=Decimal('700.00'),
        payment_mode='bank_transfer',
        transaction_reference='REFUND-001',
        payment_date=datetime.date.today()
    )
    summary_refund = project.get_financial_summary()
    assert Decimal(summary_refund['refunds']) == Decimal('700.00')
    assert Decimal(summary_refund['net_recorded_payments']) == Decimal('2800.00')
    assert Decimal(summary_refund['overpayment_balance']) == Decimal('0.00')
    assert Decimal(summary_refund['outstanding_balance']) == Decimal('0.00')
    print(f"  PASS: Refund of INR {summary_refund['refunds']} reconciled.")
    print(f"  PASS: Net recorded payments: INR {summary_refund['net_recorded_payments']}, Overpayment: INR {summary_refund['overpayment_balance']}")

    # 6. FIN-08: Cancellation Release of Unutilized Commitment
    print("\n[STEP 5] Verifying Booking Cancellation Commitment Release (FIN-08)")
    cancel_commitment = ExpenseRecord.objects.create(
        project=project,
        title='Irrigation Service Booking (To be cancelled)',
        category='irrigation',
        record_type='commitment',
        amount=Decimal('1500.00'),
        status='active'
    )
    summary_pre_cancel = project.get_financial_summary()
    assert Decimal(summary_pre_cancel['confirmed_commitments']) == Decimal('1500.00')

    # Cancel the commitment
    cancel_commitment.status = 'cancelled'
    cancel_commitment.save()
    summary_post_cancel = project.get_financial_summary()
    assert Decimal(summary_post_cancel['confirmed_commitments']) == Decimal('0.00')
    print("  PASS: Cancelled commitment successfully excluded; unutilized commitment released.")

    # 7. FIN-12: Realized Revenue & Net Surplus Calculation
    print("\n[STEP 6] Verifying Realized Revenue & Net Surplus Calculation (FIN-12)")
    rev = RevenueRecord.objects.create(
        project=project,
        crop='Wheat',
        quantity_quintals=Decimal('120.00'),
        rate_per_quintal=Decimal('2275.00'),
        total_realized_revenue=Decimal('273000.00'),
        buyer_name='Meerut Mandi Trader',
        mandi_or_mill='Meerut APMC Mandi',
        sale_date=datetime.date.today()
    )
    # Total revenue = 120 * 2275 = 273,000.00
    summary_rev = project.get_financial_summary()
    expected_rev = Decimal('120.00') * Decimal('2275.00')
    expected_surplus = expected_rev - Decimal('2800.00') # Revenue - Incurred
    assert Decimal(summary_rev['realized_revenue']) == expected_rev
    assert Decimal(summary_rev['recorded_surplus']) == expected_surplus
    print(f"  PASS: Realized revenue: INR {summary_rev['realized_revenue']}")
    print(f"  PASS: Net farm surplus: INR {summary_rev['recorded_surplus']} (Revenue - Incurred)")
    print(f"  PASS: Economic disclaimer included: '{summary_rev['economic_disclaimer']}'")

    # 8. FIN-10: Decimal Precision & Integrity Check
    print("\n[STEP 7] Verifying Decimal Precision & Arithmetic Safety (FIN-10)")
    for key, val in summary_rev.items():
        if key not in ['economic_disclaimer']:
            d = Decimal(str(val))
            # Verify no floating point artifacts like .99999999
            assert '.' in str(val) and len(str(val).split('.')[1]) == 2, f"Value {val} for {key} is not formatted to 2 decimals"
    print("  PASS: Strict Decimal(10, 2) arithmetic preserved; 0 floating point rounding drift.")

    print("\n" + "=" * 80)
    print("FINANCIAL VERIFICATION COMPLETE: ALL 12 FINANCIAL REQUIREMENTS (FIN-01..12) PASS")
    print("=" * 80)

if __name__ == '__main__':
    run_financial_verification()
