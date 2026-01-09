from django.contrib import admin, messages
from django.utils.html import format_html
from django.urls import reverse
from .models import Transaction, Deposit

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'account', 'transaction_type', 'amount', 'payment_method', 'status', 'created_at', 'proof', 'receipt']
    search_fields = ['reference_number', 'account__account_number', 'description']
    list_filter = ['transaction_type', 'status', 'payment_method', 'created_at']
    readonly_fields = ['balance_before', 'balance_after', 'reference_number', 'created_at', 'updated_at']
    actions = ['mark_as_completed', 'mark_as_pending']

    def proof(self, obj: Transaction):
        if obj.payment_proof:
            return format_html('<a href="{}" target="_blank">View Proof</a>', obj.payment_proof.url)
        return '-'
    proof.short_description = 'Payment Proof'

    def receipt(self, obj: Transaction):
        try:
            url = reverse('deposit_receipt', kwargs={'reference': obj.reference_number})
            return format_html('<a href="{}" target="_blank">View Receipt</a>', url)
        except Exception:
            return '-'
    receipt.short_description = 'Receipt'

    # Admin banner to clarify balance behavior
    def change_view(self, request, object_id, form_url='', extra_context=None):
        messages.info(
            request,
            'Note: For deposits, setting status to Completed will credit the linked account. Changing from Completed back to Pending/Failed will revert the credit.'
        )
        return super().change_view(request, object_id, form_url, extra_context)

    # Bulk actions
    def mark_as_completed(self, request, queryset):
        updated = 0
        for obj in queryset:
            if obj.transaction_type == 'deposit' and obj.status != 'completed':
                obj.status = 'completed'
                obj.save()
                updated += 1
        self.message_user(request, f"Marked {updated} deposit(s) as Completed.", level=messages.SUCCESS)
    mark_as_completed.short_description = 'Mark selected deposits as Completed'

    def mark_as_pending(self, request, queryset):
        updated = 0
        for obj in queryset:
            if obj.transaction_type == 'deposit' and obj.status != 'pending':
                obj.status = 'pending'
                obj.save()
                updated += 1
        self.message_user(request, f"Marked {updated} deposit(s) as Pending.", level=messages.SUCCESS)
    mark_as_pending.short_description = 'Mark selected deposits as Pending'


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'account', 'amount', 'payment_method', 'status', 'created_at', 'proof', 'receipt']
    search_fields = ['reference_number', 'account__account_number', 'description']
    list_filter = ['status', 'payment_method', 'created_at']
    readonly_fields = ['balance_before', 'balance_after', 'reference_number', 'created_at', 'updated_at']
    actions = ['mark_as_completed', 'mark_as_pending']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(transaction_type='deposit')

    def proof(self, obj: Deposit):
        if obj.payment_proof:
            return format_html('<a href="{}" target="_blank">View Proof</a>', obj.payment_proof.url)
        return '-'
    proof.short_description = 'Payment Proof'

    def receipt(self, obj: Deposit):
        try:
            url = reverse('deposit_receipt', kwargs={'reference': obj.reference_number})
            return format_html('<a href="{}" target="_blank">View Receipt</a>', url)
        except Exception:
            return '-'
    receipt.short_description = 'Receipt'

    # Admin banner
    def change_view(self, request, object_id, form_url='', extra_context=None):
        messages.info(
            request,
            'Note: Setting status to Completed will credit the linked account. Changing back to Pending/Failed will revert the credit.'
        )
        return super().change_view(request, object_id, form_url, extra_context)

    # Bulk actions for deposits
    def mark_as_completed(self, request, queryset):
        updated = 0
        for obj in queryset:
            if obj.status != 'completed':
                obj.status = 'completed'
                obj.save()
                updated += 1
        self.message_user(request, f"Marked {updated} deposit(s) as Completed.", level=messages.SUCCESS)
    mark_as_completed.short_description = 'Mark selected deposits as Completed'

    def mark_as_pending(self, request, queryset):
        updated = 0
        for obj in queryset:
            if obj.status != 'pending':
                obj.status = 'pending'
                obj.save()
                updated += 1
        self.message_user(request, f"Marked {updated} deposit(s) as Pending.", level=messages.SUCCESS)
    mark_as_pending.short_description = 'Mark selected deposits as Pending'
