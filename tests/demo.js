define(['composer','anima'], function(Composer, Anima) {
	console.log('Component module demo running');




	window.composer = Composer.build({

		$els: $('.g1'),

		states: {
			fadeIn: {
				opacity: 1,
				
				__options: {
					duration: 3000,
					__before: {
						display: 'block',
						zIndex: 1,
					}
				}
			},

			fadeHalf: {
				opacity: 0.2,

				__options: {
					duration: 1000,

					__before: {
						display: 'block',
						zIndex: 1,
					}
				}
			},

			halt: function() {
				var defer = $.Deferred();

				$('#first').html('halted');

				setTimeout(function() {
					$('#first').html('halt end!');
					defer.resolve();
				}, 5000)

				return defer;
			},

			fadeOut: {
				opacity: 0,
				zIndex: 0,

				__options: {
					duration: 3000,
					__after: function($el) {
						$el.css('display', 'none');
					}
				}
			},
		},

		scenes: {
			/*
			'fadeIn:first': {
				first: 'fadeIn',
				second: 'fadeHalf',
				third: 'fadeOut',
				fourth: 'fadeHalf'
			},
			'fadeIn:second': {
				first: 'fadeOut',
				second: 'fadeIn',
				third: 'fadeHalf',
				fourth: 'fadeHalf'

			}
			*/

			test: {
				fourth: 'fadeIn',
			}
		}
	});



	composer.create({
		$el: $('#fifth'),
		states: {
			fadeOut: {
				opacity: 0.3,
				__options: {
					__before: {
						display: 'block',
					}
				}
			},
		}
	})


	composer
		.flow(['test','fadeIn:first','fadeIn:second','fadeOut','fadeIn:third|fourth|fifth'])
		.then(function() {
			composer.flow('fadeOut');
		});



});