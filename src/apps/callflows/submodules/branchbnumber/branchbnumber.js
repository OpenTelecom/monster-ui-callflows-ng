define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'branchbnumberDefineActions'
		},

		branchbnumberDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.branch_bnumber;

			$.extend(callflow_nodes, {
				'branch_bnumber[]': {
					name: i18n.branch_bnumber,
					icon: 'share-alt',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'branch_bnumber',
					tip: i18n.tooltip,
					data: {
						hunt: true
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
						var key = child_node.key;

						return (key !== '_') ? key : i18n.default_action;
					},
					key_edit: function(child_node, callback) {
						var popup, popup_html;

						popup_html = $(self.getTemplate({
							name: 'dialogMenuOption',
							data: {
								menuOption: child_node.key
							},
							submodule: 'branchbnumber'
						}));

						popup_html.find('.js-save').on('click', function() {
							var menuOption = $('[name="menu_option"]', popup).val();
							child_node.key = menuOption;
							child_node.key_caption = menuOption;
							popup.dialog('close');
						});

						popup = monster.ui.dialog(popup_html, {
							title: i18n.menu_option_title,
							minHeight: '0',
							beforeClose: function() {
								callback && callback();
							}
						});
					},
					caption: function(node, caption_map) {
						return node.getMetadata('hunt') ? i18n.hunting : i18n.branching;
					},
					edit: function(node, callback) {
						self.branchbnumberShowEditDialog(node, callback);
					}
				}
			});
		},

		branchbnumberShowEditDialog: function (node, callback) {
			var self = this,
				$popup,
				$dialog,
				i18n = self.i18n.active().callflows.branch_bnumber,
				hunt = node.getMetadata('hunt'),
				huntAllow = node.getMetadata('hunt_allow'),
				huntDeny = node.getMetadata('hunt_deny');

			$dialog = $(self.getTemplate({
				name: 'dialogEdit',
				data: {
					hunt: hunt,
					huntAllow: huntAllow || '',
					huntDeny: huntDeny || ''
				},
				submodule: 'branchbnumber'
			}));

			$popup = monster.ui.dialog($dialog, {
				title: self.i18n.active().callflows.branch_bnumber.edit_dialog.title,
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
					.closest('.js-branch-bnumber-dialog')
					.find('.js-branch-bnumber-form');
				var formData = monster.ui.getFormData($form[0]);

				node.deleteMetadata('hunt_allow');
				node.deleteMetadata('hunt_deny');

				formData.hunt_allow && node.setMetadata('hunt_allow', formData.hunt_allow);
				formData.hunt_deny && node.setMetadata('hunt_deny', formData.hunt_deny);
				node.setMetadata('hunt', formData.hunt);
				node.caption = formData.hunt ? i18n.hunting : i18n.branching;
				if (typeof callback === 'function') {
					callback();
				}

				$popup.dialog('close');
			});
		}
	};

	return app;
});
