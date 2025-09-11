from django.contrib.auth.tokens import PasswordResetTokenGenerator
from datetime import datetime, timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import six

from base.serializer import ProductSerializer

class CustomPasswordResetTokenGenerator(PasswordResetTokenGenerator):
    timeout = 60 * 2  # 2 saat

    def _make_hash_value(self, user, timestamp):
        login_timestamp = '' if user.last_login is None else user.last_login.replace(microsecond=0, tzinfo=None)
        return (
            six.text_type(user.pk) + user.password +
            six.text_type(login_timestamp) +
            six.text_type(timestamp)
        )

    def check_token(self, user, token):
        """
        Token'ın geçerlilik süresini kontrol etmek için override.
        """
        if not (user and token):
            return False

        # Orijinal metottan timestamp çekmek için split
        try:
            ts_b36, _ = token.split("-")
            ts = int(ts_b36, 36)
        except ValueError:
            return False

        # Token expire kontrolü
        now_ts = int((datetime.now() - datetime(2001, 1, 1)).total_seconds())
        if (now_ts - ts) > self.timeout:
            return False

        # Kalan kontrolleri Django'nun orijinal fonksiyonuna bırak
        return super().check_token(user, token)
    
def notify_new_product(product_instance):
    channel_layer = get_channel_layer()
    data = ProductSerializer(product_instance).data
    async_to_sync(channel_layer.group_send)(
        "product_updates",
        {
            "type": "send_product",
            "message": {"event": "new_product", "data": data}
        }
    )
