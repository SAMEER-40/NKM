// Importing utility function for preloading images
import { preloadImages, preloadImages2, preloadFonts } from './utils';
import { Row } from './row';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
// Importing StackMotionEffect classes from different effect files with renamed imports to avoid name conflicts
import { StackMotionEffect as StackMotionEffect1 } from './effect-1/stackMotionEffect.js';
import { StackMotionEffect as StackMotionEffect2 } from './effect-2/stackMotionEffect.js';
import { StackMotionEffect as StackMotionEffect3 } from './effect-3/stackMotionEffect.js';

gsap.registerPlugin(Flip);

// preview Items
const previewItems = [...document.querySelectorAll('.preview > .preview__item')];
// initial rows
const rows = [...document.querySelectorAll('.row')];
// cover element
const cover = document.querySelector('.cover');
// close ctrl
const closeCtrl = document.querySelector('.preview > .preview__close');
const body = document.body;

// Row instance array
let rowsArr = [];
rows.forEach((row, position) => {
    rowsArr.push(new Row(row, previewItems[position]));
});

let isOpen = false;
let isAnimating = false;
let currentRow = -1;
let mouseenterTimeline;

for (const row of rowsArr) {
    
    row.DOM.el.addEventListener('mouseenter', () => { 
        if ( isOpen ) return;
        
        gsap.killTweensOf([row.DOM.images, row.DOM.title]);
        
        mouseenterTimeline = gsap.timeline()
        .addLabel('start', 0)
        .to(row.DOM.images, {
            duration: 0.4,
            ease: 'power3',
            startAt: {
                scale: 0.8, 
                xPercent: 20
            },
            scale: 1,
            xPercent: 0,
            opacity: 1,
            stagger: -0.035
        }, 'start')
        .set(row.DOM.title, {transformOrigin: '0% 50%'}, 'start')
        .to(row.DOM.title, {
            duration: 0.1,
            ease: 'power1.in',
            yPercent: -100,
            onComplete: () => row.DOM.titleWrap.classList.add('cell__title--switch')
        }, 'start')
        .to(row.DOM.title, {
            duration: 0.5,
            ease: 'expo',
            startAt: {
                yPercent: 100, 
                rotation: 15
            },
            yPercent: 0,
            rotation: 0
        }, 'start+=0.1');
    });
    
    row.DOM.el.addEventListener('mouseleave', () => {
        if ( isOpen ) return;
        
        gsap.killTweensOf([row.DOM.images, row.DOM.title]);
        
        gsap.timeline()
        .addLabel('start')
        .to(row.DOM.images, {
            duration: 0.4,
            ease: 'power4',
            opacity: 0,
            scale: 0.8
        }, 'start')
        .to(row.DOM.title, {
            duration: 0.1,
            ease: 'power1.in',
            yPercent: -100,
            onComplete: () => row.DOM.titleWrap.classList.remove('cell__title--switch')
        }, 'start')
        .to(row.DOM.title, {
            duration: 0.5,
            ease: 'expo',
            startAt: {
                yPercent: 100, 
                rotation: 15
            },
            yPercent: 0,
            rotation: 0
        }, 'start+=0.1');
    });

    // Open a row and reveal the grid
    row.DOM.el.addEventListener('click', () => {
        if ( isAnimating ) return;
        isAnimating = true;

        isOpen = true;

        currentRow = rowsArr.indexOf(row);
        
        gsap.killTweensOf([cover, rowsArr.map(row => row.DOM.title)]);

        gsap.timeline({
            onStart: () => {
                body.classList.add('oh');
                row.DOM.el.classList.add('row--current');
                row.previewItem.DOM.el.classList.add('preview__item--current');

                gsap.set(row.previewItem.DOM.images, {opacity: 0});
                
                // set cover to be on top of the row and then animate it to cover the whole page
                gsap.set(cover, {
                    height: row.DOM.el.offsetHeight-1, // minus border width
                    top: row.DOM.el.getBoundingClientRect()['top'],
                    opacity: 1
                });
                
                gsap.set(row.previewItem.DOM.title, {
                    yPercent: -100,
                    rotation: 15,
                    transformOrigin: '100% 50%'
                });

                closeCtrl.classList.add('preview__close--show');
            },
            onComplete: () => isAnimating = false
        })
        .addLabel('start', 0)
        .to(cover, {
            duration: 0.9,
            ease: 'power4.inOut',
            height: window.innerHeight,
            top: 0,
        }, 'start')
        // animate all the titles out
        .to(rowsArr.map(row => row.DOM.title), {
            duration: 0.5,
            ease: 'power4.inOut',
            yPercent: (_, target) => {
                return target.getBoundingClientRect()['top'] > row.DOM.el.getBoundingClientRect()['top'] ? 100 : -100;
            },
            rotation: 0
        }, 'start')
        .add(() => {
            mouseenterTimeline.progress(1, false);
            const flipstate = Flip.getState(row.DOM.images, {simple: true});
            row.previewItem.DOM.grid.prepend(...row.DOM.images);
            Flip.from(flipstate, {
                duration: 0.9,
                ease: 'power4.inOut',
                //absoluteOnLeave: true,
                stagger: 0.04,
            })
            // other images in the grid
            .to(row.previewItem.DOM.images, {
                duration: 0.9,
                ease: 'power4.inOut',
                startAt: {scale: 0, yPercent: () => gsap.utils.random(0,200)},
                scale: 1,
                opacity: 1,
                yPercent: 0,
                stagger: 0.04
            }, 0.04*(row.DOM.images.length))
        }, 'start')
        .to(row.previewItem.DOM.title, {
            duration: 1,
            ease: 'power4.inOut',
            yPercent: 0,
            rotation: 0,
            onComplete: () => row.DOM.titleWrap.classList.remove('cell__title--switch')
        }, 'start')
        .to(closeCtrl, {
            duration: 1,
            ease: 'power4.inOut',
            opacity: 1
        }, 'start');

    });

}

