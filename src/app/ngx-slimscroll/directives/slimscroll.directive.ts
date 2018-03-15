import {
  Directive,
  ViewContainerRef,
  HostListener,
  OnInit,
  OnDestroy,
  Renderer,
  Inject,
  Optional,
  Input,
  EventEmitter,
  Output
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SlimScrollOptions, ISlimScrollOptions, SLIMSCROLL_DEFAULTS } from '../classes/slimscroll-options.class';
import { SlimScrollEvent } from '../classes/slimscroll-event.class';
import { SlimScrollState, ISlimScrollState } from '../classes/slimscroll-state.class';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/map';

export const easing: { [key: string]: Function } = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t ),
  inOutQuad: (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => (--t) * t * t + 1,
  inOutCubic: (t: number) => t < .5 ? 4 * t * t * t : (t - 1) * ( 2 * t - 2) * (2 * t - 2) + 1,
  inQuart: (t: number) => t * t * t * t,
  outQuart: (t: number) => 1 - (--t) * t * t * t,
  inOutQuart: (t: number) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  inQuint: (t: number) => t * t * t * t * t,
  outQuint: (t: number) => 1 + (--t) * t * t * t * t,
  inOutQuint: (t: number) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};

@Directive({
  selector: '[slimScroll]', // tslint:disable-line
  exportAs: 'slimScroll'
})
export class SlimScrollDirective implements OnInit, OnDestroy {
  @Input() options: SlimScrollOptions;
  @Input() scrollEvents: EventEmitter<SlimScrollEvent>;
  @Output('scrollChanged') scrollChanged = new EventEmitter<ISlimScrollState>();

  el: HTMLElement;
  wrapper: HTMLElement;
  grid: HTMLElement;
  bar: HTMLElement;
  body: HTMLElement;
  pageY: number;
  top: number;
  dragging: boolean;
  mutationThrottleTimeout: number;
  mutationObserver: MutationObserver;
  lastTouchPositionY: number;
  visibleTimeout: any;
  interactionSubscriptions: Subscription = new Subscription();

  constructor(
    @Inject(ViewContainerRef) private viewContainer: ViewContainerRef,
    @Inject(Renderer) private renderer: Renderer,
    @Inject(DOCUMENT) private document: any,
    @Inject(SLIMSCROLL_DEFAULTS) @Optional() private optionsDefaults: ISlimScrollOptions
  ) {
    this.viewContainer = viewContainer;
    this.el = viewContainer.element.nativeElement;
    this.body = this.document.querySelector('body');
    this.mutationThrottleTimeout = 50;
  }

  ngOnInit() {
    if (this.optionsDefaults) {
      this.options = new SlimScrollOptions(this.optionsDefaults).merge(this.options);
    } else {
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
      const scrollSubscription = this.scrollEvents.subscribe((event: SlimScrollEvent) => this.handleEvent(event));
      this.interactionSubscriptions.add(scrollSubscription);
    }
  }

  ngOnDestroy() {
    this.interactionSubscriptions.unsubscribe();
  }

  handleEvent(e: SlimScrollEvent): void {
    if (e.type === 'scrollToBottom') {
      const y = this.el.scrollHeight - this.el.clientHeight;
      this.scrollTo(y, e.duration, e.easing);
    } else if (e.type === 'scrollToTop') {
      const y = 0;
      this.scrollTo(y, e.duration, e.easing);
    } else if (e.type === 'scrollToPercent' && (e.percent >= 0 && e.percent <= 100)) {
      const y = Math.round(((this.el.scrollHeight - this.el.clientHeight) / 100) * e.percent);
      this.scrollTo(y, e.duration, e.easing);
    } else if (e.type === 'scrollTo') {
      const y = e.y;
      if (y <= this.el.scrollHeight - this.el.clientHeight && y >= 0) {
        this.scrollTo(y, e.duration, e.easing);
      }
    } else if (e.type === 'recalculate') {
      this.getBarHeight();
    }
  }

