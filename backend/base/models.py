from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
# from django.contrib.auth.models import AbstractUser
# from django.contrib.auth.models import User

from accounts.models import CustomUser

BRAND_CHOICES = (
    ("Samsung", "Samsung"),
    ("Apple", "Apple"),
    ("LG", "LG"),
    ("Lenovo", "Lenovo"),
    ("Sony", "Sony"),
)

CATEGORY_CHOICES = (
    ("Telefon", "Telefon"),
    ("Televizyon", "Televizyon"),
    ("Bilgisayar", "Bilgisayar"),
    ("Tablet", "Tablet"),
    ("Akıllı Saat", "Akıllı Saat"),
)

class Product(models.Model):
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='resources/images/', blank=True, null=True)
    description = models.TextField()
    brand = models.ForeignKey('Brand', on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    count_in_stock = models.IntegerField()
    rating = models.DecimalField(max_digits=3, decimal_places=1) 
    num_reviews = models.IntegerField()

    def __str__(self):
        return self.name
    
    def update_average_rating(self):
        ratings = self.ratings.all()
        if ratings.exists():
            avg = round(sum([r.rating for r in ratings]) / ratings.count(), 1)
            self.rating = avg
            self.save()
    
class Brand(models.Model):
    name = models.CharField(max_length=250, unique=True)
    
    def __str__(self):
        return self.name
    
class Category(models.Model):
    name = models.CharField(max_length=250,unique=True)
    
    def __str__(self):
        return self.name
    
class CustomUserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="userprofile",  # <-- eklendi
    )
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} profili"
    
class ProductFavorite(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'product')

class ProductRating(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    rating = models.PositiveSmallIntegerField()
    comment =models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True,blank=True,null=True)
    
    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.email} → {self.product.name}: {self.rating}"
    
class CartItem(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('user', 'product')

class ProductQuestionAnswer(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    answer = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True,blank=True,null=True)
    
    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.email} → {self.product.name}: {self.question}"
    
class Notification(models.Model):
    TYPE_CHOICES = [
        ("success", "Success"),
        ("error", "Error"),
        ("info", "Info"),
        ("warning", "Warning"),
    ]
    CHANNEL_CHOICES = [("header", "Header"), ("toast", "Toast")]

    # Kime gidecek? (opsiyonel: herkese açık için null bırak)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.CASCADE, related_name="notifications"
    )

    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="info")
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="header")
    read = models.BooleanField(default=False)

    # İsteğe bağlı: bildirimi bir objeye bağla (örn. Product)
    content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey("content_type", "object_id")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.type})"