import { Directive, EventEmitter, HostListener, Inject, InjectionToken, Input, NgModule, Optional, Output, Renderer, ViewContainerRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable as Observable$1 } from 'rxjs/Observable';
import { Subscription as Subscription$1 } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/map';

class SlimScrollEvent {
    /**
     * @param {?=} obj
     */
    constructor(obj) {
        this.type = obj.type;
        this.y = obj && obj.y ? obj.y : 0;
        this.percent = obj && obj.percent ? obj.percent : 0;
        this.duration = obj && obj.duration ? obj.duration : 0;
        this.easing = obj && obj.easing ? obj.easing : 'linear';
    }
}

const SLIMSCROLL_DEFAULTS = new InjectionToken('NGX_SLIMSCROLL_DEFAULTS');
class SlimScrollOptions {
    /**
     * @param {?=} obj
     */
    constructor(obj) {
        this.position = obj && obj.position ? obj.position : 'right';
        this.barBackground = obj && obj.barBackground ? obj.barBackground : '#343a40';
        this.barOpacity = obj && obj.barOpacity ? obj.barOpacity : '1';
        this.barWidth = obj && obj.barWidth ? obj.barWidth : '12';
        this.barBorderRadius = obj && obj.barBorderRadius ? obj.barBorderRadius : '5';
        this.barMargin = obj && obj.barMargin ? obj.barMargin : '1px 0';
        this.gridBackground = obj && obj.gridBackground ? obj.gridBackground : '#adb5bd';
        this.gridOpacity = obj && obj.gridOpacity ? obj.gridOpacity : '1';
        this.gridWidth = obj && obj.gridWidth ? obj.gridWidth : '8';
        this.gridBorderRadius = obj && obj.gridBorderRadius ? obj.gridBorderRadius : '10';
        this.gridMargin = obj && obj.gridMargin ? obj.gridMargin : '1px 2px';
        this.alwaysVisible = obj && typeof obj.alwaysVisible !== 'undefined' ? obj.alwaysVisible : true;
        this.visibleTimeout = obj && obj.visibleTimeout ? obj.visibleTimeout : 1000;
        this.scrollSensitivity = obj && obj.scrollSensitivity ? obj.scrollSensitivity : 1;
    }
    /**
     * @param {?=} obj
     * @return {?}
     */
    merge(obj) {
        const /** @type {?} */ result = new SlimScrollOptions();
        result.position = obj && obj.position ? obj.position : this.position;
        result.barBackground = obj && obj.barBackground ? obj.barBackground : this.barBackground;
        result.barOpacity = obj && obj.barOpacity ? obj.barOpacity : this.barOpacity;
        result.barWidth = obj && obj.barWidth ? obj.barWidth : this.barWidth;
        result.barBorderRadius = obj && obj.barBorderRadius ? obj.barBorderRadius : this.barBorderRadius;
        result.barMargin = obj && obj.barMargin ? obj.barMargin : this.barMargin;
        result.gridBackground = obj && obj.gridBackground ? obj.gridBackground : this.gridBackground;
        result.gridOpacity = obj && obj.gridOpacity ? obj.gridOpacity : this.gridBackground;
        result.gridWidth = obj && obj.gridWidth ? obj.gridWidth : this.gridWidth;
        result.gridBorderRadius = obj && obj.gridBorderRadius ? obj.gridBorderRadius : this.gridBorderRadius;
        result.gridMargin = obj && obj.gridMargin ? obj.gridMargin : this.gridMargin;
        result.alwaysVisible = obj && typeof obj.alwaysVisible !== 'undefined' ? obj.alwaysVisible : this.alwaysVisible;
        result.visibleTimeout = obj && obj.visibleTimeout ? obj.visibleTimeout : this.visibleTimeout;
        result.scrollSensitivity = obj && obj.scrollSensitivity ? obj.scrollSensitivity : this.scrollSensitivity;
        return result;
    }
}

class SlimScrollState {
    /**
     * @param {?=} obj
     */
    constructor(obj) {
        this.scrollPosition = obj && obj.scrollPosition ? obj.scrollPosition : 0;
        this.isScrollAtStart = obj && typeof obj.isScrollAtStart !== 'undefined' ? obj.isScrollAtStart : true;
        this.isScrollAtEnd = obj && typeof obj.isScrollAtEnd !== 'undefined' ? obj.isScrollAtEnd : false;
    }
}

const easing = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    inCubic: (t) => t * t * t,
    outCubic: (t) => (--t) * t * t + 1,
    inOutCubic: (t) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    inQuart: (t) => t * t * t * t,
    outQuart: (t) => 1 - (--t) * t * t * t,
    inOutQuart: (t) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    inQuint: (t) => t * t * t * t * t,
    outQuint: (t) => 1 + (--t) * t * t * t * t,
    inOutQuint: (t) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};
