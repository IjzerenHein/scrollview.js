import ScrollView from './ScrollView';
import {requestAnimationFrame, cancelAnimationFrame} from './util';

export default class RAFScrollView extends ScrollView {
	onRequestUpdate(cancel) {
		this._updateFn = this._updateFn || this.update.bind(this);
		this._animationFrame = cancel ? cancelAnimationFrame(this._animationFrame) : requestAnimationFrame(this._updateFn);
	}
}
