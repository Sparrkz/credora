# Credora Bank

Credora Bank is a Django-based web application for managing banking operations, including user accounts, transactions, notifications, and more. This project is structured for modularity and scalability, supporting features such as user authentication, profile management, transaction processing, and administrative controls.

## Features
- User registration, login, and profile management
- Account management (deposits, withdrawals, transfers)
- Transaction history and receipts
- Loan application and management
- Notification system
- Admin dashboard
- Media uploads (profile pictures, payment proofs)

## Project Structure
- `accounts/` - User account management (models, views, admin, migrations)
- `core/` - Core utilities, context processors, and views
- `credora/` - Main banking logic and models
- `notifications/` - Notification system
- `transactions/` - Transaction models, serializers, and views
- `templates/` - HTML templates for frontend
- `assets/` and `staticfiles/` - Static assets (CSS, JS, images)
- `media/` - Uploaded media files
- `manage.py` - Django management script
- `requirements.txt` - Python dependencies

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip
- (Optional) Virtual environment tool (venv, virtualenv, etc.)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd credora_bank
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```
5. **Create a superuser (admin):**
   ```bash
   python manage.py createsuperuser
   ```
6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```
7. **Access the application:**
   - User site: http://127.0.0.1:8000/
   - Admin site: http://127.0.0.1:8000/admin/

## Usage
- Register a new user or log in with an existing account.
- Manage your profile, view transaction history, and apply for loans.
- Admins can manage users, transactions, and site content via the admin dashboard.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

## Contact
For support or inquiries, please contact the project maintainer.
