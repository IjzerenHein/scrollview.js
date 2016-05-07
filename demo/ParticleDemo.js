import React from 'react';
//import ScrollView, {RAFParticle} from '../dist/scrollview';
import ScrollView, {RAFParticle} from '../src/index';

const Sphere = (props) => {
	return <div style={{borderRadius: '50%', backgroundColor: 'white', width: '30px', height: '30px'}} {...props} />;
};

export default class ParticleDemo extends React.Component {
	constructor() {
		super();
		this.state = {
			x: 500
		};
		console.log(ScrollView);
		this._particle = new RAFParticle({
			value: 0,
			endValue: this.state.x 
		});
		this._particle.onUpdate = (value) => this.setState({x: value});
		//this._particle.onSettle = (value) => console.log('onSettle: ', value);
		setInterval(() => this._particle.set(this._particle.endValue ? 0 : 500), 1000);
	}

	render() {
		return <div style={{
			position: 'absolute',
			transform: 'translate3d(' + this.state.x + 'px, 100px, 0)'
		}}><Sphere onClick={() => {
			this._particle.enabled = !this._particle.enabled;
		}}/></div>;
	}
}
