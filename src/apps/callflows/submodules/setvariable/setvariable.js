define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'setvariableDefineActions'
		},

		setvariableDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.set_variable;

			$.extend(callflow_nodes, {
				'set_variable[]': {
					name: i18n.set_variable,
					icon: 'check',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'set_variable',
					tip: i18n.tooltip,
					data: {
						channel: 'a'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '9999'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return node.getMetadata('variable') || '';
					},
					edit: function(node, callback) {
						self.setvariableShowEditDialog(node, callback);
					}
				}
			});
		},

		setvariableShowEditDialog: function (node, callback) {
			var self = this,
				$popup,
				$dialog,
				i18n = self.i18n.active().callflows.set_variable,
				variable = node.getMetadata('variable') || '',
				value = node.getMetadata('value') || '',
				channel = node.getMetadata('channel') || '';

			$dialog = $(self.getTemplate({
				name: 'dialogEdit',
				data: {
					variable: variable,
					value: value,
					channel: channel,
					channels: [
						{
							'name': i18n.edit_dialog.channel_a,
							'value': 'a'
						}, {
							'name': i18n.edit_dialog.channel_both,
							'value': 'both'
						}
					]
				},
				submodule: 'setvariable'
			}));

			$popup = monster.ui.dialog($dialog, {
				title: self.i18n.active().callflows.set_variable.edit_dialog.title,
				minHeight: '0',
				width: 450,
				beforeClose: function() {
					if (typeof callback === 'function') {
						callback();
					}
				}
			});

			monster.ui.tooltips($dialog);

			$dialog.find('.js-save').click(function() {
				var $form = $(this)
					.closest('.js-set-variable-dialog')
					.find('.js-set-variable-form');
				var formData = monster.ui.getFormData($form[0]);

				node.deleteMetadata('variable');
				node.deleteMetadata('value');
				node.deleteMetadata('channel');

				formData.variable && node.setMetadata('variable', formData.variable);
				formData.value && node.setMetadata('value', formData.value);
				formData.channel && node.setMetadata('channel', formData.channel);
				node.caption = formData.variable || '';

				if (typeof callback === 'function') {
					callback();
				}

				$popup.dialog('close');
			});
		}
	};

	return app;
});
