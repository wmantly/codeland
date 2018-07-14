// please change this...
// spa.Router.add({ // git-readme page
// 	uri: '.+',
// 	shell: spa.shells.codeland,
// 	init: spa.utils.emptyFunc
// });

spa.Router.add({
	uri: '.+',
	shell: spa.shells.gotty,
	init: spa.utils.emptyFunc,
});
