define(['jquery','cascade','eventemitter2','underscore','_.mixins','anima','fsm'],
function(   $   , Cascade , Eventemitter2 , undef      , undef    , Anima , FSM ) {

	// internal
	var composer = {


		_toScene: function(scenename) {
			var _this = this,
				scene = _this.composer('scene', scenename),
				promise;
			
			if (typeof scene === 'function') {
				// if scene is a function, just run it.
				promise = scene.call(this, this);

			} else if (typeof scene === 'object') {
				// if it is an object
				var anima_promises = _.map(scene)

			}

			var promise = typeof scene === 'function' ? scene.call(this, this) : $.when(this.$el.animate(scene, aoptions));

			// set state as stopped when this animation ends
			promise.then(function() { _this.fsm('set','stopped:' + statename); });

			// set the state as on-transition just before the animation starts
			this.fsm('set','on-transition:'+statename);

			return promise;
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
					evaluate: function(scene) {
						var res;

						if (typeof scene === 'object') {
							// if the scene is an object
							// for each property of the scene, evaluate its value.
							// and copy the result to a new res object
							res = {};

							for (prop in scene) {
								if (typeof scene[ prop ] === 'function') {
									res[ prop ] = scene[ prop ].call(this.$el, this);
								} else {
									res[ prop ] = scene[ prop ];
								}
							}

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
						_.each(this._aels, function(ael, id) {
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
			// sequence may either be an array or a single state string
			// the objective is the LAST state of the sequence.
			var sequence = typeof sequence === 'string' ? [sequence] : sequence,
				objective = _.last(sequence);

			if ( !this.isNewObjective(objective) && !insist ) {

				// return the promise object
				return this.promise;

			} else {
				// set the flow queue as the sequence
				this.flowq = sequence;

				var _this = this,
					// build up a cascade object
					cascade = Cascade.build();

				// stop all aniations on the $el
				this.$el.stop();

				// add tasks to cascade
				_.each(sequence, function(statename, index) {
					cascade.add(function(defer, common) {
						return _this.anima('_toState', statename);
					});
				});

				// run the cascade and return the promise
				return this.promise = cascade.run();
			}
		}
	};

	var Composer = Object.create(FSM);
	Composer.extend({
		init: function(options) {
			_.interface(options, {
				id: 'Composer initialization',
				typeofs: {
					$els: ['object','undefined'],
					initial: ['function','undefined']
				}
			})

			_.bindAll(this, 'composer');

			// save the states
			this.composer('state', options.states);

			// save the scenes
			this.composer('scene', options.scenes);

			// build the anima elements
			_.each(options.$els, function(el, index) {
				var $el = $(el);
				_this.create({
					$el: $el,
					initial: options.initial($el),
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
			ael.anima('state', _.clone(this.composer('state')) );
			this.composer('ael', ael.id, ael);

			return this;
		},

		states: {
			'on-transition': {
				isNewObjective: function(currObjective, objective) {
					// as the currObjective only refers to 
					// the current transition, not to the queue,
					// compare the objective to the last item on the 
					// flow queue
					return _.last(this.flowq) !== objective;
				},
			},

			'stoppped': {

			}
		}
	});


	return Composer;
});