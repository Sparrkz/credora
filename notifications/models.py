from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Notification(models.Model):
    """Notification model to track all system events"""
    
    NOTIFICATION_TYPES = [
        ('login', 'Device Login'),
        ('registration', 'Account Registration'),
        ('activation', 'Account Activation'),
        ('deposit', 'Deposit Transaction'),
        ('withdrawal', 'Withdrawal Transaction'),
        ('transfer_sent', 'Transfer Sent'),
        ('transfer_received', 'Transfer Received'),
        ('loan_applied', 'Loan Application'),
        ('loan_approved', 'Loan Approved'),
        ('loan_rejected', 'Loan Rejected'),
        ('password_changed', 'Password Changed'),
        ('pin_changed', 'PIN Changed'),
        ('profile_updated', 'Profile Updated'),
        ('transaction_pending', 'Transaction Pending'),
        ('transaction_completed', 'Transaction Completed'),
        ('transaction_failed', 'Transaction Failed'),
        ('transaction_cancelled', 'Transaction Cancelled'),
        ('limit_updated', 'Transfer Limit Updated'),
        ('security_alert', 'Security Alert'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True, help_text="Additional data related to the notification")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def get_icon(self):
        """Return appropriate icon class based on notification type"""
        icon_map = {
            'login': 'ph-key',
            'registration': 'ph-user-plus',
            'activation': 'ph-check-circle',
            'deposit': 'ph-arrow-circle-down-right',
            'withdrawal': 'ph-arrow-circle-up-right',
            'transfer_sent': 'ph-arrow-circle-up-right',
            'transfer_received': 'ph-arrow-circle-down-right',
            'loan_applied': 'ph-hand-withdraw',
            'loan_approved': 'ph-check-circle',
            'loan_rejected': 'ph-x-circle',
            'password_changed': 'ph-lock',
            'pin_changed': 'ph-lock',
            'profile_updated': 'ph-user',
            'transaction_pending': 'ph-clock',
            'transaction_completed': 'ph-check-circle',
            'transaction_failed': 'ph-x-circle',
            'transaction_cancelled': 'ph-warning',
            'limit_updated': 'ph-gauge',
            'security_alert': 'ph-warning',
            'system': 'ph-bell',
        }
        return icon_map.get(self.notification_type, 'ph-bell')
    
    @staticmethod
    def create_notification(user, notification_type, title, message, metadata=None):
        """Helper method to create notifications"""
        return Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata or {}
        )