class SlimScrollDirective {
    /**
     * @param {?} viewContainer
     * @param {?} renderer
     * @param {?} document
     * @param {?} optionsDefaults
     */
    constructor(viewContainer, renderer, document, optionsDefaults) {
        this.viewContainer = viewContainer;
        this.renderer = renderer;
        this.document = document;
        this.optionsDefaults = optionsDefaults;
        this.scrollChanged = new EventEmitter();
        this.interactionSubscriptions = new Subscription$1();
        this.initWheel = () => {
            const /** @type {?} */ dommousescroll = Observable$1.fromEvent(this.el, 'DOMMouseScroll');
            const /** @type {?} */ mousewheel = Observable$1.fromEvent(this.el, 'mousewheel');
            const /** @type {?} */ wheelSubscription = Observable$1.merge(...[dommousescroll, mousewheel]).subscribe((e) => {
                const /** @type {?} */ scrollSensitivity = this.options.scrollSensitivity / 100;
                let { wheelDeltaY } = e;
                const /** @type {?} */ maxScaledDelta = Math.max(1, wheelDeltaY * scrollSensitivity);
                const /** @type {?} */ minScaledDelta = Math.min(-1, wheelDeltaY * scrollSensitivity);
                wheelDeltaY = (Math.sign(wheelDeltaY) === 1) ? maxScaledDelta : minScaledDelta;
                this.scrollContent(-wheelDeltaY, true, false);
                if (e.preventDefault) {
                    e.preventDefault();
                }
            });
            this.interactionSubscriptions.add(wheelSubscription);
        };
        this.initDrag = () => {
            const /** @type {?} */ bar = this.bar;
            const /** @type {?} */ mousemove = Observable$1.fromEvent(this.document.documentElement, 'mousemove');
            const /** @type {?} */ touchmove = Observable$1.fromEvent(this.document.documentElement, 'touchmove');
            const /** @type {?} */ mousedown = Observable$1.fromEvent(bar, 'mousedown');
            const /** @type {?} */ touchstart = Observable$1.fromEvent(this.el, 'touchstart');
            const /** @type {?} */ mouseup = Observable$1.fromEvent(this.document.documentElement, 'mouseup');
            const /** @type {?} */ touchend = Observable$1.fromEvent(this.document.documentElement, 'touchend');
            const /** @type {?} */ mousedrag = mousedown.mergeMap((e) => {
                this.pageY = e.pageY;
                this.top = parseFloat(getComputedStyle(bar).top);
                return mousemove.map((emove) => {
                    emove.preventDefault();
                    return this.top + emove.pageY - this.pageY;
                }).takeUntil(mouseup);
            });
            const /** @type {?} */ touchdrag = touchstart.mergeMap((e) => {
                this.pageY = e.targetTouches[0].pageY;
                this.top = -parseFloat(getComputedStyle(bar).top);
                return touchmove.map((tmove) => {
                    return -(this.top + tmove.targetTouches[0].pageY - this.pageY);
                }).takeUntil(touchend);
            });
            const /** @type {?} */ dragSubscription = Observable$1.merge(...[mousedrag, touchdrag]).subscribe((top) => {
                this.body.addEventListener('selectstart', this.preventDefaultEvent, false);
                this.renderer.setElementStyle(this.body, 'touch-action', 'pan-y');
                this.renderer.setElementStyle(this.body, 'user-select', 'none');
                this.renderer.setElementStyle(this.bar, 'top', `${top}px`);
                const /** @type {?} */ over = this.scrollContent(0, true, false);
                const /** @type {?} */ maxTop = this.el.offsetHeight - this.bar.offsetHeight;
                if (over && over < 0 && -over <= maxTop) {
                    this.renderer.setElementStyle(this.el, 'paddingTop', -over + 'px');
                }
                else if (over && over > 0 && over <= maxTop) {
                    this.renderer.setElementStyle(this.el, 'paddingBottom', over + 'px');
                }
            });
            const /** @type {?} */ dragEndSubscription = Observable$1.merge(...[mouseup, touchend]).subscribe(() => {
                this.body.removeEventListener('selectstart', this.preventDefaultEvent, false);
                const /** @type {?} */ paddingTop = parseInt(this.el.style.paddingTop, 10);
                const /** @type {?} */ paddingBottom = parseInt(this.el.style.paddingBottom, 10);
                this.renderer.setElementStyle(this.body, 'touch-action', 'unset');
                this.renderer.setElementStyle(this.body, 'user-select', 'default');
                if (paddingTop > 0) {
                    this.scrollTo(0, 300, 'linear');
                }
                else if (paddingBottom > 0) {
                    this.scrollTo(0, 300, 'linear');
                }
            });
            this.interactionSubscriptions.add(dragSubscription);
            this.interactionSubscriptions.add(dragEndSubscription);
        };
        this.preventDefaultEvent = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        this.viewContainer = viewContainer;
        this.el = viewContainer.element.nativeElement;
        this.body = this.document.querySelector('body');
        this.mutationThrottleTimeout = 50;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        if (this.optionsDefaults) {
            this.options = new SlimScrollOptions(this.optionsDefaults).merge(this.options);
        }
        else {
            this.options = new SlimScrollOptions(this.options);
        }
        this.setElementStyle();
        this.wrapContainer();
        this.initGrid();
        this.initBar();
        this.getBarHeight();
        this.initWheel();
        this.initDrag();
        if (!this.options.alwaysVisible) {
            this.hideBarAndGrid();
        }
        if (MutationObserver) {
            this.mutationObserver = new MutationObserver(() => {
                if (this.mutationThrottleTimeout) {
                    clearTimeout(this.mutationThrottleTimeout);
                    this.mutationThrottleTimeout = setTimeout(this.onMutation.bind(this), 50);
                }
            });
            this.mutationObserver.observe(this.el, { subtree: true, childList: true });
        }
        if (this.scrollEvents && this.scrollEvents instanceof EventEmitter) {
            const /** @type {?} */ scrollSubscription = this.scrollEvents.subscribe((event) => this.handleEvent(event));
            this.interactionSubscriptions.add(scrollSubscription);
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this.interactionSubscriptions.unsubscribe();
    }
    /**
     * @param {?} e
     * @return {?}
     */
    handleEvent(e) {
        if (e.type === 'scrollToBottom') {
            const /** @type {?} */ y = this.el.scrollHeight - this.el.clientHeight;
            this.scrollTo(y, e.duration, e.easing);
        }
        else if (e.type === 'scrollToTop') {
            const /** @type {?} */ y = 0;
            this.scrollTo(y, e.duration, e.easing);
        }
        else if (e.type === 'scrollToPercent' && (e.percent >= 0 && e.percent <= 100)) {
            const /** @type {?} */ y = Math.round(((this.el.scrollHeight - this.el.clientHeight) / 100) * e.percent);
            this.scrollTo(y, e.duration, e.easing);
        }
        else if (e.type === 'scrollTo') {
            const /** @type {?} */ y = e.y;
            if (y <= this.el.scrollHeight - this.el.clientHeight && y >= 0) {
                this.scrollTo(y, e.duration, e.easing);
            }
        }
        else if (e.type === 'recalculate') {
            this.getBarHeight();
        }
    }
    /**
     * @return {?}
     */
    setElementStyle() {
        const /** @type {?} */ el = this.el;
        this.renderer.setElementStyle(el, 'overflow', 'hidden');
        this.renderer.setElementStyle(el, 'position', 'relative');
        this.renderer.setElementStyle(el, 'display', 'block');
    }
    /**
     * @return {?}
     */
    onMutation() {
        this.getBarHeight();
    }
    /**
     * @return {?}
     */
    wrapContainer() {
        this.wrapper = this.renderer.createElement(this.el, 'div');
        const /** @type {?} */ wrapper = this.wrapper;
        const /** @type {?} */ el = this.el;
        this.renderer.setElementClass(wrapper, 'slimscroll-wrapper', true);
        this.renderer.setElementStyle(wrapper, 'position', 'relative');
        this.renderer.setElementStyle(wrapper, 'overflow', 'hidden');
        this.renderer.setElementStyle(wrapper, 'display', 'inline-block');
        this.renderer.setElementStyle(wrapper, 'margin', getComputedStyle(el).margin);
        this.renderer.setElementStyle(wrapper, 'width', 'inherit');
        this.renderer.setElementStyle(wrapper, 'height', '100%');
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    }
    /**
     * @return {?}
     */
    initGrid() {
        this.grid = this.renderer.createElement(this.el, 'div');
        const /** @type {?} */ grid = this.grid;
        this.renderer.setElementClass(grid, 'slimscroll-grid', true);
        this.renderer.setElementStyle(grid, 'position', 'absolute');
        this.renderer.setElementStyle(grid, 'top', '0');
        this.renderer.setElementStyle(grid, 'bottom', '0');
        this.renderer.setElementStyle(grid, this.options.position, '0');
        this.renderer.setElementStyle(grid, 'width', `${this.options.gridWidth}px`);
        this.renderer.setElementStyle(grid, 'background', this.options.gridBackground);
        this.renderer.setElementStyle(grid, 'opacity', this.options.gridOpacity);
        this.renderer.setElementStyle(grid, 'display', 'block');
        this.renderer.setElementStyle(grid, 'cursor', 'pointer');
        this.renderer.setElementStyle(grid, 'z-index', '99');
        this.renderer.setElementStyle(grid, 'border-radius', `${this.options.gridBorderRadius}px`);
        this.renderer.setElementStyle(grid, 'margin', this.options.gridMargin);
        this.wrapper.appendChild(grid);
    }
    /**
     * @return {?}
     */
    initBar() {
        this.bar = this.renderer.createElement(this.el, 'div');
        const /** @type {?} */ bar = this.bar;
        this.renderer.setElementClass(bar, 'slimscroll-bar', true);
        this.renderer.setElementStyle(bar, 'position', 'absolute');
        this.renderer.setElementStyle(bar, 'top', '0');
        this.renderer.setElementStyle(bar, this.options.position, '0');
        this.renderer.setElementStyle(bar, 'width', `${this.options.barWidth}px`);
        this.renderer.setElementStyle(bar, 'background', this.options.barBackground);
        this.renderer.setElementStyle(bar, 'opacity', this.options.barOpacity);
        this.renderer.setElementStyle(bar, 'display', 'block');
        this.renderer.setElementStyle(bar, 'cursor', 'pointer');
        this.renderer.setElementStyle(bar, 'z-index', '100');
        this.renderer.setElementStyle(bar, 'border-radius', `${this.options.barBorderRadius}px`);
        this.renderer.setElementStyle(bar, 'margin', this.options.barMargin);
        this.wrapper.appendChild(bar);
    }
    /**
     * @return {?}
     */
    getBarHeight() {
        const /** @type {?} */ barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30) + 'px';
        const /** @type {?} */ display = parseInt(barHeight, 10) === this.el.offsetHeight ? 'none' : 'block';
        this.renderer.setElementStyle(this.bar, 'height', barHeight);
        this.renderer.setElementStyle(this.bar, 'display', display);
        this.renderer.setElementStyle(this.grid, 'display', display);
    }
    /**
     * @param {?} y
     * @param {?} duration
     * @param {?} easingFunc
     * @return {?}
     */
    scrollTo(y, duration, easingFunc) {
        const /** @type {?} */ start = Date.now();
        const /** @type {?} */ from = this.el.scrollTop;
        const /** @type {?} */ maxTop = this.el.offsetHeight - this.bar.offsetHeight;
        const /** @type {?} */ maxElScrollTop = this.el.scrollHeight - this.el.clientHeight;
        const /** @type {?} */ barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30);
        const /** @type {?} */ paddingTop = parseInt(this.el.style.paddingTop, 10) || 0;
        const /** @type {?} */ paddingBottom = parseInt(this.el.style.paddingBottom, 10) || 0;
        const /** @type {?} */ scroll = (timestamp) => {
            const /** @type {?} */ currentTime = Date.now();
            const /** @type {?} */ time = Math.min(1, ((currentTime - start) / duration));
            const /** @type {?} */ easedTime = easing[easingFunc](time);
            if (paddingTop > 0 || paddingBottom > 0) {
                let /** @type {?} */ fromY = null;
                if (paddingTop > 0) {
                    fromY = -paddingTop;
                    fromY = -((easedTime * (y - fromY)) + fromY);
                    this.renderer.setElementStyle(this.el, 'paddingTop', `${fromY}px`);
                }
                if (paddingBottom > 0) {
                    fromY = paddingBottom;
                    fromY = ((easedTime * (y - fromY)) + fromY);
                    this.renderer.setElementStyle(this.el, 'paddingBottom', `${fromY}px`);
                }
            }
            else {
                this.el.scrollTop = (easedTime * (y - from)) + from;
            }
            const /** @type {?} */ percentScroll = this.el.scrollTop / maxElScrollTop;
            if (paddingBottom === 0) {
                const /** @type {?} */ delta = Math.round(Math.round(this.el.clientHeight * percentScroll) - barHeight);
                if (delta > 0) {
                    this.renderer.setElementStyle(this.bar, 'top', `${delta}px`);
                }
            }
            if (time < 1) {
                requestAnimationFrame(scroll);
            }
        };
        requestAnimationFrame(scroll);
    }
    /**
     * @param {?} y
     * @param {?} isWheel
     * @param {?} isJump
     * @return {?}
     */
    scrollContent(y, isWheel, isJump) {
        let /** @type {?} */ delta = y;
        const /** @type {?} */ maxTop = this.el.offsetHeight - this.bar.offsetHeight;
        const /** @type {?} */ hiddenContent = this.el.scrollHeight - this.el.offsetHeight;
        let /** @type {?} */ percentScroll;
        let /** @type {?} */ over = null;
        if (isWheel) {
            delta = parseInt(getComputedStyle(this.bar).top, 10) + y * 20 / 100 * this.bar.offsetHeight;
            if (delta < 0 || delta > maxTop) {
                over = delta > maxTop ? delta - maxTop : delta;
            }
            delta = Math.min(Math.max(delta, 0), maxTop);
            delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);
            this.renderer.setElementStyle(this.bar, 'top', delta + 'px');
        }
        percentScroll = parseInt(getComputedStyle(this.bar).top, 10) / (this.el.offsetHeight - this.bar.offsetHeight);
        delta = percentScroll * hiddenContent;
        this.el.scrollTop = delta;
        this.showBarAndGrid();
        if (!this.options.alwaysVisible) {
            if (this.visibleTimeout) {
                clearTimeout(this.visibleTimeout);
            }
            this.visibleTimeout = setTimeout(() => {
                this.hideBarAndGrid();
            }, this.options.visibleTimeout);
        }
        const /** @type {?} */ isScrollAtStart = delta === 0;
        const /** @type {?} */ isScrollAtEnd = delta === hiddenContent;
        const /** @type {?} */ scrollPosition = Math.ceil(delta);
        const /** @type {?} */ scrollState = new SlimScrollState({ scrollPosition, isScrollAtStart, isScrollAtEnd });
        this.scrollChanged.emit(scrollState);
        return over;
    }
    /**
     * @return {?}
     */
    showBarAndGrid() {
        this.renderer.setElementStyle(this.grid, 'background', this.options.gridBackground);
        this.renderer.setElementStyle(this.bar, 'background', this.options.barBackground);
    }
    /**
     * @return {?}
     */
    hideBarAndGrid() {
        this.renderer.setElementStyle(this.grid, 'background', 'transparent');
        this.renderer.setElementStyle(this.bar, 'background', 'transparent');
    }
    /**
     * @return {?}
     */
    destroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        if (this.el.parentElement.classList.contains('slimscroll-wrapper')) {
            const /** @type {?} */ wrapper = this.el.parentElement;
            const /** @type {?} */ bar = this.el.querySelector('.slimscroll-bar');
            this.el.removeChild(bar);
            this.unwrap(wrapper);
        }
    }
    /**
     * @param {?} wrapper
     * @return {?}
     */
    unwrap(wrapper) {
        const /** @type {?} */ docFrag = document.createDocumentFragment();
        while (wrapper.firstChild) {
            const /** @type {?} */ child = wrapper.removeChild(wrapper.firstChild);
            docFrag.appendChild(child);
        }
        wrapper.parentNode.replaceChild(docFrag, wrapper);
    }
    /**
     * @param {?} $event
     * @return {?}
     */
    onResize($event) {
        this.getBarHeight();
    }
}
SlimScrollDirective.decorators = [
    { type: Directive, args: [{
                selector: '[slimScroll]',
                exportAs: 'slimScroll'
            },] },
];
/**
 * @nocollapse
 */
SlimScrollDirective.ctorParameters = () => [
    { type: ViewContainerRef, decorators: [{ type: Inject, args: [ViewContainerRef,] },] },
    { type: Renderer, decorators: [{ type: Inject, args: [Renderer,] },] },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] },] },
    { type: undefined, decorators: [{ type: Inject, args: [SLIMSCROLL_DEFAULTS,] }, { type: Optional },] },
];
SlimScrollDirective.propDecorators = {
    'options': [{ type: Input },],
    'scrollEvents': [{ type: Input },],
    'scrollChanged': [{ type: Output, args: ['scrollChanged',] },],
    'onResize': [{ type: HostListener, args: ['window:resize', ['$event'],] },],
};

class NgSlimScrollModule {
}
NgSlimScrollModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    SlimScrollDirective
                ],
                exports: [
                    SlimScrollDirective
                ]
            },] },
];
/**
 * @nocollapse
 */
NgSlimScrollModule.ctorParameters = () => [];

/**
 * Generated bundle index. Do not edit.
 */

export { SlimScrollEvent, SLIMSCROLL_DEFAULTS, SlimScrollOptions, NgSlimScrollModule, SlimScrollDirective as ɵa };
//# sourceMappingURL=ngx-slimscroll.js.map
