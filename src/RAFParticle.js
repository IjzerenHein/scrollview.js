import Particle from './Particle';
import {requestAnimationFrame, cancelAnimationFrame} from './util';

export default class RAFParticle extends Particle {
	onUpdateRequested(cancel) {
		this._updateFn = this._updateFn || this.update.bind(this);
		this._animationFrame = cancel ? cancelAnimationFrame(this._animationFrame) : requestAnimationFrame(this._updateFn);
	}
}
