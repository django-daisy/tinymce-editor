from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.staticfiles import finders
from django.db import connection
from django.db.migrations.loader import MigrationLoader
from django.test import TestCase
from django.urls import reverse


class EditorAdminTests(TestCase):
    def test_edit_existing_field(self):
        user = get_user_model().objects.create_superuser(username="admin", password="test")
        self.client.force_login(user)
        group = Group.objects.create(name="Original <strong>HTML</strong>")
        url = reverse("admin:auth_group_change", args=[group.pk])

        response = self.client.get(url)
        self.assertContains(response, "Original &lt;strong&gt;HTML&lt;/strong&gt;")
        self.assertContains(response, "tinymce-editor-field")
        self.assertContains(response, "tinymce/tinymce.min.js")
        self.assertContains(response, 'data-upload-url="/editor/upload/"')

        response = self.client.post(url, {"name": "<p>Updated <em>HTML</em></p>"})
        self.assertEqual(response.status_code, 302)
        group.refresh_from_db()
        self.assertEqual(group.name, "<p>Updated <em>HTML</em></p>")
        self.assertContains(self.client.get(url), "&lt;p&gt;Updated &lt;em&gt;HTML&lt;/em&gt;&lt;/p&gt;")

    def test_assets_and_migrations(self):
        self.assertIsNotNone(finders.find("django_tinymce_editor/editor.js"))
        loader = MigrationLoader(connection)
        self.assertNotIn("django_tinymce_editor", loader.migrated_apps)
