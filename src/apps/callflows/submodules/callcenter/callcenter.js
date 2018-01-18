define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		toastr = require('toastr'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var app = {
		requests: {
			'callcenter.queue.eavesdrop': {
				'verb': 'PUT',
				'url': 'accounts/{accountId}/queues/{queueId}/eavesdrop'
			},
			'callcenter.call.eavesdrop': {
				'verb': 'PUT',
				'url': 'accounts/{accountId}/queues/eavesdrop'
			},
			'callcenter.queues.list': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/queues'
			},
			'callcenter.queues.create': {
				'verb': 'PUT',
				'url': 'accounts/{accountId}/queues'
			},
			'callcenter.queues.get': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/queues/{queuesId}'
			},
			'callcenter.queues.update': {
				'verb': 'POST',
				'url': 'accounts/{accountId}/queues/{queuesId}'
			},
			'callcenter.queues.delete': {
				'verb': 'DELETE',
				'url': 'accounts/{accountId}/queues/{queuesId}'
			},
			'callcenter.queues.stats': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/queues/stats'
			},
			'callcenter.agents.stats': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/agents/stats'
			},
			'callcenter.agents.status': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/agents/status'
			},
			'callcenter.agents.toggle': {
				'verb': 'POST',
				'url': 'accounts/{accountId}/agents/{agentId}/status'
			},
			'callcenter.agents.list': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/agents'
			},
			'callcenter.agents.update': {
				'verb': 'POST',
				'url': 'accounts/{accountId}/queues/{queuesId}/roster'
			}
		},

		validationRules: {
			'#name': {
				regex: /^.*/
			},
			'#connection_timeout': {
				regex: /^[0-9]+$/
			},
			'#member_timeout': {
				regex: /^[0-9]+$/
			}/*,
			 '#caller_exit_key': {
			 regex: /^.{1}/
			 }*/
		},

		subscribe: {
			//'callflows.queue.activate': 'activate', // TODO
			'callflows.queue.edit': 'queueEdit',
			'callflows.fetchActions': 'callcenterDefineActions',
			'callflows.queue.popupEdit': 'queuePopupEdit'

		},

		random_id: false,

		callcenterDefineActions: function(args) {
			var self = this,
				callflow_nodes= args.actions,
				i18nApp = self.i18n.active().callflows.callcenter;

			$.extend(callflow_nodes, {
				'acdc_queue[id=*]': {
					name: i18nApp.queue,
					icon: 'link',
					category: i18nApp.category,
					module: 'acdc_queue',
					tip: i18nApp.tooltip,
					data: {
						id: 'null'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 40,
					caption: function(node, caption_map) {
						var id = node.getMetadata('id'),
							returned_value = '';

						if(id in caption_map) {
							returned_value = caption_map[id].name;
						}

						return returned_value;
					},
					edit: function(node, callback) {
						self.getQueuesList(function(queues) {
							var popup, popup_html;

							popup_html = $(monster.template(self, 'callcenter-queue-callflow' , {
								i18n: self.i18n.active(),
								objects: {
									items: queues,
									selected: node.getMetadata('id') || ''
								}
							}));

							if($('#queue_selector option:selected', popup_html).val() == undefined) {
								$('#edit_link', popup_html).hide();
							}

							$('.inline_action', popup_html).click(function(ev) {
								var _data = ($(this).data('action') == 'edit') ?
												{ id: $('#queue_selector', popup_html).val() } : {};

								ev.preventDefault();

								self.queuePopupEdit({
									data: _data, 
									callback: function(_data) {
										node.setMetadata('id', _data.id || 'null');
										node.caption = _data.name || '';

										popup.dialog('close');
									}
								});
							});

							$('#add', popup_html).click(function() {
								node.setMetadata('id', $('#queue_selector', popup).val());
								node.caption = $('#queue_selector option:selected', popup).text();
								popup.dialog('close');

							});

							popup = monster.ui.dialog(popup_html, {
								title: self.i18n.active().callflows.callcenter.select_queue,
								minHeight: '0',
								beforeClose: function() {
									if(typeof callback == 'function') {
										callback();
									}
								}
							});
						});
					},
					listEntities: function(callback) {
						monster.request({
							resource: 'callcenter.queues.list',
							data: {
								accountId: self.accountId,
								filters: { paginate:false }
							},
							success: function(data, status) {
								callback && callback(data.data);
							}
						});
					},
					editEntity: 'callflows.queue.edit'
				},
				'acdc_agent[action=resume]': {
					name: i18nApp.agentResume,
					icon: 'reply',
					category: i18nApp.category,
					module: 'acdc_agent',
					tip: '',
					data: {
						action: 'resume',
						retries: '3'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '0'
						}
					],
					isUsable: 'true',
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						if(typeof callback == 'function') {
							callback();
						}
					}
				},
				'acdc_agent[action=break]': {
					name: i18nApp.agentBreak,
					icon: 'chain-broken',
					category: i18nApp.category,
					module: 'acdc_agent',
					tip: '',
					data: {
						action: 'break',
						retries: '3'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '0'
						}
					],
					isUsable: 'true',
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						if(typeof callback == 'function') {
							callback();
						}
					}
				},
				'acdc_agent[action=logout]': {
					name: i18nApp.logoutAgent,
					icon: 'sign-out',
					category: i18nApp.category,
					module: 'acdc_agent',
					tip: '',
					data: {
						action: 'logout',
						retries: '3'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '0'
						}
					],
					isUsable: 'true',
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						if(typeof callback == 'function') {
							callback();
						}
					}
				},
				'acdc_agent[action=login]': {
					name: i18nApp.loginAgent,
					icon: 'sign-in',
					category: i18nApp.category,
					module: 'acdc_agent',
					tip: '',
					data: {
						action: 'login',
						retries: '3'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '0'
						}
					],
					isUsable: 'true',
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						if(typeof callback == 'function') {
							callback();
						}
					}
				},
				'acdc_agent[action=toggle]': {
					name: i18nApp.toggleAgent,
					icon: 'toggle-off',
					category: i18nApp.category,
					module: 'acdc_agent',
					tip: '',
					data: {
						action: 'toggle',
						retries: '3'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '0'
						}
					],
					isUsable: 'true',
					caption: function(node, caption_map) {
						return '';
					},
					edit: function(node, callback) {
						if(typeof callback == 'function') {
							callback();
						}
					}
				}
			});
		},

		queuePopupEdit: function(args) {
			var self = this,
				popup_html = $('<div class="inline_popup callflows-queue"><div class="inline_content main_content"></div></div>'),
				callback = args.callback,
				popup,
				data = args.data,
				data_defaults = args.data_defaults;

			popup_html.css({
				height: 500,
				'overflow-y': 'scroll'
			});

			self.queueEdit({
				data: data,
				parent: popup_html,
				target: $('.inline_content', popup_html),
				callbacks: {
					save_success: function(_data) {
						popup.dialog('close');

						if(typeof callback == 'function') {
							callback(_data);
						}
					},
					delete_success: function() {
						popup.dialog('close');

						if(typeof callback == 'function') {
							callback({ data: {} });
						}
					},
					after_render: function() {
						popup = monster.ui.dialog(popup_html, {
							title: (data.id) ? self.i18n.active().callflows.callcenter.queue_edit : self.i18n.active().callflows.callcenter.queue_create
						});
					}
				},
				data_defaults: data_defaults
			});
		},

		queueEdit: function(args) {
			var self = this,
				data = args.data,
				parent = args.parent || $('#queue-content'),
				target = args.target || $('#queue-view', parent),
				_callbacks = args.callbacks || {},
				callbacks = {
					save_success: _callbacks.save_success || function(_data) {
						// self.queueRenderList(parent);

						self.queueEdit({
							data: {
								id: _data.data.id
							},
							parent: parent,
							target: target,
							callbacks: callbacks
						});
					},

					save_error: _callbacks.save_error,

					delete_success: _callbacks.delete_success || function() {
						target.empty();

						//self.queueRenderList(parent);
					},

					delete_error: _callbacks.delete_error,

					after_render: _callbacks.after_render
				},
				defaults = {
					data: $.extend(true, {
						connection_timeout: '300',
						member_timeout: '5'
						/* caller_exit_key: '#' */
					}, args.data_defaults || {}),
					field_data: {
						sort_by: {
							'first_name': self.i18n.active().callflows.callcenter.first_name,
							'last_name': self.i18n.active().callflows.callcenter.last_name
						}
					}
				};

			self.getUsersList(function(users) {
				defaults.field_data.users = users;

				if(typeof data == 'object' && data.id) {

					monster.request({
						resource: 'callcenter.queues.get',
						data: {
							accountId: self.accountId,
							queuesId: data.id,
							generateError: false
						},
						success: function (_data) {
							var render_data = $.extend(true, defaults, _data);
							render_data.field_data.old_list = [];
							if('agents' in _data.data) {
								render_data.field_data.old_list = _data.data.agents;
							}
							self.queueRender(render_data, target, callbacks);

							if(typeof callbacks.after_render == 'function') {
								callbacks.after_render();
							}
						}
					});
				} else {
					self.queueRender(defaults, target, callbacks);

					if(typeof callbacks.after_render == 'function') {
						callbacks.after_render();
					}
				}
			});
		},


		getUsersList: function(callback) {
			var self = this;

			self.callApi({
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

		queueRenderList: function(_parent){
			var self = this,
				parent = _parent || $('#queue-content'),
				i18nApp = self.i18n.active().callflows.callcenter;

			self.getQueuesList(function(data) {
				var map_crossbar_data = function(data) {
					var new_list = [];

					if(data.length > 0) {
						$.each(data, function(key, val) {
							new_list.push({
								id: val.id,
								title: val.name || _t('voip_queue', 'no_name')
							});
						});
					}

					new_list.sort(function(a, b) {
						return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
					});

					return new_list;
				};

				// TODO!

				/*$('#queue-listpanel', parent)
					.empty()
					.listpanel({
						label: i18nApp.queues_label,
						identifier: 'queue-listview',
						new_entity_label: i18nApp.add_queue_label,
						data: map_crossbar_data(data.data),
						publisher: winkstart.publish,
						notifyMethod: 'queue.edit',
						notifyCreateMethod: 'queue.edit',
						notifyParent: parent
					});*/
			});
		},

		getQueuesList: function(callback) {
			var self = this;

			monster.request({
				resource: 'callcenter.queues.list',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function (data) {
					callback && callback(data.data);
				}
			});
		},

		// TODO
		/*activate: function(parent) {
			var self = this,
				queue_html = $(monster.template(self, 'callcenter-queue'));

			(parent || $('#monster_content'))
				.empty()
				.append(queue_html);

			self.queueRenderList(queue_html);
		},*/

		queueRender: function(data, target, callbacks) {
			var self = this;
			data.i18nApp = self.i18n.active().callflows.callcenter;
			var queue_html = $(monster.template(self, 'callcenter-queue-edit' , data));

			self.userListRender(data, queue_html);

			var $form = queue_html.find('form');

			monster.ui.validate($form, {
				rules: self.validationRules
			});

			monster.ui.tooltips(queue_html, {
				selector: '[rel=popover]'
			});

			$('.queue-save', queue_html).click(function(ev) {
				ev.preventDefault();

				if(monster.ui.valid($form)) {
					var form_data = monster.ui.getFormData($form);

					var new_list = [];

					$('.rows .row:not(#row_no_data)', queue_html).each(function() {
						new_list.push($(this).dataset('id'));
					});

					data.field_data.user_list = {
						old_list: data.data.agents || [],
						new_list: new_list
					};

					self.queueSave(form_data, data, callbacks.save_success, callbacks.save_error);
				} else {
					toastr.error(self.i18n.active().callflows.callcenter.formHasErrorsMessage);
				}
			});

			$('.queue-delete', queue_html).click(function(ev) {
				ev.preventDefault();


				monster.ui.confirm(self.i18n.active().callflows.callcenter.deleteConfirmMessage, function() {
					self.queueDelete(data, callbacks.delete_success, callbacks.delete_error);
				});
			});

			$('.js-add-user-btn', queue_html).click(function(e) {
				e.preventDefault();

				var $userSelect = $('#users-list', queue_html);

				if($userSelect.val() != 'empty_option_user') {
					var user_id = $userSelect.val(),
						user_data = {
							user_id: user_id,
							user_name: $('#option_user_' + user_id, queue_html).text()
						};

					if($('#row_no_data', queue_html).size() > 0) {
						$('#row_no_data', queue_html).remove();
					}

					$('.js-user-table-body', queue_html).prepend($(monster.template(self, 'callcenter-user-row' , user_data)));
					$('#option_user_'+user_id, queue_html).hide();

					$userSelect.val('empty_option_user');
				}
			});

			$(queue_html).on('click', '.js-edit-user', function() {
				var _data = {
					id: $(this).data('id')
				};

				monster.pub('callflows.user.popupEdit', {
					data: _data,
					callflow: function(_data) {
						$('#row_user_' + _data.data.id + ' .column.first', queue_html).html(_data.data.first_name + ' ' + _data.data.last_name);
						$('#option_user_' + _data.data.id, queue_html).html(_data.data.first_name + ' ' + _data.data.last_name);
					}
				});
			});

			$(queue_html).on('click', '.js-delete-user', function() {
				var user_id = $(this).data('id');

				//removes it from the grid
				$('#row_user_' + user_id, queue_html).remove();

				//re-add it to the dropdown
				$('#option_user_'+user_id, queue_html).show();

				//if grid empty, add no data line
				if($('.js-user-table-body .js-user-table-item', queue_html).size() == 0) {
					$('.js-user-table-body', queue_html).append($(monster.template(self, 'callcenter-user-row')));
				}
			});

			target.empty().append(queue_html);
		},

		queueDelete: function(data, success, error) {
			var self = this;

			if(typeof data.data == 'object' && data.data.id) {
				self.callApi({
					resource: 'callcenter.queues.delete',
					data: {
						accountId: self.accountId,
						queuesId: data.data.id,
						generateError: false
					},
					success: function(_data, status) {
						if(typeof success == 'function') {
							success(_data, status);
						}
					},
					error: function(_data, status) {
						if(typeof error == 'function') {
							error(_data, status);
						}
					}
				});
			}
		},

		userListRender: function(data, parent) {
			var self = this;

			if(data.data.id) {
				if('agents' in data.data && data.data.agents.length > 0) {
					var user_item;
					$.each(data.field_data.users, function(k, v) {
						if(data.data.agents.indexOf(v.id) >= 0) {
							var html = $(monster.template(self, 'callcenter-user-row' , {
								user_id: v.id,
								user_name: v.first_name + ' ' + v.last_name
							}));

							$('.js-user-table-body', parent).append(html);
							$('#option_user_' + v.id, parent).hide();
						}
					});
				} else {
					$('.js-user-table-body', parent).empty()
						.append($(monster.template(self, 'callcenter-user-row')));
				}
			} else {
				$('.js-user-table-body', parent).empty()
					.append($(monster.template(self, 'callcenter-user-row')));
			}
		},

		queueSave: function(form_data, data, success, error) {
			var self = this,
				normalized_data = self.normalizeData($.extend(true, {}, data.data, form_data));

			if (typeof data.data == 'object' && data.data.id) {
				monster.request({
					resource: 'callcenter.queues.update',
					data: {
						accountId: self.accountId,
						queuesId: data.id,
						generateError: false,
						data: normalized_data
					},
					success: function (_data, status) {
						if(typeof success == 'function') {
							self.usersUpdate(data.field_data.user_list, _data.data.id, function() {
								success(_data, status, 'update');
							});
						}
					},
					error: function(_data, status) {
						if(typeof error == 'function') {
							error(_data, status, 'update');
						}
					}
				});
			} else {
				monster.request({
					resource: 'callcenter.queues.create',
					data: {
						accountId: self.accountId,
						generateError: false,
						data: normalized_data
					},
					success: function (_data, status) {
						if(typeof success == 'function') {
							self.usersUpdate(data.field_data.user_list, _data.data.id, function() {
								success(_data, status, 'create');
							});
						}
					},
					error: function(_data, status) {
						if(typeof error == 'function') {
							error(_data, status, 'update');
						}
					}
				});
			}
		},

		usersUpdate: function(data, queue_id, success) {
			var old_queue_user_list = data.old_list,
				new_queue_user_list = data.new_list,
				self = this,
				users_updated_count = 0,
				users_count = 0,
				callback = function() {
					users_updated_count++;
					if(users_updated_count >= users_count) {
						success();
					}
				};


			if(old_queue_user_list) {
				$.each(old_queue_user_list, function(k, v) {
					if(new_queue_user_list.indexOf(v) === -1) {
						//Request to update user without this queue.
						users_count++;
						self.singleUserUpdate(v, queue_id, 'remove', callback);
					}
				});

				$.each(new_queue_user_list, function(k, v) {
					if(old_queue_user_list.indexOf(v) === -1) {
						users_count++;
						self.singleUserUpdate(v, queue_id, 'add', callback);
					}
				});
			} else {
				if(new_queue_user_list) {
					$.each(new_queue_user_list, function(k, v) {
						users_count++;
						self.singleUserUpdate(v, queue_id, 'add', callback);
					});
				}
			}

			/* If no users has been updated, we still need to refresh the view for the other attributes */
			if(users_count == 0) {
				success();
			}
		},

		singleUserUpdate: function(user_id, queue_id, action, callback) {
			var self = this;

			self.callApi({
				resource: 'user.get',
				data: {
					accountId: self.accountId,
					userId: user_id,
					generateError: false
				},
				success: function(_data, status) {
					if(action =='add') {
						if(!_data.data.queues || typeof _data.data.queues != 'object') {
							_data.data.queues = [];
						}
						_data.data.queues.push(queue_id);

						/* If a user is added to a queue, but is not enabled as an agent, we enable this user automatically */
						if(!('queue_pin' in _data.data)) {
							_data.data.queue_pin = '';
						}
					} else { //remove
						_data.data.queues.splice(_data.data.queues.indexOf(queue_id), 1);
					}

					self.callApi({
						resource: 'user.update',
						data: {
							accountId: self.accountId,
							userId: user_id,
							data: _data.data,
							generateError: false
						},
						success: function(_data, status) {
							if(typeof callback === 'function') {
								callback(status);
							}
						},
						error: function(_data, status) {
							if(typeof callback === 'function') {
								callback(status);
							}
						}
					});
				}
			});
		},

		normalizeData: function(form_data) {
			delete form_data.users;
			return form_data;
		}
	};

	return app;
});
