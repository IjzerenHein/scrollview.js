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
		this._particle.onUpdateRequested = (cancel) => this.requestUpdate(cancel);
		this._particle.onSettle = () => this.onSettle();

		this._align = withDefault(config.align, 0); // top align
		this._size = withDefault(config.size, 0);
		this._incrementalRendering = withDefault(config.incrementalRendering, false);

		this._offset = 0;
		this._sectionIdx = 0;
		this._rowIdx = 0;

		this._sections = [{rows: []}];

		this.requestUpdate();
	}

	requestUpdate(cancel) {
		if (cancel && this._updateRequested) {
			this._updateRequested = false;
			this.onUpdateRequested(true);
		}
		else if (!this._updateRequested) {
			this._updateRequested = true;
			this.onUpdateRequested();
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
			item.data = row.data;
			row.size = this.onMeasureItem(item);
		}
		return row.size;
	}

	_offsetToParticleValue(startItem, offset) {
		return startItem.offset - offset - this._offset;
	}

	_allocStartItem() {
		const item = {
			sectionIdx: this._sectionIdx,
			rowIdx: this._rowIdx
		};
		item.size = this._getItemSize(item);
		item.offset = this._particle.value + this._offset + (this._align * (this._size - item.size));
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

	_getFirstItemToRender(startItem) {
		const item = this._cloneItem(startItem);
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

	_calculateBoundsNew(startItem) {
		let totalSize = 0;
		const topBounds = (this._size - startItem.size) * -this._align;
		const bottomBounds = topBounds + this._size;
		let topItem = this._cloneItem(startItem);
		let bottomItem = this._cloneItem(startItem);
		let prevItem = topItem;
		let nextItem = bottomItem;
		totalSize += topItem.size;
		while (prevItem || nextItem){
			if (((topItem.offset < topBounds) && (bottomItem.offset > bottomBounds)) ||
				((!prevItem || !nextItem) && (totalSize >= this._size))) {
				break;
			}
			if (prevItem && (!nextItem || (topItem.offset > topBounds))) {
				prevItem = this._getPrevItem(prevItem);
				totalSize += prevItem ? prevItem.size : 0;
				topItem = prevItem || topItem;
			}
			else {
				nextItem = this._getNextItem(nextItem);
				totalSize += nextItem ? nextItem.size : 0;
				bottomItem = nextItem || bottomItem;
			}
		}
		let bounds;
		if (totalSize < this._size) {
			bounds = (totalSize - startItem.size) * -this._align;
		}
		else if (topItem.offset > topBounds) {
			bounds = topBounds;
		}
		else if (bottomItem.offset < bottomBounds) {
			bounds = bottomBounds;
		}
		if (bounds !== undefined) {
			//console.log('bounds hit: ', bounds, ', offset: ', this._offset,', particle: ', particleValue);
			this._particle.set(bounds);	
		}
		this._freeItem(topItem);
		this._freeItem(bottomItem);
	}

	_normalize(startItem) {
		let item = this._cloneItem(startItem);
		const targetOffset = this._size * this._align;
		let itemOffset = item.offset + (item.size * this._align);
		let itemSize = item.size;
		if (itemOffset < targetOffset) {
			item = this._getNextItem(item);
			while (item) {
				const nextItemOffset = item.offset + (item.size * this._align);
				if (Math.abs(nextItemOffset - targetOffset) > Math.abs(itemOffset - targetOffset)) {
					break;
				}
				this._sectionIdx = item.sectionIdx;
				this._rowIdx = item.rowIdx;
				this._offset += (item.size * this._align) + (itemSize * (1 - this._align));
				itemOffset = nextItemOffset;
				console.log('normalize down, rowIdx: ', this._rowIdx ,' offset: ', this._offset, ', size: ', itemSize);
				itemSize = item.size;
				item = this._getNextItem(item);
			}
		}
		else if (itemOffset > targetOffset) {
			item = this._getPrevItem(item);
			while (item) {
				const prevItemOffset = item.offset + (item.size * this._align);
				if (Math.abs(prevItemOffset - targetOffset) > Math.abs(itemOffset - targetOffset)) {
					break;
				}
				this._sectionIdx = item.sectionIdx;
				this._rowIdx = item.rowIdx;
				//this._offset -= item.size;
				this._offset -= (item.size * this._align) + (itemSize * (1 - this._align));
				itemOffset = prevItemOffset;
				console.log('normalize up, rowIdx: ', this._rowIdx ,' offset: ', this._offset, ', size: ', item.size);
				itemSize = item.size;
				item = this._getPrevItem(item);
			}
		}
		this._freeItem(item);
	}

	/**
     * Updates the scrollview.
     *
     * @param {Date} [timeStamp] Time of the update.
     * @return {ScrollView} this
     */
	update(timeStamp = Date.now()) {
		//console.log('update');
		this._updateRequested = false;

		this._particle.update(timeStamp);

		// section of first visible row (math.max(offset, 0))
		//const stickyHeader = this._stickySections ? this._findStickySection(item) : undefined;
		
		// layout all visible items
		const startItem = this._allocStartItem();
		let item = this._getFirstItemToRender(startItem);
		while (item && (item.offset < this._size)) {
			if (item.size) {
				const section = this._sections[item.sectionIdx];
				const prevItem = (item.rowIdx === -1) ? section.header : section.rows[item.rowIdx];
				if (!this._incrementalRendering || (prevItem.size !== item.size) || (prevItem.offset !== item.offset)) {
					item.data = prevItem.data;
					prevItem.size = item.size;
					prevItem.offset = item.offset;
					this.onLayoutItem(item);
				}
			}
			item = this._getNextItem(item, true);
		}
		this._freeItem(item);

		//this._calculateBoundsNew(startItem);
		this._normalize(startItem);
		this._freeItem(startItem);

		return this;
	}

	/*get bounds() {
		return this._bounds;
	}*/

	get updateRequested() {
		return this._updateRequested;
	}

	/**
     * Inserts rows into the scrollview.
     *
     * @param {Number} rowIdx Index of the row within the section.
     * @param {Array} rows Rows to insert.
     * @param {Number} [sectionIdx] Index of the section.
     * @return {ScrollView} this
     */
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
		return this;
	}

	insertSections(/*sectionIdx, sections*/) {
		//this._sections.splice(sectionIdx, 0, ...sections);
		this.requestUpdate();
	}

	/**
     * Scrolls to the given row within a section.
     *
     * The `align` argument specifies how the row is positioned. The default value
     * of `undefined` means that the row is scrolled the minimal amount in order to
     * become fully visible. Additionally, a value between 0 and 1 can be specified
     * to align the item relative to the scrollview. 0 meaning the top, and 1 meaning
     * the bottom. In order to align the item to the center, use 0.5.
     *
     * @param {Number} sectionIdx Index of the section.
     * @param {Number} rowIdx Index of the row within the section (-1 = section-header).
     * @param {Number} [align] Alignment of the row relative to the scrollview (0..1).
     * @param {Bool} [animated] Set to true to animate the change in position.
     * @return {ScrollView} this
     */
	scrollToRow(sectionIdx, rowIdx, align, animated) {
		const startItem = this._allocStartItem();
		let item = this._cloneItem(startItem);
		const searchPrev = (sectionIdx < item.sectionIdx) || ((sectionIdx === item.sectionIdx) && (rowIdx < item.rowIdx));
		while ((item.sectionIdx !== sectionIdx) || (item.rowIdx !== rowIdx)) {
			item = searchPrev ? this._getPrevItem(item) : this._getNextItem(item);
		}
		if (align === undefined) {
			const minOffset = this._particle.value - item.offset;
			const maxOffset = minOffset + this._size - item.size;
			if (this._particle.value < minOffset) {
				this._particle.set(minOffset, animated ? undefined : minOffset, animated ? undefined : 0);				
			}
			else if (this._particle.value > maxOffset) {
				this._particle.set(maxOffset, animated ? undefined : maxOffset, animated ? undefined : 0);				
			}
		}
		else {
			//const offset = this._particle.value + (startItem.offset - item.offset);
			const offset = (this._particle.value - item.offset) + (align * (this._size - item.size));
			console.log('offset: ', offset, ', this._offset: ', this._offset, ', size: ' + this._size);
			this._particle.set(offset, animated ? undefined : offset, animated ? undefined : 0);
		}
		this._freeItem(item);
		this._freeItem(startItem);
		return this;
	}

	/**
     * Position the items are aligned to when:
     * - the total size of the items is less than the scrollview size
     * - pagination is enabled
     *
     * The alignment is a number between 0 and 1. The default is 0 which
     * means the items are aligned to the top of the view. 1 aligns the
     * items to the bottom and 0.5 to the center.
     *
     * The alignment also affects the direction the scrollview is scrolled
     * into, when inserting and removing items.
     *
     * @type {Number}
     */
	get align() {
		return this._align;
	}
	set align(value) {
		if (this._align !== value) {
			this._align = value;
			this.requestUpdate();
		}
	}

	/**
     * Window size of the scrollview.
     *
     * @type {Number}
     */
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
		this._estimatedRowSize = value;
	}

	get estimatedSectionSize() {
		return this._estimatedRowSize;
	}

	set estimatedSectionSize(value) {
		this._estimatedSectionSize = value;
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

	onSettle() {
		// override to implement
		console.log('settled on, offset: ', this._offset, ', particle: ', this._particle.value);
	}

	onUpdateRequested(/*cancel*/) {

	}

	onMeasureItem(item) {
		// override to implement
		return (item.rowIdx === -1) ? this._estimatedSectionSize : this._estimatedRowSize;
	}

	onLayoutItem(/*item*/) {
		// override to implement
	}
}