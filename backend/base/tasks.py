import random
import time
from .models import Product
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task 
def create_product():
    name = f"Ürün {random.randint(1000,9999)}"
    price = round(random.uniform(10, 500), 2)
    product = Product.objects.create(name=name, price=price)

    data = {
        'name': product.name,
        'price': product.price,
        'created_at': str(product.created_at)
    }

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "products",
        {"type": "send_product", "data": data}
    )


@shared_task
def uzun_sureli_islem(saniye):
    print(f"{saniye} saniyelik işlem başladı...")
    time.sleep(saniye)
    print("İşlem tamamlandı.")