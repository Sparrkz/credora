from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from accounts.models import Customer, Account
from transactions.models import Transaction
from credora.models import Loan
from decimal import Decimal
from decimal import InvalidOperation
import uuid
from django.utils import timezone
from django.http import JsonResponse
from django.http import HttpResponseNotFound
import random
import string
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings

# Public pages
def home(request):
    """Home page view"""
    return render(request, 'index.html')

def about(request):
    """About page view"""
    return render(request, 'about.html')

def services(request):
    """Services page view"""
    return render(request, 'services.html')

def contact(request):
    """Contact page view"""
    return render(request, 'contact.html')

def terms(request):
    """Terms and conditions view"""
    return render(request, 'terms.html')

# Authentication views
@require_http_methods(["GET", "POST"])
def login_view(request):
    """Login page and authentication"""
    if request.user.is_authenticated:
        return redirect('user_dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            
            # Create login notification
            from notifications.models import Notification
            Notification.create_notification(
                user=user,
                notification_type='login',
                title='Device Login Notice',
                message=f'A new login to your account was detected from {request.META.get("REMOTE_ADDR", "unknown IP")}. If this was not you, please secure your account immediately.',
                metadata={'ip_address': request.META.get('REMOTE_ADDR'), 'user_agent': request.META.get('HTTP_USER_AGENT')}
            )
            
            # Check if user has PIN set
            try:
                customer = Customer.objects.get(user=user)
                if customer.pin:
                    # User has PIN, redirect to PIN verification
                    request.session['pending_pin_verification'] = True
                    messages.info(request, 'Please enter your PIN to continue.')
                    next_url = request.GET.get('next', 'user_dashboard')
                    request.session['redirect_after_pin'] = next_url
                    return redirect('verify_pin')
            except Customer.DoesNotExist:
                pass
            
            messages.success(request, f'Welcome back, {user.first_name or user.username}!')
            next_url = request.GET.get('next', 'user_dashboard')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, 'login.html')

