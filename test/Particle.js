/*global describe, it*/
var assert = (typeof window === 'undefined') ? require('assert') : window.chai.assert;
var ScrollView = (typeof window === 'undefined') ? require('../dist/scrollview') : window.ScrollView;
var Particle = ScrollView.Particle;
var RAFParticle = ScrollView.RAFParticle;

describe('Particle', function() {
    describe('Construct (no arguments)', function() {
		var p = new Particle();
		it('value should be 0', function() {
            assert.equal(p.value, 0);
        });
        it('endValue should be 0', function() {
            assert.equal(p.endValue, 0);
        });
        it('enabled should be true', function() {
            assert.equal(p.enabled, true);
        });
        it('velocity should be 0', function() {
            assert.equal(p.velocity, 0);
        });
        it('tension should be 230', function() {
            assert.equal(p.tension, 230);
        });
        it('friction should be 22', function() {
            assert.equal(p.friction, 22);
        });
        it('velocityThreshold should be 0.001', function() {
            assert.equal(p.velocityThreshold, 0.001);
        });
        it('displacementThreshold should be 0.001', function() {
            assert.equal(p.displacementThreshold, 0.001);
        });
    });

    describe('Construct with arguments', function() {
		var p = new Particle({
			value: 100,
			endValue: 200,
			velocity: 20,
			velocityThreshold: 0.002,
			displacementThreshold: 0.003,
			tension: 240,
			friction: 21
		});
		it('value should be 100', function() {
            assert.equal(p.value, 100);
        });
        it('endValue should be 200', function() {
            assert.equal(p.endValue, 200);
        });
        it('velocity should be 20', function() {
            assert.equal(p.velocity, 20);
        });
        it('velocityThreshold should be 0.002', function() {
            assert.equal(p.velocityThreshold, 0.002);
        });
        it('displacementThreshold should be 0.003', function() {
            assert.equal(p.displacementThreshold, 0.003);
        });
        it('tension should be 240', function() {
            assert.equal(p.tension, 240);
        });
        it('friction should be 21', function() {
            assert.equal(p.friction, 21);
        });
    });

    describe('Getters/setters', function() {
		var p = new Particle();
		p.enabled = false;
        p.velocityThreshold = 0.02;
		p.displacementThreshold = 0.03;
		p.tension = 241;
		p.friction = 26;
		it('enabled should be false', function() {
            assert.equal(p.enabled, false);
        });
        it('velocityThreshold should be 0.02', function() {
            assert.equal(p.velocityThreshold, 0.02);
        });
        it('displacementThreshold should be 0.03', function() {
            assert.equal(p.displacementThreshold, 0.03);
        });
        it('tension should be 241', function() {
            assert.equal(p.tension, 241);
        });
        it('friction should be 26', function() {
            assert.equal(p.friction, 26);
        });
    });

    describe('Particle.set', function() {
        var p = new Particle();
        p.set(444, 333, 10);
        it('endValue should be 444', function() {
            assert.equal(p.endValue, 444);
        });
        it('value should be 333', function() {
            assert.equal(p.value, 333);
        });
        it('velocity should be 10', function() {
            assert.equal(p.velocity, 10);
        });
    });

    describe('onUpdate & onSettle', function() {
		it('value should smoothly transition 10..333', function(done) {
			var p = new RAFParticle();
            p.set(333, 10);
			var lastValue = 10;
			var endReached;
			var startTime = Date.now();
			p.onUpdate = function(value) {
				if (endReached || (value >= 333)) {
					endReached = true;
				}
				else {
					assert(value >= lastValue);
					lastValue = value;
				}
				//console.log('onUpdate(', value, '), steps: ', steps);
			};
			p.onSettle = function(value) {
				var duration = Date.now() - startTime;
				assert.equal(value, 333);
				assert.equal(p.value, 333);
				assert(duration > 1000);
				done();
			}
        });
        /*it('velocity should speed up and slow down', function(done) {
			var p = new Particle();
			p.value = 10;
			p.endValue = 333;
			var speedingUp = true;
			var lastVelocity = 0;
			p.onUpdate = function() {
				console.log('onUpdate(velocity=', p.velocity, ')');
				if (speedingUp) {
					if (p.velocity < lastVelocity) {
						console.log('slowing down')
						speedingUp = false;
					}
				}
				else {
					assert(Math.abs(p.velocity) < lastVelocity);
				}
				lastVelocity = Math.abs(p.velocity);
			};
			p.onSettle = function() {
				assert(!speedingUp);
				done();
			}
        });*/
    });
});
