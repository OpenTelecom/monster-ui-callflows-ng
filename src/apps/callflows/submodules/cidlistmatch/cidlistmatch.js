define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {
			'callflows.cidlistmatch.lists.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists'
			}
		},

		subscribe: {
			'callflows.fetchActions': 'cidlistmatchDefineActions'
		},

		cidlistmatchDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.cid_list_match;

			$.extend(callflow_nodes, {
				'cidlistmatch[id=*]': {
					name: i18n.cid_list_match,
					icon: 'group',
					category: self.i18n.active().oldCallflows.caller_id_cat,
					module: 'cidlistmatch',
					tip: i18n.tooltip,
					data: {},
					rules: [
						{
							type: 'quantity',
							maxSize: '2'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						self.cidlistmatchShowEditDialog(node, callback);
					},
					key_caption: function(child_node, caption_map) {
						if(child_node.key === 'match') {
							return i18n.menu_option_dialog.match;
						} else if(child_node.key === 'nomatch') {
							return i18n.menu_option_dialog.no_match;
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
							submodule: 'cidlistmatch'
						}));

						$popup.find('.js-save').on('click', function() {
							var $menuOption = $('#cid-list-match_menu-option option:selected', $popup);
							child_node.key = $menuOption.val();
							child_node.key_caption = $menuOption.text();
							$dialog.dialog('close');
						});

						$dialog = monster.ui.dialog($popup, {
							title: self.i18n.active().callflows.cid_list_match.menu_option_dialog.title,
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

		cidlistmatchShowEditDialog: function (node, callback) {
			var self = this,
				$popup,
				$dialog,
				listId = node.getMetadata('id');

			self.cidlistmatchGetLists(function (lists) {
				$dialog = $(self.getTemplate({
					name: 'dialogEdit',
					data: {
						listId: listId,
						lists: lists
					},
					submodule: 'cidlistmatch'
				}));

				$popup = monster.ui.dialog($dialog, {
					title: self.i18n.active().callflows.cid_list_match.edit_dialog.title,
					minHeight: '0',
					width: 450,
					beforeClose: function() {
						if (typeof callback === 'function') {
							callback();
						}
					}
				});

				$dialog.find('.js-save').click(function() {
					var $selectedOption = $('#cid-list-match_id option:selected');
					var listId = $selectedOption.val();

					node.setMetadata('id', listId);
					if (typeof callback === 'function') {
						callback();
					}

					$popup.dialog('close');
				});
			})
		},

		cidlistmatchGetLists: function(callback){
			var self = this;

			monster.request({
				resource: 'callflows.cidlistmatch.lists.get',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function (data) {
					if(typeof(callback) === 'function') {
						callback(data.data);
					}
				}
			});
		},
	};

	return app;
});
