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
        group = Group.objects.create(name="Original **Markdown**")
        url = reverse("admin:auth_group_change", args=[group.pk])

        response = self.client.get(url)
        self.assertContains(response, "Original **Markdown**")
        self.assertContains(response, "toastui-editor-field")
        self.assertContains(response, "django_toastui_editor/toastui-editor.min.js")
        self.assertContains(response, 'data-upload-url="/editor/upload/"')

        response = self.client.post(url, {"name": "Updated *Markdown*\nSecond line"})
        self.assertEqual(response.status_code, 302)
        group.refresh_from_db()
        self.assertEqual(group.name, "Updated *Markdown*\nSecond line")
        self.assertContains(self.client.get(url), "Updated *Markdown*\nSecond line")

    def test_assets_and_migrations(self):
        for filename in ("init.js", "toastui-editor.min.js", "toastui-editor.min.css", "daisy-theme.css"):
            self.assertIsNotNone(finders.find(f"django_toastui_editor/{filename}"))
        loader = MigrationLoader(connection)
        self.assertNotIn("django_toastui_editor", loader.migrated_apps)