@require_http_methods(["GET", "POST"])
def register_view(request):
    """Registration page and user creation"""
    if request.user.is_authenticated:
        return redirect('user_dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        phone = request.POST.get('phone', '')
        address = request.POST.get('address', '')
        dob = request.POST.get('date_of_birth', '1990-01-01')
        
        # Validation
        if password != password2:
            messages.error(request, 'Passwords do not match.')
        elif User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
        elif User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
        else:
            try:
                # Create user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )
                
                # Create customer profile
                customer = Customer.objects.create(
                    user=user,
                    phone=phone or f'555-{username[:4]}',
                    address=address or '123 Main St',
                    date_of_birth=dob,
                    id_number=f'ID{uuid.uuid4().hex[:8].upper()}'
                )
                
                # Create default account
                Account.objects.create(
                    customer=customer,
                    account_number=f'ACC{uuid.uuid4().hex[:10].upper()}',
                    account_type='savings',
                    balance=Decimal('0.00'),
                    status='active'
                )
                
                # Create welcome notification
                from notifications.models import Notification
                Notification.create_notification(
                    user=user,
                    notification_type='registration',
                    title='Welcome to Corion',
                    message='Your account has been successfully created. Explore our services and manage your finances securely.',
                    metadata={'registration_date': timezone.now().isoformat()}
                )
                
                messages.success(request, 'Registration successful! Please login.')
                return redirect('login')
            except Exception as e:
                messages.error(request, f'Registration failed: {str(e)}')
    
    return render(request, 'register.html')

def logout_view(request):
    """Logout user"""
    auth_logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('home')

def forgot_password(request):
    """Forgot password view"""
    return render(request, 'forgot-password.html')

# User dashboard views
@login_required
def user_dashboard(request):
    """User dashboard with account summary"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
        total_balance = sum(acc.balance for acc in accounts)
        primary_account = accounts.first() if accounts else None
        recent_transactions = Transaction.objects.filter(
            account__in=accounts
        ).order_by('-created_at')[:10]
        
        context = {
            'customer': customer,
            'accounts': accounts,
            'primary_account': primary_account,
            'total_balance': total_balance,
            'recent_transactions': recent_transactions,
            'accounts_count': accounts.count(),
        }
    except Customer.DoesNotExist:
        context = {
            'customer': None,
            'accounts': [],
            'primary_account': None,
            'total_balance': Decimal('0.00'),
            'recent_transactions': [],
            'accounts_count': 0,
        }
    
    return render(request, 'user/dashboard.html', context)

@login_required
def transaction_history(request):
    """Transaction history view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
        transactions = Transaction.objects.filter(
            account__in=accounts
        ).order_by('-created_at')

        # Include loans in the unified history as well
        loans = Loan.objects.filter(account__in=accounts).order_by('-application_date')

        # Build a unified history list sorted by timestamp
        history = []
        for t in transactions:
            # Determine direction (credit/debit)
            direction = 'credit' if t.transaction_type == 'deposit' else 'debit'
            # Counterparty/label
            if t.transaction_type == 'deposit':
                label = dict(Transaction.PAYMENT_METHODS).get(t.payment_method, 'Deposit') or 'Deposit'
            elif t.transaction_type == 'transfer':
                label = t.recipient_account or 'Transfer'
            elif t.transaction_type == 'withdrawal':
                label = 'Withdrawal'
            elif t.transaction_type == 'payment':
                label = t.description or 'Payment'
            else:
                label = t.description or t.get_transaction_type_display()

            history.append({
                'kind': 'transaction',
                'id': t.id,
                'reference': t.reference_number,
                'created_at': t.created_at,
                'amount': t.amount,
                'currency': t.account.currency,
                'type': t.get_transaction_type_display(),
                'status': t.status,  # use choices in template via get_status_display if needed
                'status_display': dict(Transaction.STATUS_CHOICES).get(t.status, t.status.title()),
                'direction': direction,
                'label': label,
            })

        for l in loans:
            # Represent loan entries; treat as separate type in history
            history.append({
                'kind': 'loan',
                'id': l.id,
                'reference': f'LOAN-{l.id}',
                'created_at': l.application_date,
                'amount': l.loan_amount,
                'currency': l.account.currency,
                'type': 'Loan',
                'status': l.status,
                'status_display': dict(Loan.STATUS_CHOICES).get(l.status, l.status.title()),
                'direction': 'debit',  # treat loans as obligations by default
                'label': l.get_loan_type_display() if hasattr(l, 'get_loan_type_display') else 'Loan',
            })

        # Sort combined history by created_at descending
        history.sort(key=lambda x: x['created_at'], reverse=True)

        context = {
            'transactions': transactions,
            'accounts': accounts,
            'loans': loans,
            'history': history,
        }
    except Customer.DoesNotExist:
        context = {
            'transactions': [],
            'accounts': [],
            'loans': [],
            'history': [],
        }
    
    return render(request, 'user/transaction-history.html', context)

@login_required
def deposit_funds(request):
    """Deposit funds view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer, status='active')
    except Customer.DoesNotExist:
        accounts = []
    
    if request.method == 'POST':
        # Prefer posted account id; fall back to user's first active account
        account_id = request.POST.get('account_id') or (accounts[0].id if accounts else None)
        amount = request.POST.get('amount')
        description = request.POST.get('description', '')
        payment_method = request.POST.get('paymentMethod', '')
        payment_proof = request.FILES.get('paymentProof')
        
        try:
            if not account_id:
                raise ValueError('No active account found for deposit.')

            account = Account.objects.get(id=account_id, customer__user=request.user)

            try:
                amount = Decimal(amount)
            except (InvalidOperation, TypeError):
                raise ValueError('Enter a valid amount.')
            
            if amount <= 0:
                messages.error(request, 'Amount must be greater than zero.')
            else:
                # Do not update balance here. Leave as-is until status is set to 'completed' in admin.
                balance_before = account.balance
                txn = Transaction.objects.create(
                    account=account,
                    transaction_type='deposit',
                    amount=amount,
                    balance_before=balance_before,
                    balance_after=account.balance,
                    status='pending',
                    description=description,
                    payment_method=payment_method if payment_method in dict(Transaction.PAYMENT_METHODS) else '',
                    payment_proof=payment_proof,
                    reference_number=f'DEP-{uuid.uuid4().hex[:12].upper()}'
                )
                
                # Create notification for deposit
                from notifications.models import Notification
                Notification.create_notification(
                    user=request.user,
                    notification_type='deposit_pending',
                    title='Deposit Submitted',
                    message=f'{account.currency} {amount} deposit is pending approval.',
                    metadata={
                        'reference': txn.reference_number,
                        'amount': str(amount),
                        'payment_method': payment_method
                    }
                )
                
                messages.success(request, f'Deposit of {account.currency or ""} {amount} recorded and pending approval.')
                return redirect('deposit_receipt', reference=txn.reference_number)
        except (Account.DoesNotExist, ValueError) as e:
            messages.error(request, f'Deposit failed: {str(e)}')
        except Exception as e:
            messages.error(request, f'Deposit failed: Unexpected error. {str(e)}')
    
    return render(request, 'user/deposit-funds.html', {'accounts': accounts})

@login_required
def local_transfer(request):
    """Local transfer view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer, status='active')
    except Customer.DoesNotExist:
        customer = None
        accounts = []

    # Calculate daily spending and limit for display
    total_balance = sum(Decimal(str(acc.balance)) for acc in accounts) if accounts else Decimal('0.00')
    primary_account = accounts[0] if accounts else None
    
    daily_spent = customer.get_daily_spending() if customer else Decimal('0.00')
    # Use custom limit if set, otherwise use account balance
    daily_limit = customer.get_effective_daily_limit() if customer else total_balance
    daily_remaining = customer.get_daily_limit_remaining() if customer else total_balance
    has_custom_limit = customer.daily_transfer_limit is not None if customer else False

    if request.method == 'POST':
        # AJAX indicator
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
        amount_raw = request.POST.get('amount')
        beneficiary_account_number = request.POST.get('beneficiaryAccountNumber')
        beneficiary_account_name = request.POST.get('beneficiaryAccountName')
        beneficiary_bank_name = request.POST.get('beneficiaryBankName')
        purpose = request.POST.get('purpose', '')
        transfer_from = request.POST.get('transferFrom', 'main-balance')

        try:
            if not accounts:
                raise ValueError('No active account available for transfer.')
            account = accounts[0]  # Simplified: use first active account

            # Validate amount
            from decimal import InvalidOperation
            try:
                amount = Decimal(amount_raw)
            except (InvalidOperation, TypeError):
                raise ValueError('Enter a valid amount.')
            if amount <= 0:
                raise ValueError('Amount must be greater than zero.')
            
            # Check daily transfer limit (custom limit or account balance)
            if customer:
                current_spent = customer.get_daily_spending()
                
                if customer.daily_transfer_limit is not None:
                    # Use custom admin-set limit
                    limit = Decimal(str(customer.daily_transfer_limit))
                else:
                    # Use account balance as limit
                    limit = Decimal(str(account.balance))
                
                if current_spent + amount > limit:
                    remaining = max(Decimal('0.00'), limit - current_spent)
                    raise ValueError(f'Transfer limit exceeded. Remaining limit: {account.currency} {remaining:.2f}')
            
            # Also check if sufficient balance exists
            if amount > account.balance:
                raise ValueError(f'Insufficient balance. Available: {account.currency} {account.balance:.2f}')

            # Basic required fields
            if not beneficiary_account_number or not beneficiary_account_name or not beneficiary_bank_name:
                raise ValueError('All beneficiary details are required.')

            # Build description snapshot
            description = f"Local transfer to {beneficiary_account_name} ({beneficiary_bank_name}) - Purpose: {purpose[:100]}"

            txn = Transaction.objects.create(
                account=account,
                transaction_type='transfer',
                amount=amount,
                balance_before=account.balance,
                balance_after=account.balance,  # no immediate balance change for pending
                status='pending',
                description=description,
                payment_method='',
                reference_number=f'TRF-{uuid.uuid4().hex[:12].upper()}',
                recipient_account=beneficiary_account_number,
            )
            
            # Create notification for transfer
            from notifications.models import Notification
            Notification.create_notification(
                user=request.user,
                notification_type='transaction_pending',
                title='Transfer Initiated',
                message=f'{account.currency} {amount} transfer to {beneficiary_account_name} is pending approval.',
                metadata={
                    'reference': txn.reference_number,
                    'amount': str(amount),
                    'recipient': beneficiary_account_name,
                    'bank': beneficiary_bank_name
                }
            )

            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'reference': txn.reference_number,
                    'amount': f"{account.currency} {amount}",
                    'currency': account.currency,
                    'recipient_name': beneficiary_account_name,
                    'bank_name': beneficiary_bank_name,
                    'beneficiary_account_number': beneficiary_account_number,
                    'status': txn.status,
                    'redirect': request.build_absolute_uri('/transaction-history/')
                })
            else:
                messages.success(request, f'Transfer recorded and pending approval. Reference {txn.reference_number}.')
                return redirect('transaction_history')
        except ValueError as e:
            if is_ajax:
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
            messages.error(request, f'Transfer failed: {str(e)}')
        except Exception as e:
            if is_ajax:
                return JsonResponse({'success': False, 'error': 'Unexpected error.'}, status=500)
            messages.error(request, 'Transfer failed: Unexpected error.')

    context = {
        'accounts': accounts,
        'customer': customer,
        'primary_account': primary_account,
        'total_balance': total_balance,
        'daily_limit': daily_limit,
        'daily_spent': daily_spent,
        'daily_remaining': daily_remaining,
        'has_custom_limit': has_custom_limit,
    }
    return render(request, 'user/local-transfer.html', context)

