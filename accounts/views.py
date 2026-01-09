from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from .models import Customer, Account
import random
import string

def generate_account_number():
    """Generate a unique 10-digit account number"""
    while True:
        account_number = ''.join(random.choices(string.digits, k=10))
        if not Account.objects.filter(account_number=account_number).exists():
            return account_number

@csrf_exempt
def register_user(request):
    """Handle user registration with profile picture"""
    if request.method == 'POST':
        try:
            # Get form data
            first_name = request.POST.get('firstName')
            last_name = request.POST.get('lastName')
            email = request.POST.get('email')
            phone = request.POST.get('phone')
            password = request.POST.get('password')
            account_type = request.POST.get('accountType')
            account_currency = request.POST.get('accountCurrency')
            profile_picture = request.FILES.get('profilePicture')
            
            # Validate required fields
            if not all([first_name, last_name, email, phone, password, account_type, account_currency]):
                return JsonResponse({
                    'success': False,
                    'message': 'All required fields must be filled.'
                }, status=400)
            
            # Normalize email to lowercase
            email = email.lower().strip()
            
            # Check if user already exists by email or username (case-insensitive)
            if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
                return JsonResponse({
                    'success': False,
                    'message': f'The email {email} is already registered. Please use a different email or login to your existing account.'
                }, status=400)
            
            # Create user with try-except for database constraints
            try:
                user = User.objects.create_user(
                    username=email,  # Using email as username
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=password
                )
            except Exception as user_error:
                return JsonResponse({
                    'success': False,
                    'message': 'This email is already registered. Please login instead.'
                }, status=400)
            
            # Create customer profile
            customer = Customer.objects.create(
                user=user,
                phone=phone
            )
            
            # Save profile picture if provided
            if profile_picture:
                customer.profile_picture = profile_picture
                customer.save()
            
            # Create account
            account_number = generate_account_number()
            
            # Map account type to valid choices
            account_type_mapping = {
                'savings': 'savings',
                'current': 'checking',
                'checking': 'checking',
                'fixed deposit': 'savings',
                'non resident': 'savings',
                'online banking': 'checking',
                'joint account': 'savings',
                'domiciliary account': 'business'
            }
            
            # Get mapped account type or default to savings
            mapped_account_type = account_type_mapping.get(
                account_type.lower(), 
                'savings'
            )
            
            Account.objects.create(
                customer=customer,
                account_number=account_number,
                account_type=mapped_account_type,
                currency=(account_currency or 'USD').strip(),
                balance=0.00
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Registration successful! Your account number is {account_number}',
                'account_number': account_number
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Registration failed: {str(e)}'
            }, status=500)
    
    return render(request, 'register.html')
