define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var languagesList = monster.supportedLanguages.map(function(code) {
		var shortLangCode = code.split('-')[0];
		var monsterLanguages = monster.apps.core.i18n.active().monsterLanguages;
		var fullLabel = monster.util.tryI18n(monsterLanguages, code);
		var labelWithShortLangCode = fullLabel.split(' ')[0] + ' (' + shortLangCode + ')';
		return {
			value: code.split('-')[0],
			label: labelWithShortLangCode
		};
	});

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'languageDefineActions'
		},

		languageDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.language;

			$.extend(callflow_nodes, {
				'language[]': {
					name: i18n.language,
					icon: 'language',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'language',
					tip: i18n.tooltip,
					data: {},
					rules: [{
						type: 'quantity',
						maxSize: 1
					}],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						var langShortCode = node.getMetadata('language') || '';
						return self.languageGetCaption(langShortCode);
					},
					edit: function(node, callback) {
						self.languageShowEditDialog(node, callback);
					}
				}
			});
		},

		languageGetCaption: function(langShortCode) {
			var captionText = '';
			if(langShortCode) {
				for(var i=0, len=languagesList.length; i<len; i++) {
					if(languagesList[i].value === langShortCode) {
						captionText = languagesList[i].label;
						break;
					}
				}
			} else {
				captionText = langShortCode;
			}

			return captionText;
		},

		languageShowEditDialog: function (node, callback) {
			var self = this,
				$dialogHtml,
				$dialog,
				i18n = self.i18n.active().callflows.language,
				language = node.getMetadata('language') || '';

			$dialogHtml = $(self.getTemplate({
				name: 'dialogEdit',
				data: {
					selected: language,
					languages: languagesList
				},
				submodule: 'language'
			}));

			$dialog = monster.ui.dialog($dialogHtml, {
				title: i18n.edit_dialog.title,
				minHeight: '0',
				width: 450,
				beforeClose: function() {
					if (typeof callback === 'function') {
						callback();
					}
				}
			});

			$dialogHtml.find('.js-save').click(function() {
				var langShortCode = $('#language', $dialog).val();
				node.setMetadata('language', langShortCode);
				node.caption = self.languageGetCaption(langShortCode);

				if (typeof callback === 'function') {
					callback();
				}

				$dialog.dialog('close');
			});
		}
	};

	return app;
});
