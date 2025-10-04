import datetime as dt
import uuid
import boto3
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from botocore.client import Config
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

DEFAULT_EXPIRE = 300
def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        config=Config(signature_version="s3v4"),
    )


def _choose_bucket(content_type: str):
    """
    İçeriğin tipine göre hangi bucket kullanılacak?
    """
    if content_type and content_type.startswith("image/"):
        return settings.AWS_PUBLIC_BUCKET_NAME   # görseller public bucket'a
    return settings.AWS_PRIVATE_BUCKET_NAME      # pdf, doc vb. private bucket'a


@api_view(["POST"])
def get_presigned_post(request):
    """
    Body: { "keyPrefix": "uploads/", "filename": "video.mp4", "contentType": "video/mp4" }
    """
    data = request.data
    key_prefix   = data.get("keyPrefix", "uploads/")
    filename     = data.get("filename", "file.bin")
    content_type = data.get("contentType", "application/octet-stream")

    today = dt.datetime.utcnow().strftime("%Y/%m/%d")
    safe_name = filename.replace("/", "_")
    object_key = f"{key_prefix}{today}/{uuid.uuid4().hex}-{safe_name}"

    bucket = _choose_bucket(content_type)
    s3 = _s3_client()

    post = s3.generate_presigned_post(
        Bucket=bucket,
        Key=object_key,
        Fields={"Content-Type": content_type},
        Conditions=[{"Content-Type": content_type}],
        ExpiresIn=DEFAULT_EXPIRE,   # 🔹 5 dakika
    )

    public_url = None
    if bucket == settings.AWS_PUBLIC_BUCKET_NAME:
        public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket}/{object_key}"

    return Response({
        "url": post["url"],
        "fields": post["fields"],
        "objectKey": object_key,
        "bucket": bucket,
        "publicUrl": public_url,
    })


@api_view(["POST"])
def get_presigned_download(request):
    """
    Body:
    {
      "objectKey": "uploads/2025/09/15/1690000000-dosya.pdf",
      "downloadName": "rapor.pdf",
      "contentType": "application/pdf",
      "bucket": "media-private"   # opsiyonel
    }
    """
    object_key = request.data.get("objectKey")
    if not object_key:
        return Response({"detail": "objectKey gerekli."}, status=400)

    # expiresSec parametresini yoksayıyoruz, her zaman 300 sn
    expires_sec  = DEFAULT_EXPIRE
    downloadName = request.data.get("downloadName")
    content_type = request.data.get("contentType")
    bucket       = request.data.get("bucket")

    if not bucket:
        bucket = _choose_bucket(content_type or "")

    s3 = _s3_client()
    params = {
        "Bucket": bucket,
        "Key": object_key,
    }
    if content_type:
        params["ResponseContentType"] = content_type
    if downloadName:
        params["ResponseContentDisposition"] = f'inline; filename="{downloadName}"'

    url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params=params,
        ExpiresIn=expires_sec,   # 🔹 5 dakika
    )
    print("Presigned download URL:", url)
    return Response({"url": url})

@api_view(["POST"])
@permission_classes([IsAuthenticated])  # anonimse kaldır
def list_private_objects(request):
    """
    Body (opsiyonel):
    {
      "prefix": "docs/",
      "maxKeys": 100,
      "continuationToken": "...."
    }
    """
    prefix = request.data.get("prefix", "")
    max_keys = int(request.data.get("maxKeys", 100))
    token = request.data.get("continuationToken")

    s3 = _s3_client()
    kwargs = {
        "Bucket": settings.AWS_PRIVATE_BUCKET_NAME,
        "MaxKeys": max_keys,
        "Prefix": prefix,
    }
    if token:
        kwargs["ContinuationToken"] = token

    resp = s3.list_objects_v2(**kwargs)

    items = []
    for obj in resp.get("Contents", []):
        items.append({
            "key": obj["Key"],
            "size": obj.get("Size", 0),
            "lastModified": obj.get("LastModified").isoformat() if obj.get("LastModified") else None,
        })

    return Response({
        "items": items,
        "truncated": resp.get("IsTruncated", False),
        "nextToken": resp.get("NextContinuationToken")
    })