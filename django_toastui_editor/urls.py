from django.urls import path

from . import attachments

app_name = "django_toastui_editor"

urlpatterns = [
    path("upload/", attachments.upload, name="upload"),
    path("attachments/", attachments.attachments, name="attachments"),
    path("delete/", attachments.delete, name="delete"),
]
