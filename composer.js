define(['jquery','cascade','eventemitter2','underscore','_.mixins','anima','fsm'],
function(   $   , Cascade , Eventemitter2 , undef      , undef    , Anima , FSM ) {

	// internal
	var composer = {

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

						// if no scene is found, check if there is a state defined for that.


						return scene;
					}
				}
			});
		},

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
					evaluate: function(state) {
						return state;
					},
				}
			})
		},

		ael: function(id, ael) {
			return _.getset({
				context: this,
				obj: '_aels',
				name: id,
				value: ael,
				options: {
					iterate: function(id, ael) {
						// for each added ael, add all the states available on 
						// the composer object
						ael.anima('state', this._states);

						return ael;
					},
				}
			})
		}
	};

	var Composer = Object.create(FSM);
	Composer.extend({
		init: function(data) {
			_.bindAll(this, 'composer');
		},

		composer: function(method) {
			var args = _.args(arguments, 1);
			return composer.apply(this, args);
		},

		add: function() {

		},

		states: {
			'on-transition': {

			},

			'stoppped': {

			}
		}
	});


	return Composer;
});