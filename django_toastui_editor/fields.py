from django import forms
from django.contrib.admin.widgets import AdminTextareaWidget
from django.db import models
from django.urls import NoReverseMatch, reverse


class ToastUIEditorWidget(forms.Textarea):
    """Markdown editor with optional attachment URLs."""

    def __init__(self, attrs=None, upload_url=None):
        super().__init__(attrs)
        self.upload_url = upload_url

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        widget_attrs = context['widget']['attrs']
        widget_attrs['class'] = (widget_attrs.get('class', '') + ' toastui-editor-field').strip()
        if self.upload_url is not None:
            widget_attrs['data-upload-url'] = self.upload_url
        else:
            try:
                widget_attrs['data-upload-url'] = reverse('django_toastui_editor:upload')
                widget_attrs['data-attachments-url'] = reverse('django_toastui_editor:attachments')
                widget_attrs['data-delete-url'] = reverse('django_toastui_editor:delete')
            except NoReverseMatch:
                pass
        return context

    class Media:
        css = {'all': (
            'django_toastui_editor/toastui-editor.min.css',
            'django_toastui_editor/daisy-theme.css',
        )}
        js = ('django_toastui_editor/toastui-editor.min.js',
              'django_toastui_editor/init.js')


class ToastUIEditorField(models.TextField):
    def formfield(self, **kwargs):
        if self.choices is None:
            widget = kwargs.get('widget')
            if widget is None or widget is AdminTextareaWidget or type(widget) is AdminTextareaWidget:
                kwargs['widget'] = ToastUIEditorWidget
        return super().formfield(**kwargs)
