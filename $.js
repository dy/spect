let count = 0

export default function listen(selector, callback) {
    var styleAnimation, animationName = 'spect-' + (count++);

    styleAnimation = document.createElement('style');
    styleAnimation.innerHTML = `
    @keyframes ${ animationName } { from {} to {} }
    ${ selector } { clip: rect(0,0,0,0);
clip-path: inset(50%);
position: absolute;
animation-delay: -1ms !important; animation-duration: 0ms !important;
    animation-iteration-count: 1 !important; animation-name: ${ animationName }; }
    `;

    var eventHandler = e => {
      if (e.animationName === animationName) {
        e.target.style.cssText = `clip-path: none; position: relative`
        callback(e.target)
      }
    }
    document.head.appendChild(styleAnimation);

    document.addEventListener('animationstart', eventHandler, false)

    return function () {
        clearTimeout(bindAnimationLater);
        if (styleAnimation) {
            document.head.removeChild(styleAnimation);
            styleAnimation = null;
        }
        document.removeEventListener('animationstart', eventHandler)
    }
}
