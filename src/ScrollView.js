import {withDefault} from './util';
import Particle from './Particle';

export default class ScrollView {
	constructor(config = {}) {
		this._particle = new Particle({
			value: config.offset || 0,
			endValue: config.offset || 0,
			tension: config.scrollTension,
			friction: config.scrollFriction,
			velocityThreshold: config.scrollVelocityThreshold,
			displacementThreshold: config.scrollDisplacementThreshold
		});
		this._particle.onRequestUpdate = (cancel) => this.requestUpdate(cancel);

		this._align = (config.align !== undefined) ? config.align : 0;
		this._size = config.size || 0;
		this._incrementalLayouting = withDefault(config._incrementalLayouting, false);

		this._offset = 0;
		this._sectionIdx = 0;
		this._rowIdx = 0;

		this._sections = [{rows: []}];

		this.requestUpdate();
	}

	requestUpdate(cancel) {
		if (cancel && this._updateRequested) {
			this._updateRequested = false;
			this.onRequestUpdate(true);
		}
		else if (!this._updateRequested) {
			this._updateRequested = true;
			this.onRequestUpdate();
		}
	}

	_getItemSize(item) {
		const section = this._sections[item.sectionIdx];
		if (item.rowIdx === -1) {
			if (section.header) {
				if (section.header.size === undefined) {
					section.header.size = this.onMeasureItem(item);
				}
				return section.header.size;
			}
			return 0;
		}
		const row = section.rows[item.rowIdx];
		if (row.size === undefined) {
			row.size = this.onMeasureItem(item);
		}
		return row.size;
	}

	_allocStartItem() {
		const item = {
			offset: this._particle.value + this._offset,
			sectionIdx: this._sectionIdx,
			rowIdx: this._rowIdx
		};
		item.size = this._getItemSize(item);
		return item;
	}

	_cloneItem(item) {
		return {
			offset: item.offset,
			sectionIdx: item.sectionIdx,
			rowIdx: item.rowIdx,
			size: item.size
		};
	}

	_freeItem(/*item*/) {
		// TODO
	}

	scrollToRow(sectionIdx, rowIdx, animated) {
		let item = this._allocStartItem();
		const searchPrev = (sectionIdx < item.sectionIdx) || ((sectionIdx === item.sectionIdx) && (rowIdx < item.rowIdx));
		while ((item.sectionIdx !== sectionIdx) || (item.rowIdx !== rowIdx)) {
			item = searchPrev ? this._getPrevItem(item) : this._getNextItem(item);
		}
		const initialOffset = this._particle.value + this._offset;
		this._particle.set(
			this._particle.endValue - (item.offset - initialOffset),
			animated ? undefined : this._particle.endValue - (item.offset - initialOffset),
			animated ? undefined : 0
		);
		this._freeItem(item);
		this.requestUpdate();
	}

	_getNextItem(item, freeIfEndReached) {
		if ((item.rowIdx + 1) >= this._sections[item.sectionIdx].rows.length) {
			if ((item.sectionIdx + 1) >= this._sections.length) {
				return freeIfEndReached ? this._freeItem(item) : undefined;
			}
			item.rowIdx = -1;
			item.sectionIdx++;
		}
		else {
			item.rowIdx++;
		}
		item.offset += item.size;
		item.size = this._getItemSize(item);
		return item;
	}

	_getPrevItem(item, freeIfEndReached) {
		if (item.rowIdx === -1) {
			if (item.sectionIdx === 0) {
				return freeIfEndReached ? this._freeItem(item) : undefined;
			}
			item.sectionIdx--;
			item.rowIdx = this._sections[item.sectionIdx].rows.length - 1;
		}
		else {
			item.rowIdx--;
		}
		item.size = this._getItemSize(item);
		item.offset -= item.size;
		return item;
	}

	_getFirstItemToRender() {
		const item = this._allocStartItem();
		if (item.offset < 0) {
			while ((item.offset + item.size) <= 0) {
				if (!this._getNextItem(item)) {
					break;
				}
			}
		}
		else {
			while (item.offset > 0) {
				if (!this._getPrevItem(item)) {
					break;
				}
			}
		}
		return item;
	}

	_findStickySection(/*firstItem*/) {
		return undefined;
	}

