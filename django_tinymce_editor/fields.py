from django import forms
from django.conf import settings
from django.contrib.admin.widgets import AdminTextareaWidget
from django.db import models
from django.urls import NoReverseMatch, reverse


class TinyMCEWidget(forms.Textarea):
    """HTML editor with optional attachment URLs."""

    def __init__(self, attrs=None, upload_url=None):
        super().__init__(attrs)
        self.upload_url = upload_url

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        widget_attrs = context['widget']['attrs']
        widget_attrs['class'] = (widget_attrs.get('class', '') + ' tinymce-editor-field').strip()
        widget_attrs['data-tinymce-license-key'] = getattr(settings, 'TINYMCE_EDITOR_LICENSE_KEY', 'gpl')
        if self.upload_url is not None:
            widget_attrs['data-upload-url'] = self.upload_url
        else:
            try:
                widget_attrs['data-upload-url'] = reverse('django_tinymce_editor:upload')
                widget_attrs['data-attachments-url'] = reverse('django_tinymce_editor:attachments')
                widget_attrs['data-delete-url'] = reverse('django_tinymce_editor:delete')
            except NoReverseMatch:
                pass
        return context

    @property
    def media(self):
        if not getattr(settings, 'TINYMCE_EDITOR_LICENSE_KEY', 'gpl'):
            return forms.Media()
        return forms.Media(js=(
            getattr(settings, 'TINYMCE_EDITOR_SCRIPT', 'django_tinymce_editor/tinymce/tinymce.min.js'),
            'django_tinymce_editor/markdown-it/markdown-it.umd.min.js',
            'django_tinymce_editor/editor.js',
        ))


class TinyMCEField(models.TextField):
    def formfield(self, **kwargs):
        if self.choices is None:
            widget = kwargs.get('widget')
            if widget is None or widget is AdminTextareaWidget or type(widget) is AdminTextareaWidget:
                kwargs['widget'] = TinyMCEWidget
        return super().formfield(**kwargs)
