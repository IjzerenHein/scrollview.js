function withDefault(value, defaultValue) {
	return (value === undefined) ? defaultValue : value;
}

const _requestAnimationFrame = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function(callback) {
	return setTimeout(callback, 16);
};
const _cancelAnimationFrame = (typeof cancelAnimationFrame === 'function') ? cancelAnimationFrame : function(requestID) {
	return clearTimeout(requestID);
};

export {
	_requestAnimationFrame as requestAnimationFrame,
	_cancelAnimationFrame as cancelAnimationFrame,
	withDefault
}

export default {
	requestAnimationFrame: _requestAnimationFrame,
	cancelAnimationFrame: _cancelAnimationFrame,
	withDefault
}