	_hasMinimalSize() {
		let totalSize = 0;
		let topItem = this._allocStartItem();
		let bottomItem = this._cloneItem(topItem);
		totalSize += topItem.size;
		while ((totalSize < this._size) && (topItem || bottomItem)) {
			if (!bottomItem || (topItem.offset > 0)) {
				topItem = this._getPrevItem(topItem, true);
				totalSize += topItem ? topItem.size : 0;
			}
			else {
				bottomItem = this._getNextItem(bottomItem, true);
				totalSize += bottomItem ? bottomItem.size : 0;
			}
		}
		this._freeItem(topItem);
		this._freeItem(bottomItem);
		return totalSize <= this._size;
	}

	_calculateBounds(firstItem) {
		if ((firstItem.offset > 0) || this._hasMinimalSize()) {
			return 0;
		}
		let item = this._cloneItem(firstItem);
		while (item && ((item.offset + item.size) < this._size)) {
			item = this._getNextItem(item, true)
		}
		this._freeItem(item);
		return item ? undefined : this._size;
	}

	update(timeStamp = Date.now()) {
		//console.log('update');
		this._updateRequested = false;

		this._particle.update(timeStamp);

		let item = this._getFirstItemToRender();
		this._bounds = this._calculateBounds(item);
		// section of first visible row (math.max(offset, 0))
		//const stickyHeader = this._stickySections ? this._findStickySection(item) : undefined;
		
		while (item && (item.offset < this._size)) {
			if (item.size) {
				const section = this._sections[item.sectionIdx];
				const prevItem = (item.rowIdx === -1) ? section.header : section.rows[item.rowIdx];
				if (!this._incrementalLayouting || (prevItem.size !== item.size) || (prevItem.offset !== item.offset)) {
					item.data = prevItem.data;
					prevItem.size = item.size;
					prevItem.offset = item.offset;
					this.onLayoutItem(item);
				}
			}
			item = this._getNextItem(item, true);
		}
		this._freeItem(item);
	}

	get bounds() {
		return this._bounds;
	}

	get updateRequested() {
		return this._updateRequested;
	}

	_updateTotalSize() {

	}

	insertRows(rowIdx, rows, sectionIdx = 0) {
		const section = this._sections[sectionIdx];
		for (let i = 0; i < rows.length; i++) {
			section.rows.splice(rowIdx + i, 0, {
				data: rows[i],
				offset: undefined,
				size: undefined
			});
		}
		this.requestUpdate();
	}

	insertSections(/*sectionIdx, sections*/) {
		//this._sections.splice(sectionIdx, 0, ...sections);
		this.requestUpdate();
	}

	get align() {
		return this._align;
	}

	set align(value) {
		if (this._align !== value) {
			this._align = value;
			this.requestUpdate();
		}
	}

	get size() {
		return this._size;
	}

	set size(value) {
		if (this._size !== value) {
			this._size = value;
			this.requestUpdate();
		}
	}

	get estimatedRowSize() {
		return this._estimatedRowSize;
	}

	set estimatedRowSize(value) {
		if (this._estimatedRowSize !== value) {
			this._estimatedRowSize = value;
			this._updateTotalSize();
		}
	}

	get estimatedSectionSize() {
		return this._estimatedRowSize;
	}

	set estimatedSectionSize(value) {
		if (this._estimatedSectionSize !== value) {
			this._estimatedSectionSize = value;
			this._updateTotalSize();
		}
	}

	get scrollFriction() {
		return this._particle.friction;
	}

	set scrollFriction(value) {
		this._particle.friction = value;
	}

	get scrollTension() {
		return this._particle.tension;
	}

	set scrollTension(value) {
		this._particle.tension = value;
	}

	get scrollVelocityThreshold() {
		return this._particle.velocityThreshold;
	}

	set scrollVelocityThreshold(value) {
		this._particle.velocityThreshold = value;
	}

	get scrollDisplacementThreshold() {
		return this._particle.displacementThreshold;
	}

	set scrollDisplacementThreshold(value) {
		this._particle.displacementThreshold = value;
	}

	invalidateItem() {
		// TODO
	}

	onRequestUpdate() {

	}

	onMeasureItem(item) {
		// override to implement
		return (item.rowIdx === -1) ? this._estimatedSectionSize : this._estimatedRowSize;
	}

	onLayoutItem(/*item*/) {
		// override to implement
	}
}