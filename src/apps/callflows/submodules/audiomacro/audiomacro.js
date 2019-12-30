define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		Handlebars = require('handlebars'),
		monster = require('monster');

	var macrosAllList = [
		{
			name: 'Play',
			value: 'play'
		}, {
			name: 'TTS',
			value: 'tts'
		}, {
			name: 'Prompt',
			value: 'prompt'
		}, {
			name: 'Say',
			value: 'say'
		}
	];

	var languages = [
		'en-us',
		'en-ca',
		'en-au',
		'en-gb',
		'es-us',
		'us-us',
		'zh-cn',
		'zh-hk',
		'zh-tw',
		'ja-jp',
		'ko-kr',
		'da-dk',
		'de-de',
		'ca-es',
		'es-es',
		'fi-fi',
		'fr-ca',
		'fr-fr',
		'it-it',
		'nb-no',
		'nl-nl',
		'pl-pl',
		'pt-br',
		'pt-pt',
		'ru-ru',
		'sv-se',
		'hu-hu',
		'cs-cz',
		'tr-tr',
	];

	var voices = [
		'female',
		'male'
	];

	var app = {
		requests: {
			'callflows.audio_macro.media.prompts': {
				'verb': 'GET',
				'url': 'accounts/{accountId}/media/prompts'
			},
		},

		subscribe: {
			'callflows.fetchActions': 'audiomacroDefineActions'
		},

		audiomacroDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions;

			self.audiomacroInitHandlebarsHelpers();

			$.extend(callflow_nodes, {
				'audio_macro[]': {
					name: 'Audio macro',
					icon: 'link',
					category: 'Advanced',
					module: 'audio_macro',
					tip: 'Tooltip for this',
					data: {
						macros: [],
						terminators: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
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
						var macros = node.getMetadata('macros');
						return self.audiomacroGetCaptionText(macros);
					},
					edit: function(node, callback) {
						self.audiomacroEditAudioMacro(node, callback);
					}
				}
			});
		},

		audiomacroGetCaptionText: function (macros) {
			var self = this;
			var captionText = '',
				accordionTitles = self.i18n.active().callflows.audio_macro.accordion_titles,
				macroName = '',
				macroI18nName = '';
			for(var i = 0, len = macros.length; i < len; i++) {
				macroName = macros[i].macro;
				macroI18nName = accordionTitles.hasOwnProperty(macroName) ?
					accordionTitles[macroName] :
					macroName;
				if(i === 0) {
					captionText += macroI18nName
				} else {
					captionText += ', ' + macroI18nName
				}
			}
			return captionText;
		},

		audiomacroInitHandlebarsHelpers: function () {
			Handlebars.registerHelper('join', function(array, separator) {
				return Array.isArray(array) ? array.join(separator) : '';
			});

			Handlebars.registerHelper('safeVal', function (value, safeValue) {
				var out = value || safeValue;
				return new Handlebars.SafeString(out);
			});
		},

		audiomacroGetData: function (callback) {
			var self = this;
			var requestsList = {
				media: function (callback) {
					self.audiomacroGetMediaList(function (media) {
						callback(null, media);
					})
				},
				prompts: function (callback) {
					self.audiomacroGetPrompts(function (prompts) {
						callback(null, prompts);
					})
				}
			};
			monster.parallel(requestsList, function(error, results) {
				callback && callback(results);
			});
		},

		audiomacroGetPrompts: function (callback) {
			var self = this;
			monster.request({
				resource: 'callflows.audio_macro.media.prompts',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: false
					}
				},
				success: function(response) {
					var prompts = response.data;
					if(prompts.length > 0) {
						prompts = prompts[0];
					}

					callback && callback(prompts);
				},
				error: function(response) {
					console.log('Error while getting prompts');
					console.log(response)
				}
			});
		},

		audiomacroGetMediaList: function(callback) {
			var self = this;

			self.callApi({
				resource: 'media.list',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: false
					}
				},
				success: function(data) {
					var mediaList = _.sortBy(data.data, function(item) { return item.name.toLowerCase(); });

					mediaList.unshift(
						{
							id: 'silence_stream://300000',
							name: self.i18n.active().callflows.media.silence
						},
						{
							id: 'shoutcast',
							name: self.i18n.active().callflows.media.shoutcastURL
						}
					);

					callback && callback(mediaList);
				}
			});
		},

		audiomacroEditAudioMacro (node, callback) {
			var self = this;

			self.audiomacroGetData(function(data) {
				var $popup,
					$dialog,
					macros = node.getMetadata('macros'),
					commonTerminators = node.getMetadata('terminators');

				// TODO: Remove this test data in the future
				/* {
					"macros": [
						{
							"macro": "play",
							"id": "27502f3d5b5240a976748a2e49faf54f",
							"endless_playback": true,
							"answer": true, // Whether to answer an unanswered call
							"loop_count": 2, // How many times to loop the media
							"terminators": ["1", "2", "3"]
						},
						{
							"macro": "tts",
							"endless_playback": true,
							"engine": "ispeech", // 'google', 'flite', 'voicefabric'
							"language": "en-us",
							"terminators": ["1", "2", "3"],
							"text": "this can be said",
							"voice": "female"
						},
						{
							"macro": "prompt",
							"id": "agent-resume",
							"language": "en-us",
							"terminators": ["1", "2", "3"]
						},
						{
							"macro": "say",
							"gender": "masculine", // "feminine", "neuter"
							"language": "en-us",
							"method": "pronounced", // 'none', 'iterated', 'counted'
							"terminators": ["1", "2", "3"],
							"text": "123",
							"type": "number" // 'items', 'persons', 'messages'
						}
					],
					"terminators": ["1","2","3","4","5","6","7","8","9","*","0","#"]
				}; */

				var accordionItems = [];

				for(var i = 0, len = macros.length; i < len; i++) {
					accordionItems.push({
						title: self.audiomacroGetMacroI18nName(macros[i].macro),
						content: self.getTemplate({
							name: 'form',
							data: {
								macro: macros[i],
								macrosAllList: macrosAllList,
								media: data.media,
								languages: languages,
								voices: voices,
								prompts: data.prompts,
								randomInt: monster.util.randomString(7)
							},
							submodule: 'audiomacro'
						})
					})
				}

				var accordion_html = self.getTemplate({
					name: 'accordion',
					data: {
						items: accordionItems,
						terminators: commonTerminators.join('')
					},
					submodule: 'audiomacro'
				});

				$dialog = $(self.getTemplate({
					name: 'dialog',
					data: {
						content: accordion_html
					},
					submodule: 'audiomacro'
				}));

				$popup = monster.ui.dialog($dialog, {
					title: self.i18n.active().callflows.audio_macro.dialog_title,
					minHeight: '0',
					width: 500,
					beforeClose: function() {
						if (typeof callback === 'function') {
							callback();
						}
					}
				});

				self.audiomacroInitFormBehavior($dialog);
				self.audiomacroInitDialogBehavior({
					node: node,
					callback: callback,
					$dialog: $dialog,
					$popup: $popup,
					macrosAllList: macrosAllList,
					media: data.media,
					languages: languages,
					voices: voices,
					prompts: data.prompts
				});
				self.audiomacroInitAccordionBehavior();
			});
		},

		audiomacroInitFormBehavior: function ($container) {
			var self = this;
			$container.find('.js-macro').change(function() {
				var $form = $(this).closest('form'),
					macroI18nName = self.audiomacroGetMacroI18nName(this.value);
				$form.find('.form-part').addClass('form-part_hidden');
				$form.find('.form-part.form-part_' + this.value).removeClass('form-part_hidden');
				$(this).closest('.js-accordion-group').find('.js-accordion-group-title').text(macroI18nName);
			});
		},

		audiomacroGetMacroI18nName: function (macroKeyName) {
			var self = this,
				accordionTitles = self.i18n.active().callflows.audio_macro.accordion_titles;

			return accordionTitles.hasOwnProperty(macroKeyName) ?
					accordionTitles[macroKeyName] :
					macroKeyName;
		},

		audiomacroInitDialogBehavior: function (data) {
			var self = this,
				$dialog = data.$dialog,
				$popup = data.$popup,
				node = data.node,
				callback = data.callback;

			$dialog.find('.js-add-item').on('click', function (e) {
				e.preventDefault();
				self.audiomacroAddAccordionItem({
					macrosAllList: data.macrosAllList,
					media: data.media,
					languages: data.languages,
					voices: data.voices,
					prompts: data.prompts,
					randomInt: monster.util.randomString(7)
				});
			});

			self.audiomacroInitAccordionRemoveItemBehavior($dialog);

			$dialog.find('.js-save').click(function() {
				self.audiomacroSaveAudioMacro(node, callback);
				$popup.dialog('close');
			});

			monster.ui.tooltips($dialog);
		},

		audiomacroInitAccordionRemoveItemBehavior: function($dialog) {
			var self = this;
			$dialog.find('.js-remove-item').on('click', function(e){
				e.stopPropagation();
				e.preventDefault();
				var confirmMessage = self.i18n.active().callflows.audio_macro.are_you_sure_you_want_to_delete;
				if(confirm(confirmMessage)) {
					$(this).closest('.js-accordion-group').remove();
					$('.js-accordion').accordion('refresh');
				}
			});
		},

		audiomacroInitAccordionBehavior: function () {
			$('.js-accordion')
				.accordion({
					header: '> div > h3',
					collapsible: true,
					heightStyle: 'content',
					active: false
				})
				.sortable({
					axis: 'y',
					handle: 'h3',
					stop: function( event, ui ) {
						// IE doesn't register the blur when sorting
						// so trigger focusout handlers to remove .ui-state-focus
						ui.item.children('h3').triggerHandler('focusout');
						$(this).accordion('refresh');
					}
				});
		},

		audiomacroAddAccordionItem: function (data) {
			data.macro = { // default macro for display
				'macro': 'play'
			};

			var self = this,
				formHtml = self.getTemplate({
				name: 'form',
				data: data,
				submodule: 'audiomacro'
			}),
				accordionTitles = self.i18n.active().callflows.audio_macro.accordion_titles,
				macroName = data.macro.macro,
				macroI18nName = accordionTitles.hasOwnProperty(macroName) ?
					accordionTitles[macroName] :
					macroName;
			var $accordionItem = $(self.getTemplate({
				name: 'accordion_item',
				data: {
					title: macroI18nName,
					content: formHtml
				},
				submodule: 'audiomacro'
			}));

			self.audiomacroInitFormBehavior($accordionItem);
			self.audiomacroInitAccordionRemoveItemBehavior($accordionItem);

			$('.js-accordion').append($accordionItem).accordion('refresh');
		},

		audiomacroSaveAudioMacro: function (node, callback) {
			var self = this,
				resultMacros = [];

			$('.js-accordion-group').each(function (i, el) {
				var itemData = {};
				itemData.macro = $(el).find('select[name="macro"]').val();
				var $macroContainer = $(el).find('.form-part_' + itemData.macro);
				var macroFormData = monster.ui.getFormData($macroContainer[0]);
				_.extend(itemData, macroFormData);

				if(itemData.terminators) {
					itemData.terminators = itemData.terminators.split('');
				}

				if (itemData.macro === 'play' && itemData.loop_count) {
					itemData.loop_count = parseInt(itemData.loop_count);
				}

				resultMacros.push(itemData);
			});
			var commonTerminators = $('#common-terminators').val().split('');

			node.setMetadata('macros', resultMacros); // self.audiomacroPrepareDataForSave(resultMacros)
			node.setMetadata('terminators', commonTerminators);
			node.caption = self.audiomacroGetCaptionText(resultMacros);
		}
	};

	return app;
});
