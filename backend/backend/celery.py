import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# settings.py içinde CELERY_ ile başlayan ayarları al
app.config_from_object('django.conf:settings', namespace='CELERY')

# otomatik task bulma
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

