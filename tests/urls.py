from django import forms
from django.contrib import admin
from django.contrib.auth.models import Group
from django.urls import include, path

from django_tinymce_editor.fields import TinyMCEWidget


class GroupEditorForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ("name", "permissions")
        widgets = {"name": TinyMCEWidget}


class GroupEditorAdmin(admin.ModelAdmin):
    form = GroupEditorForm


admin.site.unregister(Group)
admin.site.register(Group, GroupEditorAdmin)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("editor/", include("django_tinymce_editor.urls")),
]
