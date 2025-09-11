from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import CustomUser

from .models import CustomUserProfile, Product
from .utils import notify_new_product

@receiver(post_save, sender=CustomUser)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    # Profil yoksa oluşturur, varsa dokunmaz. Reverse'e erişmeye gerek yok.
    CustomUserProfile.objects.get_or_create(user=instance)
        
@receiver(post_save, sender=Product)
def product_created(sender, instance, created, **kwargs):
    if created:
        notify_new_product(instance)