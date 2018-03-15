(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/common'), require('rxjs/Observable'), require('rxjs/Subscription'), require('rxjs/add/observable/fromEvent'), require('rxjs/add/observable/merge'), require('rxjs/add/operator/mergeMap'), require('rxjs/add/operator/takeUntil'), require('rxjs/add/operator/map')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core', '@angular/common', 'rxjs/Observable', 'rxjs/Subscription', 'rxjs/add/observable/fromEvent', 'rxjs/add/observable/merge', 'rxjs/add/operator/mergeMap', 'rxjs/add/operator/takeUntil', 'rxjs/add/operator/map'], factory) :
	(factory((global['ngx-slimscroll'] = {}),global.ng.core,global.ng.common,global.Rx,global.Rx));
}(this, (function (exports,core,common,Observable,Subscription) { 'use strict';

var SlimScrollEvent = (function () {
    /**
     * @param {?=} obj
     */
    function SlimScrollEvent(obj) {
        this.type = obj.type;
        this.y = obj && obj.y ? obj.y : 0;
        this.percent = obj && obj.percent ? obj.percent : 0;
        this.duration = obj && obj.duration ? obj.duration : 0;
        this.easing = obj && obj.easing ? obj.easing : 'linear';
    }
    return SlimScrollEvent;
}());
var SLIMSCROLL_DEFAULTS = new core.InjectionToken('NGX_SLIMSCROLL_DEFAULTS');
var SlimScrollOptions = (function () {
    /**
     * @param {?=} obj
     */
    function SlimScrollOptions(obj) {
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
    SlimScrollOptions.prototype.merge = function (obj) {
        var /** @type {?} */ result = new SlimScrollOptions();
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
    };
    return SlimScrollOptions;
}());
var SlimScrollState = (function () {
    /**
     * @param {?=} obj
     */
    function SlimScrollState(obj) {
        this.scrollPosition = obj && obj.scrollPosition ? obj.scrollPosition : 0;
        this.isScrollAtStart = obj && typeof obj.isScrollAtStart !== 'undefined' ? obj.isScrollAtStart : true;
        this.isScrollAtEnd = obj && typeof obj.isScrollAtEnd !== 'undefined' ? obj.isScrollAtEnd : false;
    }
    return SlimScrollState;
}());
var easing = {
    linear: function (t) { return t; },
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return t * (2 - t); },
    inOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    inCubic: function (t) { return t * t * t; },
    outCubic: function (t) { return (--t) * t * t + 1; },
    inOutCubic: function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
    inQuart: function (t) { return t * t * t * t; },
    outQuart: function (t) { return 1 - (--t) * t * t * t; },
    inOutQuart: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; },
    inQuint: function (t) { return t * t * t * t * t; },
    outQuint: function (t) { return 1 + (--t) * t * t * t * t; },
    inOutQuint: function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t; }
};
var SlimScrollDirective = (function () {
    /**
     * @param {?} viewContainer
     * @param {?} renderer
     * @param {?} document
     * @param {?} optionsDefaults
     */
    function SlimScrollDirective(viewContainer, renderer, document, optionsDefaults) {
        var _this = this;
        this.viewContainer = viewContainer;
        this.renderer = renderer;
        this.document = document;
        this.optionsDefaults = optionsDefaults;
        this.scrollChanged = new core.EventEmitter();
        this.interactionSubscriptions = new Subscription.Subscription();
        this.initWheel = function () {
            var /** @type {?} */ dommousescroll = Observable.Observable.fromEvent(_this.el, 'DOMMouseScroll');
            var /** @type {?} */ mousewheel = Observable.Observable.fromEvent(_this.el, 'mousewheel');
            var /** @type {?} */ wheelSubscription = Observable.Observable.merge.apply(Observable.Observable, [dommousescroll, mousewheel]).subscribe(function (e) {
                var /** @type {?} */ scrollSensitivity = _this.options.scrollSensitivity / 100;
                var wheelDeltaY = e.wheelDeltaY;
                var /** @type {?} */ maxScaledDelta = Math.max(1, wheelDeltaY * scrollSensitivity);
                var /** @type {?} */ minScaledDelta = Math.min(-1, wheelDeltaY * scrollSensitivity);
                wheelDeltaY = (Math.sign(wheelDeltaY) === 1) ? maxScaledDelta : minScaledDelta;
                _this.scrollContent(-wheelDeltaY, true, false);
                if (e.preventDefault) {
                    e.preventDefault();
                }
            });
            _this.interactionSubscriptions.add(wheelSubscription);
        };
        this.initDrag = function () {
            var /** @type {?} */ bar = _this.bar;
            var /** @type {?} */ mousemove = Observable.Observable.fromEvent(_this.document.documentElement, 'mousemove');
            var /** @type {?} */ touchmove = Observable.Observable.fromEvent(_this.document.documentElement, 'touchmove');
            var /** @type {?} */ mousedown = Observable.Observable.fromEvent(bar, 'mousedown');
            var /** @type {?} */ touchstart = Observable.Observable.fromEvent(_this.el, 'touchstart');
            var /** @type {?} */ mouseup = Observable.Observable.fromEvent(_this.document.documentElement, 'mouseup');
            var /** @type {?} */ touchend = Observable.Observable.fromEvent(_this.document.documentElement, 'touchend');
            var /** @type {?} */ mousedrag = mousedown.mergeMap(function (e) {
                _this.pageY = e.pageY;
                _this.top = parseFloat(getComputedStyle(bar).top);
                return mousemove.map(function (emove) {
                    emove.preventDefault();
                    return _this.top + emove.pageY - _this.pageY;
                }).takeUntil(mouseup);
            });
            var /** @type {?} */ touchdrag = touchstart.mergeMap(function (e) {
                _this.pageY = e.targetTouches[0].pageY;
                _this.top = -parseFloat(getComputedStyle(bar).top);
                return touchmove.map(function (tmove) {
                    return -(_this.top + tmove.targetTouches[0].pageY - _this.pageY);
                }).takeUntil(touchend);
            });
            var /** @type {?} */ dragSubscription = Observable.Observable.merge.apply(Observable.Observable, [mousedrag, touchdrag]).subscribe(function (top) {
                _this.body.addEventListener('selectstart', _this.preventDefaultEvent, false);
                _this.renderer.setElementStyle(_this.body, 'touch-action', 'pan-y');
                _this.renderer.setElementStyle(_this.body, 'user-select', 'none');
                _this.renderer.setElementStyle(_this.bar, 'top', top + "px");
                var /** @type {?} */ over = _this.scrollContent(0, true, false);
                var /** @type {?} */ maxTop = _this.el.offsetHeight - _this.bar.offsetHeight;
                if (over && over < 0 && -over <= maxTop) {
                    _this.renderer.setElementStyle(_this.el, 'paddingTop', -over + 'px');
                }
                else if (over && over > 0 && over <= maxTop) {
                    _this.renderer.setElementStyle(_this.el, 'paddingBottom', over + 'px');
                }
            });
            var /** @type {?} */ dragEndSubscription = Observable.Observable.merge.apply(Observable.Observable, [mouseup, touchend]).subscribe(function () {
                _this.body.removeEventListener('selectstart', _this.preventDefaultEvent, false);
                var /** @type {?} */ paddingTop = parseInt(_this.el.style.paddingTop, 10);
                var /** @type {?} */ paddingBottom = parseInt(_this.el.style.paddingBottom, 10);
                _this.renderer.setElementStyle(_this.body, 'touch-action', 'unset');
                _this.renderer.setElementStyle(_this.body, 'user-select', 'default');
                if (paddingTop > 0) {
                    _this.scrollTo(0, 300, 'linear');
                }
                else if (paddingBottom > 0) {
                    _this.scrollTo(0, 300, 'linear');
                }
            });
            _this.interactionSubscriptions.add(dragSubscription);
            _this.interactionSubscriptions.add(dragEndSubscription);
        };
        this.preventDefaultEvent = function (e) {
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
    SlimScrollDirective.prototype.ngOnInit = function () {
        var _this = this;
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
            this.mutationObserver = new MutationObserver(function () {
                if (_this.mutationThrottleTimeout) {
                    clearTimeout(_this.mutationThrottleTimeout);
                    _this.mutationThrottleTimeout = setTimeout(_this.onMutation.bind(_this), 50);
                }
            });
            this.mutationObserver.observe(this.el, { subtree: true, childList: true });
        }
        if (this.scrollEvents && this.scrollEvents instanceof core.EventEmitter) {
            var /** @type {?} */ scrollSubscription = this.scrollEvents.subscribe(function (event) { return _this.handleEvent(event); });
            this.interactionSubscriptions.add(scrollSubscription);
        }
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.ngOnDestroy = function () {
        this.interactionSubscriptions.unsubscribe();
    };
    /**
     * @param {?} e
     * @return {?}
     */
    SlimScrollDirective.prototype.handleEvent = function (e) {
        if (e.type === 'scrollToBottom') {
            var /** @type {?} */ y = this.el.scrollHeight - this.el.clientHeight;
            this.scrollTo(y, e.duration, e.easing);
        }
        else if (e.type === 'scrollToTop') {
            var /** @type {?} */ y = 0;
            this.scrollTo(y, e.duration, e.easing);
        }
        else if (e.type === 'scrollToPercent' && (e.percent >= 0 && e.percent <= 100)) {
            var /** @type {?} */ y = Math.round(((this.el.scrollHeight - this.el.clientHeight) / 100) * e.percent);
            this.scrollTo(y, e.duration, e.easing);
        }
        else if (e.type === 'scrollTo') {
            var /** @type {?} */ y = e.y;
            if (y <= this.el.scrollHeight - this.el.clientHeight && y >= 0) {
                this.scrollTo(y, e.duration, e.easing);
            }
        }
        else if (e.type === 'recalculate') {
            this.getBarHeight();
        }
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.setElementStyle = function () {
        var /** @type {?} */ el = this.el;
        this.renderer.setElementStyle(el, 'overflow', 'hidden');
        this.renderer.setElementStyle(el, 'position', 'relative');
        this.renderer.setElementStyle(el, 'display', 'block');
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.onMutation = function () {
        this.getBarHeight();
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.wrapContainer = function () {
        this.wrapper = this.renderer.createElement(this.el, 'div');
        var /** @type {?} */ wrapper = this.wrapper;
        var /** @type {?} */ el = this.el;
        this.renderer.setElementClass(wrapper, 'slimscroll-wrapper', true);
        this.renderer.setElementStyle(wrapper, 'position', 'relative');
        this.renderer.setElementStyle(wrapper, 'overflow', 'hidden');
        this.renderer.setElementStyle(wrapper, 'display', 'inline-block');
        this.renderer.setElementStyle(wrapper, 'margin', getComputedStyle(el).margin);
        this.renderer.setElementStyle(wrapper, 'width', 'inherit');
        this.renderer.setElementStyle(wrapper, 'height', '100%');
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.initGrid = function () {
        this.grid = this.renderer.createElement(this.el, 'div');
        var /** @type {?} */ grid = this.grid;
        this.renderer.setElementClass(grid, 'slimscroll-grid', true);
        this.renderer.setElementStyle(grid, 'position', 'absolute');
        this.renderer.setElementStyle(grid, 'top', '0');
        this.renderer.setElementStyle(grid, 'bottom', '0');
        this.renderer.setElementStyle(grid, this.options.position, '0');
        this.renderer.setElementStyle(grid, 'width', this.options.gridWidth + "px");
        this.renderer.setElementStyle(grid, 'background', this.options.gridBackground);
        this.renderer.setElementStyle(grid, 'opacity', this.options.gridOpacity);
        this.renderer.setElementStyle(grid, 'display', 'block');
        this.renderer.setElementStyle(grid, 'cursor', 'pointer');
        this.renderer.setElementStyle(grid, 'z-index', '99');
        this.renderer.setElementStyle(grid, 'border-radius', this.options.gridBorderRadius + "px");
        this.renderer.setElementStyle(grid, 'margin', this.options.gridMargin);
        this.wrapper.appendChild(grid);
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.initBar = function () {
        this.bar = this.renderer.createElement(this.el, 'div');
        var /** @type {?} */ bar = this.bar;
        this.renderer.setElementClass(bar, 'slimscroll-bar', true);
        this.renderer.setElementStyle(bar, 'position', 'absolute');
        this.renderer.setElementStyle(bar, 'top', '0');
        this.renderer.setElementStyle(bar, this.options.position, '0');
        this.renderer.setElementStyle(bar, 'width', this.options.barWidth + "px");
        this.renderer.setElementStyle(bar, 'background', this.options.barBackground);
        this.renderer.setElementStyle(bar, 'opacity', this.options.barOpacity);
        this.renderer.setElementStyle(bar, 'display', 'block');
        this.renderer.setElementStyle(bar, 'cursor', 'pointer');
        this.renderer.setElementStyle(bar, 'z-index', '100');
        this.renderer.setElementStyle(bar, 'border-radius', this.options.barBorderRadius + "px");
        this.renderer.setElementStyle(bar, 'margin', this.options.barMargin);
        this.wrapper.appendChild(bar);
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.getBarHeight = function () {
        var /** @type {?} */ barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30) + 'px';
        var /** @type {?} */ display = parseInt(barHeight, 10) === this.el.offsetHeight ? 'none' : 'block';
        this.renderer.setElementStyle(this.bar, 'height', barHeight);
        this.renderer.setElementStyle(this.bar, 'display', display);
        this.renderer.setElementStyle(this.grid, 'display', display);
    };
    /**
     * @param {?} y
     * @param {?} duration
     * @param {?} easingFunc
     * @return {?}
     */
    SlimScrollDirective.prototype.scrollTo = function (y, duration, easingFunc) {
        var _this = this;
        var /** @type {?} */ start = Date.now();
        var /** @type {?} */ from = this.el.scrollTop;
        var /** @type {?} */ maxTop = this.el.offsetHeight - this.bar.offsetHeight;
        var /** @type {?} */ maxElScrollTop = this.el.scrollHeight - this.el.clientHeight;
        var /** @type {?} */ barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30);
        var /** @type {?} */ paddingTop = parseInt(this.el.style.paddingTop, 10) || 0;
        var /** @type {?} */ paddingBottom = parseInt(this.el.style.paddingBottom, 10) || 0;
        var /** @type {?} */ scroll = function (timestamp) {
            var /** @type {?} */ currentTime = Date.now();
            var /** @type {?} */ time = Math.min(1, ((currentTime - start) / duration));
            var /** @type {?} */ easedTime = easing[easingFunc](time);
            if (paddingTop > 0 || paddingBottom > 0) {
                var /** @type {?} */ fromY = null;
                if (paddingTop > 0) {
                    fromY = -paddingTop;
                    fromY = -((easedTime * (y - fromY)) + fromY);
                    _this.renderer.setElementStyle(_this.el, 'paddingTop', fromY + "px");
                }
                if (paddingBottom > 0) {
                    fromY = paddingBottom;
                    fromY = ((easedTime * (y - fromY)) + fromY);
                    _this.renderer.setElementStyle(_this.el, 'paddingBottom', fromY + "px");
                }
            }
            else {
                _this.el.scrollTop = (easedTime * (y - from)) + from;
            }
            var /** @type {?} */ percentScroll = _this.el.scrollTop / maxElScrollTop;
            if (paddingBottom === 0) {
                var /** @type {?} */ delta = Math.round(Math.round(_this.el.clientHeight * percentScroll) - barHeight);
                if (delta > 0) {
                    _this.renderer.setElementStyle(_this.bar, 'top', delta + "px");
                }
            }
            if (time < 1) {
                requestAnimationFrame(scroll);
            }
        };
        requestAnimationFrame(scroll);
    };
    /**
     * @param {?} y
     * @param {?} isWheel
     * @param {?} isJump
     * @return {?}
     */
    SlimScrollDirective.prototype.scrollContent = function (y, isWheel, isJump) {
        var _this = this;
        var /** @type {?} */ delta = y;
        var /** @type {?} */ maxTop = this.el.offsetHeight - this.bar.offsetHeight;
        var /** @type {?} */ hiddenContent = this.el.scrollHeight - this.el.offsetHeight;
        var /** @type {?} */ percentScroll;
        var /** @type {?} */ over = null;
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
            this.visibleTimeout = setTimeout(function () {
                _this.hideBarAndGrid();
            }, this.options.visibleTimeout);
        }
        var /** @type {?} */ isScrollAtStart = delta === 0;
        var /** @type {?} */ isScrollAtEnd = delta === hiddenContent;
        var /** @type {?} */ scrollPosition = Math.ceil(delta);
        var /** @type {?} */ scrollState = new SlimScrollState({ scrollPosition: scrollPosition, isScrollAtStart: isScrollAtStart, isScrollAtEnd: isScrollAtEnd });
        this.scrollChanged.emit(scrollState);
        return over;
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.showBarAndGrid = function () {
        this.renderer.setElementStyle(this.grid, 'background', this.options.gridBackground);
        this.renderer.setElementStyle(this.bar, 'background', this.options.barBackground);
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.hideBarAndGrid = function () {
        this.renderer.setElementStyle(this.grid, 'background', 'transparent');
        this.renderer.setElementStyle(this.bar, 'background', 'transparent');
    };
    /**
     * @return {?}
     */
    SlimScrollDirective.prototype.destroy = function () {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        if (this.el.parentElement.classList.contains('slimscroll-wrapper')) {
            var /** @type {?} */ wrapper = this.el.parentElement;
            var /** @type {?} */ bar = this.el.querySelector('.slimscroll-bar');
            this.el.removeChild(bar);
            this.unwrap(wrapper);
        }
    };
    /**
     * @param {?} wrapper
     * @return {?}
     */
    SlimScrollDirective.prototype.unwrap = function (wrapper) {
        var /** @type {?} */ docFrag = document.createDocumentFragment();
        while (wrapper.firstChild) {
            var /** @type {?} */ child = wrapper.removeChild(wrapper.firstChild);
            docFrag.appendChild(child);
        }
        wrapper.parentNode.replaceChild(docFrag, wrapper);
    };
    /**
     * @param {?} $event
     * @return {?}
     */
    SlimScrollDirective.prototype.onResize = function ($event) {
        this.getBarHeight();
    };
    return SlimScrollDirective;
}());
SlimScrollDirective.decorators = [
    { type: core.Directive, args: [{
                selector: '[slimScroll]',
                exportAs: 'slimScroll'
            },] },
];
/**
 * @nocollapse
 */
SlimScrollDirective.ctorParameters = function () { return [
    { type: core.ViewContainerRef, decorators: [{ type: core.Inject, args: [core.ViewContainerRef,] },] },
    { type: core.Renderer, decorators: [{ type: core.Inject, args: [core.Renderer,] },] },
    { type: undefined, decorators: [{ type: core.Inject, args: [common.DOCUMENT,] },] },
    { type: undefined, decorators: [{ type: core.Inject, args: [SLIMSCROLL_DEFAULTS,] }, { type: core.Optional },] },
]; };
SlimScrollDirective.propDecorators = {
    'options': [{ type: core.Input },],
    'scrollEvents': [{ type: core.Input },],
    'scrollChanged': [{ type: core.Output, args: ['scrollChanged',] },],
    'onResize': [{ type: core.HostListener, args: ['window:resize', ['$event'],] },],
};
var NgSlimScrollModule = (function () {
    function NgSlimScrollModule() {
    }
    return NgSlimScrollModule;
}());
NgSlimScrollModule.decorators = [
    { type: core.NgModule, args: [{
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
NgSlimScrollModule.ctorParameters = function () { return []; };

exports.SlimScrollEvent = SlimScrollEvent;
exports.SLIMSCROLL_DEFAULTS = SLIMSCROLL_DEFAULTS;
exports.SlimScrollOptions = SlimScrollOptions;
exports.NgSlimScrollModule = NgSlimScrollModule;
exports.ɵa = SlimScrollDirective;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-slimscroll.umd.js.map
