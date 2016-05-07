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
		this._scrollView = new ScrollView({
			offset: -100,
			size: 601
		});
		this._updateFn = () => this.forceUpdate();
		this._scrollView.onRequestUpdate = (cancel) => {
			this._animationFrame = cancel ? cancelAnimationFrame(this._animationFrame) : requestAnimationFrame(this._updateFn);
		};
		this._scrollView.onMeasureItem = (/*item*/) => {
			return 300;
		};
		this._scrollView.insertRows(0, [1,2,3]);
		
		//setInterval(() => this._particle.endValue = this._particle.endValue ? 0 : 500, 2000);
	}

	render() {
		const children = [];
		this._scrollView.onLayoutItem = (item) => {
			console.log('s' + item.sectionIdx + 'r' + item.rowIdx);
			children.push(<ListItem
				key={'s' + item.sectionIdx + 'r' + item.rowIdx}
				offset={item.offset}
				size={item.size}
			/>);
		};
		this._scrollView.update();
		return <div style={{
			width: '500px',
			height: this._scrollView.size + 'px',
			overflow: 'hidden',
			position: 'absolute'}}
			onClick={() => this._scrollView.scrollToRow(0, 1)}
			//onClick={() => this._scrollView.requestUpdate()}
		>{children}</div>
	}
}
