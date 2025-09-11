from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ProductConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("product_updates", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("product_updates", self.channel_name)

    async def send_product(self, event):
        await self.send(text_data=json.dumps(event["message"]))