@login_required
def wire_transfer(request):
    """Wire transfer view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer, status='active')
    except Customer.DoesNotExist:
        customer = None
        accounts = []
    
    # Calculate daily spending and limit for display
    total_balance = sum(Decimal(str(acc.balance)) for acc in accounts) if accounts else Decimal('0.00')
    primary_account = accounts[0] if accounts else None
    
    daily_spent = customer.get_daily_spending() if customer else Decimal('0.00')
    # Use custom limit if set, otherwise use account balance
    daily_limit = customer.get_effective_daily_limit() if customer else total_balance
    daily_remaining = customer.get_daily_limit_remaining() if customer else total_balance
    has_custom_limit = customer.daily_transfer_limit is not None if customer else False
    
    if request.method == 'POST':
        amount_raw = request.POST.get('amount')
        
        # Validate amount and check daily limit before storing in session
        try:
            if not accounts:
                messages.error(request, 'No active account available for transfer.')
                return redirect('wire_transfer')
            
            account = accounts[0]
            
            # Validate amount
            try:
                amount = Decimal(amount_raw)
            except (InvalidOperation, TypeError, ValueError):
                messages.error(request, 'Enter a valid amount.')
                return redirect('wire_transfer')
            
            if amount <= 0:
                messages.error(request, 'Amount must be greater than zero.')
                return redirect('wire_transfer')
            
            # Check daily transfer limit (custom limit or account balance)
            if customer:
                current_spent = customer.get_daily_spending()
                
                if customer.daily_transfer_limit is not None:
                    # Use custom admin-set limit
                    limit = Decimal(str(customer.daily_transfer_limit))
                else:
                    # Use account balance as limit
                    limit = Decimal(str(account.balance))
                
                if current_spent + amount > limit:
                    remaining = max(Decimal('0.00'), limit - current_spent)
                    messages.error(request, f'Transfer limit exceeded. Remaining limit: {account.currency} {remaining:.2f}')
                    return redirect('wire_transfer')
            
            # Also check if sufficient balance exists
            if amount > account.balance:
                messages.error(request, f'Insufficient balance. Available: {account.currency} {account.balance:.2f}')
                return redirect('wire_transfer')
        except Exception as e:
            messages.error(request, f'Transfer validation failed: {str(e)}')
            return redirect('wire_transfer')
        
        # Store wire transfer data in session for secure-transfer page
        transfer_data = {
            'amount': request.POST.get('amount'),
            'transfer_from': request.POST.get('transferFrom'),
            'beneficiary_account_number': request.POST.get('beneficiaryAccountNumber'),
            'beneficiary_account_name': request.POST.get('beneficiaryAccountName'),
            'beneficiary_bank_name': request.POST.get('beneficiaryBankName'),
            'swift_code': request.POST.get('swiftCode'),
            'country': request.POST.get('country'),
            'purpose': request.POST.get('purpose'),
        }
        request.session['pending_wire_transfer'] = transfer_data
        messages.info(request, 'Please enter security codes to complete your transfer.')
        return redirect('secure_transfer')
    
    context = {
        'accounts': accounts,
        'customer': customer,
        'primary_account': primary_account,
        'total_balance': total_balance,
        'daily_limit': daily_limit,
        'daily_spent': daily_spent,
        'daily_remaining': daily_remaining,
        'has_custom_limit': has_custom_limit,
    }
    return render(request, 'user/wire-transfer.html', context)

@login_required
@ensure_csrf_cookie
def secure_transfer(request):
    """Secure transfer view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer, status='active')

        # Generate and send IMT code
        imt_code = ''.join(random.choices(string.digits, k=6))
        request.session['imt_code'] = imt_code
        
        # Send email
        html_message = render_to_string('user/email/imt_code_email.html', {'imt_code': imt_code, 'user': request.user})
        send_mail(
            'Your IMT Code for Secure Transfer',
            f'Your IMT code is {imt_code}',
            settings.DEFAULT_FROM_EMAIL,
            [request.user.email],
            html_message=html_message,
            fail_silently=False,
        )

    except Customer.DoesNotExist:
        accounts = []
    
    return render(request, 'user/secure-transfer.html', {'accounts': accounts})

