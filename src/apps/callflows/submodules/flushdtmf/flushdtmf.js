define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'flushdtmfDefineActions'
		},

		flushdtmfDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.flush_dtmf;

			$.extend(callflow_nodes, {
				'flush_dtmf[]': {
					name: i18n.flush_dtmf,
					icon: 'phone',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'flush_dtmf',
					tip: i18n.tooltip,
					data: {},
					rules: [{
						type: 'quantity',
						maxSize: 1
					}],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return node.getMetadata('collection_name') || '';
					},
					edit: function(node, callback) {
						self.flushdtmfShowEditDialog(node, callback);
					}
				}
			});
		},

		flushdtmfShowEditDialog: function (node, callback) {
			var self = this,
				$dialogHtml,
				$dialog,
				i18n = self.i18n.active().callflows.flush_dtmf,
				collectionName = node.getMetadata('collection_name') || '';

			$dialogHtml = $(self.getTemplate({
				name: 'dialogEdit',
				data: {
					collectionName: collectionName
				},
				submodule: 'flushdtmf'
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

			monster.ui.tooltips($dialogHtml);

			$dialogHtml.find('.js-save').click(function() {
				var collectionName = $('#flush-dtmf_collection-name', $dialog).val();
				if(collectionName) {
					node.setMetadata('collection_name', collectionName);
				} else {
					node.deleteMetadata('collection_name');
				}
				node.caption = collectionName;

				if (typeof callback === 'function') {
					callback();
				}

				$dialog.dialog('close');
			});
		}
	};

	return app;
});
