from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Customer(models.Model):
    """Customer profile model"""
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Non-binary', 'Non-binary'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    id_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zipcode = models.CharField(max_length=20, blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True, null=True)
    ssn = models.CharField(max_length=20, blank=True, null=True)
    pin = models.CharField(max_length=6, blank=True, null=True, help_text="4-6 digit PIN for transactions")
    daily_transfer_limit = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Daily transfer limit (leave empty for unlimited)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.id_number or 'N/A'}"
    
    def get_daily_spending(self):
        """Calculate total amount spent today on transfers"""
        from django.utils import timezone
        from datetime import timedelta
        from decimal import Decimal
        
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Get all transfer transactions for this customer today
        from transactions.models import Transaction
        total_spent = Decimal('0.00')
        
        for account in self.accounts.all():
            transfers = Transaction.objects.filter(
                account=account,
                transaction_type='transfer',
                created_at__gte=today_start,
                created_at__lt=today_end
            ).exclude(status='cancelled').exclude(status='failed')
            
            for txn in transfers:
                total_spent += Decimal(str(txn.amount))
        
        return total_spent
    
    def get_daily_limit_remaining(self):
        """Get remaining daily transfer limit"""
        from decimal import Decimal
        
        # If no custom limit is set, use total account balance as limit
        if self.daily_transfer_limit is None:
            total_balance = sum(Decimal(str(acc.balance)) for acc in self.accounts.filter(status='active'))
            return total_balance
        
        spent = self.get_daily_spending()
        limit = Decimal(str(self.daily_transfer_limit))
        remaining = limit - spent
        
        return max(Decimal('0.00'), remaining)
    
    def get_effective_daily_limit(self):
        """Get the effective daily limit (custom limit or account balance)"""
        from decimal import Decimal
        
        if self.daily_transfer_limit is None:
            # Use total account balance as default limit
            total_balance = sum(Decimal(str(acc.balance)) for acc in self.accounts.filter(status='active'))
            return total_balance
        
        return Decimal(str(self.daily_transfer_limit))
    
    class Meta:
        ordering = ['-created_at']

class Account(models.Model):
    """Bank account model"""
    ACCOUNT_TYPES = [
        ('savings', 'Savings'),
        ('checking', 'Checking'),
        ('business', 'Business'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('frozen', 'Frozen'),
        ('closed', 'Closed'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='accounts')
    account_number = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='savings')
    currency = models.CharField(max_length=20, default='USD')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.account_number} - {self.customer.user.username}"
    
    class Meta:
        ordering = ['-created_at']