@require_POST
@login_required
def verify_imt_code(request):
    """Verify the IMT code and process the wire transfer."""
    user_code = request.POST.get('code')
    imt_code = request.session.get('imt_code')

    if user_code == imt_code:
        # Code is correct, clear it from session
        request.session.pop('imt_code', None)
        
        pending_transfer = request.session.get('pending_wire_transfer')
        if not pending_transfer:
            return JsonResponse({'status': 'error', 'message': 'No pending transfer found.'}, status=400)

        try:
            customer = Customer.objects.get(user=request.user)
            accounts = Account.objects.filter(customer=customer, status='active')
            if not accounts:
                raise ValueError('No active account available for transfer.')
            
            account = accounts[0]
            amount = Decimal(pending_transfer['amount'])

            if amount > account.balance:
                raise ValueError('Insufficient balance.')

            # Create the transaction
            balance_before = account.balance
            account.balance -= amount
            balance_after = account.balance

            description = (
                f"Wire transfer to {pending_transfer['beneficiary_account_name']} "
                f"({pending_transfer['beneficiary_bank_name']}) - "
                f"Purpose: {pending_transfer['purpose']}"
            )

            txn = Transaction.objects.create(
                account=account,
                transaction_type='transfer',
                amount=amount,
                balance_before=balance_before,
                balance_after=balance_after,
                status='completed',
                description=description,
                reference_number=f'TRF-{uuid.uuid4().hex[:12].upper()}',
                recipient_account=pending_transfer['beneficiary_account_number'],
            )
            
            account.save()

            # Clear the pending transfer from the session
            del request.session['pending_wire_transfer']
            
            # Create notification for transfer
            from notifications.models import Notification
            Notification.create_notification(
                user=request.user,
                notification_type='transaction_completed',
                title='Transfer Successful',
                message=f'{account.currency} {amount} transfer to {pending_transfer["beneficiary_account_name"]} has been completed.',
                metadata={
                    'reference': txn.reference_number,
                    'amount': str(amount),
                    'recipient': pending_transfer["beneficiary_account_name"],
                    'bank': pending_transfer["beneficiary_bank_name"]
                }
            )

            return JsonResponse({'status': 'success', 'message': 'Verification successful. Transfer completed.'})

        except (Customer.DoesNotExist, ValueError) as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': 'An unexpected error occurred.'}, status=500)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid IMT code.'}, status=400)


