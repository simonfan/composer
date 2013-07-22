define(['jquery','underscore','_.mixins','anima','taskrunner'],
function(   $   , undef      , undef    , Anima , TaskRunner ) {

	// internal
	var composer = {


		_toScene: function(scenename) {
			var _this = this,
				scene = _this.composer('scene', scenename),
				promise;

			//////////////////////////////////////////////////////
			///// 1: do stuff before running the transition //////
			//////////////////////////////////////////////////////



			/////////////////////////////////////
			///// 2: transitate to scene ////////
			/////////////////////////////////////
			if (typeof scene === 'function') {
				// if scene is a function, just run it.
				promise = scene.call(null, this);

			} else if (typeof scene === 'object') {

				console.log(scene)

				// if it is an object, 
				// assume that the object is a hash of statenames or statesequences
				// keyed by ael id;
				var anima_promises = _.map(scene, function(state, aelname) {
					// get the anima object
					var ael = _this.composer('ael', aelname);

					// animate the object
					return ael.anima('flow', state);
				});

				promise = $.when.apply(null, anima_promises);
			}


			/////////////////////////////
			///// 3: do stuff after /////
			/////////////////////////////

			// set state as stopped when this animation ends
			promise.then(function() {

			});

			/////////////////////////////
			///// 4: return promise /////
			/////////////////////////////
			return promise;
		},

		// builds up a scene object based on syntax
		/*
			stateName:targets
			stateName
		*/
		_parseScene: function(scenename) {
			var _this = this,
				// split the scenename
				split = scenename.split(':', 2),

				// the scene object
				scene = {};

			if (split.length === 2 && split[1]) {
				// in case the split is successful,
				// check if the state is defined

				var statename = split[0],
					targets = split[1].split('|');

				// if there is a defaultScene defined, clone it.
				if (typeof defaultScene !== 'undefined') {
					scene = _.clone(_this.defaultScene)
				}


				// loop through each of the targets
				_.each(targets, function(targetId, index) {
					scene[ targetId ] = statename;
				});

			} else if ( this.composer('state', scenename) ) {
				// in case the split is not successful,
				// check if the scenename is actually a statename
				// if so, create a scene that sets all aels to that state.
				var statename = scenename;
				scene = _.mapo(_this.composer('ael'), function(ael, aelname) {
					return statename;
				});
			}

			return scene;
		},

		/////////////////
		////// API //////
		/////////////////
		scene: function(name, scene) {
			return _.getset({
				context: this,
				obj: '_scenes',
				name: name,
				value: scene,
				options: {
					iterate: function(scenename, scene) {
						/*
							When a scene is defined, the task that will execute the 
							scene should be also defined
						*/
						/////////////////////////
						/// 1: save the task ////
						/////////////////////////
						var _this = this;
						this.taskrunner('task', scenename, function() {
							return _this.composer('_toScene', scenename);
						});

						return scene;
					},

					evaluate: function(scenename, scene) {
						var res;

						if (typeof scene === 'object') {
							// if the scene is an object
							// for each property of the scene, evaluate its value.
							// and copy the result to a new res object
							res = _.mapo(scene, function(state, aelname) {
								return (typeof state === 'function') ? state.call(this.$el, this) : state;
							});

						} else {
							// if type of scene is not an object, just pass it on.
							res = scene;
						}

						return res;
					}
				}
			});
		},

		// define a common state object and 
		// define it in each anima elements controlled by this composer
		state: function(name, state) {
			return _.getset({
				context: this,
				obj: '_states',
				name: name,
				value: state,
				options: {
					iterate: function(name, state) {
						// define the state on each of the composition elements
						_.each(this.composer('ael'), function(ael, id) {
							ael.anima('state', name, state);
						});

						return state;
					},
				}
			})
		},

		// ael is the anima object
		ael: function(id, ael) {
			return _.getset({
				context: this,
				obj: '_aels',
				name: id,
				value: ael,
			});
		},

		// flow!
		flow: function(sequence, insist) {

			var _this = this;

			sequence = typeof sequence === 'string' ? [sequence] : sequence;

			// check if each of the flow scenes exist
			// and define those that do not exist yet
			_.each(sequence, function(scenename, order) {
				var scene = _this.composer('scene', scenename);

				if (!scene) {
					scene = _this.composer('_parseScene', scenename);
					_this.composer('scene', scenename, scene);
				}
			});

			// taskrunner run method receives: tasknames, insist, common object to be passed to each task.
			return this.taskrunner('run', sequence, insist, {});
		}
	};

	var Composer = Object.create(TaskRunner);
	Composer.extend({
		init: function(options) {
			_.interface(options, {
				id: 'Composer initialization',
				typeofs: {
					$els: ['object','undefined'],
					initial: ['function','undefined']
				}
			});


			var _this = this;

			_.bindAll(this, 'composer');

			// save the states
			this.composer('state', options.states);

			// save the scenes
			this.composer('scene', options.scenes);

			// the default scene
			this.defaultScene = typeof options.defaultScene === 'string' ? this.composer('scene', options.defaultScene) : options.defaultScene;

			// build the anima elements
			_.each(options.$els, function(el, index) {
				var $el = $(el);
				_this.create({
					$el: $el
				});
			});
		},

		composer: function(method) {
			var args = _.args(arguments, 1);
			return composer[ method ].apply(this, args);
		},

		create: function(options) {
			/*
				options: {
					id: 'string' or undefined (defaults to $el.prop('id'))
					$el: jquery object,
					initial: 'string' or function() {}

					// optional: states
					states: object
				}
			*/

			// set the states object
			options.states = _.extend({}, this.composer('state'), options.states);

			var ael = Anima.build(options);

			this.composer('ael', ael.id, ael);

			return this;
		},


		add: function(ael) {
			var commonStates = this.composer('state');
			
			ael.anima('state', _.clone(commonStates) );
			this.composer('ael', ael.id, ael);

			return this;
		},


		flow: composer.flow,

		/////////////////////////////////////////////////
		////// OVERWRITE taskrunner condition method ////
		/////////////////////////////////////////////////
		// RECEIVES: queue, tasks
		condition: function(currentQueue, tasks) {
			if (_.isArray(currentQueue)) {
				// if currentQueue is an array of task names
				// check if destinations match

				return _.last(currentQueue) !== _.last(tasks);

			} else if (!currentQueue) {
				// currentQueue not set
				return true;
			}
		},
	});


	return Composer;
});