var DETAIL_SLIDE_IN_Y = 600;

var worker = require('./worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');
var util = require('./util');

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;
var lastNationalId;

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      animateOut();
    }
  });
});

function animateOut() {
  detailViewContainer.classList.add('hidden');
  document.body.style.overflow = '';
}

function animateIn() {
  var sourceSprite = $(`[data-national-id="${lastNationalId}"]`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');
  var targetSprite = $('.detail-sprite');
  var targetBackground = $('.detail-view-bg');
  var targetForeground = $('.detail-view-fg');

  var screenWidth = window.innerWidth;
  var screenHeight = window.innerHeight;

  detailView.style.transform = `translateY(${window.pageYOffset}px)`;
  detailViewContainer.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var targetSpriteRect = targetSprite.getBoundingClientRect();
  var sourceTitleSpanHeight = parseInt(getComputedStyle(sourceTitleSpan).height.replace('px', ''));

  var spriteChangeX = sourceSpriteRect.left - targetSpriteRect.left;
  var spriteChangeY = (sourceSpriteRect.top - targetSpriteRect.top) - DETAIL_SLIDE_IN_Y;

  var scaleX = sourceSpriteRect.width / screenWidth;
  var scaleY = (sourceSpriteRect.height - sourceTitleSpanHeight) / screenHeight;

  targetBackground.style.transform =
    `translate(${sourceSpriteRect.left}px, ${sourceSpriteRect.top}px)` +
    ` scale(${scaleX}, ${scaleY})`;
  targetSprite.style.transform = `translate(${spriteChangeX}px, ${spriteChangeY}px)`;
  targetForeground.style.transform = `translateY(${DETAIL_SLIDE_IN_Y}px)`;

  requestAnimationFrame(() => {
    // go go go!
    targetSprite.classList.add('animating');
    targetSprite.style.transform = '';
    targetForeground.classList.add('animating');
    targetForeground.style.transform = '';
    targetBackground.classList.add('animating');
    targetBackground.style.transform = '';
  });

  function onAnimEnd() {
    console.log('done animating');
    targetSprite.classList.remove('animating');
    targetForeground.classList.remove('animating');
    targetBackground.classList.remove('animating');
    targetSprite.removeEventListener('transitionend', onAnimEnd);
  }

  targetSprite.addEventListener('transitionend', onAnimEnd);
}

function applyPatch(patchString) {
  console.time('applyPatch');
  var patchJson = JSON.parse(patchString);
  var patch = fromJson(patchJson);

  patchElement(detailView, patch);

  console.timeEnd('applyPatch');
}

function onMessage(message) {
  lastNationalId = message.nationalId;
  applyPatch(message.patch);
  requestAnimationFrame(animateIn);
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    onMessage(e.data);
  }
});