@login_required
def my_deposits(request):
    """My deposits view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
        deposits = Transaction.objects.filter(
            account__in=accounts,
            transaction_type='deposit'
        ).order_by('-created_at')
    except Customer.DoesNotExist:
        deposits = []
    
    return render(request, 'user/my-deposits.html', {'deposits': deposits})

@login_required
def deposit_receipt(request, reference: str):
    """Render a receipt page for a specific transaction reference"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
        txn = Transaction.objects.get(reference_number=reference, account__in=accounts)
    except (Customer.DoesNotExist, Transaction.DoesNotExist):
        messages.error(request, 'Receipt not found.')
        return redirect('transaction_history')

    context = {
        'transaction': txn,
        'account': txn.account,
        'now': timezone.localtime(txn.created_at),
    }
    return render(request, 'user/receipt.html', context)

@login_required
def my_loans(request):
    """My loans view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
        loans = Loan.objects.filter(account__in=accounts).order_by('-application_date')
    except:
        loans = []
    
    return render(request, 'user/my-loans.html', {'loans': loans})

@login_required
def apply_loan(request):
    """Apply for loan view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer, status='active')
    except Customer.DoesNotExist:
        accounts = []

    if request.method == 'POST':
        account_id = request.POST.get('account_id') or (accounts[0].id if accounts else None)
        amount_raw = request.POST.get('amount')
        loan_type_raw = request.POST.get('loanType') or request.POST.get('loan_type')
        term_raw = request.POST.get('repaymentPeriod') or request.POST.get('term_months')
        terms_agreed = request.POST.get('terms') == 'on'

        try:
            if not account_id:
                raise ValueError('No active account found for loan application.')

            account = Account.objects.get(id=account_id, customer__user=request.user)

            # Validate amount
            try:
                amount = Decimal(amount_raw)
            except Exception:
                raise ValueError('Enter a valid loan amount.')
            if amount <= 0:
                raise ValueError('Loan amount must be greater than zero.')

            # Validate term
            try:
                term_months = int(term_raw)
            except Exception:
                raise ValueError('Select a valid repayment period.')
            if term_months <= 0:
                raise ValueError('Repayment period must be greater than zero.')

            if not terms_agreed:
                raise ValueError('You must accept the Loan Terms and Conditions.')

            # Normalize loan type values from UI to model choices
            loan_type_map = {
                'personal': 'personal',
                'auto': 'auto',
                'mortgage': 'home',
                'home': 'home',
                'business': 'business',
                'Personal': 'personal',
                'Auto': 'auto',
                'Mortgage': 'home',
                'Home': 'home',
                'Business': 'business',
            }
            loan_type = loan_type_map.get(loan_type_raw, None)
            if not loan_type:
                raise ValueError('Select a valid loan type.')

            # Determine interest rate by loan type (basic defaults)
            default_rates = {
                'personal': Decimal('8.0'),
                'auto': Decimal('6.5'),
                'home': Decimal('5.0'),
                'business': Decimal('9.0'),
            }
            interest_rate = default_rates.get(loan_type, Decimal('8.0'))

            # Compute monthly payment using amortization formula
            # r = annual_rate/12/100
            r = (interest_rate / Decimal('100')) / Decimal('12')
            if r > 0:
                # P * r * (1+r)^n / ((1+r)^n - 1)
                one_plus_r_pow_n = (Decimal('1') + r) ** term_months
                monthly_payment = (amount * r * one_plus_r_pow_n) / (one_plus_r_pow_n - Decimal('1'))
            else:
                monthly_payment = amount / term_months

            loan = Loan.objects.create(
                account=account,
                loan_type=loan_type,
                loan_amount=amount,
                interest_rate=interest_rate,
                term_months=term_months,
                monthly_payment=monthly_payment.quantize(Decimal('0.01')),
                outstanding_balance=amount,
                status='pending',
            )

            messages.success(request, 'Loan application submitted and is pending review.')
            return redirect('loan_receipt', loan_id=loan.id)

        except (Account.DoesNotExist, ValueError) as e:
            messages.error(request, f'Loan application failed: {str(e)}')
        except Exception as e:
            messages.error(request, f'Loan application failed: Unexpected error. {str(e)}')

    return render(request, 'user/apply-loan.html', {'accounts': accounts})