// Close the grid and show back the rows
closeCtrl.addEventListener('click', () => {
    if ( isAnimating ) return;
    isAnimating = true;

    isOpen = false;

    const row = rowsArr[currentRow];
    
    gsap.timeline({
        defaults: {duration: 0.5, ease: 'power4.inOut'},
        onStart: () => body.classList.remove('oh'),
        onComplete: () => {
            row.DOM.el.classList.remove('row--current');
            row.previewItem.DOM.el.classList.remove('preview__item--current');
            isAnimating = false;
        }
    })
    .addLabel('start', 0)
    .to([row.DOM.images, row.previewItem.DOM.images], {
        scale: 0,
        opacity: 0,
        stagger: 0.04,
        onComplete: () => row.DOM.imagesWrap.prepend(...row.DOM.images)
    }, 0)
    .to(row.previewItem.DOM.title, {
        duration: 0.6,
        yPercent: 100
    }, 'start')
    .to(closeCtrl, {
        opacity: 0
    }, 'start')
    // animate cover out
    .to(cover, {
        ease: 'power4',
        height: 0,//,row.DOM.el.offsetHeight-1, // minus border width
        top: row.DOM.el.getBoundingClientRect()['top']+row.DOM.el.offsetHeight/2
    }, 'start+=0.4')
    // fade out cover
    .to(cover, {
        duration: 0.3,
        opacity: 0
    }, 'start+=0.9')
    // animate all the titles in
    .to(rowsArr.map(row => row.DOM.title), {
        yPercent: 0,
        stagger: {
            each: 0.03,
            grid: 'auto',
            from: currentRow
        }
    }, 'start+=0.4')
});

// Preload images and fonts
Promise.all([preloadImages('.cell__img-inner'), preloadFonts('gdf6msi')]).then(() => {
    document.body.classList.remove('loading')
});


// Registers ScrollTrigger plugin with GSAP for scroll-based animations.
gsap.registerPlugin(ScrollTrigger);

// Initialize function to set up motion effects and animations
const init = () => {
  // Apply the first stack motion effect to all elements with a specific data attribute
  document.querySelectorAll('[data-stack-1]').forEach((stackEl) => {
    new StackMotionEffect1(stackEl);
  });
  // Apply the second stack motion effect to all elements with a different specific data attribute
  document.querySelectorAll('[data-stack-2]').forEach((stackEl) => {
    new StackMotionEffect2(stackEl);
  });
  // Apply the third stack motion effect to all elements with yet another specific data attribute
  document.querySelectorAll('[data-stack-3]').forEach((stackEl) => {
    new StackMotionEffect3(stackEl);
  });

  // Select all grid intro card elements and apply animations on scroll
  const introCards = document.querySelectorAll('.intro1 .card');
  introCards.forEach(introCard => {
    gsap.to(introCard, {
      ease: 'power1.in',
      startAt: {
        transformOrigin: '100% 50%',
        filter: 'brightness(70%)'
      },
      rotationX: () => -60,
      yPercent: () => gsap.utils.random(-100,0),
      z: () => gsap.utils.random(-100,0),
      filter: 'brightness(0%)',
      scrollTrigger: {
        trigger: introCard,
        start: 'clamp(top bottom)',
        end: 'clamp(bottom top)',
        scrub: true,
      }
    });
  });
};

// Preloading images and initializing setup when complete
preloadImages2('.grid__img').then(() => {
  document.body.classList.remove('loading');
  init();
});
