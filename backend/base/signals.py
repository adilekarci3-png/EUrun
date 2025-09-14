from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from accounts.models import CustomUser

from .models import CustomUserProfile, Notification, Product
from .utils import notify_new_product

@receiver(post_save, sender=CustomUser)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    # Profil yoksa oluşturur, varsa dokunmaz. Reverse'e erişmeye gerek yok.
    CustomUserProfile.objects.get_or_create(user=instance)
        
@receiver(post_save, sender=Product)
def product_created(sender, instance, created, **kwargs):
    if created:
        notify_new_product(instance)
        
@receiver(post_save, sender=Product)
def product_created_notification(sender, instance, created, **kwargs):
    # instance üzerinden oluşturana erişebiliyorsan (örn. instance.created_by)
    if created and getattr(instance, "created_by_id", None):
        Notification.objects.create(
            recipient=instance.created_by,
            title="Ürün oluşturuldu",
            message=f"“{getattr(instance, 'title', 'Yeni ürün')}” başarıyla oluşturuldu.",
            type="success",
            channel="header",
            content_type=ContentType.objects.get_for_model(Product),
            object_id=instance.pk,
        )