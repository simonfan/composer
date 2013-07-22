define(['composer','anima'], function(Composer, Anima) {
	console.log('Component module demo running');




	window.composer = Composer.build({

		$els: $('#transition-list').children(),

		initial: function($el) {
			return $el.attr('data-initial') || $el.prop('id');
		}
	});
/*
	<ul id="transition-list" class="transition-list">
		<li id="first" data-inistate="fadeOut" data-hide-opacity="0.05">
			1 this one has hide-opacity = 0.05
			<div></div>
		</li>
		<li id="second" data-inistate="fadeIn">
			2
			<div></div>
		</li>
		<li id="third" data-inistate="not-existent-state">
			3
			<div></div>
		</li>
		<li id="fourth" >
			4
			<div></div>
		</li>
	</ul>



*/


});