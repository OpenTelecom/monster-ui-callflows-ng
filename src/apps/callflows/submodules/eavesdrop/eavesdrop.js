define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'eavesdropDefineActions'
		},

		eavesdropDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions;

			$.extend(callflow_nodes, {
				'eavesdrop[]': {
					name: self.i18n.active().callflows.eavesdrop.name,
					icon: 'headphones',
					category: self.i18n.active().oldCallflows.advanced_cat,
					module: 'eavesdrop',
					tip: self.i18n.active().callflows.eavesdrop.tip,
					data: {},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 48,
					caption: function(node) {
						return '';
					},
					edit: function(node, callback) {
						self.eavesdropGetEndpoints(function(formattedData) {
							var popup, popup_html;

							popup_html = $(self.getTemplate({
								name: 'eavesdrop',
								data: {
									fieldData: formattedData,
									data: {
										'selectedId': node.getMetadata('device_id') || node.getMetadata('user_id') || '',
										'approvedId': node.getMetadata('approved_device_id') || node.getMetadata('approved_user_id') || node.getMetadata('approved_group_id') || ''
									}
								},
								submodule: 'groups'
							}));

							monster.ui.tooltips(popup_html);

							$('#add', popup_html).click(function() {
								var setData = function(field, value) {
									if (value === 'endpoint_empty') {
										node.deleteMetadata('user_id');
										node.deleteMetadata('device_id');
									} else if (value === 'approved_empty') {
										node.deleteMetadata('approved_user_id');
										node.deleteMetadata('approved_group_id');
										node.deleteMetadata('approved_device_id');
									} else {
										node.setMetadata(field, value);
									}
								};

								var endpointField = $('#endpoint_selector option:selected').data('type') + '_id',
									endpointVal = $('#endpoint_selector option:selected').val(),
									approvedEndpointField = 'approved_' + $('#approved_endpoint_selector option:selected').data('type') + '_id',
									approvedEndpointVal = $('#approved_endpoint_selector option:selected').val();

								setData(endpointField, endpointVal);
								setData(approvedEndpointField, approvedEndpointVal);

								popup.dialog('close');
							});

							popup = monster.ui.dialog(popup_html, {
								title: self.i18n.active().callflows.eavesdrop.title,
								beforeClose: function() {
									if (typeof callback === 'function') {
										callback();
									}
								}
							});
						});
					}
				}
			});
		},

		eavesdropGetEndpoints: function(callback) {
			var self = this;

			monster.parallel({
				'group': function(callback) {
					self.groupsGroupList(function(data) {
						callback(null, data);
					});
				},
				'user': function(callback) {
					self.groupsRequestUserList({
						success: function(data) {
							callback(null, data);
						}
					});
				},
				'device': function(callback) {
					self.groupsRequestDeviceList({
						success: function(data) {
							callback(null, data);
						}
					});
				}
			}, function(err, results) {
				var data = self.eavesdropFormatEndpoints(results);

				callback(data);
			});
		},

		eavesdropFormatEndpoints: function(data) {
			_.each(data.user, function(user) {
				user.name = user.first_name + ' ' + user.last_name;
			});

			return data;
		}
	};

	return app;
});
