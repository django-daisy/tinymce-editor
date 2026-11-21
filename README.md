# Django TOAST UI Editor

Add a Markdown and visual editor to Django forms. The widget works with
Django's default admin and Django Daisy. The app has no database models or
migrations.

## Installation

```sh
pip install 'django-toastui-editor @ git+https://github.com/django-daisy/django-toastui-editor.git@v0.1.0'
```

Add `"django_toastui_editor"` to `INSTALLED_APPS`. The app includes the
editor's JavaScript and CSS. Run Django's usual `collectstatic` command for
production deployments.

## Edit an existing field in the admin

Use the same `ModelAdmin` setup with either admin site. Replace `Article` and
`body` with your model and existing text field.

```python
from django import forms
from django.contrib import admin
from django_toastui_editor.fields import ToastUIEditorWidget

from .models import Article


class ArticleAdminForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = "__all__"
        widgets = {"body": ToastUIEditorWidget}


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
```

For a regular form, use `forms.CharField(widget=ToastUIEditorWidget)` and
include `{{ form.media }}` and `{% csrf_token %}` in your template. If you
prefer to declare the editor on a model in your own app, use
`django_toastui_editor.fields.ToastUIEditorField`, a `TextField` subclass
whose default form widget is the editor.

The field stores Markdown. If your existing field contains HTML, convert the
content separately if you want to edit it as Markdown. Sanitize rendered HTML
before displaying user-authored content.

## Enable attachments

Include the editor's URL configuration in your project's URL patterns.

```python
from django.urls import include, path

urlpatterns = [
    # Your existing URLs
    path("editor/", include("django_toastui_editor.urls")),
]
```

The routes use Django's session and authentication middleware and require an
active staff account. Uploads and deletions require a CSRF token. Each staff
user can manage their own uploads. The size limit defaults to 5 MiB and can
be set in bytes with `TOASTUI_EDITOR_MAX_UPLOAD_SIZE`.

The editor uses Django's default file storage. Listing attachments requires
storage with `listdir()` support. Files stay in storage until explicitly
deleted, even after their links or the objects containing them are removed.
Serve uploaded files from a separate origin.

## Run the tests

After installing this project locally, run
`python -m django test --settings=tests.settings` from the repository root.
With Django Daisy installed, run the same command with
`--settings=tests.settings_daisy` to verify that admin too.
