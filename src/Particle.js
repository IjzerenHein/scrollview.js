import {withDefault} from './util';

export default class Particle {
	constructor(config = {}) {
		this._enabled = withDefault(config.enabled, true);
		//this._overshootClamping = withDefault(config.overshootClamping, false);
		this._displacementThreshold = withDefault(config.displacementThreshold, 0.001);
		this._velocityThreshold = withDefault(config.velocityThreshold, 0.001);
		this._tension = withDefault(config.tension, 230);
		this._friction = withDefault(config.friction, 22);

		this._endValue = withDefault(config.endValue, 0);
		this._value = withDefault(config.value, 0);
		this._lastValue = this._value;
		this._lastVelocity = withDefault(config.velocity, 0);
		this._lastTime = withDefault(config.time, Date.now());

		if ((this._endValue !== this._value) || this._lastVelocity) {
			this.requestUpdate();
		}
	}

	get displacementThreshold() {
		return this._displacementThreshold;
	}

	set displacementThreshold(value) {
		this._displacementThreshold = value;
	}

	get velocityThreshold() {
		return this._velocityThreshold;
	}

	set velocityThreshold(value) {
		this._velocityThreshold = value;
	}

	get friction() {
		return this._friction;
	}

	set friction(value) {
		this._friction = value;
	}

	get tension() {
		return this._tension;
	}

	set tension(value) {
		this._tension = value;
	}

	get enabled() {
		return this._enabled;
	}

	set enabled(value) {
		if (this._enabled !== value) {
			this._enabled = value;
			this.requestUpdate(!this._enabled)
		}
	}

	set(endValue, value, velocity, timeStamp) {
		this._endValue = (endValue === undefined) ? this._endValue : endValue;
		this._value = (value === undefined) ? this._value : value;
		this._lastValue = (value === undefined) ? this._lastValue : value;
		this._lastVelocity = (velocity === undefined) ? this._lastVelocity : velocity;
		this._lastTime = timeStamp || Date.now();
		this.requestUpdate();
	}

	get endValue() {
		return this._endValue;
	}

	get value() {
		return this._value;
	}

	get velocity() {
		return this._lastVelocity;
	}

	onUpdate(/*value*/) {
		// override to implement
	}

	onSettle(/*value*/) {
		// override to implement
	}

	onRequestUpdate(/*cancel*/) {
		// override to implement
	}

	requestUpdate(cancel) {
		if (cancel && this._updateRequested) {
			this._updateRequested = false;
			this.onRequestUpdate(true);
		}
		else if (this._enabled && !this._updateRequested) {
			this._updateRequested = true;
			this.onRequestUpdate();
		}
	}

	get updateRequested() {
		return this._updateRequested;
	}

	_updateValue(value) {
		if (this._value !== value) {
			this._value = value;
			this.onUpdate(value);
		}
	}

	update(timeStamp = Date.now()) {
		this._updateRequested = false;

		let position = this._lastValue;
		let velocity = this._lastVelocity;

		let tempValue = this._lastValue;
		let tempVelocity = this._lastVelocity;

		// If for some reason we lost a lot of frames (e.g. process large payload or
		// stopped in the debugger), we only advance by 4 frames worth of
		// computation and will continue on the next frame. It's better to have it
		// running at faster speed than jumping to the end.
		const MAX_STEPS = 64;
		let now = timeStamp;
		if (now > this._lastTime + MAX_STEPS) {
			now = this._lastTime + MAX_STEPS;
		}

		// We are using a fixed time step and a maximum number of iterations.
		// The following post provides a lot of thoughts into how to build this
		// loop: http://gafferongames.com/game-physics/fix-your-timestep/
		const TIMESTEP_MSEC = 1;
		const numSteps = Math.floor((now - this._lastTime) / TIMESTEP_MSEC);
		for (let i = 0; i < numSteps; ++i) {
			// Velocity is based on seconds instead of milliseconds
			const step = TIMESTEP_MSEC / 1000;

			// This is using RK4. A good blog post to understand how it works:
			// http://gafferongames.com/game-physics/integration-basics/
			const aVelocity = velocity;
			const aAcceleration = this._tension * (this._endValue - tempValue) - this._friction * tempVelocity;
			tempValue = position + aVelocity * step / 2;
			tempVelocity = velocity + aAcceleration * step / 2;

			const bVelocity = tempVelocity;
			const bAcceleration = this._tension * (this._endValue - tempValue) - this._friction * tempVelocity;
			tempValue = position + bVelocity * step / 2;
			tempVelocity = velocity + bAcceleration * step / 2;

			const cVelocity = tempVelocity;
			const cAcceleration = this._tension * (this._endValue - tempValue) - this._friction * tempVelocity;
			tempValue = position + cVelocity * step / 2;
			tempVelocity = velocity + cAcceleration * step / 2;

			const dVelocity = tempVelocity;
			const dAcceleration = this._tension * (this._endValue - tempValue) - this._friction * tempVelocity;
			tempValue = position + cVelocity * step / 2;
			tempVelocity = velocity + cAcceleration * step / 2;

			const dxdt = (aVelocity + 2 * (bVelocity + cVelocity) + dVelocity) / 6;
			const dvdt = (aAcceleration + 2 * (bAcceleration + cAcceleration) + dAcceleration) / 6;

			position += dxdt * step;
			velocity += dvdt * step;
		}

		this._lastTime = now;
		this._lastValue = position;
		this._lastVelocity = velocity;

		//this.onUpdate(position);
		//if (!this.__active) { // a listener might have stopped us in _onUpdate
		//  	return;
		//}

		// Conditions for stopping the spring animation
		const isOvershooting = false;
		/*if (this._overshootClamping && this._tension !== 0) {
		  if (this._startPosition < this._endValue) {
		    isOvershooting = position > this._endValue;
		  } else {
		    isOvershooting = position < this._endValue;
		  }
		}*/
		const isVelocity = Math.abs(velocity) <= this._velocityThreshold;
		const isDisplacement = (this._tension !== 0) ? (Math.abs(this._endValue - position) <= this._displacementThreshold) : true;
		if (isOvershooting || (isVelocity && isDisplacement)) {
			if (this._tension !== 0) {
				// Ensure that we end up with a round value
				this._updateValue(this._endValue);
			}
			else {
				this._updateValue(this._lastValue);	
			}
			this.onSettle(this._value);
			//this.__debouncedOnEnd({finished: true});
			return;
		}
		this._updateValue(this._lastValue);	

		this.requestUpdate();
	}
}
