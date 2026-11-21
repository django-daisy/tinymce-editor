(function () {
    'use strict';

    function init(root) {
        root.querySelectorAll('textarea.tinymce-editor-field').forEach(function (textarea) {
            if (!window.tinymce || !textarea.dataset.tinymceLicenseKey || textarea.dataset.tinymceReady || textarea.name.indexOf('__prefix__') !== -1) return;
            textarea.dataset.tinymceReady = '1';
            var csrf = textarea.form && textarea.form.querySelector('[name=csrfmiddlewaretoken]');
            var editor;

            function post(url, data) {
                if (new URL(url, document.baseURI).origin !== window.location.origin) {
                    return Promise.reject(new Error('Attachment requests must use the same origin.'));
                }
                return fetch(url, {
                    method: 'POST', body: data, credentials: 'same-origin',
                    headers: { 'X-CSRFToken': csrf ? csrf.value : '' }
                }).then(function (response) {
                    if (!response.ok) throw new Error('Request failed');
                    return response.json();
                });
            }
            function upload(blob, filename) {
                if (!textarea.dataset.uploadUrl) return Promise.reject(new Error('Uploads disabled'));
                var data = new FormData();
                data.append('file', blob, filename || blob.name || 'image');
                return post(textarea.dataset.uploadUrl, data);
            }
            function failure(error) { window.alert(error.message || 'The attachment request failed.'); }
            function button(text, action) {
                var element = document.createElement('button');
                element.type = 'button';
                element.textContent = text;
                element.addEventListener('click', action);
                return element;
            }
            function insert(item) {
                var link = document.createElement('a');
                link.href = item.url;
                link.textContent = item.name;
                editor.insertContent(link.outerHTML);
                editor.focus();
            }
            var options = {
                target: textarea,
                readonly: textarea.disabled || textarea.readOnly,
                license_key: textarea.dataset.tinymceLicenseKey,
                height: 400,
                menubar: false,
                plugins: 'link image lists',
                toolbar: 'undo redo | blocks | bold italic | bullist numlist | link image',
                paste_data_images: false,
                block_unsupported_drop: true,
                convert_urls: false,
                promotion: false,
                branding: false,
                setup: function (instance) {
                    instance.on('input change undo redo', function () { instance.save(); });
                    if (textarea.dataset.uploadUrl) {
                        instance.on('OpenWindow', function (event) {
                            var dialog = event.dialog;
                            if (!dialog.getData || !dialog.showTab) return;
                            var data = dialog.getData();
                            // The image dialog provides both a URL and an upload field.
                            if (Array.isArray(data.fileinput) && data.src && !data.src.value) {
                                dialog.showTab('upload');
                            }
                        });
                    }
                    instance.on('init', function () {
                        textarea.removeAttribute('required');
                        if (textarea.dataset.uploadUrl && !textarea.disabled && !textarea.readOnly) {
                            editor = instance;
                            addAttachmentControls(instance.getContainer());
                        }
                    });
                }
            };
            if (textarea.dataset.uploadUrl) {
                options.paste_data_images = true;
                options.images_upload_handler = function (blobInfo) {
                    return upload(blobInfo.blob(), blobInfo.filename()).then(function (data) { return data.url; });
                };
            }
            window.tinymce.init(options).catch(function (error) {
                delete textarea.dataset.tinymceReady;
                console.error('TinyMCE initialization failed', error);
            });

            function addAttachmentControls(container) {
                var controls = document.createElement('div');
                var input = document.createElement('input');
                input.type = 'file';
                input.accept = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.zip,.docx,.xlsx,.pptx';
                input.hidden = true;
                input.addEventListener('change', function () {
                    if (!input.files.length) return;
                    upload(input.files[0]).then(insert).catch(failure);
                    input.value = '';
                });
                controls.appendChild(button('Attach file', function () { input.click(); }));
                controls.appendChild(input);
                container.insertAdjacentElement('afterend', controls);

                if (!textarea.dataset.attachmentsUrl || !textarea.dataset.deleteUrl) return;
                var list = document.createElement('div');
                list.hidden = true;
                controls.appendChild(button('Manage attachments', function () {
                    list.hidden = !list.hidden;
                    if (!list.hidden) loadPage(1);
                }));
                controls.appendChild(list);
                function loadPage(page) {
                    fetch(textarea.dataset.attachmentsUrl + '?page=' + page, { credentials: 'same-origin' })
                        .then(function (response) {
                            return response.json().then(function (data) {
                                if (!response.ok) throw new Error(data.error || 'The attachment request failed.');
                                return data;
                            });
                        }).then(function (data) {
                            list.replaceChildren();
                            if (!data.items.length) list.appendChild(document.createTextNode('No attachments.'));
                            data.items.forEach(function (item) {
                                var row = document.createElement('div');
                                row.appendChild(document.createTextNode(item.name + ' '));
                                row.appendChild(button('Insert link', function () { insert(item); }));
                                row.appendChild(button('Delete', function () {
                                    if (!window.confirm('Permanently delete this file? Remove its links from this and any other content.')) return;
                                    var form = new FormData();
                                    form.append('id', item.id);
                                    post(textarea.dataset.deleteUrl, form).then(function () { loadPage(page); }).catch(failure);
                                }));
                                list.appendChild(row);
                            });
                            if (page > 1) list.appendChild(button('Previous', function () { loadPage(page - 1); }));
                            if (data.has_more) list.appendChild(button('Next', function () { loadPage(page + 1); }));
                        }).catch(failure);
                }
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
    else init(document);
    document.addEventListener('formset:added', function (event) { init(event.target); });
}());
