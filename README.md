# Django TinyMCE Editor

Add a TinyMCE rich text editor to Django forms. The widget works with
Django's default admin and Django Daisy. The app has no database models or
migrations.

## Installation

```sh
pip install .
```

Add `"django_tinymce_editor"` to `INSTALLED_APPS`. Download a patched
[TinyMCE 8 self-hosted distribution](https://www.tiny.cloud/get-tiny/self-hosted/)
and place the full distribution under `tinymce/` in a directory listed in
`STATICFILES_DIRS`. Keep the scripts, plugins, skins, and themes together.
Set `TINYMCE_EDITOR_LICENSE_KEY = "gpl"` if your deployment uses TinyMCE
under GPLv2+. For a commercial deployment, configure a valid self-hosted
license key and install the license key manager as described by
[TinyMCE](https://www.tiny.cloud/docs/tinymce/latest/license-key/).

Run `collectstatic` and serve the complete TinyMCE directory, including the
original filenames TinyMCE loads dynamically. Override
`TINYMCE_EDITOR_SCRIPT` if the script is stored at another static path.
With the license setting unset, the widget renders as a textarea.

## Edit an existing field in the admin

Use the same `ModelAdmin` setup with either admin site. Replace `Article` and
`body` with your model and existing text field.

```python
from django import forms
from django.contrib import admin
from django_tinymce_editor.fields import TinyMCEWidget

from .models import Article


class ArticleAdminForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = "__all__"
        widgets = {"body": TinyMCEWidget}


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
```

For a regular form, use `forms.CharField(widget=TinyMCEWidget)` and
include `{{ form.media }}` and `{% csrf_token %}` in your template. If you
prefer to declare the editor on a model in your own app, use
`django_tinymce_editor.fields.TinyMCEField`, a `TextField` subclass
whose default form widget is the editor.

TinyMCE stores HTML. Sanitize untrusted HTML on the server before rendering
it, including content submitted directly to the form.

## Enable attachments

Include the editor's URL configuration in your project's URL patterns.

```python
from django.urls import include, path

urlpatterns = [
    # Your existing URLs
    path("editor/", include("django_tinymce_editor.urls")),
]
```

The routes use Django's session and authentication middleware and require an
active staff account. Uploads and deletions require a CSRF token. Each staff
user can manage their own uploads. The size limit defaults to 5 MiB and can
be set in bytes with `TINYMCE_EDITOR_MAX_UPLOAD_SIZE`.

The editor uses Django's default file storage. Listing attachments requires
storage with `listdir()` support. Files stay in storage until explicitly
deleted, even after their links or the objects containing them are removed.

## Production security

- **Rich text.** Apply a server-side HTML allowlist before rendering untrusted
  editor content as HTML. Allow only the elements, attributes, and URL schemes
  your application needs. Apply this rule to every rendering path, including
  admin previews. TinyMCE filters content in the browser, and requests can
  submit HTML directly to Django. See the
  [TinyMCE security guide](https://www.tiny.cloud/docs/tinymce/latest/security/).
- **Media hosting.** Keep the optional attachment routes disabled until your
  media service is configured. Serve uploads from a separate registrable
  domain, set explicit content types and `X-Content-Type-Options: nosniff`, and
  serve documents and archives as downloads. The package checks file signatures
  and extensions. Add deeper validation or scanning where your file policy
  requires it. See [Django's upload guidance](https://docs.djangoproject.com/en/5.2/topics/security/#user-uploaded-content).
- **Private attachments.** Staff and owner checks apply to upload, list, and
  delete operations. The editor inserts the storage URL into saved HTML.
  Public URLs can be shared, and signed URLs can expire. For private files, use
  a stable download URL that checks the requesting user's access to the
  associated content before serving the file or issuing a fresh signed URL.
- **Upload limits.** Configure a request-body limit at the reverse proxy, with
  room for multipart overhead. The package's file-size limit runs after Django
  parses the upload. Set rate limits and storage quotas as needed. Each list
  request reads the owner's full storage directory before returning a page, so
  verify listing performance at your expected attachment volume.
- **Dependencies.** Deploy on a
  [supported Django release](https://www.djangoproject.com/download/#supported-versions)
  and pin a patched self-hosted TinyMCE build in your deployment. Track the
  [TinyMCE changelog](https://www.tiny.cloud/docs/tinymce/latest/changelog/) for
  security updates. Before rollout, verify TinyMCE loads under your production
  Content Security Policy and check upload and download behavior with the
  actual proxy and storage backend.

## Run the tests

After installing this project locally, run
`python -m django test --settings=tests.settings` from the repository root.
With Django Daisy installed, run the same command with
`--settings=tests.settings_daisy` to verify that admin too.