@login_required
def loan_receipt(request, loan_id: int):
    """Render a receipt page for a specific loan application"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
        loan = Loan.objects.get(id=loan_id, account__in=accounts)
    except (Customer.DoesNotExist, Loan.DoesNotExist):
        messages.error(request, 'Loan receipt not found.')
        return redirect('my_loans')

    # Derived reference without storing extra field
    reference = f'LOAN-{loan.id:06d}'

    context = {
        'loan': loan,
        'reference': reference,
        'account': loan.account,
    }
    return render(request, 'user/loan-receipt.html', context)

@login_required
def manage_account(request):
    """Manage account view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
    except Customer.DoesNotExist:
        customer = None
        accounts = []
    
    if request.method == 'POST':
        if not customer:
            messages.error(request, 'Customer profile not found.')
            return redirect('manage_account')
        
        try:
            # Update user fields
            request.user.first_name = request.POST.get('firstName', '')
            request.user.last_name = request.POST.get('lastName', '')
            request.user.email = request.POST.get('email', '')
            request.user.save()
            
            # Update customer fields
            customer.phone = request.POST.get('phone', '')
            customer.address = request.POST.get('address', '')
            customer.gender = request.POST.get('gender', '')
            customer.country = request.POST.get('country', '')
            customer.city = request.POST.get('city', '')
            customer.state = request.POST.get('state', '')
            customer.zipcode = request.POST.get('zipcode', '')
            customer.occupation = request.POST.get('occupation', '')
            customer.ssn = request.POST.get('ssn', '')
            
            # Parse date of birth from DD/MM/YYYY to YYYY-MM-DD
            dob_raw = request.POST.get('dob', '')
            if dob_raw:
                from datetime import datetime
                try:
                    # Try parsing DD/MM/YYYY format
                    dob_parsed = datetime.strptime(dob_raw, '%d/%m/%Y')
                    customer.date_of_birth = dob_parsed.strftime('%Y-%m-%d')
                except ValueError:
                    # If already in YYYY-MM-DD format or invalid, use as-is
                    customer.date_of_birth = dob_raw
            
            # Handle profile picture upload
            if 'profilePicture' in request.FILES:
                customer.profile_picture = request.FILES['profilePicture']
            
            customer.save()
            
            # Create notification
            from notifications.models import Notification
            Notification.create_notification(
                user=request.user,
                notification_type='profile_updated',
                title='Profile Updated Successfully',
                message='Your account information has been updated successfully.',
                metadata={'updated_at': timezone.now().isoformat()}
            )
            
            messages.success(request, 'Account updated successfully!')
            return redirect('manage_account')
        except Exception as e:
            messages.error(request, f'Update failed: {str(e)}')
            return redirect('manage_account')
    
    return render(request, 'user/manage-account.html', {
        'customer': customer,
        'accounts': accounts
    })

