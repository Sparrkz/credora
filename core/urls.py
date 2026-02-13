from django.urls import path, re_path
from . import views
from accounts.views import register_user

urlpatterns = [
    # Public pages
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('services/', views.services, name='services'),
    path('contact/', views.contact, name='contact'),
    path('terms/', views.terms, name='terms'),
    
    # Authentication
    path('login/', views.login_view, name='login'),
    path('register/', register_user, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('verify-pin/', views.verify_pin, name='verify_pin'),
    
    # User dashboard
    path('dashboard/', views.user_dashboard, name='user_dashboard'),
    path('transaction-history/', views.transaction_history, name='transaction_history'),
    path('deposit-funds/', views.deposit_funds, name='deposit_funds'),
    path('local-transfer/', views.local_transfer, name='local_transfer'),
    path('wire-transfer/', views.wire_transfer, name='wire_transfer'),
    path('secure-transfer/', views.secure_transfer, name='secure_transfer'),
    path('verify-imt-code/', views.verify_imt_code, name='verify_imt_code'),
    path('my-deposits/', views.my_deposits, name='my_deposits'),
    path('receipt/<str:reference>/', views.deposit_receipt, name='deposit_receipt'),
    path('my-loans/', views.my_loans, name='my_loans'),
    path('apply-loan/', views.apply_loan, name='apply_loan'),
    path('loan-receipt/<int:loan_id>/', views.loan_receipt, name='loan_receipt'),
    path('manage-account/', views.manage_account, name='manage_account'),
    path('profile/', views.profile, name='profile'),
    path('security-settings/', views.security_settings, name='security_settings'),
    path('notifications/', views.notifications, name='notifications'),
    path('notifications/mark-read/<int:notification_id>/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    path('my-cashback/', views.my_cashback, name='my_cashback'),
    path('virtual-card/', views.virtual_card, name='virtual_card'),
    path('pin-settings/', views.pin_settings, name='pin_settings'),
    # Legacy .html redirects (must appear near end but before catch-all)
    re_path(r'^(?P<slug>[A-Za-z0-9\-]+)/\.html$', views.legacy_html_redirect),
]
