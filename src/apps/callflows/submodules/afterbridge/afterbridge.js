define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'afterbridgeDefineActions'
		},

		afterbridgeDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.after_bridge;

			$.extend(callflow_nodes, {
				'after_bridge[action=park]': {
					name: i18n.park.nodeName,
					icon: 'reply',
					category: i18n.category,
					module: 'after_bridge',
					tip: i18n.park.tooltip,
					data: {
						action: 'park',
						data: true
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						self.afterbridgeShowWarningDialog(node, callback);
					}
				},
				'after_bridge[action=transfer]': {
					name: i18n.transfer.nodeName,
					icon: 'map-signs',
					category: i18n.category,
					module: 'after_bridge',
					tip: i18n.transfer.tooltip,
					data: {
						action: 'transfer',
						data: false
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return node.getMetadata('data') || '';
					},
					edit: function(node, callback) {
						self.afterbridgeTransferEdit(node, callback);
					}
				},
				'after_bridge[action=hangup]': {
					name: i18n.hangup.nodeName,
					icon: 'power-off',
					category: i18n.category,
					module: 'after_bridge',
					tip: i18n.hangup.tooltip,
					data: {
						action: 'hangup',
						data: true
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						self.afterbridgeShowWarningDialog(node, callback);
					}
				}
			});
		},

		afterbridgeShowWarningDialog: function (node, callback) {
			var self = this,
				$popup,
				$dialog;

			$dialog = $(self.getTemplate({
				name: 'warningDialog',
				data: {},
				submodule: 'afterbridge'
			}));

			$popup = monster.ui.dialog($dialog, {
				title: self.i18n.active().callflows.after_bridge.warning_dialog.title,
				minHeight: '0',
				width: 400,
				beforeClose: function() {
					if (typeof callback === 'function') {
						callback();
					}
				}
			});

			$dialog.find('.js-confirm').click(function() {
				if (typeof callback === 'function') {
					callback();
				}
				$popup.dialog('close');
			});
		},

		afterbridgeTransferEdit: function (node, callback) {
			var self = this,
				$popup,
				$dialog,
				action = node.getMetadata('action'),
				number = node.getMetadata('data');

			$dialog = $(self.getTemplate({
				name: 'transferDialog',
				data: {
					action: action,
					number: number || ''
				},
				submodule: 'afterbridge'
			}));

			$popup = monster.ui.dialog($dialog, {
				title: self.i18n.active().callflows.after_bridge.transfer.dialog_title,
				minHeight: '0',
				width: 400,
				beforeClose: function() {
					if (typeof callback === 'function') {
						callback();
					}
				}
			});

			$dialog.find('.js-save').click(function() {
				var number = $('#after-bridge-number').val();
				var caption = '';

				if(!number) {
					number = false
				} else {
					caption = number;
				}

				node.setMetadata('data', number);
				node.caption = caption;
				if (typeof callback === 'function') {
					callback();
				}

				$popup.dialog('close');
			});
		}
	};

	return app;
});
