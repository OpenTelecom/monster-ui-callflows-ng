define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var useAbsoluteMode;

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'checkcidDefineActions'
		},

		checkcidDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18n = self.i18n.active().callflows.check_cid;


			$.extend(callflow_nodes, {
				'check_cid[]': {
					name: i18n.check_cid,
					icon: 'check',
					category: self.i18n.active().oldCallflows.caller_id_cat,
					module: 'check_cid',
					tip: i18n.tooltip,
					data: {
						use_absolute_mode: false
					},
					rules: [{
						type: 'quantity',
						maxSize: 2
					}],
					isUsable: 'true',
					weight: 48,
					caption: function(node, caption_map) {
						return self.checkcidGetCaptionFromNode(node);
					},
					edit: function(node, callback) {
						self.checkcidShowEditDialog(node, callback);
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
								useAbsoluteMode: useAbsoluteMode,
								selected: child_node.key === '_' ? '' : child_node.key
							},
							submodule: 'checkcid'
						}));

						$popup.find('.js-save').on('click', function() {
							if(useAbsoluteMode) {
								var callerID = $('#check-cid_caller-id', $popup).val();
								child_node.key = callerID;
								child_node.key_caption = callerID;
							} else {
								var $regexKeySelectedOption = $('#check-cid_regex-menu-options option:selected', $popup);
								var regexKeyVal = $regexKeySelectedOption.val();
								var regexKeyText = $regexKeySelectedOption.text();
								child_node.key = regexKeyVal;
								child_node.key_caption = regexKeyText;
							}
							$dialog.dialog('close');
						});

						$dialog = monster.ui.dialog($popup, {
							title: self.i18n.active().callflows.check_cid.menu_option_dialog.title,
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

		checkcidGetCaptionFromNode: function (node) {
			var caption = '';
			useAbsoluteMode = node.getMetadata('use_absolute_mode');
			var callerID = node.getMetadata('caller_id');
			var regex = node.getMetadata('regex');
			if(useAbsoluteMode && callerID && callerID.external) {
				if(callerID.external.hasOwnProperty('name')) {
					caption = Object.values(callerID.external).join(', ')
				}
			} else if(regex) {
				caption = regex;
			}
			return caption;
		},

		checkcidShowEditDialog: function (node, callback) {
			var self = this;
			self.checkcidGetUsers(function(users) {
				var $dialogHtml,
					$dialog,
					i18n = self.i18n.active().callflows.check_cid,
					caller_id = node.getMetadata('caller_id') || {},
					regex = node.getMetadata('regex') || '',
					user_id = node.getMetadata('user_id') || '';
				useAbsoluteMode = node.getMetadata('use_absolute_mode') || false;

				$dialogHtml = $(self.getTemplate({
					name: 'dialogEdit',
					data: {
						caller_id: caller_id,
						regex: regex,
						use_absolute_mode: useAbsoluteMode,
						user_id: user_id,
						users: users
					},
					submodule: 'checkcid'
				}));

				$dialog = monster.ui.dialog($dialogHtml, {
					title: self.i18n.active().callflows.check_cid.edit_dialog.title,
					minHeight: '0',
					width: 450,
					beforeClose: function() {
						if (typeof callback === 'function') {
							callback();
						}
					}
				});

				monster.ui.tooltips($dialogHtml);

				$('#check-cid_use_absolute_mode', $dialog).change(function (e) {
					e.preventDefault();
					var useAbsoluteMode = $(this).is(':checked');
					if(useAbsoluteMode) {
						self.checkcidShowChildNodesWarning({
							node: node,
							successCallback: function () {
								node.rules = [{
									type: 'quantity',
									maxSize: 999
								}];
								$('.js-caller-id-mode', $dialog).removeClass('hidden');
								$('.js-regexp-mode', $dialog).addClass('hidden');
								$('#check-cid_use_absolute_mode', $dialog).prop('checked', useAbsoluteMode);
							},
							failCallback: function () {
								$('#check-cid_use_absolute_mode', $dialog).prop('checked', !useAbsoluteMode);
							}
						});
					} else {
						self.checkcidShowChildNodesWarning({
							node: node,
							successCallback: function () {
								node.rules = [{
									type: 'quantity',
									maxSize: 2
								}];
								$('.js-caller-id-mode').addClass('hidden');
								$('.js-regexp-mode').removeClass('hidden');
								$('#check-cid_use_absolute_mode', $dialog).prop('checked', useAbsoluteMode);
							},
							failCallback: function () {
								$('#check-cid_use_absolute_mode', $dialog).prop('checked', !useAbsoluteMode);
							}
						});
					}
				});

				$dialogHtml.find('.js-save').click(function() {
					var $form = $(this)
						.closest('.js-check-cid-dialog')
						.find('.js-check-cid-form');
					var formData = monster.ui.getFormData($form[0]);

					useAbsoluteMode = formData.use_absolute_mode;
					node.setMetadata('use_absolute_mode', useAbsoluteMode);

					if(formData.caller_id && formData.caller_id.hasOwnProperty('external')) {
						var external = formData.caller_id.external;
						if(external.name || external.number) {
							node.setMetadata('caller_id', formData.caller_id);
						} else {
							node.deleteMetadata('caller_id');
						}
					}

					formData.user_id ? node.setMetadata('user_id', formData.user_id) : node.deleteMetadata('user_id');
					formData.regex ? node.setMetadata('regex', formData.regex) : node.deleteMetadata('regex');

					node.caption = self.checkcidGetCaptionFromNode(node);

					if (typeof callback === 'function') {
						callback();
					}

					$dialog.dialog('close');
				});
			});
		},

		checkcidShowChildNodesWarning: function (data) {
			var self = this,
				$dialog,
				$dialogHtml,
				node = data.node,
				successCallback = data.successCallback,
				failCallback = data.failCallback;

			if(node.children.length === 0) {
				successCallback();
				return;
			}

			$dialogHtml = $(self.getTemplate({
				name: 'dialogWarning',
				data: {},
				submodule: 'checkcid'
			}));

			$dialog = monster.ui.dialog($dialogHtml, {
				title: self.i18n.active().callflows.check_cid.edit_dialog.title,
				minHeight: '0',
				width: 450,
				dialogClass: 'no-close',
			});

			$('.js-remove-all-children', $dialogHtml).on('click', function (e) {
				e.preventDefault();
				node.children = [];
				self.repaintFlow();
				successCallback();
				$dialog.dialog('close');
			});

			$('.js-change-later', $dialogHtml).on('click', function (e) {
				e.preventDefault();
				successCallback();
				$dialog.dialog('close');
			});

			$('.js-cancel', $dialogHtml).on('click', function (event) {
				event.preventDefault();
				failCallback();
				$dialog.dialog('close');
			});
		},

		checkcidGetUsers: function (callback) {
			var self = this;

			self.getAll({
				resource: 'user.list',
				data: {
					accountId: self.accountId,
					filters: { paginate: false },
					generateError: false
				},
				success: function(users, status) {
					callback && callback(users.data);
				}
			});
		},
	};

	return app;
});
