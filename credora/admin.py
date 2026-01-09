from django.contrib import admin
from .models import Loan

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['loan_type', 'account', 'loan_amount', 'interest_rate', 'status', 'application_date']
    search_fields = ['account__account_number', 'account__customer__user__username']
    list_filter = ['loan_type', 'status', 'application_date']