@login_required
def profile(request):
    """User profile view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer)
    except Customer.DoesNotExist:
        customer = None
        accounts = []
    
    return render(request, 'user/profile.html', {
        'customer': customer,
        'accounts': accounts
    })

@login_required
def security_settings(request):
    """Security settings view"""
    try:
        customer = Customer.objects.get(user=request.user)
    except Customer.DoesNotExist:
        customer = None
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'change_password':
            old_password = request.POST.get('oldPassword')
            new_password = request.POST.get('newPassword')
            confirm_password = request.POST.get('password-2')
            
            # Validate inputs
            if not old_password or not new_password or not confirm_password:
                messages.error(request, 'All password fields are required.')
                return redirect('security_settings')
            
            # Check if old password is correct
            if not request.user.check_password(old_password):
                messages.error(request, 'Current password is incorrect.')
                return redirect('security_settings')
            
            # Check if new passwords match
            if new_password != confirm_password:
                messages.error(request, 'New passwords do not match.')
                return redirect('security_settings')
            
            # Check password strength
            if len(new_password) < 8:
                messages.error(request, 'Password must be at least 8 characters long.')
                return redirect('security_settings')
            
            # Update password
            request.user.set_password(new_password)
            request.user.save()
            
            # Update session to keep user logged in
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, request.user)
            
            # Create notification
            from notifications.models import Notification
            Notification.create_notification(
                user=request.user,
                notification_type='password_changed',
                title='Password Changed Successfully',
                message='Your account password has been changed. If you did not make this change, please contact support immediately.',
                metadata={'changed_at': timezone.now().isoformat()}
            )
            
            messages.success(request, 'Password changed successfully!')
            return redirect('security_settings')
        
        elif action == 'change_pin':
            if not customer:
                messages.error(request, 'Customer profile not found.')
                return redirect('security_settings')
            
            password = request.POST.get('password')
            pin = request.POST.get('pin')
            
            # Validate inputs
            if not password or not pin:
                messages.error(request, 'All PIN fields are required.')
                return redirect('security_settings')
            
            # Verify password
            if not request.user.check_password(password):
                messages.error(request, 'Password is incorrect.')
                return redirect('security_settings')
            
            # Validate PIN format
            if not pin.isdigit() or len(pin) < 4 or len(pin) > 6:
                messages.error(request, 'PIN must be 4-6 digits.')
                return redirect('security_settings')
            
            # Check for simple patterns
            if pin in ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']:
                messages.error(request, 'Please choose a more secure PIN.')
                return redirect('security_settings')
            
            # Update PIN
            customer.pin = pin
            customer.save()
            
            # Create notification
            from notifications.models import Notification
            Notification.create_notification(
                user=request.user,
                notification_type='pin_changed',
                title='PIN Changed Successfully',
                message='Your transaction PIN has been changed. Use this PIN for all future transactions.',
                metadata={'changed_at': timezone.now().isoformat()}
            )
            
            messages.success(request, 'PIN changed successfully!')
            return redirect('security_settings')
    
    return render(request, 'user/security-settings.html', {'customer': customer})

@login_required
def notifications(request):
    """Notifications view"""
    from notifications.models import Notification
    
    notifications_list = Notification.objects.filter(user=request.user)
    
    # Get counts
    total_count = notifications_list.count()
    unread_count = notifications_list.filter(is_read=False).count()
    read_count = notifications_list.filter(is_read=True).count()
    
    return render(request, 'user/notifications.html', {
        'notifications': notifications_list,
        'total_count': total_count,
        'unread_count': unread_count,
        'read_count': read_count,
    })

@login_required
def mark_notification_read(request, notification_id):
    """Mark a single notification as read"""
    from notifications.models import Notification
    
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        messages.success(request, 'Notification marked as read.')
    except Notification.DoesNotExist:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Notification not found'}, status=404)
        messages.error(request, 'Notification not found.')
    
    return redirect('notifications')

@login_required
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    from notifications.models import Notification
    
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    
    messages.success(request, 'All notifications marked as read.')
    return redirect('notifications')

@login_required
def my_cashback(request):
    """My cashback view"""
    return render(request, 'user/my-cashback.html')

@login_required
def virtual_card(request):
    """Virtual card view"""
    try:
        customer = Customer.objects.get(user=request.user)
        accounts = Account.objects.filter(customer=customer, status='active')
    except Customer.DoesNotExist:
        accounts = []
    
    return render(request, 'user/virtual-card.html', {'accounts': accounts})

@login_required
def pin_settings(request):
    """PIN settings view"""
    return render(request, 'user/pin.html')

@login_required
def verify_pin(request):
    """Verify PIN after login"""
    # Check if PIN verification is pending
    if not request.session.get('pending_pin_verification'):
        return redirect('user_dashboard')
    
    try:
        customer = Customer.objects.get(user=request.user)
    except Customer.DoesNotExist:
        messages.error(request, 'Customer profile not found.')
        return redirect('user_dashboard')
    
    if request.method == 'POST':
        entered_pin = request.POST.get('pin', '')
        
        if customer.pin and entered_pin == customer.pin:
            # PIN is correct
            del request.session['pending_pin_verification']
            redirect_url = request.session.pop('redirect_after_pin', 'user_dashboard')
            messages.success(request, f'Welcome back, {request.user.first_name or request.user.username}!')
            return redirect(redirect_url)
        else:
            messages.error(request, 'Invalid PIN. Please try again.')
    
    return render(request, 'verify-pin.html', {'customer': customer})

# ----------------------
# Error & Legacy Redirect Handling
# ----------------------
def custom_404(request, exception):
    """Custom 404 handler providing a gentle redirect suggestion."""
    requested_path = request.path
    context = {
        'requested_path': requested_path,
    }
    return render(request, '404.html', context, status=404)

def legacy_html_redirect(request, slug):
    """Redirect old .html endpoints to new named routes.

    Accepts paths like /wire-transfer.html and maps them to existing named URL patterns.
    If slug is not recognized, falls through to 404 handler.
    """
    mapping = {
        'wire-transfer': 'wire_transfer',
        'local-transfer': 'local_transfer',
        'transaction-history': 'transaction_history',
        'deposit-funds': 'deposit_funds',
        'apply-loan': 'apply_loan',
        'my-loans': 'my_loans',
        'my-deposits': 'my_deposits',
        'dashboard': 'user_dashboard',
        'login': 'login',
        'register': 'register',
        'about': 'about',
        'services': 'services',
        'contact': 'contact',
        'terms': 'terms',
    }

    target_name = mapping.get(slug)
    if target_name:
        from django.urls import reverse
        return redirect(target_name)
    # Unknown legacy slug: delegate to custom 404
    return custom_404(request, exception=None)
