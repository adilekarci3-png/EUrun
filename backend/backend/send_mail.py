import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

django.setup()

from django.core.mail import send_mail

send_mail(
    subject="Test Maili",
    message="Bu bir test mesajıdır.",
    from_email="adile.karci@hotmail.com",
    recipient_list=["recepkepnek@gmail.com","alemdar38kiraz@gmail.com","adilekarci3@gmail.com"],
)