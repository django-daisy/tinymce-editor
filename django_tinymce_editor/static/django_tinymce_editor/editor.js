(function () {
    'use strict';

    var markdown = typeof window.markdownit === 'function' && window.markdownit({ html: false });
    var inlineMarkdown = new Set(['em_open', 'strong_open', 's_open', 'code_inline', 'link_open', 'image']);

    function pasteMarkdown(editor, event) {
        var clipboard = event.clipboardData;
        if (!clipboard || event.defaultPrevented || clipboard.files.length || clipboard.getData('text/html')) return;

        var text = clipboard.getData('text/plain');
        if (!text) return;

        var env = {};
        var tokens = markdown.parse(text, env);
        var hasMarkdown = tokens.some(function (token) {
            if (token.type === 'inline') {
                return token.children.some(function (child) { return inlineMarkdown.has(child.type); });
            }
            return token.type !== 'paragraph_open' && token.type !== 'paragraph_close';
        });
        if (!hasMarkdown) return;

        event.preventDefault();
        editor.execCommand('mceInsertClipboardContent', false, {
            html: markdown.renderer.render(tokens, markdown.options, env)
        });
        editor.save();
    }

    function init(root) {
        root.querySelectorAll('textarea.tinymce-editor-field').forEach(function (textarea) {
            if (!window.tinymce || !textarea.dataset.tinymceLicenseKey || textarea.dataset.tinymceReady || textarea.name.indexOf('__prefix__') !== -1) return;
            textarea.dataset.tinymceReady = '1';
            var csrf = textarea.form && textarea.form.querySelector('[name=csrfmiddlewaretoken]');

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
                    if (markdown && !options.readonly) {
                        instance.on('paste', function (event) { pasteMarkdown(instance, event); }, true);
                    }
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
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
    else init(document);
    document.addEventListener('formset:added', function (event) { init(event.target); });
}());
