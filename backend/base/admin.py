

from django.contrib import admin

from accounts.models import CustomUser, Role
# from django.contrib.auth.admin import UserAdmin
from .models import Brand, Category, CustomUserProfile, Product

admin.site.register(Product)
admin.site.register(Brand)
admin.site.register(Category)
admin.site.register(CustomUserProfile)
admin.site.register(Role)
admin.site.register(CustomUser)

