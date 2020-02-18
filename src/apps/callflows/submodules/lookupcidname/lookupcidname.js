define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		requests: {
			'callflows.lookupcidname.lists.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/lists'
			}
		},

		subscribe: {
			'callflows.fetchActions': 'lookupcidnameDefineActions'
		},

		lookupcidnameDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.lookup_cid_name;

			$.extend(callflow_nodes, {
				'lookupcidname[]': {
					name: i18n.lookup_cid_name,
					icon: 'group',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'lookupcidname',
					tip: i18n.tooltip,
					data: {
						lists: []
					},
					rules: [{
						type: 'quantity',
						maxSize: 2
					}],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						self.lookupcidnameShowEditDialog(node, callback);
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
							submodule: 'lookupcidname'
						}));

						$popup.find('.js-save').on('click', function() {
							var $menuOption = $('#lookup-cid-name_menu-option option:selected', $popup);
							child_node.key = $menuOption.val();
							child_node.key_caption = $menuOption.text();
							$dialog.dialog('close');
						});

						$dialog = monster.ui.dialog($popup, {
							title: self.i18n.active().callflows.lookup_cid_name.menu_option_dialog.title,
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

		getLists: function(callback){
			var self = this;

			monster.request({
				resource: 'callflows.lookupcidname.lists.get',
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

		lookupcidnameShowEditDialog: function (node, callback) {
			var self = this,
				$dialogHtml,
				$dialog,
				i18n = self.i18n.active().callflows.lookup_cid_name,
				selectedListsIds = node.getMetadata('lists') || [];

			self.getLists(function (lists) {
				var selectedLists = [];
				var allListsWithoutSelected = [];
				for(var i=0, len=lists.length; i<len; i++) {
					if($.inArray(lists[i].id, selectedListsIds) !== -1) {
						selectedLists.push(lists[i]);
					} else {
						allListsWithoutSelected.push(lists[i]);
					}
				}

				$dialogHtml = $(self.getTemplate({
					name: 'dialogEdit',
					data: {
						selectedLists: selectedLists,
						lists: allListsWithoutSelected
					},
					submodule: 'lookupcidname'
				}));

				$dialogHtml.find(
					'#lookup-cid-name_lists .selected-lists, ' +
					'#lookup-cid-name_lists .available-lists'
				).sortable({
					connectWith: '.connected-sortable'
				}).disableSelection();

				$dialog = monster.ui.dialog($dialogHtml, {
					title: i18n.edit_dialog.title,
					minHeight: '0',
					width: 490,
					beforeClose: function() {
						if (typeof callback === 'function') {
							callback();
						}
					}
				});

				$dialogHtml.find('.js-save').click(function() {
					var lists = $('.js-selected-lists .js-list').map(function (index, el) {
						return $(el).data('list_id')
					}).toArray();
					node.setMetadata('lists', lists);

					if (typeof callback === 'function') {
						callback();
					}

					$dialog.dialog('close');
				});
			})
		}
	};

	return app;
});