  setElementStyle(): void {
    const el = this.el;
    this.renderer.setElementStyle(el, 'overflow', 'hidden');
    this.renderer.setElementStyle(el, 'position', 'relative');
    this.renderer.setElementStyle(el, 'display', 'block');
  }

  onMutation() {
    this.getBarHeight();
  }

  wrapContainer(): void {
    this.wrapper = this.renderer.createElement(this.el, 'div');
    const wrapper = this.wrapper;
    const el = this.el;

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

  initGrid(): void {
    this.grid = this.renderer.createElement(this.el, 'div');
    const grid = this.grid;

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

  initBar(): void {
    this.bar = this.renderer.createElement(this.el, 'div');
    const bar = this.bar;

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

  getBarHeight(): void {
    const barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30) + 'px';
    const display = parseInt(barHeight, 10) === this.el.offsetHeight ? 'none' : 'block';

    this.renderer.setElementStyle(this.bar, 'height', barHeight);
    this.renderer.setElementStyle(this.bar, 'display', display);
    this.renderer.setElementStyle(this.grid, 'display', display);
  }

  scrollTo(y: number, duration: number, easingFunc: string): void {
    const start = Date.now();
    const from = this.el.scrollTop;
    const maxTop = this.el.offsetHeight - this.bar.offsetHeight;
    const maxElScrollTop = this.el.scrollHeight - this.el.clientHeight;
    const barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30);
    const paddingTop = parseInt(this.el.style.paddingTop, 10) || 0;
    const paddingBottom = parseInt(this.el.style.paddingBottom, 10) || 0;

    const scroll = (timestamp: number) => {
      const currentTime = Date.now();
      const time = Math.min(1, ((currentTime - start) / duration));
      const easedTime = easing[easingFunc](time);

      if (paddingTop > 0 || paddingBottom > 0) {
        let fromY = null;

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
      } else {
        this.el.scrollTop = (easedTime * (y - from)) + from;
      }

      const percentScroll = this.el.scrollTop / maxElScrollTop;
      if (paddingBottom === 0) {
        const delta = Math.round(Math.round(this.el.clientHeight * percentScroll) - barHeight);
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

  scrollContent(y: number, isWheel: boolean, isJump: boolean): null | number {
    let delta = y;
    const maxTop = this.el.offsetHeight - this.bar.offsetHeight;
    const hiddenContent = this.el.scrollHeight - this.el.offsetHeight;
    let percentScroll: number;
    let over = null;

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
    const isScrollAtStart = delta === 0;
    const isScrollAtEnd = delta === hiddenContent;
    const scrollPosition = Math.ceil(delta);
    const scrollState = new SlimScrollState({scrollPosition, isScrollAtStart, isScrollAtEnd});
    this.scrollChanged.emit(scrollState);

    return over;
  }

  initWheel = () => {
    const dommousescroll = Observable.fromEvent(this.el, 'DOMMouseScroll');
    const mousewheel = Observable.fromEvent(this.el, 'mousewheel');

    const wheelSubscription = Observable.merge(...[dommousescroll, mousewheel]).subscribe((e: MouseWheelEvent) => {
      const scrollSensitivity = this.options.scrollSensitivity / 100;
      let { wheelDeltaY } = e;
      const maxScaledDelta = Math.max(1, wheelDeltaY * scrollSensitivity);
      const minScaledDelta = Math.min(-1, wheelDeltaY * scrollSensitivity);
      wheelDeltaY = (Math.sign(wheelDeltaY) === 1) ?  maxScaledDelta : minScaledDelta;
      this.scrollContent(-wheelDeltaY, true, false);

      if (e.preventDefault) {
        e.preventDefault();
      }
    });

    this.interactionSubscriptions.add(wheelSubscription);
  }

  initDrag = () => {
    const bar = this.bar;

    const mousemove = Observable.fromEvent(this.document.documentElement, 'mousemove');
    const touchmove = Observable.fromEvent(this.document.documentElement, 'touchmove');

    const mousedown = Observable.fromEvent(bar, 'mousedown');
    const touchstart = Observable.fromEvent(this.el, 'touchstart');
    const mouseup = Observable.fromEvent(this.document.documentElement, 'mouseup');
    const touchend = Observable.fromEvent(this.document.documentElement, 'touchend');

    const mousedrag = mousedown.mergeMap((e: MouseEvent) => {
      this.pageY = e.pageY;
      this.top = parseFloat(getComputedStyle(bar).top);

      return mousemove.map((emove: MouseEvent) => {
        emove.preventDefault();
        return this.top + emove.pageY - this.pageY;
      }).takeUntil(mouseup);
    });

    const touchdrag = touchstart.mergeMap((e: TouchEvent) => {
      this.pageY = e.targetTouches[0].pageY;
      this.top = -parseFloat(getComputedStyle(bar).top);

      return touchmove.map((tmove: TouchEvent) => {
        return -(this.top + tmove.targetTouches[0].pageY - this.pageY);
      }).takeUntil(touchend);
    });

    const dragSubscription = Observable.merge(...[mousedrag, touchdrag]).subscribe((top: number) => {
      this.body.addEventListener('selectstart', this.preventDefaultEvent, false);
      this.renderer.setElementStyle(this.body, 'touch-action', 'pan-y');
      this.renderer.setElementStyle(this.body, 'user-select', 'none');
      this.renderer.setElementStyle(this.bar, 'top', `${top}px`);
      const over = this.scrollContent(0, true, false);
      const maxTop = this.el.offsetHeight - this.bar.offsetHeight;

      if (over && over < 0 && -over <= maxTop) {
        this.renderer.setElementStyle(this.el, 'paddingTop', -over + 'px');
      } else if (over && over > 0 && over <= maxTop) {
        this.renderer.setElementStyle(this.el, 'paddingBottom', over + 'px');
      }
    });

    const dragEndSubscription = Observable.merge(...[mouseup, touchend]).subscribe(() => {
      this.body.removeEventListener('selectstart', this.preventDefaultEvent, false);
      const paddingTop = parseInt(this.el.style.paddingTop, 10);
      const paddingBottom = parseInt(this.el.style.paddingBottom, 10);
      this.renderer.setElementStyle(this.body, 'touch-action', 'unset');
      this.renderer.setElementStyle(this.body, 'user-select', 'default');

      if (paddingTop > 0) {
        this.scrollTo(0, 300, 'linear');
      } else if (paddingBottom > 0) {
        this.scrollTo(0, 300, 'linear');
      }
    });

    this.interactionSubscriptions.add(dragSubscription);
    this.interactionSubscriptions.add(dragEndSubscription);
  }

  showBarAndGrid(): void {
    this.renderer.setElementStyle(this.grid, 'background', this.options.gridBackground);
    this.renderer.setElementStyle(this.bar, 'background', this.options.barBackground);
  }

  hideBarAndGrid(): void {
    this.renderer.setElementStyle(this.grid, 'background', 'transparent');
    this.renderer.setElementStyle(this.bar, 'background', 'transparent');
  }

  preventDefaultEvent = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }

  destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.el.parentElement.classList.contains('slimscroll-wrapper')) {
      const wrapper = this.el.parentElement;
      const bar = this.el.querySelector('.slimscroll-bar');
      this.el.removeChild(bar);
      this.unwrap(wrapper);
    }
  }

  unwrap(wrapper: HTMLElement): void {
    const docFrag = document.createDocumentFragment();
    while (wrapper.firstChild) {
      const child = wrapper.removeChild(wrapper.firstChild);
      docFrag.appendChild(child);
    }
    wrapper.parentNode.replaceChild(docFrag, wrapper);
  }

  @HostListener('window:resize', ['$event'])
  onResize($event: any) {
    this.getBarHeight();
  }
}
