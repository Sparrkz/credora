from django.db import models
from accounts.models import Account
from decimal import Decimal

class Transaction(models.Model):
    """Transaction model"""
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
        ('payment', 'Payment'),
    ]
    PAYMENT_METHODS = [
        ('bitcoin', 'Bitcoin'),
        ('ethereum', 'Ethereum'),
        ('usdt', 'USDT (TRC20)'),
        ('bank', 'Bank Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, blank=True)
    payment_proof = models.FileField(upload_to='payment_proofs/', blank=True, null=True)
    reference_number = models.CharField(max_length=50, unique=True)
    recipient_account = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.reference_number} - {self.transaction_type} - ${self.amount}"
    
    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Apply account balance changes only for deposits and only when status is 'completed'
        if self.transaction_type == 'deposit':
            # Ensure amounts are Decimals
            amt = Decimal(self.amount)

            if self.pk:
                prev = Transaction.objects.get(pk=self.pk)
                # If previous state was completed, revert its effect first
                if prev.transaction_type == 'deposit' and prev.status == 'completed':
                    prev.account.balance = Decimal(prev.account.balance) - Decimal(prev.amount)
                    prev.account.save()

                # After reverting, apply new state if completed
                if self.status == 'completed':
                    before = Decimal(self.account.balance)
                    self.account.balance = before + amt
                    self.account.save()
                    self.balance_before = before
                    self.balance_after = self.account.balance
                else:
                    # Pending/failed/cancelled: do not alter account balance
                    current = Decimal(self.account.balance)
                    self.balance_before = current
                    self.balance_after = current
            else:
                # Creating new transaction
                if self.status == 'completed':
                    before = Decimal(self.account.balance)
                    self.account.balance = before + amt
                    self.account.save()
                    self.balance_before = before
                    self.balance_after = self.account.balance
                else:
                    # Pending/failed/cancelled at creation: leave balance unchanged
                    current = Decimal(self.account.balance)
                    self.balance_before = current
                    self.balance_after = current

        super().save(*args, **kwargs)


class Deposit(Transaction):
    class Meta:
        proxy = True
        verbose_name = 'Deposit'
        verbose_name_plural = 'Deposits'
