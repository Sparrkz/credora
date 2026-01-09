from decimal import Decimal
from accounts.models import Customer, Account


def user_bank_context(request):
    """Provide customer, primary_account, total_balance globally to templates."""
    customer = None
    primary_account = None
    total_balance = Decimal('0.00')

    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        try:
            customer = Customer.objects.select_related('user').get(user=user)
            accounts = Account.objects.filter(customer=customer)
            primary_account = accounts.first() if accounts.exists() else None
            total_balance = sum(acc.balance for acc in accounts) if accounts.exists() else Decimal('0.00')
        except Customer.DoesNotExist:
            pass

    return {
        'customer': customer,
        'primary_account': primary_account,
        'total_balance': total_balance,
    }
