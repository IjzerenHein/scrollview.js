import React from 'react';
import {ScrollView} from '../src';
import {requestAnimationFrame, cancelAnimationFrame} from '../src/util';

const ListItem = (allProps) => {
	const {size, offset, ...props} = allProps;
	return <div style={{
		position: 'absolute',
		transform: 'translate3d(0, ' + offset + 'px, 0)',
		padding: '5px',
		boxSizing: 'border-box',
		width: '100px',
		height: size + 'px'
	}} {...props}>
		<div style={{
			borderRadius: '5px',
			backgroundColor: 'white',
			width: '100%',
			height: '100%'}} />
	</div>
};

export default class ScrollViewDemo extends React.Component {
	constructor() {
		super();
		this.state = {
			height: window.innerHeight
		};
		this._scrollView = new ScrollView({
			offset: 0,
			size: this.state.height,
			align: 1
		});
		this._handleResize = () => this.setState({height: window.innerHeight});
		this._updateFn = () => this.forceUpdate();
		this._scrollView.onUpdateRequested = (cancel) => {
			this._animationFrame = cancel ? cancelAnimationFrame(this._animationFrame) : requestAnimationFrame(this._updateFn);
		};
		this._scrollView.onMeasureItem = (item) => {
			return item.data * 50;
			//return 100;
		};
		/*this._scrollView.onSettle = () => {
			console.log('')
		};*/
		//this._scrollView.insertRows(0, [1,2,3,4,5,6,7,8,9]);
		this._scrollView.insertRows(0, [1, 2]);
		//this._scrollView.scrollToRow(0, 1, 0);
		
		//setInterval(() => this._particle.endValue = this._particle.endValue ? 0 : 500, 2000);
	}

	componentDidMount() {
		window.addEventListener('resize', this._handleResize);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this._handleResize);
	}

	render() {
		const children = [];
		this._scrollView.size = this.state.height;
		this._scrollView.onLayoutItem = (item) => {
			//console.log('s' + item.sectionIdx + 'r' + item.rowIdx);
			children.push(<ListItem
				key={'s' + item.sectionIdx + 'r' + item.rowIdx}
				offset={item.offset}
				size={item.size}
				onClick={this._scrollView.scrollToRow.bind(this._scrollView, item.sectionIdx, item.rowIdx, 0, true)}
			/>);
		};
		this._scrollView.update();
		return <div style={{
			width: '500px',
			height: this._scrollView.size + 'px',
			overflow: 'hidden',
			position: 'absolute'}}
			//onClick={() => this._scrollView.scrollToRow(0, 1, true)}
			//onClick={() => this._scrollView.requestUpdate()}
		>{children}</div>
	}
}
