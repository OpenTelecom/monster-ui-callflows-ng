define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		toastr = require('toastr'),
		monster = require('monster');

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
			'callflows.fetchActions': 'callcenterDefineActions',
			'callflows.queue.editPopup': 'queuePopupEdit',
			'callflows.queue.edit': 'queueEdit'

		},

		random_id: false,

		callcenterDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions,
				i18nApp = self.i18n.active().callflows.callcenter;

			$.extend(callflow_nodes, {
				'acdc_member[id=*]': {
					name: i18nApp.queue,
					icon: 'link',
					category: i18nApp.category,
					module: 'acdc_member',
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

						if (id in caption_map) {
							returned_value = caption_map[id].name;
						}

						return returned_value;
					},
					edit: function(node, callback) {
						self.getQueuesList(function(queues) {
							var popup, popup_html;

							popup_html = $(self.getTemplate({
								name: 'queue-callflow',
								data: {
									i18n: self.i18n.active(),
									objects: {
										items: queues,
										selected: node.getMetadata('id') || '',
										priority: node.getMetadata('priority') || '',
									}
								},
								submodule: 'callcenter'
							}));

							if ($('#queue_selector option:selected', popup_html).val() === undefined) {
								$('#edit_link', popup_html).hide();
							}

							$('.inline_action', popup_html).click(function(ev) {
								ev.preventDefault();

								var _data = {};
								if ($(this).data('action') === 'edit') {
									_data = {
										id: $('#queue_selector', popup_html).val(),
										priority: $('#queue_priority', popup_html).val()
									}
								}

								self.queuePopupEdit({
									data: _data,
									callback: function(_data) {
										node.setMetadata('id', _data.id || 'null');
										_data.priority && node.setMetadata('priority', _data.priority);
										node.caption = _data.name || '';

										popup.dialog('close');
									}
								});
							});

							$('#add', popup_html).click(function() {
								node.setMetadata('id', $('#queue_selector', popup).val());
								node.setMetadata('priority', parseInt($('#queue_priority', popup).val()));
								node.caption = $('#queue_selector option:selected', popup).text();
								popup.dialog('close');
							});

							popup = monster.ui.dialog(popup_html, {
								title: self.i18n.active().callflows.callcenter.selectQueue,
								minHeight: '0',
								beforeClose: function() {
									if (typeof callback === 'function') {
										callback();
									}
								}
							});

							monster.ui.tooltips(popup);
						});
					},
					listEntities: function(callback) {
						self.getAll({
							resource: 'callcenter.queues.list',
							data: {
								accountId: self.accountId
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
						if (typeof callback === 'function') {
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
						if (typeof callback === 'function') {
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
						if (typeof callback === 'function') {
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
						if (typeof callback === 'function') {
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
						if (typeof callback === 'function') {
							callback();
						}
					}
				}
			});
		},

		queuePopupEdit: function(args) {
			var self = this,
				popup_html = $('<div class="callflows-callcenter-popup inline_popup callflows-port"><div class="inline_content main_content"></div></div>'),
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

						if (typeof callback === 'function') {
							callback(_data);
						}
					},
					delete_success: function() {
						popup.dialog('close');

						if (typeof callback === 'function') {
							callback({ data: {} });
						}
					},
					after_render: function() {
						popup = monster.ui.dialog(popup_html, {
							title: (data.id) ? self.i18n.active().callflows.callcenter.editQueue : self.i18n.active().callflows.callcenter.createQueue
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
					save_success: _callbacks.save_success || function (_data) {
						self.queueRenderList(parent);
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
					delete_success: _callbacks.delete_success || function () {
						target.empty();

						self.queueRenderList(parent);
					},
					delete_error: _callbacks.delete_error,
					after_render: _callbacks.after_render
				},
				defaults = {
					data: {},
					field_data: {
						sort_by: {
							'first_name': self.i18n.active().callflows.callcenter.first_name,
							'last_name': self.i18n.active().callflows.callcenter.last_name
						}
					}
				}

			monster.parallel({
				media_list: function (callback) {
					self.callApi({
						resource: 'media.list',
						data: {
							accountId: self.accountId,
							filters: {
								paginate: false
							}
						},
						success: function (mediaList, status) {
							_.each(mediaList.data, function (media) {
								if (media.media_source) {
									media.name = '[' + media.media_source.substring(0, 3).toUpperCase() + '] ' + media.name;
								}
							});

							mediaList.data.unshift({
								id: '',
								name: self.i18n.active().callflows.menu.not_set
							});

							defaults.field_data.media = mediaList.data;

							callback(null, mediaList);
						}
					});
				},
				user_list: function (callback) {
					self.getUsersList(function (users) {
						defaults.field_data.users = users;

						if (typeof data === 'object' && data.id) {
							self.queueGet(data.id, function (queueData) {
								var render_data = $.extend(true, defaults, queueData);

								render_data.field_data.old_list = [];
								if ('agents' in queueData.data) {
									render_data.field_data.old_list = queueData.data.agents;
								}

								callback(null, {});
							});
						}
					});
				}
			}, function (err, results) {
				let render_data = defaults;
				if (typeof data === 'object' && data.id) {
					render_data = $.extend(true, defaults, results.user_list);
				}

				self.queueRender(render_data, target, callbacks);

				if (typeof (callbacks.after_render) === 'function') {
					callbacks.after_render();
				}
			});


		},


		getUsersList: function(callback) {
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

		queueRenderList: function(_parent, callback) {
			var self = this,
				parent = _parent || $('#queue-content'),
				i18nApp = self.i18n.active().callflows.callcenter;

			self.getQueuesList(function(data) {
				var map_crossbar_data = function(data) {
					var new_list = [];

					if (data.length > 0) {
						$.each(data, function(key, val) {
							new_list.push({
								id: val.id,
								title: val.name || i18nApp.noName
							});
						});
					}

					new_list.sort(function(a, b) {
						return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
					});

					return new_list;
				};

				callback && callback();
			});
		},

		getQueuesList: function(callback) {
			var self = this;
			self.getAll({
				resource: 'callcenter.queues.list',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		queueGet: function(queueId, callback) {
			var self = this;
			monster.request({
				resource: 'callcenter.queues.get',
				data: {
					accountId: self.accountId,
					queuesId: queueId,
					generateError: false
				},
				success: function(_data) {
					if (typeof (callback) === 'function') {
						callback(_data);
					}
				}
			});
		},

		queueRender: function(data, target, callbacks) {
			var self = this;
			data.i18nApp = self.i18n.active().callflows.callcenter;
			var queue_html = $(self.getTemplate({
				name: 'queue-edit',
				data: data,
				submodule: 'callcenter'
			}));

			self.userListRender(data, queue_html);

			var $form = queue_html.find('form');

			monster.ui.validate($form, {
				rules: self.validationRules
			});

			// monster.ui.tooltips(queue_html, {
			// 	selector: '[rel=popover]'
			// });

			$('*[rel=popover]', queue_html).popover({
				trigger: 'focus',
				placement: 'right'
			});

			$('.queue-save', queue_html).click(function(ev) {
				ev.preventDefault();

				if (monster.ui.valid($form)) {
					var form_data = monster.ui.getFormData($form[0]);

					var agentsList = [];

					$('.js-user-table-item:not(#row_no_data)', queue_html).each(function() {
						agentsList.push($(this).data('id'));
					});

					data.field_data.user_list = {
						old_list: data.data.agents || [],
						new_list: agentsList
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

				if ($userSelect.val() !== 'empty_option_user') {
					var user_id = $userSelect.val(),
						user_data = {
							user_id: user_id,
							user_name: $('#option_user_' + user_id, queue_html).text()
						};

					if ($('#row_no_data', queue_html).size() > 0) {
						$('#row_no_data', queue_html).remove();
					}

					$('.js-user-table-body', queue_html).prepend(
						$(self.getTemplate({
							name: 'user-row',
							data: user_data,
							submodule: 'callcenter'
						}))
					);
					$('#option_user_' + user_id, queue_html).hide();

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
				$('#option_user_' + user_id, queue_html).show();

				//if grid empty, add no data line
				if ($('.js-user-table-body .js-user-table-item', queue_html).size() === 0) {
					$('.js-user-table-body', queue_html).append(
						$(self.getTemplate({
							name: 'user-row',
							data: {},
							submodule: 'callcenter'
						}))
					);
				}
			});

			self.queueBindEvents({
				data: data,
				template: queue_html,
				callbacks: callbacks
			});

			target.empty().append(queue_html);
		},

		agentsSave: function(queueId, agentsIdList, callback) {
			var self = this;

			monster.request({
				resource: 'callcenter.agents.update',
				data: {
					accountId: self.accountId,
					generateError: false,
					queuesId: queueId,
					data: agentsIdList
				},
				success: function(data) {
					if (typeof (callback) === 'function' && data.data) {
						callback(data.data);
					}
				}
			});
		},

		queueDelete: function(data, success, error) {
			var self = this;

			if (typeof data.data === 'object' && data.data.id) {
				monster.request({
					resource: 'callcenter.queues.delete',
					data: {
						accountId: self.accountId,
						queuesId: data.data.id,
						generateError: false
					},
					success: function(_data, status) {
						if (typeof success === 'function') {
							success(_data, status);
						}
					},
					error: function(_data, status) {
						if (typeof error === 'function') {
							error(_data, status);
						}
					}
				});
			}
		},

		userListRender: function(data, parent) {
			var self = this;

			if (data.data.id) {
				if ('agents' in data.data && data.data.agents.length > 0) {
					var user_item;
					$.each(data.field_data.users, function(k, v) {
						if (data.data.agents.indexOf(v.id) >= 0) {
							var html = $(self.getTemplate({
								name: 'user-row',
								data: {
									user_id: v.id,
									user_name: v.first_name + ' ' + v.last_name
								},
								submodule: 'callcenter'
							}));

							$('.js-user-table-body', parent).append(html);
							$('#option_user_' + v.id, parent).hide();
						}
					});
				} else {
					$('.js-user-table-body', parent).empty()
						.append(
							$(self.getTemplate({
								name: 'user-row',
								data: {},
								submodule: 'callcenter'
							}))
						);
				}
			} else {
				$('.js-user-table-body', parent).empty()
					.append(
						$(self.getTemplate({
							name: 'user-row',
							data: {},
							submodule: 'callcenter'
						}))
					);
			}
		},

		queueSave: function(form_data, data, success, error) {
			var self = this,
				normalized_data = self.normalizeData($.extend(true, {}, data.data, form_data));

			if (typeof data.data === 'object' && data.data.id) {
				var queueId = data.data.id;
				self.queueUpdate(queueId, normalized_data, function(queueData) {
					self.agentsSave(queueId, data.field_data.user_list.new_list, function(agentsData) {
						queueData.agents = agentsData.agents;
						if (typeof (success) === 'function') {
							success(queueData);
						}
					});
				});
			} else {
				self.queueCreate(normalized_data, function(queueData) {
					self.agentsSave(queueData.id, data.field_data.user_list.new_list, function(agentsData) {
						queueData.agents = agentsData.agents;
						if (typeof (success) === 'function') {
							success(queueData);
						}
					});
				});
			}
		},

		queueUpdate: function(queueId, data, success, error){
			var self = this;

			monster.request({
				resource: 'callcenter.queues.update',
				data: {
					accountId: self.accountId,
					queuesId: queueId,
					generateError: false,
					data: data
				},
				success: function(data) {
					if (typeof (success) === 'function' && data.data) {
						success(data.data);
					}
				},
				error: function(data) {
					if (typeof (error) === 'function') {
						error(data);
					}
				}
			});
		},

		queueCreate: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'callcenter.queues.create',
				data: {
					accountId: self.accountId,
					generateError: false,
					data: data
				},
				success: function(_data) {
					if (typeof (success) === 'function') {
						success(_data.data);
					}
				},
				error: function(_data) {
					if (typeof (error) === 'function') {
						error(_data);
					}
				}
			});
		},

		normalizeData: function(form_data) {
			delete form_data.user_id;

			// remove blank fields and let Kazoo set the defaults
			$.each(form_data, function(key, value){
				if (value === "" || value === null){
					delete form_data[key];
				}
			});

			console.log(form_data)

			return form_data;
		},

		queueBindEvents: function (args) {
			var self = this,
				data = args.data,
				callbacks = args.callbacks,
				queue_html = args.template;


			console.log($('.inline_action_media', queue_html));
			$('.inline_action_media', queue_html).click(function (ev) {
				var _data = ($(this).data('action') === 'edit') ? {id: $('#announce', queue_html).val()} : {},
					_id = _data.id;

				ev.preventDefault();

				monster.pub('callflows.media.editPopup', {
					data: _data,
					callback: function (media) {
						/* Create */
						if (!_id) {
							$('#announce', queue_html).append('<option id="' + media.id + '" value="' + media.id + '">' + media.name + '</option>');
							$('#announce', queue_html).val(media.id);

							$('#edit_link_media', queue_html).show();
						} else {
							/* Update */
							if (media.hasOwnProperty('id')) {
								$('#announce #' + media.id, queue_html).text(media.name);
								/* Delete */
							} else {
								$('#announce #' + _id, queue_html).remove();
								$('#edit_link_media', queue_html).hide();
							}
						}
					}
				});
			});

		}
	};

	return app;
});
