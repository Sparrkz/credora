from django.contrib import admin
from .models import Customer, Account

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'id_number', 'daily_transfer_limit', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone', 'id_number']
    list_filter = ['created_at']
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'profile_picture', 'phone', 'id_number')
        }),
        ('Personal Details', {
            'fields': ('date_of_birth', 'gender', 'address', 'city', 'state', 'country', 'zipcode')
        }),
        ('Professional Information', {
            'fields': ('occupation', 'ssn')
        }),
        ('Transfer Limits', {
            'fields': ('daily_transfer_limit',),
            'description': 'Set daily transfer limit for this customer. Leave empty for unlimited transfers.'
        }),
    )

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'customer', 'account_type', 'balance', 'status', 'created_at']
    search_fields = ['account_number', 'customer__user__username']
    list_filter = ['account_type', 'status', 'created_at']
