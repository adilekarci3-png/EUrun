from django.db import models


class Firma(models.Model):
    full_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(max_length=254, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'firma'


class Address(models.Model):
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    firma = models.ForeignKey(Firma, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'address'
