define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'branchbvariableDefineActions'
		},

		branchbvariableDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.branch_variable;

			self.branchvariableRegisterHandlebarsHelpers();

			$.extend(callflow_nodes, {
				'branch_variable[]': {
					name: i18n.branch_variable,
					icon: 'share-alt',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'branch_variable',
					tip: i18n.tooltip,
					data: {
						'scope': 'custom_channel_vars',
						'variable': ''
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '9999'
						}
					],
					isUsable: 'true',
					weight: 48,
					key_caption: function(child_node) {
						return child_node.key || '';
					},
					key_edit: function(child_node, callback) {
						var $popup, $popupHtml;

						$popupHtml = $(self.getTemplate({
							name: 'dialog_value',
							data: {
								value: child_node.key
							},
							submodule: 'branchvariable'
						}));

						$popupHtml.find('.js-save').on('click', function() {
							var value = $('input[name="value"]', $popup).val();
							child_node.key = value;
							child_node.key_caption = value;
							$popup.dialog('close');
						});

						monster.ui.tooltips($popupHtml);

						$popup = monster.ui.dialog($popupHtml, {
							title: i18n.value_dialog.title,
							minHeight: '0',
							beforeClose: function() {
								callback && callback();
							}
						});
					},
					caption: function(node, caption_map) {
						var scope = node.getMetadata('scope');
						return scope ? i18n[scope] : '';
					},
					edit: function(node, callback) {
						self.branchvariableShowEditDialog(node, callback);
					}
				}
			});
		},

		branchvariableRegisterHandlebarsHelpers: function () {
			Handlebars.registerHelper('inc', function(value, options) {
				return parseInt(value) + 1;
			});
		},

		branchvariableShowEditDialog: function (node, callback) {
			var self = this,
				$popup,
				$dialog,
				i18n = self.i18n.active().callflows.branch_variable,
				scope = node.getMetadata('scope'),
				variable = node.getMetadata('variable');

			var scopeList = [
				{
					name: i18n.custom_channel_vars,
					value: 'custom_channel_vars'
				}, {
					name: i18n.account,
					value: 'account'
				}, {
					name: i18n.device,
					value: 'device'
				}, {
					name: i18n.user,
					value: 'user'
				}, {
					name: i18n.merged,
					value: 'merged'
				}
			];

			$dialog = $(self.getTemplate({
				name: 'dialog_edit',
				data: {
					scope: scope || 'custom_channel_vars',
					scopeList: scopeList.sort(function (a, b) {
						if (a.name > b.name) {
							return 1;
						}
						if (a.name < b.name) {
							return -1;
						}
						return 0;
					}),
					variable: variable || ''
				},
				submodule: 'branchvariable'
			}));

			$popup = monster.ui.dialog($dialog, {
				title: self.i18n.active().callflows.branch_variable.edit_dialog.title,
				minHeight: '0',
				width: 450,
				beforeClose: function() {
					if (typeof callback === 'function') {
						callback();
					}
				}
			});

			monster.ui.tooltips($dialog);

			$dialog.find('.js-save').click(function(e) {
				e.preventDefault();
				var $form = $(this)
					.closest('.js-branch-variable-dialog')
					.find('.js-branch-variable-form');
				var formData = monster.ui.getFormData($form[0]);

				formData.scope && node.setMetadata('scope', formData.scope);
				formData.variable && node.setMetadata('variable', formData.variable);
				node.caption = formData.scope && i18n.hasOwnProperty(formData.scope) ? i18n[formData.scope] : '';
				if (typeof callback === 'function') {
					callback();
				}

				$popup.dialog('close');
			});
		}
	};

	return app;
});
