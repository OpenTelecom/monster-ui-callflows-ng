define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'faxdetectDefineActions'
		},

		faxdetectDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.fax_detect;

			$.extend(callflow_nodes, {
				'fax_detect[]': {
					name: i18n.fax_detect,
					icon: 'fax',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'fax_detect',
					tip: i18n.tooltip,
					data: {
						duration: 3
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '2'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						var duration = node.getMetadata('duration');
						return i18n.caption.replace('${duration}', duration);
					},
					edit: function(node, callback) {
						self.faxdetectShowEditDialog(node, callback);
					},
					key_caption: function(child_node, caption_map) {
						if(child_node.key === 'ON_VOICE') {
							return i18n.menu_option_dialog.on_voice;
						} else if(child_node.key === 'ON_FAX') {
							return i18n.menu_option_dialog.on_fax;
						}
						return child_node.key;
					},
					key_edit: function(child_node, callback) {
						var $dialog, $popup;

						$popup = $(self.getTemplate({
							name: 'dialogMenuOption',
							data: {
								selected: child_node.key
							},
							submodule: 'faxdetect'
						}));

						$popup.find('.js-save').on('click', function() {
							var $menuOption = $('#fax-detect_menu-option option:selected', $popup);
							child_node.key = $menuOption.val();
							child_node.key_caption = $menuOption.text();
							$dialog.dialog('close');
						});

						$dialog = monster.ui.dialog($popup, {
							title: self.i18n.active().callflows.fax_detect.menu_option_dialog.title,
							minHeight: '0',
							width: 450,
							beforeClose: function() {
								if (typeof callback === 'function') {
									callback();
								}
							}
						});
					}
				}
			});
		},

		faxdetectShowEditDialog: function (node, callback) {
			var self = this,
				$popup,
				$dialog,
				i18n = self.i18n.active().callflows.fax_detect;

			$dialog = $(self.getTemplate({
				name: 'dialogEdit',
				data: {
					duration: node.getMetadata('duration')
				},
				submodule: 'faxdetect'
			}));

			$popup = monster.ui.dialog($dialog, {
				title: self.i18n.active().callflows.fax_detect.edit_dialog.title,
				minHeight: '0',
				width: 450,
				beforeClose: function() {
					if (typeof callback === 'function') {
						callback();
					}
				}
			});

			$dialog.find('.js-save').click(function() {
				var duration = parseInt($('#fax-detect_duration').val());
				node.setMetadata('duration', duration);
				node.caption = i18n.caption.replace('${duration}', duration);
				if (typeof callback === 'function') {
					callback();
				}

				$popup.dialog('close');
			});

			monster.ui.tooltips($dialog);
		}
	};

	return app;
});
